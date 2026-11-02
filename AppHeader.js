import React from 'react';
import { Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from './ThemeContext';

// A tappable icon (menu, search, trash, ...). Default color matches the header text.
export function IconButton({ name, onPress, color, size = 26 }) {
  const { colors, styles } = useTheme();
  return (
    <TouchableOpacity
      style={styles.iconButton}
      onPress={onPress}
      hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
    >
      <Ionicons name={name} size={size} color={color || colors.headerText} />
    </TouchableOpacity>
  );
}

// The top bar of the Tasks and History screens.
// `left` and `right` are the icons. If you pass `children`, they replace
// the title (we use this for the search box).
// The space under the phone's status bar is handled by the SafeAreaView
// that wraps each screen, so the header does not need to do it.
export default function AppHeader({ title, subtitle, left, right, children }) {
  const { styles } = useTheme();

  return (
    <View style={styles.header}>
      <View style={styles.headerSide}>{left}</View>

      <View style={styles.headerCenter}>
        {children || (
          <>
            <Text style={styles.headerTitle}>{title}</Text>
            {!!subtitle && (
              <Text style={styles.headerSubtitle} numberOfLines={1}>
                {subtitle}
              </Text>
            )}
          </>
        )}
      </View>

      <View style={[styles.headerSide, styles.headerRight]}>{right}</View>
    </View>
  );
}
