import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Notifications from 'expo-notifications';
import { useEffect, useRef } from 'react';
import { Alert, Platform } from 'react-native';

// This file handles everything about notifications:
//  1. setting them up (channel, Finish button, permissions)
//  2. scheduling the two reminders of a task
//  3. cancelling reminders
//  4. reacting when the user taps the notification or its Finish button

export const FINISH_ACTION = 'FINISH'; // the id of the Finish button
const CATEGORY = 'deadline'; // a group of buttons (we only have Finish)
const CHANNEL_ID = 'task_deadlines'; // Android needs every notification in a channel
const REMIND_BEFORE_MINUTES = 60; // the early reminder comes 1 hour before
const EXACT_ALARM_ASKED_KEY = '@student_planner_exact_alarm_asked';

// When a notification arrives while the app is OPEN, show it anyway
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

// ---------- 1. Setup (runs only once) ----------
// Every step has its OWN try/catch, so if one step fails (for example the
// channel in Expo Go), the other steps still run.
let setupPromise = null;
let channelReady = false;

// Step 1: the Android channel. We try with vibration first, then a simpler one.
async function createChannel() {
  if (Platform.OS !== 'android') return;

  const attempts = [
    {
      name: 'Task deadlines',
      importance: Notifications.AndroidImportance.HIGH,
      enableVibrate: true,
      vibrationPattern: [0, 400, 250, 400], // wait 0ms, buzz 400ms, pause 250ms, buzz 400ms
    },
    {
      name: 'Task deadlines',
      importance: Notifications.AndroidImportance.HIGH,
    },
  ];

  for (const config of attempts) {
    try {
      await Notifications.setNotificationChannelAsync(CHANNEL_ID, config);
      channelReady = true;
      return;
    } catch (e) {
      console.log('Channel creation failed, trying a simpler one:', e);
    }
  }
}

// Step 2: the Finish button that appears under the notification
async function registerFinishButton() {
  try {
    await Notifications.setNotificationCategoryAsync(CATEGORY, [
      {
        identifier: FINISH_ACTION,
        buttonTitle: 'Finish',
        options: { opensAppToForeground: true },
      },
    ]);
    const categories = await Notifications.getNotificationCategoriesAsync();
    console.log('Notification categories:', JSON.stringify(categories));
  } catch (e) {
    console.log('Finish button setup failed:', e);
  }
}

// Step 3: ask the user for permission to show notifications
async function askForPermission() {
  try {
    const current = await Notifications.getPermissionsAsync();
    if (!current.granted) {
      await Notifications.requestPermissionsAsync();
    }
  } catch (e) {
    console.log('Notification permission request failed:', e);
  }
}

// Step 4: Android 12+ needs the "exact alarm" permission, otherwise the
// deadline alert may arrive late. We ask ONCE (it opens a system settings screen).
async function askForExactAlarms() {
  if (Platform.OS !== 'android') return;
  try {
    const exact = await Notifications.getExactAlarmPermissionsAsync();
    console.log('Exact alarm allowed:', exact.granted);
    if (exact.granted || !exact.canAskAgain) return;

    const alreadyAsked = await AsyncStorage.getItem(EXACT_ALARM_ASKED_KEY);
    if (alreadyAsked) return;
    await AsyncStorage.setItem(EXACT_ALARM_ASKED_KEY, 'yes');

    await Notifications.requestExactAlarmPermissionsAsync();
  } catch (e) {
    console.log('Exact alarm permission is not available here:', e);
  }
}

async function doSetup() {
  await createChannel();
  await registerFinishButton();
  await askForPermission();
  await askForExactAlarms();
}

// Calling this many times is fine: the setup really runs only once
export function setupNotifications() {
  if (!setupPromise) setupPromise = doSetup();
  return setupPromise;
}

// ---------- 2 and 3. Schedule and cancel ----------
// Each task gets two notification ids built from the task id
const soonId = (taskId) => `${taskId}_soon`;
const dueId = (taskId) => `${taskId}_due`;

// Remove both reminders of a task (also removes them from the notification tray)
export async function cancelTaskReminders(taskId) {
  for (const identifier of [soonId(taskId), dueId(taskId)]) {
    try {
      await Notifications.cancelScheduledNotificationAsync(identifier);
    } catch (e) {}
    try {
      await Notifications.dismissNotificationAsync(identifier);
    } catch (e) {}
  }
}

// Schedule one notification at a given date.
// `delivery` (Android only): 'alarmClock' is delivered on time and is not
// delayed by battery saving. It needs the exact alarm permission, otherwise
// Android falls back to 'bestEffort' (can be a few minutes late).
function scheduleOne(identifier, task, body, date, delivery = 'bestEffort') {
  const trigger = {
    type: Notifications.SchedulableTriggerInputTypes.DATE,
    date: date,
    delivery: delivery,
  };
  // Only use our channel if it was really created. Otherwise Android uses its default one.
  if (channelReady) trigger.channelId = CHANNEL_ID;

  return Notifications.scheduleNotificationAsync({
    identifier: identifier,
    content: {
      title: task.title,
      body: body,
      data: { taskId: task.id }, // so we know which task the notification is for
      categoryIdentifier: CATEGORY,
    },
    trigger: trigger,
  });
}

// Schedule the two reminders of a task:
//  - one 1 hour before the deadline
//  - one at the deadline
// Finished tasks, tasks with no deadline, and times already passed get nothing.
export async function scheduleTaskReminders(task) {
  try {
    await setupNotifications();
    await cancelTaskReminders(task.id); // start clean (needed when a task is edited)

    if (task.done || !task.deadline) return;

    const deadline = new Date(task.deadline);
    const earlyReminder = new Date(deadline.getTime() - REMIND_BEFORE_MINUTES * 60 * 1000);
    const now = Date.now();

    if (earlyReminder.getTime() > now) {
      await scheduleOne(soonId(task.id), task, `Due in 1 hour · ${task.subject}`, earlyReminder);
    }
    if (deadline.getTime() > now) {
      await scheduleOne(dueId(task.id), task, `Deadline reached · ${task.subject}`, deadline, 'alarmClock');
    }
  } catch (e) {
    console.log('Could not schedule reminders:', e);
  }
}

// ---------- 4. Reacting to the notification ----------
// Call this inside a component. `isReady` must be true only after the saved
// tasks are loaded, so we never change tasks before they exist.
//  - Finish button tapped       -> onFinish(taskId)
//  - Notification itself tapped -> ask "Mark this task as finished?"
export function useFinishFromNotification(isReady, onFinish) {
  const lastResponse = Notifications.useLastNotificationResponse();
  const handledKey = useRef(null); // remembers the response we already handled

  useEffect(() => {
    if (!isReady || !lastResponse) return;

    const key = `${lastResponse.notification.request.identifier}@${lastResponse.notification.date}@${lastResponse.actionIdentifier}`;
    if (handledKey.current === key) return; // already handled, do nothing
    handledKey.current = key;

    const content = lastResponse.notification.request.content;
    const taskId = content.data?.taskId;
    if (!taskId) return;

    if (lastResponse.actionIdentifier === FINISH_ACTION) {
      onFinish(taskId);
    } else if (lastResponse.actionIdentifier === Notifications.DEFAULT_ACTION_IDENTIFIER) {
      Alert.alert(content.title || 'Task', 'Mark this task as finished?', [
        { text: 'Not yet', style: 'cancel' },
        { text: 'Finish', onPress: () => onFinish(taskId) },
      ]);
    }
  }, [lastResponse, isReady, onFinish]);
}
