import React, { useState } from 'react';
import type { Task, Subtask, Project } from '../types';
import { useAppState, useAppDispatch } from '../hooks/useAppContext';
import { PlayIcon } from './icons/PlayIcon';
import { PauseIcon } from './icons/PauseIcon';
import { StopIcon } from './icons/StopIcon';
import { MoreVerticalIcon } from './icons/MoreVerticalIcon';
import { Dropdown, DropdownItem } from './common/Dropdown';
import { PROJECT_THEME_COLORS } from '../constants';

interface TaskItemProps {
  item: Task | Subtask;
  itemType: 'task' | 'subtask';
  project: Project;
  onEdit: () => void;
}

export const TaskItem: React.FC<TaskItemProps> = ({ item, itemType, project, onEdit }) => {
  const { activeTimer } = useAppState();
  const dispatch = useAppDispatch();

  const isRunning = activeTimer?.taskOrSubtaskId === item.id;
  const isPaused = activeTimer?.isPaused === true;

  const handleDragStart = (e: React.DragEvent<HTMLDivElement>) => {
    e.dataTransfer.setData('application/json', JSON.stringify({
      id: item.id,
      type: itemType,
      duration: item.estDuration || 60,
    }));
  };
  
  const handlePlay = () => {
    if(isRunning && isPaused) {
       dispatch({type: 'RESUME_TIMER'});
    } else if (!isRunning) {
       dispatch({ type: 'START_TIMER', payload: { taskOrSubtaskId: item.id, itemType, startTime: Date.now() } });
    }
  };
  
  const handlePause = () => {
    dispatch({ type: 'PAUSE_TIMER' });
  };
  
  const handleStop = () => {
    dispatch({ type: 'STOP_TIMER', payload: { endTime: Date.now() } });
  };

  const handleDelete = () => {
    if(window.confirm(`Are you sure you want to delete "${item.title}"?`)) {
        if (itemType === 'task') {
            dispatch({ type: 'DELETE_TASK', payload: { taskId: item.id } });
        } else {
            dispatch({ type: 'DELETE_SUBTASK', payload: { subtaskId: item.id } });
        }
    }
  }

  const projectBorder = PROJECT_THEME_COLORS[project.color]?.border || 'border-gray-500';
  const glowClass = isRunning ? 'shadow-lg shadow-cyan-400/50 ring-2 ring-cyan-400' : '';

  return (
    <div
      draggable
      onDragStart={handleDragStart}
      className={`group p-3 rounded-lg bg-gray-800 border-l-4 ${projectBorder} mb-2 flex justify-between items-center cursor-grab active:cursor-grabbing transition-shadow ${glowClass}`}
    >
      <div className="flex-grow min-w-0 flex items-baseline">
        <p className="font-semibold truncate">{item.title}</p>
        {item.estDuration && (
          <p className="text-xs text-gray-400 ml-2 flex-shrink-0">{item.estDuration} min</p>
        )}
      </div>
      <div className={`flex items-center space-x-1 pl-2 flex-shrink-0 transition-opacity ${isRunning ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}>
        {!isRunning ? (
            <button onClick={handlePlay} className="p-1 text-green-400 hover:text-green-300 transition-colors" title="Start Timer"><PlayIcon className="w-5 h-5"/></button>
        ) : (
            <>
            {isPaused ? 
              <button onClick={handlePlay} className="p-1 text-green-400 hover:text-green-300 transition-colors" title="Resume Timer"><PlayIcon className="w-5 h-5"/></button>
              :
              <button onClick={handlePause} className="p-1 text-yellow-400 hover:text-yellow-300 transition-colors" title="Pause Timer"><PauseIcon className="w-5 h-5"/></button>
            }
            <button onClick={handleStop} className="p-1 text-red-400 hover:text-red-300 transition-colors" title="Stop Timer"><StopIcon className="w-5 h-5"/></button>
            </>
        )}
         <Dropdown
            trigger={
                <button className="p-1 rounded-full text-gray-400 hover:bg-gray-700 hover:text-white" title="More options">
                    <MoreVerticalIcon className="w-5 h-5" />
                </button>
            }
        >
            <DropdownItem onClick={onEdit}>Edit</DropdownItem>
            <DropdownItem className="text-red-400 hover:bg-red-500/50" onClick={handleDelete}>Delete</DropdownItem>
        </Dropdown>
      </div>
    </div>
  );
};