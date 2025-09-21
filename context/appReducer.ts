import type { AppState, AppAction, ActivityLog, Subtask, Task } from '../types';
import { v4 as uuidv4 } from 'uuid';

const getYYYYMMDD = (date: Date): string => {
    const year = date.getFullYear();
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    return `${year}-${month}-${day}`;
};

export const appReducer = (state: AppState, action: AppAction): AppState => {
  switch (action.type) {
    case 'ADD_PROJECT':
      return {
        ...state,
        projects: [...state.projects, action.payload],
      };
    case 'ADD_TASK': {
      const { task, subtasks } = action.payload;
      return {
        ...state,
        tasks: [...state.tasks, task],
        subtasks: [...state.subtasks, ...subtasks],
      };
    }
    case 'UPDATE_TASK':
      return {
        ...state,
        tasks: state.tasks.map(t => t.id === action.payload.id ? action.payload : t),
      };
    case 'DELETE_TASK': {
        const { taskId } = action.payload;
        const subtasksToDelete = state.subtasks.filter(st => st.taskId === taskId).map(st => st.id);
        const allIdsToDelete = [taskId, ...subtasksToDelete];

        return {
            ...state,
            tasks: state.tasks.filter(t => t.id !== taskId),
            subtasks: state.subtasks.filter(st => st.taskId !== taskId),
            scheduledBlocks: state.scheduledBlocks.filter(b => !allIdsToDelete.includes(b.taskOrSubtaskId)),
            activityLogs: state.activityLogs.filter(l => !allIdsToDelete.includes(l.taskOrSubtaskId)),
        };
    }
    case 'ADD_SUBTASK':
      return {
        ...state,
        subtasks: [...state.subtasks, action.payload],
      };
    case 'UPDATE_SUBTASK':
      return {
        ...state,
        subtasks: state.subtasks.map(st => st.id === action.payload.id ? action.payload : st),
      };
    case 'DELETE_SUBTASK': {
        const { subtaskId } = action.payload;
        return {
            ...state,
            subtasks: state.subtasks.filter(st => st.id !== subtaskId),
            scheduledBlocks: state.scheduledBlocks.filter(b => b.taskOrSubtaskId !== subtaskId),
            activityLogs: state.activityLogs.filter(l => l.taskOrSubtaskId !== subtaskId),
        };
    }
    case 'UPDATE_PROJECT':
      return {
        ...state,
        projects: state.projects.map(p => p.id === action.payload.id ? action.payload : p),
      };
    case 'DELETE_PROJECT': {
      const { projectId } = action.payload;
      const tasksToDelete = state.tasks.filter(t => t.projectId === projectId);
      const taskIdsToDelete = tasksToDelete.map(t => t.id);
      const subtaskIdsToDelete = state.subtasks.filter(st => taskIdsToDelete.includes(st.taskId)).map(st => st.id);
      const allItemIdsToDelete = [...taskIdsToDelete, ...subtaskIdsToDelete];

      // Also remove the project's items from the active timer if necessary
      const activeTimer = state.activeTimer && allItemIdsToDelete.includes(state.activeTimer.taskOrSubtaskId)
        ? null
        : state.activeTimer;

      return {
        ...state,
        projects: state.projects.filter(p => p.id !== projectId),
        tasks: state.tasks.filter(t => t.projectId !== projectId),
        subtasks: state.subtasks.filter(st => !taskIdsToDelete.includes(st.taskId)),
        scheduledBlocks: state.scheduledBlocks.filter(b => !allItemIdsToDelete.includes(b.taskOrSubtaskId)),
        activityLogs: state.activityLogs.filter(l => !allItemIdsToDelete.includes(l.taskOrSubtaskId)),
        activeTimer,
      };
    }
    case 'ADD_SCHEDULED_BLOCK':
      return {
        ...state,
        scheduledBlocks: [...state.scheduledBlocks, action.payload],
      };
    case 'UPDATE_SCHEDULED_BLOCK': {
      return {
        ...state,
        scheduledBlocks: state.scheduledBlocks.map((block) =>
          block.id === action.payload.id ? action.payload : block
        ),
      };
    }
    case 'UPDATE_ACTIVITY_LOG': {
      return {
        ...state,
        activityLogs: state.activityLogs.map((log) =>
          log.id === action.payload.id ? action.payload : log
        ),
      };
    }
    case 'DELETE_SCHEDULED_BLOCK':
      return {
        ...state,
        scheduledBlocks: state.scheduledBlocks.filter(
          (block) => block.id !== action.payload.id
        ),
      };
    case 'START_TIMER': {
        if(state.activeTimer) {
            // In a real app, prompt user. Here we auto-stop.
            const now = Date.now();
            const oldTimer = state.activeTimer;
            const durationMillis = now - oldTimer.startTime + oldTimer.accumulated;
            const durationMins = Math.round(durationMillis / 60000);
            
            const endDate = new Date(now);
            const currentMinute = endDate.getHours() * 60 + endDate.getMinutes();
            const startMinute = currentMinute - durationMins;

            const newLog: ActivityLog = {
                id: uuidv4(),
                taskOrSubtaskId: oldTimer.taskOrSubtaskId,
                itemType: oldTimer.itemType,
                start: startMinute,
                end: currentMinute,
                date: getYYYYMMDD(endDate),
            };

             return {
                ...state,
                activityLogs: [...state.activityLogs, newLog],
                activeTimer: {
                    ...action.payload,
                    accumulated: 0,
                    isPaused: false,
                },
             };
        }
      return {
        ...state,
        activeTimer: {
            ...action.payload,
            accumulated: 0,
            isPaused: false,
        },
      };
    }
    case 'PAUSE_TIMER': {
      if (!state.activeTimer || state.activeTimer.isPaused) return state;
      const accumulated = state.activeTimer.accumulated + (Date.now() - state.activeTimer.startTime);
      return {
        ...state,
        activeTimer: {
          ...state.activeTimer,
          isPaused: true,
          accumulated,
        },
      };
    }
    case 'RESUME_TIMER': {
       if (!state.activeTimer || !state.activeTimer.isPaused) return state;
       return {
        ...state,
        activeTimer: {
            ...state.activeTimer,
            isPaused: false,
            startTime: Date.now(),
        }
       }
    }
    case 'STOP_TIMER': {
      if (!state.activeTimer) return state;
      const { endTime } = action.payload;
      const finalAccumulated = state.activeTimer.isPaused 
        ? state.activeTimer.accumulated 
        : state.activeTimer.accumulated + (endTime - state.activeTimer.startTime);

      const durationMins = Math.round(finalAccumulated / 60000);
      
      const endDate = new Date(endTime);
      const endMinute = endDate.getHours() * 60 + endDate.getMinutes();
      const startMinute = endMinute - durationMins;

      const newLog: ActivityLog = {
        id: uuidv4(),
        taskOrSubtaskId: state.activeTimer.taskOrSubtaskId,
        itemType: state.activeTimer.itemType,
        start: startMinute < 0 ? 0 : startMinute,
        end: endMinute,
        date: getYYYYMMDD(endDate),
      };

      return {
        ...state,
        activityLogs: [...state.activityLogs, newLog],
        activeTimer: null,
      };
    }
    case 'SET_STATE':
        return action.payload;
    case 'DRAG_START':
        return {
            ...state,
            draggedItem: action.payload,
        };
    case 'DRAG_END':
        return {
            ...state,
            draggedItem: null,
        };
    default:
      return state;
  }
};