import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Stores the user's app settings. For now: how the tasks are sorted.
const SettingsContext = createContext(null);

const SORT_KEY = '@student_planner_sort_order';

// Screens call useSettings() to get { sortOrder, setSortOrder }
export const useSettings = () => useContext(SettingsContext);

export function SettingsProvider({ children }) {
  // 'oldest' = old tasks first, 'newest' = new tasks first
  const [sortOrder, setSortOrderState] = useState('oldest');

  // Runs one time: read the saved sort order from the phone
  useEffect(() => {
    AsyncStorage.getItem(SORT_KEY)
      .then((value) => {
        if (value === 'oldest' || value === 'newest') setSortOrderState(value);
      })
      .catch(() => {});
  }, []);

  // Change the sort order and remember it
  const setSortOrder = useCallback((order) => {
    setSortOrderState(order);
    AsyncStorage.setItem(SORT_KEY, order).catch(() => {});
  }, []);

  const value = useMemo(() => ({ sortOrder, setSortOrder }), [sortOrder, setSortOrder]);

  return <SettingsContext.Provider value={value}>{children}</SettingsContext.Provider>;
}
