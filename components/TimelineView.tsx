
import React from 'react';
import { ProjectsKanban } from './ProjectsKanban';
import { CalendarView } from './CalendarView';

export const TimelineView: React.FC = () => {
  return (
    <div className="flex flex-col md:flex-row h-[calc(100vh-4rem)]">
      <ProjectsKanban />
      <CalendarView />
    </div>
  );
};
