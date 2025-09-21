export interface Project {
  id: string;
  name: string;
  color: string;
}

export interface Task {
  id: string;
  projectId: string;
  title: string;
  estDuration?: number; // in minutes
}

export interface Subtask {
  id: string;
  taskId: string;
  title: string;
  estDuration?: number; // in minutes
}

export interface ScheduledBlock {
  id: string;
  taskOrSubtaskId: string;
  itemType: 'task' | 'subtask';
  start: number; // minutes from midnight
  end: number; // minutes from midnight
  date: string; // YYYY-MM-DD
}

export interface ActivityLog {
  id:string;
  taskOrSubtaskId: string;
  itemType: 'task' | 'subtask';
  start: number; // minutes from midnight
  end: number; // minutes from midnight
  date: string; // YYYY-MM-DD
}

export interface ActiveTimer {
  startTime: number; // Date.now() timestamp
  taskOrSubtaskId: string;
  itemType: 'task' | 'subtask';
  // for pause/resume functionality
  accumulated: number; // in milliseconds
  isPaused: boolean;
}

export interface AppState {
  projects: Project[];
  tasks: Task[];
  subtasks: Subtask[];
  scheduledBlocks: ScheduledBlock[];
  activityLogs: ActivityLog[];
  activeTimer: ActiveTimer | null;
}

export type AppAction =
  | { type: 'ADD_TASK'; payload: { task: Task; subtasks: Subtask[] } }
  | { type: 'UPDATE_TASK'; payload: Task }
  | { type: 'DELETE_TASK'; payload: { taskId: string } }
  | { type: 'ADD_SUBTASK'; payload: Subtask }
  | { type: 'UPDATE_SUBTASK'; payload: Subtask }
  | { type: 'DELETE_SUBTASK'; payload: { subtaskId: string } }
  | { type: 'UPDATE_PROJECT'; payload: Project }
  | { type: 'DELETE_PROJECT'; payload: { projectId: string } }
  | { type: 'ADD_SCHEDULED_BLOCK'; payload: ScheduledBlock }
  | { type: 'UPDATE_SCHEDULED_BLOCK'; payload: ScheduledBlock }
  | { type: 'DELETE_SCHEDULED_BLOCK'; payload: { id: string } }
  | { type: 'START_TIMER'; payload: { taskOrSubtaskId: string; itemType: 'task' | 'subtask'; startTime: number } }
  | { type: 'PAUSE_TIMER' }
  | { type: 'RESUME_TIMER' }
  | { type: 'STOP_TIMER'; payload: { endTime: number } }
  | { type: 'SET_STATE'; payload: AppState }
  | { type: 'UPDATE_ACTIVITY_LOG'; payload: ActivityLog };