import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { makeTaskId } from './helpers';

// Context API: one shared place for the tasks, so every screen can use them
// without passing props through many components.
const TasksContext = createContext(null);

const STORAGE_KEY = '@student_planner_tasks';

// Screens call useTasks() to get the tasks and the functions below
export const useTasks = () => useContext(TasksContext);

export function TasksProvider({ children }) {
  const [tasks, setTasks] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  // Becomes true after the saved tasks are read. Stops us from saving an
  // empty list over the real data before loading is finished.
  const [isLoaded, setIsLoaded] = useState(false);

  // READ: get the saved text from the phone and turn it back into an array
  const loadTasks = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const savedText = await AsyncStorage.getItem(STORAGE_KEY);
      const savedTasks = savedText ? JSON.parse(savedText) : [];
      setTasks(Array.isArray(savedTasks) ? savedTasks : []);
      setIsLoaded(true);
    } catch (e) {
      setError('We could not load your saved tasks. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Empty dependency array: runs one time, when the app first starts
  useEffect(() => {
    loadTasks();
  }, [loadTasks]);

  // Dependency array [tasks, isLoaded]: runs every time the tasks change.
  // AsyncStorage only saves text, so we use JSON.stringify first.
  useEffect(() => {
    if (!isLoaded) return;
    AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(tasks)).catch(() => {
      Alert.alert('Save failed', 'Your latest change could not be saved on this phone.');
    });
  }, [tasks, isLoaded]);

  // CREATE: add a new task at the top of the list
  const addTask = useCallback(({ title, subject, deadline }) => {
    const newTask = {
      id: makeTaskId(),
      title: title,
      subject: subject,
      deadline: deadline, // saved as text, or null when not set
      done: false,
      completedAt: null,
    };
    setTasks((oldTasks) => [newTask, ...oldTasks]);
  }, []);

  // UPDATE: change the fields of one task (used by the Edit screen)
  const updateTask = useCallback((id, changes) => {
    setTasks((oldTasks) => oldTasks.map((t) => (t.id === id ? { ...t, ...changes } : t)));
  }, []);

  // UPDATE: tick or untick the box. Done tasks show up in History.
  const toggleTask = useCallback((id) => {
    setTasks((oldTasks) =>
      oldTasks.map((t) => {
        if (t.id !== id) return t;
        const nowDone = !t.done;
        return { ...t, done: nowDone, completedAt: nowDone ? new Date().toISOString() : null };
      })
    );
  }, []);

  // DELETE: remove one task for good
  const deleteTask = useCallback((id) => {
    setTasks((oldTasks) => oldTasks.filter((t) => t.id !== id));
  }, []);

  // DELETE: remove every finished task (History)
  const clearHistory = useCallback(() => {
    setTasks((oldTasks) => oldTasks.filter((t) => !t.done));
  }, []);

  const value = useMemo(
    () => ({ tasks, isLoading, error, loadTasks, addTask, updateTask, toggleTask, deleteTask, clearHistory }),
    [tasks, isLoading, error, loadTasks, addTask, updateTask, toggleTask, deleteTask, clearHistory]
  );

  return <TasksContext.Provider value={value}>{children}</TasksContext.Provider>;
}
