import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Alert, SectionList, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from './ThemeContext';
import { useTasks } from './TasksContext';
import { useSettings } from './SettingsContext';
import { useDrawer } from './DrawerContext';
import { SECTION_ORDER, getSection, sortTasks } from './helpers';
import AppHeader, { IconButton } from './AppHeader';
import TaskCard from './TaskCard';
import { EmptyState, LoadingOrError } from './StateViews';

export default function HomeScreen({ navigation }) {
  const { colors, styles } = useTheme();
  const { tasks, isLoading, error, loadTasks, toggleTask, deleteTask } = useTasks();
  const { sortOrder } = useSettings(); // 'oldest' or 'newest' (set in Settings)
  const { selectedSubject, openDrawer } = useDrawer(); // shared with the side menu

  const [isSearching, setIsSearching] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [now, setNow] = useState(new Date());
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [pendingIds, setPendingIds] = useState([]); // tasks showing a checkmark
  const [undoId, setUndoId] = useState(null);       // task that can be undone
  const undoTimer = useRef(null);

  
// Keeps the "Overdue" and "Today" groups correct while the app is open.
// It updates `now` at the START of every minute (10:00:00, 10:01:00, ...).
useEffect(() => {
  // `timer` holds the id (a number) of the next scheduled tick.
  // We use `let` because it gets a new value every time a tick runs.
  let timer;

  // One "tick": update the clock, then schedule the next tick.
  const tick = () => {
    // 1. Save the current time. This redraws the screen, and the
    //    groups are calculated again with the new time.
    setNow(new Date());

    // 2. Work out how long to wait until the start of the next minute.
    //    Date.now() % 60000 = milliseconds that already passed in this minute.
    //    60000 - that = milliseconds left until the next minute starts.
    //    + 500 = a small buffer so we land just AFTER the minute changes.
    const msToNextMinute = 60000 - (Date.now() % 60000) + 500;

    // 3. Run tick again after that wait, and remember the timer id.
    timer = setTimeout(tick, msToNextMinute);
  };

  // Run the first tick right away when the screen appears.
  tick();

  // Cleanup: when the screen is removed, cancel the next scheduled tick
  // so nothing keeps running in the background.
  return () => clearTimeout(timer);
}, []); // empty list = this effect is set up only once

  // Filter the unfinished tasks, sort them, then group them (Overdue, Today, ...)
  const sections = useMemo(() => {
    const search = searchText.trim().toLowerCase();

    const visibleTasks = tasks
      .filter((task) => !task.done)
      .filter((task) => selectedSubject === 'All' || task.subject === selectedSubject)
      .filter(
        (task) =>
          search === '' ||
          task.title.toLowerCase().includes(search) ||
          task.subject.toLowerCase().includes(search)
      )
      // Always by deadline. Same deadline -> the sort order from Settings decides.
      .sort((a, b) => sortTasks(a, b, sortOrder));

    const groups = {};
    visibleTasks.forEach((task) => {
      const sectionName = getSection(task.deadline, now);
      groups[sectionName] = groups[sectionName] || [];
      groups[sectionName].push(task);
    });

    return SECTION_ORDER.filter((name) => groups[name]).map((name) => ({ title: name, data: groups[name] }));
  }, [tasks, selectedSubject, searchText, sortOrder, now]);


const onRefresh = () => {
  setIsRefreshing(true);
  setNow(new Date());
  setTimeout(() => setIsRefreshing(false), 600);
};

  const closeSearch = () => {
    setIsSearching(false);
    setSearchText('');
  };

  //Tap the box: show the checkmark first, finish the task after 0.35 seconds
  const completeTask = (id) => {
    if (pendingIds.includes(id)) return;
    setPendingIds((ids) => [...ids, id]); // checkmark appears now
    setTimeout(() => {
      toggleTask(id); // really finish it
      setPendingIds((ids) => ids.filter((x) => x !== id));
      setUndoId(id);
      clearTimeout(undoTimer.current);
      undoTimer.current = setTimeout(() => setUndoId(null), 4000);
    }, 350);
  };

  // Undo: bring the last finished task back
  const undoComplete = () => {
    toggleTask(undoId);
    setUndoId(null);
  };

  // Hold a task: choose Edit or Delete
  const openTaskMenu = (task) => {
    Alert.alert(task.title, 'What do you want to do?', [
      { text: 'Edit', onPress: () => navigation.navigate('AddTask', { taskId: task.id }) },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () => deleteTask(task.id),
      },
      { text: 'Cancel', style: 'cancel' },
    ]);
  };

  const isFiltering = searchText !== '' || selectedSubject !== 'All';

  return (
    // SafeAreaView keeps everything below the phone's status bar
    <SafeAreaView style={styles.screen} edges={['top', 'left', 'right']}>
      <AppHeader
        title="Tasks"
        subtitle={selectedSubject === 'All' ? 'All Subjects' : selectedSubject}
        left={<IconButton name="menu" onPress={openDrawer} />}
        right={
          isSearching ? (
            <IconButton name="close" onPress={closeSearch} />
          ) : (
            <IconButton name="search" onPress={() => setIsSearching(true)} />
          )
        }
      >
        {isSearching ? (
          <TextInput
            style={styles.searchInput}
            placeholder="Search tasks or subjects"
            placeholderTextColor={colors.headerText}
            value={searchText}
            onChangeText={setSearchText}
            autoFocus
          />
        ) : null}
      </AppHeader>

      <LoadingOrError isLoading={isLoading} error={error} onRetry={loadTasks} />

      {!isLoading && !error && (
        <SectionList
          sections={sections}
          extraData={pendingIds}
          refreshing={isRefreshing}
          onRefresh={onRefresh}
          keyExtractor={(item) => item.id}
          stickySectionHeadersEnabled={false}
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={styles.listContent}
          renderSectionHeader={({ section }) => (
            <Text style={[styles.sectionTitle, section.title === 'Overdue' && { color: colors.overdue }]}>
              {section.title}
            </Text>
          )}
          renderItem={({ item }) => (
            <TaskCard
              task={item}
              checked={pendingIds.includes(item.id)}
              now={now}
              onToggle={() => completeTask(item.id)}
              onPress={() => navigation.navigate('AddTask', { taskId: item.id })}
              onLongPress={() => openTaskMenu(item)}
            />
          )}
          ListEmptyComponent={
            <EmptyState
              icon={isFiltering ? 'search-outline' : 'bulb-outline'}
              title={isFiltering ? 'No matching tasks' : 'All clear!'}
              message={
                isFiltering ? 'Try another subject or search word.' : 'Tap the + button to add your first task.'
              }
            />
          }
        />
      )}

      {/* Undo bar: shows after a task is finished */}
      {undoId !== null && (
        <View
          style={{
            position: 'absolute',
            left: 16,
            right: 16,
            bottom: 110,
            flexDirection: 'row',
            justifyContent: 'space-between',
            padding: 16,
            borderRadius: 8,
            backgroundColor: '#E0E3E8',
          }}
        >
          <Text style={{ color: '#333' }}>Task Finished</Text>
          <TouchableOpacity onPress={undoComplete}>
            <Text style={{ color: '#0077C0', fontWeight: 'bold' }}>Undo</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* + button: opens the Add Task screen */}
      <TouchableOpacity
        style={styles.fab}
        onPress={() => navigation.navigate('AddTask', {})}
        accessibilityLabel="Add task"
      >
        <Ionicons name="add" size={36} color={colors.onAccent} />
      </TouchableOpacity>
    </SafeAreaView>
  );
}