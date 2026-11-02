import React, { useMemo, useState } from 'react';
import { Alert, Keyboard, Platform, ScrollView, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useTheme } from './ThemeContext';
import { useTasks } from './TasksContext';
import { cleanSubject, formatDeadline, getDefaultDeadline } from './helpers';
import { IconButton } from './AppHeader';

// This one screen is used for both adding a new task and editing a task.
// If route.params.taskId exists we are editing, otherwise we are adding.
export default function AddTaskScreen({ route, navigation }) {
  const { colors, styles, isDark } = useTheme();
  const taskId = route.params?.taskId;
  const { tasks, addTask, updateTask, deleteTask } = useTasks();

  // The task being edited (null when adding a new one)
  const editingTask = useMemo(() => tasks.find((t) => t.id === taskId) || null, [tasks, taskId]);

  const [title, setTitle] = useState(editingTask ? editingTask.title : '');
  const [subject, setSubject] = useState(editingTask ? editingTask.subject : '');
  const [deadline, setDeadline] = useState(
    editingTask && editingTask.deadline ? new Date(editingTask.deadline) : null
  );
  const [pickerMode, setPickerMode] = useState(null); // 'date', 'time', 'datetime' or null
  const [titleError, setTitleError] = useState('');

  // Subjects the user already used, shown as quick-pick chips
  const knownSubjects = useMemo(
    () => [...new Set(tasks.map((t) => t.subject))].sort((a, b) => a.localeCompare(b)),
    [tasks]
  );

  const openPicker = () => {
    Keyboard.dismiss();
    if (!deadline) setDeadline(getDefaultDeadline());
    // Android: choose the date first, then the time. iPhone: one picker for both.
    setPickerMode(Platform.OS === 'android' ? 'date' : 'datetime');
  };

  const clearDeadline = () => {
    setDeadline(null);
    setPickerMode(null);
  };

  const onPickerChange = (event, selectedDate) => {
    if (Platform.OS === 'android') {
      // User pressed Cancel
      if (event.type !== 'set' || !selectedDate) {
        setPickerMode(null);
        return;
      }

      const newDeadline = new Date(deadline || getDefaultDeadline());

      if (pickerMode === 'date') {
        newDeadline.setFullYear(selectedDate.getFullYear(), selectedDate.getMonth(), selectedDate.getDate());
        setDeadline(newDeadline);
        setPickerMode('time'); // now ask for the time
      } else {
        newDeadline.setHours(selectedDate.getHours(), selectedDate.getMinutes(), 0, 0);
        setDeadline(newDeadline);
        setPickerMode(null);
      }
    } else if (selectedDate) {
      setDeadline(selectedDate);
    }
  };

  // CREATE or UPDATE
  const saveTask = () => {
    const trimmedTitle = title.trim();
    if (trimmedTitle === '') {
      setTitleError('Write down what you need to finish.');
      return;
    }

    const taskData = {
      title: trimmedTitle,
      subject: cleanSubject(subject, tasks),
      deadline: deadline ? deadline.toISOString() : null,
    };

    if (editingTask) {
      updateTask(editingTask.id, taskData);
    } else {
      addTask(taskData);
    }
    navigation.goBack();
  };

  // DELETE (asks first)
  const confirmDelete = () => {
    Alert.alert('Delete task', 'This task will be removed permanently.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () => {
          deleteTask(editingTask.id);
          navigation.goBack();
        },
      },
    ]);
  };

  return (
    <SafeAreaView style={styles.screen} edges={['bottom', 'left', 'right']}>
      <ScrollView contentContainerStyle={styles.formContent} keyboardShouldPersistTaps="handled">
        {/* ----- Task title ----- */}
        <View style={styles.formLabelRow}>
          <Ionicons name="create-outline" size={24} color={colors.line} />
          <Text style={styles.formLabel}>What do you need to finish?</Text>
        </View>
        <View style={styles.formBox}>
          <TextInput
            style={styles.formInput}
            placeholder="e.g. Quiz in Mobile Programming"
            placeholderTextColor={colors.textMuted}
            value={title}
            onChangeText={(text) => {
              setTitle(text);
              if (titleError) setTitleError('');
            }}
            maxLength={120}
          />
          {!!titleError && <Text style={styles.errorText}>{titleError}</Text>}
        </View>

        {/* ----- Subject: type anything, or tap a chip ----- */}
        <View style={styles.formLabelRow}>
          <Ionicons name="bookmark-outline" size={24} color={colors.line} />
          <Text style={styles.formLabel}>Which subject is it for?</Text>
        </View>
        <View style={styles.formBox}>
          <TextInput
            style={styles.formInput}
            placeholder="Type any subject (e.g. CS 302)"
            placeholderTextColor={colors.textMuted}
            value={subject}
            onChangeText={setSubject}
            maxLength={40}
          />

          {knownSubjects.length > 0 && (
            <>
              <Text style={styles.chipHint}>Your subjects</Text>
              <View style={styles.chipRow}>
                {knownSubjects.map((name) => {
                  const isSelected = name.toLowerCase() === subject.trim().toLowerCase();
                  return (
                    <TouchableOpacity
                      key={name}
                      style={[styles.chip, isSelected && styles.chipActive]}
                      onPress={() => setSubject(name)}
                    >
                      <Text style={isSelected ? styles.chipTextActive : styles.chipText}>{name}</Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </>
          )}
        </View>

        {/* ----- Deadline ----- */}
        <View style={styles.formLabelRow}>
          <Ionicons name="alarm-outline" size={24} color={colors.line} />
          <Text style={styles.formLabel}>When is it due?</Text>
        </View>
        <View style={[styles.formBox, styles.deadlineBox]}>
          <TouchableOpacity style={{ flex: 1 }} onPress={openPicker}>
            <Text style={[styles.deadlineText, !deadline && styles.deadlineEmpty]}>
              {deadline ? formatDeadline(deadline.toISOString()) : 'No deadline yet'}
            </Text>
          </TouchableOpacity>

          {deadline && (
            <IconButton name="close-circle-outline" size={24} color={colors.textSoft} onPress={clearDeadline} />
          )}
          <IconButton name="alarm-outline" size={26} color={colors.line} onPress={openPicker} />
        </View>

        {pickerMode && (
          <DateTimePicker
            value={deadline || getDefaultDeadline()}
            mode={pickerMode}
            display={Platform.OS === 'ios' ? 'spinner' : 'default'}
            themeVariant={isDark ? 'dark' : 'light'}
            textColor={Platform.OS === 'ios' ? colors.text : undefined}
            onChange={onPickerChange}
          />
        )}

        {Platform.OS === 'ios' && pickerMode && (
          <TouchableOpacity style={styles.pickerDone} onPress={() => setPickerMode(null)}>
            <Text style={styles.retryText}>Done</Text>
          </TouchableOpacity>
        )}

        {/* Delete button only appears when editing */}
        {editingTask && (
          <TouchableOpacity style={styles.deleteButton} onPress={confirmDelete}>
            <Ionicons name="trash-outline" size={20} color={colors.overdue} />
            <Text style={styles.deleteText}>Delete task</Text>
          </TouchableOpacity>
        )}
      </ScrollView>

      {/* Check button: saves the task */}
      <TouchableOpacity style={styles.fab} onPress={saveTask} accessibilityLabel="Save task">
        <Ionicons name="checkmark" size={34} color={colors.onAccent} />
      </TouchableOpacity>
    </SafeAreaView>
  );
}
