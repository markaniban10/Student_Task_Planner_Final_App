import React, { useMemo } from 'react';
import { Alert, FlatList, Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from './ThemeContext';
import { useTasks } from './TasksContext';
import { useDrawer } from './DrawerContext';
import AppHeader, { IconButton } from './AppHeader';
import TaskCard from './TaskCard';
import { EmptyState, LoadingOrError } from './StateViews';

export default function HistoryScreen() {
  const { styles } = useTheme();
  const { tasks, isLoading, error, loadTasks, toggleTask, deleteTask, clearHistory } = useTasks();
  const { openDrawer } = useDrawer(); // the same side menu as the Tasks screen
  const now = new Date();

  // Only finished tasks, most recently finished first
  const finishedTasks = useMemo(
    () =>
      tasks
        .filter((task) => task.done)
        .sort((a, b) => new Date(b.completedAt) - new Date(a.completedAt)),
    [tasks]
  );

  // Ask first before deleting one task
  const confirmDelete = (task) => {
    Alert.alert('Delete task', `Remove "${task.title}" from your history?`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => deleteTask(task.id) },
    ]);
  };

  // Ask first before deleting everything
  const confirmClearAll = () => {
    Alert.alert('Clear history', 'Delete all finished tasks? This cannot be undone.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Clear all', style: 'destructive', onPress: clearHistory },
    ]);
  };

  return (
    // SafeAreaView keeps everything below the phone's status bar
    <SafeAreaView style={styles.screen} edges={['top', 'left', 'right']}>
      <AppHeader
        title="History"
        subtitle={`${finishedTasks.length} finished`}
        left={<IconButton name="menu" onPress={openDrawer} />}
        right={finishedTasks.length > 0 ? <IconButton name="trash-outline" onPress={confirmClearAll} /> : null}
      />

      <LoadingOrError isLoading={isLoading} error={error} onRetry={loadTasks} />

      {!isLoading && !error && (
        <FlatList
          data={finishedTasks}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          ListHeaderComponent={
            finishedTasks.length > 0 ? (
              <Text style={styles.hint}>Tap a box to move a task back to your list.</Text>
            ) : null
          }
          renderItem={({ item }) => (
            <TaskCard
              task={item}
              now={now}
              onToggle={() => toggleTask(item.id)}
              onPress={() => {}}
              onDelete={() => confirmDelete(item)}
            />
          )}
          ListEmptyComponent={
            <EmptyState
              icon="hourglass-outline"
              title="Nothing finished yet"
              message="Tasks you tick off will show up here."
            />
          }
        />
      )}
    </SafeAreaView>
  );
}
