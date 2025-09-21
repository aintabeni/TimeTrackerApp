import React, { useState, useMemo, useRef } from 'react';
import { useAppState, useAppDispatch } from '../hooks/useAppContext';
import type { ScheduledBlock, ActivityLog } from '../types';
import { v4 as uuidv4 } from 'uuid';
import { formatTime, minutesToPercent } from '../utils/time';
import { PROJECT_THEME_COLORS, MINUTES_IN_DAY } from '../constants';

// Helper to format date as YYYY-MM-DD
const getYYYYMMDD = (date: Date): string => {
    const year = date.getFullYear();
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    return `${year}-${month}-${day}`;
};

// --- Icons for Pane Visibility Toggle ---
const CalendarIcon: React.FC<{className?: string}> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line>
    </svg>
);

const ClockIcon: React.FC<{className?: string}> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline>
    </svg>
);

const SplitViewIcon: React.FC<{className?: string}> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><line x1="12" y1="3" x2="12" y2="21"></line>
    </svg>
);


interface CalendarEventProps {
  block: ScheduledBlock | ActivityLog;
  type: 'planned' | 'actual';
}

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

const CalendarEvent: React.FC<CalendarEventProps> = ({ block, type }) => {
    const state = useAppState();
    const { title, project } = findItemDetails(block.taskOrSubtaskId, block.itemType, state);
    
    const top = minutesToPercent(block.start);
    const height = minutesToPercent(block.end - block.start);

    const projectTheme = project ? PROJECT_THEME_COLORS[project.color] : null;
    const projectColor = projectTheme ? projectTheme.bg : 'bg-gray-600';
    const projectBorder = projectTheme ? projectTheme.border : 'border-gray-500';


    const plannedClasses = `border-2 ${projectBorder} opacity-70 hover:opacity-100 transition-opacity`;
    const actualClasses = `${projectColor} text-white`;

    const duration = block.end - block.start;

    const handleDragStart = (e: React.DragEvent<HTMLDivElement>) => {
        e.dataTransfer.setData('application/json', JSON.stringify({
            id: block.id,
            duration: block.end - block.start,
            source: 'calendar',
            itemType: type, // 'planned' or 'actual'
        }));
    };

    return (
        <div 
            draggable
            onDragStart={handleDragStart}
            style={{ top: `${top}%`, height: `${height}%` }}
            className={`absolute left-1 right-1 rounded-md p-1.5 text-xs overflow-hidden cursor-grab active:cursor-grabbing ${type === 'planned' ? plannedClasses : actualClasses}`}
        >
            <p className="font-bold truncate">{title}</p>
            {duration > 15 && <p className="truncate">{formatTime(block.start)} - {formatTime(block.end)}</p>}
        </div>
    );
}

const DAY_GRID_HEIGHT_PX = 24 * 60; // 1px per minute = 1440px total height

const TimeAxis = () => (
    <div className="w-16 text-right pr-2 text-xs text-gray-400 flex-shrink-0" style={{ height: `${DAY_GRID_HEIGHT_PX}px` }}>
        {Array.from({ length: 25 }, (_, i) => {
            let timeLabel = '';
            if (i > 0 && i < 24) {
                if (i < 12) {
                    timeLabel = `${i} AM`;
                } else if (i === 12) {
                    timeLabel = '12 PM';
                } else {
                    timeLabel = `${i - 12} PM`;
                }
            }
            return (
                <div key={i} className="h-[calc(100%/24)] -mt-px border-t border-gray-700/50 flex items-start justify-end">
                     {timeLabel ? <span>{timeLabel}</span> : <span />}
                </div>
            )
        })}
    </div>
);

type PaneVisibility = 'both' | 'planned' | 'actual';

interface DayColumnProps {
    date: string;
    scheduledBlocks: ScheduledBlock[];
    activityLogs: ActivityLog[];
    onDrop: (e: React.DragEvent<HTMLDivElement>, date: string) => void;
    paneVisibility: PaneVisibility;
}

const DayColumn: React.FC<DayColumnProps> = ({ date, scheduledBlocks, activityLogs, onDrop, paneVisibility }) => {
    const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => e.preventDefault();

    return (
        <div 
            className="flex-1 flex relative border-l border-gray-700 min-w-[150px] lg:min-w-[200px]"
            style={{ height: `${DAY_GRID_HEIGHT_PX}px` }}
            onDrop={(e) => onDrop(e, date)}
            onDragOver={handleDragOver}
        >
            {/* Planned Pane */}
            {(paneVisibility === 'both' || paneVisibility === 'planned') && (
                 <div className={`h-full relative transition-all duration-300 ease-in-out ${paneVisibility === 'both' ? 'w-1/2 border-r border-gray-700/50' : 'w-full'}`}>
                    <div className="absolute inset-0 text-center top-2 text-gray-500 font-bold text-xs pointer-events-none">PLANNED</div>
                    {scheduledBlocks.map(block => <CalendarEvent key={block.id} block={block} type="planned" />)}
                </div>
            )}
           
            {/* Actual Pane */}
             {(paneVisibility === 'both' || paneVisibility === 'actual') && (
                <div className={`h-full relative transition-all duration-300 ease-in-out ${paneVisibility === 'both' ? 'w-1/2' : 'w-full'}`}>
                    <div className="absolute inset-0 text-center top-2 text-gray-500 font-bold text-xs pointer-events-none">ACTUAL</div>
                    {activityLogs.map(log => <CalendarEvent key={log.id} block={log} type="actual" />)}
                </div>
            )}
        </div>
    );
};


export const CalendarView: React.FC = () => {
    const state = useAppState();
    const dispatch = useAppDispatch();
    const [viewMode, setViewMode] = useState<'day' | '3day' | 'week'>('day');
    const [currentDate, setCurrentDate] = useState(new Date());
    const [paneVisibility, setPaneVisibility] = useState<PaneVisibility>('both');

    const headerContainerRef = useRef<HTMLDivElement>(null);
    const timelineContainerRef = useRef<HTMLDivElement>(null);

    const syncScroll = (e: React.UIEvent<HTMLDivElement>) => {
        if (headerContainerRef.current) {
            headerContainerRef.current.scrollLeft = e.currentTarget.scrollLeft;
        }
    };


    const { days, dateRangeFormatted } = useMemo(() => {
        const startDate = new Date(currentDate);
        const daysToShow: string[] = [];
        let rangeStr = '';

        const options: Intl.DateTimeFormatOptions = { month: 'long', day: 'numeric', year: 'numeric' };

        switch (viewMode) {
            case 'day':
                daysToShow.push(getYYYYMMDD(startDate));
                rangeStr = startDate.toLocaleDateString('en-US', options);
                break;
            case '3day':
                for (let i = -1; i <= 1; i++) {
                    const day = new Date(startDate);
                    day.setDate(startDate.getDate() + i);
                    daysToShow.push(getYYYYMMDD(day));
                }
                const viewStartDate = new Date(daysToShow[0] + 'T00:00:00');
                const viewEndDate = new Date(daysToShow[2] + 'T00:00:00');
                rangeStr = `${viewStartDate.toLocaleDateString('en-US', { month: 'long', day: 'numeric' })} - ${viewEndDate.toLocaleDateString('en-US', options)}`;
                break;
            case 'week': {
                // Start week on Monday
                const weekStartDate = new Date(startDate);
                const dayOfWeek = startDate.getDay(); // 0=Sun, 1=Mon, ..., 6=Sat
                const daysToSubtract = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
                weekStartDate.setDate(startDate.getDate() - daysToSubtract);

                for (let i = 0; i < 7; i++) {
                    const day = new Date(weekStartDate);
                    day.setDate(weekStartDate.getDate() + i);
                    daysToShow.push(getYYYYMMDD(day));
                }
                const endDate7 = new Date(daysToShow[6] + 'T00:00:00');
                rangeStr = `${weekStartDate.toLocaleDateString('en-US', { month: 'long', day: 'numeric' })} - ${endDate7.toLocaleDateString('en-US', options)}`;
                break;
            }
        }
        return { days: daysToShow, dateRangeFormatted: rangeStr };
    }, [viewMode, currentDate]);


    const handleDrop = (e: React.DragEvent<HTMLDivElement>, date: string) => {
        e.preventDefault();
        try {
            const data = JSON.parse(e.dataTransfer.getData('application/json'));
            
            const target = e.currentTarget as HTMLDivElement;
            const timelineRect = timelineContainerRef.current!.getBoundingClientRect();
            const scrollTop = timelineContainerRef.current!.scrollTop;

            const dropY = e.clientY - timelineRect.top + scrollTop;
            
            const dropMinute = Math.round(dropY / DAY_GRID_HEIGHT_PX * MINUTES_IN_DAY);
            
            // Snap to 15 minute grid
            const start = Math.floor(dropMinute / 15) * 15;
            const end = start + data.duration;

            if (data.source === 'calendar') {
                // It's an existing event being moved
                if (data.itemType === 'planned') {
                    const originalBlock = state.scheduledBlocks.find(b => b.id === data.id);
                    if (originalBlock) {
                        dispatch({
                            type: 'UPDATE_SCHEDULED_BLOCK',
                            payload: { ...originalBlock, start, end, date }
                        });
                    }
                } else if (data.itemType === 'actual') {
                    const originalLog = state.activityLogs.find(l => l.id === data.id);
                    if (originalLog) {
                        dispatch({
                            type: 'UPDATE_ACTIVITY_LOG',
                            payload: { ...originalLog, start, end, date }
                        });
                    }
                }
            } else {
                // It's a new task from the kanban
                dispatch({
                    type: 'ADD_SCHEDULED_BLOCK',
                    payload: {
                        id: uuidv4(),
                        taskOrSubtaskId: data.id,
                        itemType: data.type,
                        start,
                        end,
                        date,
                    }
                });
            }
        } catch (error) {
            console.error("Failed to handle drop:", error);
        }
    };

    const handleNavigate = (direction: 'prev' | 'next' | 'today') => {
        const newDate = new Date(currentDate);
        if (direction === 'today') {
            setCurrentDate(new Date());
            return;
        }

        const increment = direction === 'prev' ? -1 : 1;
        switch (viewMode) {
            case 'day':
                newDate.setDate(newDate.getDate() + increment);
                break;
            case '3day':
                newDate.setDate(newDate.getDate() + (3 * increment));
                break;
            case 'week':
                newDate.setDate(newDate.getDate() + (7 * increment));
                break;
        }
        setCurrentDate(newDate);
    };

    const ViewButton = ({ mode, children }: { mode: 'day' | '3day' | 'week', children: React.ReactNode }) => (
        <button
            onClick={() => setViewMode(mode)}
            className={`px-3 py-1 text-sm font-semibold rounded-md transition-colors ${
                viewMode === mode ? 'bg-indigo-600 text-white' : 'text-gray-300 hover:bg-gray-600/50'
            }`}
        >{children}</button>
    );

    const PaneToggleButton = ({ mode, children, title }: { mode: PaneVisibility, children: React.ReactNode, title: string }) => (
        <button
            onClick={() => setPaneVisibility(mode)}
            title={title}
            className={`p-1.5 rounded-md transition-colors ${
                paneVisibility === mode ? 'bg-indigo-600 text-white' : 'text-gray-400 hover:bg-gray-600/50 hover:text-white'
            }`}
        >{children}</button>
    );


    return (
        <div className="flex-grow p-4 bg-gray-800/50 flex flex-col overflow-hidden">
            <header className="flex-shrink-0 flex justify-between items-center mb-4">
                 <div className="flex items-center space-x-2">
                    <button onClick={() => handleNavigate('prev')} className="px-2 py-1 bg-gray-700/50 rounded-md hover:bg-gray-600/50">&lt;</button>
                    <button onClick={() => handleNavigate('today')} className="px-3 py-1 text-sm bg-gray-700/50 rounded-md hover:bg-gray-600/50">Today</button>
                    <button onClick={() => handleNavigate('next')} className="px-2 py-1 bg-gray-700/50 rounded-md hover:bg-gray-600/50">&gt;</button>
                    <h2 className="text-xl font-bold ml-4 text-white">{dateRangeFormatted}</h2>
                 </div>
                 <div className="flex items-center space-x-2">
                    <div className="flex space-x-1 bg-gray-700/50 p-1 rounded-lg">
                        <PaneToggleButton mode="planned" title="Show Planned"><CalendarIcon className="w-5 h-5"/></PaneToggleButton>
                        <PaneToggleButton mode="both" title="Show Both"><SplitViewIcon className="w-5 h-5"/></PaneToggleButton>
                        <PaneToggleButton mode="actual" title="Show Actual"><ClockIcon className="w-5 h-5"/></PaneToggleButton>
                    </div>
                    <div className="flex space-x-1 bg-gray-700/50 p-1 rounded-lg">
                        <ViewButton mode="day">Day</ViewButton>
                        <ViewButton mode="3day">3-Day</ViewButton>
                        <ViewButton mode="week">Week</ViewButton>
                    </div>
                 </div>
            </header>
            <div className="flex-grow flex flex-col overflow-hidden rounded-lg bg-gray-900/40">
                {/* Header Row */}
                <div className="flex flex-shrink-0">
                    <div className="w-16 flex-shrink-0"></div> {/* Spacer for TimeAxis */}
                    <div ref={headerContainerRef} className="flex-grow overflow-x-hidden">
                        <div className="flex">
                           {days.map(dateStr => {
                                const dateObj = new Date(dateStr + 'T00:00:00');
                                const dayOfWeek = dateObj.toLocaleDateString('en-US', { weekday: 'short' });
                                const dayOfMonth = dateStr.split('-')[2];
                                const isToday = getYYYYMMDD(new Date()) === dateStr;

                                return (
                                    <div key={dateStr} className="flex-1 min-w-[150px] lg:min-w-[200px]">
                                        <div className={`text-center py-2 border-b border-l border-gray-700 ${isToday ? 'bg-indigo-600/20' : ''}`}>
                                            <p className="text-sm font-semibold text-gray-400">{dayOfWeek}</p>
                                            <p className={`text-xl font-bold ${isToday ? 'text-indigo-400' : ''}`}>{dayOfMonth}</p>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>
                
                {/* Scrollable Body */}
                <div ref={timelineContainerRef} onScroll={syncScroll} className="flex-grow overflow-auto">
                    <div className="flex">
                        <TimeAxis />
                        <div className="flex flex-grow">
                             {days.map(dateStr => {
                                const dayScheduledBlocks = state.scheduledBlocks.filter(b => b.date === dateStr);
                                const dayActivityLogs = state.activityLogs.filter(l => l.date === dateStr);

                                return (
                                    <DayColumn 
                                        key={dateStr}
                                        date={dateStr}
                                        scheduledBlocks={dayScheduledBlocks}
                                        activityLogs={dayActivityLogs}
                                        onDrop={handleDrop}
                                        paneVisibility={paneVisibility}
                                    />
                                )
                            })}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};