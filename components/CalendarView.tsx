import React, { useState, useMemo, useRef, useEffect } from 'react';
import { useAppState, useAppDispatch } from '../hooks/useAppContext';
import type { AppState, ScheduledBlock, ActivityLog, Project } from '../types';
import { v4 as uuidv4 } from 'uuid';
import { formatTime, minutesToPercent } from '../utils/time';
import { PROJECT_THEME_COLORS, MINUTES_IN_DAY } from '../constants';
import { AgendaView } from './AgendaView';
import { EditPlannedEventModal } from './modals/EditPlannedEventModal';


// --- Helper Functions ---

const getYYYYMMDD = (date: Date): string => {
    const year = date.getFullYear();
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    return `${year}-${month}-${day}`;
};

const findItemDetails = (id: string, itemType: 'task' | 'subtask', state: AppState) => {
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
    return { title: 'Unknown', project: undefined as Project | undefined };
};

const getProjectId = (item: ScheduledBlock | ActivityLog, state: AppState): string | null => {
    const details = findItemDetails(item.taskOrSubtaskId, item.itemType, state);
    return details.project ? details.project.id : null;
}


// --- Icons ---
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

const ListViewIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <line x1="8" y1="6" x2="21" y2="6"></line><line x1="8" y1="12" x2="21" y2="12"></line><line x1="8" y1="18" x2="21" y2="18"></line><line x1="3" y1="6" x2="3.01" y2="6"></line><line x1="3" y1="12" x2="3.01" y2="12"></line><line x1="3" y1="18" x2="3.01" y2="18"></line>
    </svg>
);


// --- Subcomponents ---

const DropIndicator: React.FC<{ top: number; height: number }> = ({ top, height }) => (
    <div
        className="absolute left-1 right-1 bg-indigo-500/50 border-2 border-indigo-400 rounded-md z-10 pointer-events-none"
        style={{
            top: `${minutesToPercent(top)}%`,
            height: `${minutesToPercent(height)}%`,
        }}
    />
);

interface CalendarEventProps {
  block: ScheduledBlock | ActivityLog;
  type: 'planned' | 'actual';
  onResizeStart: (blockId: string, direction: 'top' | 'bottom') => (e: React.MouseEvent) => void;
  onClick: (block: ScheduledBlock) => void;
}

const CalendarEvent: React.FC<CalendarEventProps> = ({ block, type, onResizeStart, onClick }) => {
    const state = useAppState();
    const dispatch = useAppDispatch();
    const { title, project } = findItemDetails(block.taskOrSubtaskId, block.itemType, state);
    
    const top = minutesToPercent(block.start);
    const height = minutesToPercent(block.end - block.start);

    const projectTheme = project ? PROJECT_THEME_COLORS[project.color] : null;
    const projectColor = projectTheme ? projectTheme.bg : 'bg-gray-600';
    const projectBorder = projectTheme ? projectTheme.border : 'border-gray-500';

    const plannedClasses = `border-2 ${projectBorder} opacity-70 group hover:opacity-100 transition-opacity`;
    const actualClasses = `${projectColor} text-white`;

    const duration = block.end - block.start;

    const handleDragStart = (e: React.DragEvent<HTMLDivElement>) => {
        e.stopPropagation(); // Prevent onClick from firing on drag start
        const duration = block.end - block.start;
        e.dataTransfer.setData('application/json', JSON.stringify({
            id: block.id,
            duration: duration,
            source: 'calendar',
            itemType: type, // 'planned' or 'actual'
        }));
        
        dispatch({ type: 'DRAG_START', payload: {
            type: type,
            duration: duration,
            originalId: block.id,
        }});
    };

    const handleDragEnd = () => {
        dispatch({ type: 'DRAG_END' });
    };

    const isShortLayout = duration < 45;

    const getContainerClasses = () => {
        let classes = 'absolute left-1 right-1 rounded-md text-xs overflow-hidden ';
        if (type === 'planned') {
            classes += `${plannedClasses} cursor-pointer cursor-grab active:cursor-grabbing`;
        } else {
            classes += `${actualClasses} cursor-default`; // Actual blocks are not draggable/resizable for now
        }

        if (duration <= 20) {
            classes += ' py-0 px-1.5 flex items-center'; // Center vertically for very short blocks
        } else if (duration < 45) {
            classes += ' p-1';
        } else {
            classes += ' p-1.5';
        }
        return classes;
    };

    return (
        <div 
            draggable={type === 'planned'}
            onDragStart={type === 'planned' ? handleDragStart : undefined}
            onDragEnd={type === 'planned' ? handleDragEnd : undefined}
            onClick={type === 'planned' ? () => onClick(block as ScheduledBlock) : undefined}
            style={{ top: `${top}%`, height: `${height}%` }}
            className={getContainerClasses()}
        >
            {type === 'planned' && (
                <>
                <div onMouseDown={onResizeStart(block.id, 'top')} className="absolute top-0 left-0 right-0 h-1.5 cursor-n-resize z-10 hidden group-hover:block" />
                <div onMouseDown={onResizeStart(block.id, 'bottom')} className="absolute bottom-0 left-0 right-0 h-1.5 cursor-s-resize z-10 hidden group-hover:block" />
                </>
            )}
            {isShortLayout ? (
                <div className="flex items-baseline space-x-2 whitespace-nowrap overflow-hidden w-full">
                    <p className="font-bold truncate">{title}</p>
                    {duration > 20 && (
                        <p className="truncate opacity-80">{formatTime(block.start)} - {formatTime(block.end)}</p>
                    )}
                </div>
            ) : (
                <>
                    <p className="font-bold truncate">{title}</p>
                    <p className="truncate">{formatTime(block.start)} - {formatTime(block.end)}</p>
                </>
            )}
        </div>
    );
};

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
type ViewMode = 'day' | '3day' | 'week' | 'agenda';

interface DayColumnProps {
    date: string;
    scheduledBlocks: ScheduledBlock[];
    activityLogs: ActivityLog[];
    onDrop: (e: React.DragEvent<HTMLDivElement>, date: string) => void;
    onDragOver: (e: React.DragEvent<HTMLDivElement>, date: string) => void;
    onDragLeave: (e: React.DragEvent<HTMLDivElement>) => void;
    paneVisibility: PaneVisibility;
    dropIndicator: { date: string; start: number; pane: 'planned' | 'actual' } | null;
    draggedItem: AppState['draggedItem'];
    onResizeStart: (blockId: string, direction: 'top' | 'bottom') => (e: React.MouseEvent) => void;
    onEventClick: (block: ScheduledBlock) => void;
}

const DayColumn: React.FC<DayColumnProps> = ({ date, scheduledBlocks, activityLogs, onDrop, onDragOver, onDragLeave, paneVisibility, dropIndicator, draggedItem, onResizeStart, onEventClick }) => {
    return (
        <div 
            className="flex-1 flex relative border-l border-gray-700 min-w-[150px] lg:min-w-[200px]"
            style={{ height: `${DAY_GRID_HEIGHT_PX}px` }}
            onDrop={(e) => onDrop(e, date)}
            onDragOver={(e) => onDragOver(e, date)}
            onDragLeave={onDragLeave}
        >
            {/* Planned Pane */}
            {(paneVisibility === 'both' || paneVisibility === 'planned') && (
                 <div className={`h-full relative transition-all duration-300 ease-in-out ${paneVisibility === 'both' ? 'w-1/2 border-r border-gray-700/50' : 'w-full'}`}>
                    <div className="absolute inset-0 text-center top-2 text-gray-500 font-bold text-xs pointer-events-none">PLANNED</div>
                    {dropIndicator?.date === date && dropIndicator.pane === 'planned' && draggedItem && (
                        <DropIndicator top={dropIndicator.start} height={draggedItem.duration} />
                    )}
                    {scheduledBlocks.map(block => <CalendarEvent key={block.id} block={block} type="planned" onResizeStart={onResizeStart} onClick={onEventClick} />)}
                </div>
            )}
           
            {/* Actual Pane */}
             {(paneVisibility === 'both' || paneVisibility === 'actual') && (
                <div className={`h-full relative transition-all duration-300 ease-in-out ${paneVisibility === 'both' ? 'w-1/2' : 'w-full'}`}>
                    <div className="absolute inset-0 text-center top-2 text-gray-500 font-bold text-xs pointer-events-none">ACTUAL</div>
                    {activityLogs.map(log => <CalendarEvent key={log.id} block={log} type="actual" onResizeStart={() => () => {}} onClick={() => {}} />)}
                </div>
            )}
        </div>
    );
};

interface CalendarViewProps {
  visibleProjectIds: Set<string>;
}

export const CalendarView: React.FC<CalendarViewProps> = ({ visibleProjectIds }) => {
    const state = useAppState();
    const { draggedItem } = state;
    const dispatch = useAppDispatch();
    const [viewMode, setViewMode] = useState<ViewMode>('day');
    const [currentDate, setCurrentDate] = useState(new Date());
    const [paneVisibility, setPaneVisibility] = useState<PaneVisibility>('both');
    const [dropIndicator, setDropIndicator] = useState<{ date: string; start: number; pane: 'planned' | 'actual' } | null>(null);
    const [resizingBlock, setResizingBlock] = useState<{ id: string; direction: 'top' | 'bottom' } | null>(null);
    const [selectedEvent, setSelectedEvent] = useState<{ block: ScheduledBlock; title: string } | null>(null);


    const headerContainerRef = useRef<HTMLDivElement>(null);
    const timelineContainerRef = useRef<HTMLDivElement>(null);

    const syncScroll = (e: React.UIEvent<HTMLDivElement>) => {
        if (headerContainerRef.current) {
            headerContainerRef.current.scrollLeft = e.currentTarget.scrollLeft;
        }
    };

    useEffect(() => {
        if (!resizingBlock) return;
    
        const handleMouseMove = (e: MouseEvent) => {
            const originalBlock = state.scheduledBlocks.find(b => b.id === resizingBlock.id);
            if (!originalBlock || !timelineContainerRef.current) return;
    
            const timelineRect = timelineContainerRef.current.getBoundingClientRect();
            const scrollTop = timelineContainerRef.current.scrollTop;
            const dropY = e.clientY - timelineRect.top + scrollTop;
            const currentMinute = Math.max(0, Math.round(dropY / DAY_GRID_HEIGHT_PX * MINUTES_IN_DAY));
            const snappedMinute = Math.round(currentMinute / 15) * 15;
    
            let newStart = originalBlock.start;
            let newEnd = originalBlock.end;
    
            if (resizingBlock.direction === 'top') {
                newStart = Math.min(snappedMinute, newEnd - 15); // ensure min duration of 15 min
            } else { // 'bottom'
                newEnd = Math.max(snappedMinute, newStart + 15); // ensure min duration of 15 min
            }
            
            if (newStart !== originalBlock.start || newEnd !== originalBlock.end) {
                 dispatch({
                    type: 'UPDATE_SCHEDULED_BLOCK',
                    payload: { ...originalBlock, start: newStart, end: newEnd }
                });
            }
        };
    
        const handleMouseUp = () => {
            setResizingBlock(null);
        };
    
        window.addEventListener('mousemove', handleMouseMove);
        window.addEventListener('mouseup', handleMouseUp, { once: true });
    
        return () => {
            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('mouseup', handleMouseUp);
        };
    }, [resizingBlock, state.scheduledBlocks, dispatch]);

    // This effect handles closing the modal automatically if the underlying event is deleted from the state.
    // This prevents race conditions where the modal tries to operate on stale data.
    useEffect(() => {
        if (selectedEvent && !state.scheduledBlocks.some(block => block.id === selectedEvent.block.id)) {
            setSelectedEvent(null);
        }
    }, [state.scheduledBlocks, selectedEvent]);


    const { days, dateRangeFormatted } = useMemo(() => {
        const startDate = new Date(currentDate);
        const daysToShow: string[] = [];
        let rangeStr = '';

        const options: Intl.DateTimeFormatOptions = { month: 'long', day: 'numeric', year: 'numeric' };

        switch (viewMode) {
            case 'day':
            case 'agenda':
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


    const handleDragOver = (e: React.DragEvent<HTMLDivElement>, date: string) => {
        e.preventDefault();
        if (!draggedItem) return;

        const timelineRect = timelineContainerRef.current!.getBoundingClientRect();
        const scrollTop = timelineContainerRef.current!.scrollTop;
        const dropY = e.clientY - timelineRect.top + scrollTop;
        const dropMinute = Math.round(dropY / DAY_GRID_HEIGHT_PX * MINUTES_IN_DAY);
        const start = Math.floor(dropMinute / 15) * 15;

        const dayColumnRect = e.currentTarget.getBoundingClientRect();
        const dropX = e.clientX - dayColumnRect.left;
        
        let pane: 'planned' | 'actual' = 'actual';
        if ((paneVisibility === 'both' && dropX < dayColumnRect.width / 2) || paneVisibility === 'planned') {
            pane = 'planned';
        }

        let isDropAllowed = true;
        if ((draggedItem.type === 'actual' && pane === 'planned') || (draggedItem.type === 'planned' && pane === 'actual')) {
            isDropAllowed = false;
        }

        if (isDropAllowed) {
            e.dataTransfer.dropEffect = 'move';
            setDropIndicator({ date, start, pane });
        } else {
            e.dataTransfer.dropEffect = 'none';
            setDropIndicator(null);
        }
    };

    const handleDragLeave = () => {
        setDropIndicator(null);
    };


    const handleDrop = (e: React.DragEvent<HTMLDivElement>, date: string) => {
        e.preventDefault();
        if (!draggedItem) return;

        const currentDraggedItem = { ...draggedItem };
        setDropIndicator(null);
        dispatch({ type: 'DRAG_END' });
    
        try {
            const data = JSON.parse(e.dataTransfer.getData('application/json'));
            
            const dayColumnRect = e.currentTarget.getBoundingClientRect();
            const dropX = e.clientX - dayColumnRect.left;
            let pane: 'planned' | 'actual' = 'actual';
            if ((paneVisibility === 'both' && dropX < dayColumnRect.width / 2) || paneVisibility === 'planned') {
                pane = 'planned';
            }

            // Final validation check
            if ((currentDraggedItem.type === 'actual' && pane === 'planned') || (currentDraggedItem.type === 'planned' && pane === 'actual')) return;

            const timelineRect = timelineContainerRef.current!.getBoundingClientRect();
            const scrollTop = timelineContainerRef.current!.scrollTop;
            const dropY = e.clientY - timelineRect.top + scrollTop;
            const dropMinute = Math.round(dropY / DAY_GRID_HEIGHT_PX * MINUTES_IN_DAY);
            
            const start = Math.floor(dropMinute / 15) * 15;
            const end = start + data.duration;

            if (pane === 'planned') {
                const conflicts = state.scheduledBlocks.filter(b => {
                    if (b.date !== date) return false;
                    if (currentDraggedItem.originalId && b.id === currentDraggedItem.originalId) return false;
                    return (start < b.end) && (end > b.start);
                });

                if (conflicts.length > 0) {
                    if (!window.confirm("This time slot is already occupied. Do you want to overwrite the existing event(s)?")) {
                        return; // User cancelled
                    }
                    conflicts.forEach(block => {
                        dispatch({ type: 'DELETE_SCHEDULED_BLOCK', payload: { id: block.id } });
                    });
                }
            }


            if (data.source === 'calendar') {
                // This logic is for moving a planned block. Resizing is handled separately.
                // Actual blocks are not draggable in this implementation.
                if (data.itemType === 'planned') {
                    const originalBlock = state.scheduledBlocks.find(b => b.id === data.id);
                    if (originalBlock) {
                        dispatch({
                            type: 'UPDATE_SCHEDULED_BLOCK',
                            payload: { ...originalBlock, start, end, date }
                        });
                    }
                }
            } else {
                 if (pane === 'planned') { // Can only drop new items to planned pane
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
            }
        } catch (error) {
            console.error("Failed to handle drop:", error);
        }
    };
    
    const handleResizeStart = (blockId: string, direction: 'top' | 'bottom') => (e: React.MouseEvent) => {
        e.stopPropagation();
        e.preventDefault();
        setResizingBlock({ id: blockId, direction });
    };

    const handleEventClick = (block: ScheduledBlock) => {
        const { title } = findItemDetails(block.taskOrSubtaskId, block.itemType, state);
        setSelectedEvent({ block, title });
    };

    const handleDeleteEvent = (id: string) => {
        dispatch({ type: 'DELETE_SCHEDULED_BLOCK', payload: { id } });
        // The modal will be closed by the useEffect hook once the state update propagates.
    };

    const handleNavigate = (direction: 'prev' | 'next' | 'today') => {
        const newDate = new Date(currentDate);
        if (direction === 'today') {
            setCurrentDate(new Date());
            return;
        }

        const increment = direction === 'prev' ? -1 : 1;
        let numDays = 1;
        if (viewMode === '3day') numDays = 3;
        if (viewMode === 'week') numDays = 7;
        
        newDate.setDate(newDate.getDate() + (numDays * increment));
        setCurrentDate(newDate);
    };

    const ViewButton = ({ mode, children }: { mode: ViewMode, children: React.ReactNode }) => (
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
    
    // Filtered items based on visible projects
    const visibleScheduledBlocks = useMemo(() => state.scheduledBlocks.filter(b => {
        const projectId = getProjectId(b, state);
        return projectId ? visibleProjectIds.has(projectId) : true;
    }), [state.scheduledBlocks, visibleProjectIds, state.tasks, state.subtasks, state.projects]);
    
    const visibleActivityLogs = useMemo(() => state.activityLogs.filter(l => {
        const projectId = getProjectId(l, state);
        return projectId ? visibleProjectIds.has(projectId) : true;
    }), [state.activityLogs, visibleProjectIds, state.tasks, state.subtasks, state.projects]);


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
                    {viewMode !== 'agenda' && (
                        <div className="flex space-x-1 bg-gray-700/50 p-1 rounded-lg">
                            <PaneToggleButton mode="planned" title="Show Planned"><CalendarIcon className="w-5 h-5"/></PaneToggleButton>
                            <PaneToggleButton mode="both" title="Show Both"><SplitViewIcon className="w-5 h-5"/></PaneToggleButton>
                            <PaneToggleButton mode="actual" title="Show Actual"><ClockIcon className="w-5 h-5"/></PaneToggleButton>
                        </div>
                    )}
                    <div className="flex space-x-1 bg-gray-700/50 p-1 rounded-lg">
                        <ViewButton mode="day">Day</ViewButton>
                        <ViewButton mode="3day">3-Day</ViewButton>
                        <ViewButton mode="week">Week</ViewButton>
                        <ViewButton mode="agenda">Agenda</ViewButton>
                    </div>
                 </div>
            </header>
            <div className="flex-grow flex flex-col overflow-hidden rounded-lg bg-gray-900/40">
                {viewMode === 'agenda' ? (
                    <AgendaView 
                        days={days} 
                        scheduledBlocks={visibleScheduledBlocks} 
                        activityLogs={visibleActivityLogs} 
                    />
                ) : (
                <>
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
                                    const dayScheduledBlocks = visibleScheduledBlocks.filter(b => b.date === dateStr);
                                    const dayActivityLogs = visibleActivityLogs.filter(l => l.date === dateStr);

                                    return (
                                        <DayColumn 
                                            key={dateStr}
                                            date={dateStr}
                                            scheduledBlocks={dayScheduledBlocks}
                                            activityLogs={dayActivityLogs}
                                            onDrop={handleDrop}
                                            onDragOver={handleDragOver}
                                            onDragLeave={handleDragLeave}
                                            paneVisibility={paneVisibility}
                                            dropIndicator={dropIndicator}
                                            draggedItem={draggedItem}
                                            onResizeStart={handleResizeStart}
                                            onEventClick={handleEventClick}
                                        />
                                    )
                                })}
                            </div>
                        </div>
                    </div>
                </>
                )}
            </div>
            {selectedEvent && (
                <EditPlannedEventModal
                    isOpen={!!selectedEvent}
                    onClose={() => setSelectedEvent(null)}
                    onDelete={handleDeleteEvent}
                    event={selectedEvent.block}
                    title={selectedEvent.title}
                />
            )}
        </div>
    );
};