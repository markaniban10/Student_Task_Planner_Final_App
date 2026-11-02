import React from 'react';
import { ActivityIndicator, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from './ThemeContext';

// Shows a spinner while loading, or an error message with a "Try again"
// button when loading failed. Shows nothing when everything is fine.
export function LoadingOrError({ isLoading, error, onRetry }) {
  const { colors, styles } = useTheme();

  if (isLoading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={colors.accent} />
        <Text style={styles.stateText}>Loading your tasks...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.centered}>
        <Ionicons name="cloud-offline-outline" size={48} color={colors.overdue} />
        <Text style={styles.stateText}>{error}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={onRetry}>
          <Text style={styles.retryText}>Try again</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return null;
}

// Shown when a list has nothing to display
export function EmptyState({ icon, title, message }) {
  const { colors, styles } = useTheme();
  return (
    <View style={styles.centered}>
      <Ionicons name={icon} size={56} color={colors.line} />
      <Text style={styles.emptyTitle}>{title}</Text>
      <Text style={styles.stateText}>{message}</Text>
    </View>
  );
}
