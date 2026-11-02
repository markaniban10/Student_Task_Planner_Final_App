import React, { useEffect, useRef, useState } from 'react';
import { Animated, Modal, Pressable, ScrollView, Switch, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { DRAWER_WIDTH } from './globalStyles';
import { useTheme } from './ThemeContext';

// One row in the menu (icon + name + number badge)
function DrawerRow({ icon, label, count, isActive, onPress }) {
  const { colors, styles } = useTheme();
  return (
    <TouchableOpacity style={[styles.drawerRow, isActive && styles.drawerRowActive]} onPress={onPress}>
      <Ionicons name={icon} size={24} color={colors.textSoft} />
      <Text style={styles.drawerRowText} numberOfLines={1}>
        {label}
      </Text>
      {count > 0 && (
        <View style={styles.badge}>
          <Text style={styles.badgeText}>{count}</Text>
        </View>
      )}
    </TouchableOpacity>
  );
}

// The menu that slides in from the left when you tap the hamburger icon.
// It lists every subject so the user can filter the Tasks screen,
// and has "Finished" and "Settings" shortcuts.
export default function SubjectDrawer({
  isOpen,
  onClose,
  subjects,
  subjectCounts,
  selectedSubject,
  onSelectSubject,
  totalPending,
  finishedCount,
  onOpenHistory,
  onOpenSettings,
}) {
  const { colors, styles, isDark, setThemeMode } = useTheme();
  const slide = useRef(new Animated.Value(0)).current; // 0 = closed, 1 = open
  // We keep the menu on screen until the closing animation finishes
  const [isShown, setIsShown] = useState(isOpen);

  // Runs every time isOpen changes: play the open or close animation
  useEffect(() => {
    if (isOpen) {
      setIsShown(true);
      Animated.timing(slide, { toValue: 1, duration: 220, useNativeDriver: true }).start();
    } else {
      Animated.timing(slide, { toValue: 0, duration: 180, useNativeDriver: true }).start(({ finished }) => {
        if (finished) setIsShown(false);
      });
    }
  }, [isOpen, slide]);

  if (!isShown) return null;

  const translateX = slide.interpolate({ inputRange: [0, 1], outputRange: [-DRAWER_WIDTH, 0] });

  return (
    <Modal transparent visible animationType="none" statusBarTranslucent onRequestClose={onClose}>
      {/* A Modal is outside the normal screen tree, so it needs its own SafeAreaProvider */}
      <SafeAreaProvider>
        <View style={styles.drawerOverlay}>
          <Animated.View style={[styles.drawer, { transform: [{ translateX }] }]}>
            {/* SafeAreaView keeps the menu away from the status bar and the bottom buttons */}
            <SafeAreaView style={{ flex: 1 }} edges={['top', 'bottom', 'left']}>
              {/* Top part with the app name */}
              <View style={styles.drawerHero}>
                <View style={styles.logoCircle}>
                  <Ionicons name="pencil" size={38} color={colors.onAccent} />
                </View>
                <Text style={styles.drawerAppName}>Student Planner</Text>
                <Text style={styles.drawerAppTagline}>Never miss a deadline</Text>
              </View>

              <ScrollView style={{ flex: 1 }}>
                <Text style={styles.drawerLabel}>Subjects</Text>

                <DrawerRow
                  icon="apps-outline"
                  label="All Subjects"
                  count={totalPending}
                  isActive={selectedSubject === 'All'}
                  onPress={() => onSelectSubject('All')}
                />

                {subjects.map((subject) => (
                  <DrawerRow
                    key={subject}
                    icon="bookmark-outline"
                    label={subject}
                    count={subjectCounts[subject] || 0}
                    isActive={selectedSubject === subject}
                    onPress={() => onSelectSubject(subject)}
                  />
                ))}

                <View style={styles.drawerDivider} />

                <DrawerRow
                  icon="checkmark-done-circle-outline"
                  label="Finished"
                  count={finishedCount}
                  isActive={false}
                  onPress={onOpenHistory}
                />

                <View style={styles.drawerDivider} />

                {/* Dark mode switch (also available in Settings) */}
                <View style={styles.drawerRow}>
                  <Ionicons name={isDark ? 'moon' : 'moon-outline'} size={24} color={colors.textSoft} />
                  <Text style={styles.drawerRowText}>Dark mode</Text>
                  <Switch
                    value={isDark}
                    onValueChange={(value) => setThemeMode(value ? 'dark' : 'light')}
                    trackColor={{ false: colors.border, true: colors.accent }}
                    thumbColor={isDark ? colors.onAccent : colors.textMuted}
                  />
                </View>
              </ScrollView>

              {/* Settings stays at the bottom of the menu */}
              <View style={styles.drawerFooter}>
                <DrawerRow icon="settings-outline" label="Settings" count={0} isActive={false} onPress={onOpenSettings} />
              </View>
            </SafeAreaView>
          </Animated.View>

          {/* Dark area on the right: tap it to close the menu */}
          <Animated.View style={[styles.drawerBackdrop, { opacity: slide }]}>
            <Pressable style={{ flex: 1 }} onPress={onClose} />
          </Animated.View>
        </View>
      </SafeAreaProvider>
    </Modal>
  );
}
