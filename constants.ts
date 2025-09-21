import type { AppState } from './types';

export const PROJECT_THEME_COLORS: { [key: string]: { bg: string; border: string; } } = {
  blue: { bg: 'bg-blue-600', border: 'border-blue-500' },
  green: { bg: 'bg-green-600', border: 'border-green-500' },
  purple: { bg: 'bg-purple-600', border: 'border-purple-500' },
  yellow: { bg: 'bg-yellow-600', border: 'border-yellow-500' },
};


const getTodayString = () => {
    const today = new Date();
    const year = today.getFullYear();
    const month = (today.getMonth() + 1).toString().padStart(2, '0');
    const day = today.getDate().toString().padStart(2, '0');
    return `${year}-${month}-${day}`;
};

export const INITIAL_STATE: AppState = {
  projects: [
    { id: 'p1', name: 'Business', color: 'blue' },
    { id: 'p2', name: 'Health', color: 'green' },
    { id: 'p3', name: 'Looksmaxxing', color: 'purple' },
    { id: 'p4', name: 'Reflection', color: 'yellow' },
  ],
  tasks: [
    { id: 't1', projectId: 'p1', title: 'Develop new feature', estDuration: 180 },
    { id: 't2', projectId: 'p1', title: 'Client meeting prep' },
    { id: 't3', projectId: 'p2', title: 'Workout', estDuration: 60 },
    { id: 't4', projectId: 'p2', title: 'Meal Prep', estDuration: 45 },
    { id: 't5', projectId: 'p3', title: 'Skincare routine', estDuration: 15 },
    { id: 't6', projectId: 'p4', title: 'Journaling', estDuration: 30 },
  ],
  subtasks: [
    { id: 's1', taskId: 't2', title: 'Research client background', estDuration: 30 },
    { id: 's2', taskId: 't2', title: 'Prepare presentation slides', estDuration: 90 },
  ],
  scheduledBlocks: [
    { id: 'sb1', taskOrSubtaskId: 't3', itemType: 'task', start: 420, end: 480, date: getTodayString() }, // 7:00 - 8:00
    { id: 'sb2', taskOrSubtaskId: 's2', itemType: 'subtask', start: 600, end: 690, date: getTodayString() }, // 10:00 - 11:30
  ],
  activityLogs: [
    { id: 'al1', taskOrSubtaskId: 't3', itemType: 'task', start: 425, end: 490, date: getTodayString() }, // 7:05 - 8:10
  ],
  activeTimer: null,
};

export const MINUTES_IN_DAY = 24 * 60;