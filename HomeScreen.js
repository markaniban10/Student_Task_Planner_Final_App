import React, { useEffect, useMemo, useState } from 'react';
import { Alert, SectionList, Text, TextInput, TouchableOpacity } from 'react-native';
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

  // Lifecycle: update the clock every minute so "Overdue" and "Today" stay
  // correct. The returned function (cleanup) stops the timer when the
  // screen is removed.
  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 60000);
    return () => clearInterval(timer);
  }, []);

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

  const closeSearch = () => {
    setIsSearching(false);
    setSearchText('');
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
              now={now}
              onToggle={() => toggleTask(item.id)}
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
