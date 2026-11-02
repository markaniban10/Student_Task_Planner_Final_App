import { Ionicons } from '@expo/vector-icons';
import Constants from 'expo-constants';
import { Alert, Linking, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useSettings } from './SettingsContext';
import { useTheme } from './ThemeContext';

// TODO: change this to your real support email
const SUPPORT_EMAIL = 'markaniban54@gmail.com';
const APP_NAME = 'Student Task Planner';

// The two theme choices
const THEME_OPTIONS = [
  { value: 'light', label: 'Light', icon: 'sunny-outline' },
  { value: 'dark', label: 'Dark', icon: 'moon-outline' },
];

// The two sort choices. Tasks are always sorted by deadline;
// this only decides the order of tasks that have the SAME deadline.
const SORT_OPTIONS = [
  { value: 'oldest', label: 'Old tasks first', hint: 'the task you added first is at the top' },
  { value: 'newest', label: 'New tasks first', hint: 'the task you added last is at the top' },
];

export default function SettingsScreen() {
  const { colors, styles, isDark, setThemeMode } = useTheme();
  const { sortOrder, setSortOrder } = useSettings();

  // The version number comes from "version" in app.json
  const appVersion = Constants.expoConfig?.version || '1.0.0';

  // Open the phone's email app
  const contactSupport = async () => {
    const url = `mailto:${SUPPORT_EMAIL}?subject=${encodeURIComponent(`${APP_NAME} support`)}`;
    try {
      await Linking.openURL(url);
    } catch (e) {
      Alert.alert('No email app found', `You can email us at ${SUPPORT_EMAIL}`);
    }
  };

  return (
    <SafeAreaView style={styles.screen} edges={['bottom', 'left', 'right']}>
      <ScrollView contentContainerStyle={styles.settingsContent}>
        {/* ---------------- GENERAL ---------------- */}
        <Text style={styles.settingsSectionTitle}>General</Text>
        <View style={styles.settingsCard}>
          {/* 1. Theme */}
          <Text style={styles.settingsLabel}>Theme</Text>
          <View style={styles.segment}>
            {THEME_OPTIONS.map((option) => {
              const isSelected = (isDark ? 'dark' : 'light') === option.value;
              return (
                <TouchableOpacity
                  key={option.value}
                  style={[styles.segmentButton, isSelected && styles.segmentButtonActive]}
                  onPress={() => setThemeMode(option.value)}
                >
                  <Ionicons
                    name={option.icon}
                    size={20}
                    color={isSelected ? colors.onAccent : colors.textSoft}
                  />
                  <Text style={isSelected ? styles.segmentTextActive : styles.segmentText}>{option.label}</Text>
                </TouchableOpacity>
              );
            })}
          </View>

          <View style={styles.settingsDivider} />

          {/* 2. Sort order */}
          <Text style={styles.settingsLabel}>Sort order</Text>
          <Text style={[styles.radioHint, { marginBottom: 6 }]}>
            Tasks are always sorted by deadline, nearest first.
          </Text>
          {SORT_OPTIONS.map((option) => {
            const isSelected = sortOrder === option.value;
            return (
              <TouchableOpacity key={option.value} style={styles.radioRow} onPress={() => setSortOrder(option.value)}>
                <Ionicons
                  name={isSelected ? 'radio-button-on' : 'radio-button-off'}
                  size={24}
                  color={isSelected ? colors.line : colors.textMuted}
                />
                <View>
                  <Text style={styles.radioLabel}>{option.label}</Text>
                  <Text style={styles.radioHint}>{option.hint}</Text>
                </View>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* ---------------- ABOUT ---------------- */}
        <Text style={styles.settingsSectionTitle}>About</Text>
        <View style={styles.settingsCard}>
          <View style={styles.infoRow}>
            <Ionicons name="information-circle-outline" size={24} color={colors.line} />
            <Text style={styles.infoLabel}>App version</Text>
            <Text style={styles.infoValue}>{appVersion}</Text>
          </View>

          <View style={styles.settingsDivider} />

          <TouchableOpacity style={styles.infoRow} onPress={contactSupport}>
            <Ionicons name="mail-outline" size={24} color={colors.line} />
            <Text style={styles.infoLabel}>Contact / Support</Text>
            <Ionicons name="chevron-forward" size={20} color={colors.textMuted} />
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
