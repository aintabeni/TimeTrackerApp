import React, { useMemo } from 'react';
import type { ScheduledBlock, ActivityLog } from '../types';
import { useAppState } from '../hooks/useAppContext';
import { formatTime } from '../utils/time';
import { PROJECT_THEME_COLORS } from '../constants';

interface AgendaViewProps {
  days: string[];
  scheduledBlocks: ScheduledBlock[];
  activityLogs: ActivityLog[];
}

type AgendaItem = (ScheduledBlock | ActivityLog) & { viewType: 'planned' | 'actual' };

const findItemDetails = (id: string, itemType: 'task' | 'subtask', state: ReturnType<typeof useAppState>) => {
    if (itemType === 'task') {
        const task = state.tasks.find(t => t.id === id);
        if(task) {
            const project = state.projects.find(p => p.id === task.projectId);
            return { title: task.title, project };
        }
    } else {
        const subtask = state.subtasks.find(s => s.id === id);
        if(subtask) {
            const task = state.tasks.find(t => t.id === subtask.taskId);
            if (task) {
                const project = state.projects.find(p => p.id === task.projectId);
                return { title: subtask.title, project };
            }
        }
    }
    return { title: 'Unknown', project: undefined };
}

const AgendaItemRow: React.FC<{ item: AgendaItem }> = ({ item }) => {
    const state = useAppState();
    const { title, project } = findItemDetails(item.taskOrSubtaskId, item.itemType, state);
    const projectColor = project ? PROJECT_THEME_COLORS[project.color]?.bg : 'bg-gray-500';

    const isPlanned = item.viewType === 'planned';

    return (
        <div className={`flex items-center space-x-4 p-3 border-b border-gray-700/50 ${isPlanned ? 'text-gray-400' : 'text-white'}`}>
            <div className="w-40 text-right font-mono text-sm flex-shrink-0">
                {formatTime(item.start)} - {formatTime(item.end)}
            </div>
            <div className={`w-2 h-10 rounded-full ${projectColor} ${isPlanned ? 'opacity-50' : ''}`}></div>
            <div className="flex-grow">
                <p className="font-semibold">{title}</p>
                <p className="text-xs text-gray-500">{project?.name || 'No Project'}</p>
            </div>
            <div className="w-24 text-center flex-shrink-0">
                <span className={`px-2 py-0.5 text-xs rounded-full ${isPlanned ? 'bg-gray-600' : 'bg-green-600/50 text-green-300'}`}>
                    {isPlanned ? 'Planned' : 'Actual'}
                </span>
            </div>
        </div>
    );
};

export const AgendaView: React.FC<AgendaViewProps> = ({ days, scheduledBlocks, activityLogs }) => {
    
    const agendaItemsByDay = useMemo(() => {
        const items: { [key: string]: AgendaItem[] } = {};

        days.forEach(day => {
            const dayItems: AgendaItem[] = [];
            
            scheduledBlocks
                .filter(b => b.date === day)
                .forEach(b => dayItems.push({ ...b, viewType: 'planned' }));

            activityLogs
                .filter(l => l.date === day)
                .forEach(l => dayItems.push({ ...l, viewType: 'actual' }));
            
            dayItems.sort((a, b) => a.start - b.start);
            items[day] = dayItems;
        });

        return items;
    }, [days, scheduledBlocks, activityLogs]);

    const hasAnyItems = Object.values(agendaItemsByDay).some(dayItems => dayItems.length > 0);

    return (
        <div className="flex-grow overflow-y-auto">
            {!hasAnyItems && (
                <div className="flex items-center justify-center h-full">
                    <p className="text-gray-500">No events scheduled for this period.</p>
                </div>
            )}
            {days.map(dayStr => {
                const items = agendaItemsByDay[dayStr];
                if (!items || items.length === 0) return null;

                const dateObj = new Date(dayStr + 'T00:00:00');
                const isToday = new Date().toDateString() === dateObj.toDateString();

                return (
                    <div key={dayStr}>
                        <div className={`sticky top-0 bg-gray-800/80 backdrop-blur-sm z-10 px-4 py-2 border-b border-t border-gray-700 ${isToday ? 'text-indigo-400' : ''}`}>
                            <h3 className="font-bold">{dateObj.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</h3>
                        </div>
                        <div>
                            {items.map(item => <AgendaItemRow key={`${item.id}-${item.viewType}`} item={item} />)}
                        </div>
                    </div>
                );
            })}
        </div>
    );
};