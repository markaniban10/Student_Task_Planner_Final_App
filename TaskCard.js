import { Ionicons } from '@expo/vector-icons';
import { Pressable, Text, TouchableOpacity, View } from 'react-native';
import { useTheme } from './ThemeContext';
import { formatDeadline } from './helpers';

// One task in the list.
//  - Tap the box   -> onToggle (finish the task, or bring it back from History)
//  - Tap the card  -> onPress (open the Edit screen)
//  - Hold the card -> onLongPress (Edit / Delete menu)
//  - onDelete is optional: when given, a trash icon is shown (History screen)
//  - checked is optional: shows the checkmark before the task is really finished
export default function TaskCard({ task, now, onToggle, onPress, onLongPress, onDelete, checked }) {
  const { colors, styles } = useTheme();
  const showCheck = task.done || checked;
  const isOverdue = !task.done && task.deadline && new Date(task.deadline) < now;

  const dueText = task.done
    ? `Finished ${formatDeadline(task.completedAt, now)}`
    : formatDeadline(task.deadline, now);

  return (
    <Pressable style={[styles.card, task.done && styles.cardDone]} onPress={onPress} onLongPress={onLongPress}>
      <TouchableOpacity
        onPress={onToggle}
        hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
        accessibilityLabel={task.done ? 'Mark as not done' : 'Mark as done'}
      >
        <Ionicons
          name={showCheck ? 'checkbox' : 'square-outline'}
          size={34}
          color={showCheck ? colors.textSoft : colors.text}
        />
      </TouchableOpacity>

      <View style={styles.cardBody}>
        <Text style={[styles.cardTitle, task.done && styles.cardTitleDone]} numberOfLines={2}>
          {task.title}
        </Text>
        <Text style={[styles.cardDue, isOverdue && { color: colors.overdue }]}>{dueText}</Text>
      </View>

      {!!onDelete && (
        <TouchableOpacity onPress={onDelete} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
          <Ionicons name="trash-outline" size={22} color={colors.overdue} />
        </TouchableOpacity>
      )}

      {/* Subject label in the top-right corner */}
      <View style={styles.tag}>
        <Text style={styles.tagText} numberOfLines={1}>
          {task.subject}
        </Text>
      </View>
    </Pressable>
  );
}