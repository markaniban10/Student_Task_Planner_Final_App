// Small helper functions used by several screens.
// No React code here, just plain JavaScript.

// The order of the groups shown on the Home screen
export const SECTION_ORDER = ['Overdue', 'Today', 'Tomorrow', 'This week', 'Later', 'No deadline'];

const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

const startOfDay = (date) => new Date(date.getFullYear(), date.getMonth(), date.getDate());

// How many calendar days from `now` to `date` (0 = today, 1 = tomorrow)
const daysFromNow = (date, now) => Math.round((startOfDay(date) - startOfDay(now)) / 86400000);

// 15:30 -> "3:30 PM"
const formatTime = (date) => {
  const hours = date.getHours();
  const minutes = `${date.getMinutes()}`.padStart(2, '0');
  const hours12 = hours % 12 === 0 ? 12 : hours % 12;
  return `${hours12}:${minutes} ${hours >= 12 ? 'PM' : 'AM'}`;
};

// Turns a saved date into text like "Today, 12:00 PM" or "Fri, Oct 23, 12:00 PM"
export const formatDeadline = (isoDate, now = new Date()) => {
  if (!isoDate) return 'No deadline';
  const date = new Date(isoDate);
  const diff = daysFromNow(date, now);

  if (diff === 0) return `Today, ${formatTime(date)}`;
  if (diff === 1) return `Tomorrow, ${formatTime(date)}`;
  if (diff === -1) return `Yesterday, ${formatTime(date)}`;

  const year = date.getFullYear() !== now.getFullYear() ? `, ${date.getFullYear()}` : '';
  return `${DAY_NAMES[date.getDay()]}, ${MONTH_NAMES[date.getMonth()]} ${date.getDate()}${year}, ${formatTime(date)}`;
};

// Decides which group a deadline belongs to on the Home screen
export const getSection = (isoDate, now) => {
  if (!isoDate) return 'No deadline';
  const date = new Date(isoDate);
  if (date < now) return 'Overdue';

  const diff = daysFromNow(date, now);
  if (diff === 0) return 'Today';
  if (diff === 1) return 'Tomorrow';
  if (diff <= 7) return 'This week';
  return 'Later';
};

// When was the task added? Every task id starts with the time it was
// created (13 digits), so we can read it back from the id.
export const getAddedTime = (task) => Number(String(task.id).slice(0, 13)) || 0;

// Sort the tasks:
//  1. ALWAYS by deadline: the nearest deadline is at the top, tasks with
//     no deadline go last.
//  2. If two tasks have the same deadline, the sort order decides:
//       order = 'oldest' -> the task you added first is at the top
//       order = 'newest' -> the task you added last is at the top
export const sortTasks = (a, b, order = 'oldest') => {
  if (a.deadline && b.deadline) {
    const deadlineDifference = new Date(a.deadline) - new Date(b.deadline);
    if (deadlineDifference !== 0) return deadlineDifference;
  } else if (a.deadline) {
    return -1; // a has a deadline, b does not
  } else if (b.deadline) {
    return 1;
  }

  // Same deadline: compare the time they were added
  const addedDifference = getAddedTime(a) - getAddedTime(b);
  return order === 'newest' ? -addedDifference : addedDifference;
};

// The date the picker starts on: tomorrow at 12:00 PM
export const getDefaultDeadline = () => {
  const date = new Date();
  date.setDate(date.getDate() + 1);
  date.setHours(12, 0, 0, 0);
  return date;
};

// Cleans the subject the user typed.
// "cs302" and "CS302" count as the same subject (the first spelling is kept).
export const cleanSubject = (typedSubject, tasks) => {
  const trimmed = typedSubject.trim();
  if (trimmed === '') return 'General';
  const existing = tasks.find((t) => t.subject.toLowerCase() === trimmed.toLowerCase());
  return existing ? existing.subject : trimmed;
};

// Makes a unique id for each new task
export const makeTaskId = () => `${Date.now()}${Math.floor(Math.random() * 1000)}`;
