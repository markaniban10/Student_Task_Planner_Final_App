import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { createNavigationContainerRef } from '@react-navigation/native';
import { useTasks } from './TasksContext';
import SubjectDrawer from './SubjectDrawer';

// Lets us move between screens from outside a screen (the drawer is not a screen).
// App.js gives this to the NavigationContainer.
export const navigationRef = createNavigationContainerRef();

// The drawer is shared, so the Tasks screen AND the History screen can open it.
const DrawerContext = createContext(null);

// Screens call useDrawer() to get { selectedSubject, openDrawer }
export const useDrawer = () => useContext(DrawerContext);

export function DrawerProvider({ children }) {
  const { tasks } = useTasks();
  const [isOpen, setIsOpen] = useState(false);
  const [selectedSubject, setSelectedSubject] = useState('All');

  // Count the subjects and the tasks. Only recalculated when `tasks` changes.
  const { subjects, subjectCounts, pendingCount, finishedCount } = useMemo(() => {
    const counts = {};
    let pending = 0;
    let finished = 0;

    tasks.forEach((task) => {
      if (task.done) {
        finished += 1;
        counts[task.subject] = counts[task.subject] || 0;
      } else {
        pending += 1;
        counts[task.subject] = (counts[task.subject] || 0) + 1;
      }
    });

    return {
      subjects: Object.keys(counts).sort((a, b) => a.localeCompare(b)),
      subjectCounts: counts,
      pendingCount: pending,
      finishedCount: finished,
    };
  }, [tasks]);

  // If the chosen subject no longer exists (its tasks were deleted), show All again
  useEffect(() => {
    if (selectedSubject !== 'All' && !subjects.includes(selectedSubject)) {
      setSelectedSubject('All');
    }
  }, [subjects, selectedSubject]);

  const openDrawer = useCallback(() => setIsOpen(true), []);
  const closeDrawer = useCallback(() => setIsOpen(false), []);

  // Close the menu, then go to another screen
  const goTo = (...args) => {
    setIsOpen(false);
    if (navigationRef.isReady()) navigationRef.navigate(...args);
  };

  const value = useMemo(() => ({ selectedSubject, openDrawer }), [selectedSubject, openDrawer]);

  return (
    <DrawerContext.Provider value={value}>
      {children}

      <SubjectDrawer
        isOpen={isOpen}
        onClose={closeDrawer}
        subjects={subjects}
        subjectCounts={subjectCounts}
        selectedSubject={selectedSubject}
        totalPending={pendingCount}
        finishedCount={finishedCount}
        onSelectSubject={(subject) => {
          setSelectedSubject(subject);
          goTo('Main', { screen: 'Tasks' }); // show the filtered list
        }}
        onOpenHistory={() => goTo('Main', { screen: 'History' })}
        onOpenSettings={() => goTo('Settings')}
      />
    </DrawerContext.Provider>
  );
}
