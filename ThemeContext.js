import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { useColorScheme } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createStyles, darkColors, lightColors } from './globalStyles';

// Context API again: every screen can ask "which colors should I use?"
const ThemeContext = createContext(null);

const THEME_KEY = '@student_planner_theme';

// Screens call useTheme() to get { colors, styles, isDark, setThemeMode }
export const useTheme = () => useContext(ThemeContext);

export function ThemeProvider({ children }) {
  // The phone's own setting ('light' or 'dark')
  const phoneScheme = useColorScheme();
  // The choice the user made in Settings (null = never chose)
  const [savedMode, setSavedMode] = useState(null);

  // Runs one time: read the saved choice from the phone
  useEffect(() => {
    AsyncStorage.getItem(THEME_KEY)
      .then((value) => {
        if (value === 'light' || value === 'dark') setSavedMode(value);
      })
      .catch(() => {});
  }, []);

  // The user's choice wins. If there is none, follow the phone.
  const isDark = (savedMode || phoneScheme) === 'dark';

  // Used by the Settings screen: mode is 'light' or 'dark'
  const setThemeMode = useCallback((mode) => {
    setSavedMode(mode);
    AsyncStorage.setItem(THEME_KEY, mode).catch(() => {});
  }, []);

  // Rebuild the colors and styles only when the mode changes
  const value = useMemo(() => {
    const colors = isDark ? darkColors : lightColors;
    return { isDark, colors, styles: createStyles(colors), setThemeMode };
  }, [isDark, setThemeMode]);

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}
