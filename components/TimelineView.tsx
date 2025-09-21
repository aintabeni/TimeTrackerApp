import React, { useState } from 'react';
import { ProjectsKanban } from './ProjectsKanban';
import { CalendarView } from './CalendarView';
import { useAppState } from '../hooks/useAppContext';

export const TimelineView: React.FC = () => {
  const { projects } = useAppState();
  const allProjectIds = projects.map(p => p.id);
  const [visibleProjectIds, setVisibleProjectIds] = useState<Set<string>>(new Set(allProjectIds));

  // Ensure that new projects are automatically visible
  React.useEffect(() => {
    setVisibleProjectIds(currentVisibleIds => {
      const allCurrentIds = new Set(projects.map(p => p.id));
      projects.forEach(p => {
        // Add new projects that aren't in the original set
        if (!currentVisibleIds.has(p.id)) {
          allCurrentIds.add(p.id);
        }
      });
       // Re-create the set based on all known project IDs to handle deletions
      const updatedVisibleIds = new Set<string>();
      currentVisibleIds.forEach(id => {
        if(projects.some(p => p.id === id)) {
            updatedVisibleIds.add(id);
        }
      });
       projects.forEach(p => updatedVisibleIds.add(p.id)); // Add all for now to avoid complexity

      return new Set(projects.map(p => p.id));
    });
  }, [projects]);


  return (
    <div className="flex flex-col md:flex-row h-[calc(100vh-4rem)]">
      <ProjectsKanban
        visibleProjectIds={visibleProjectIds}
        setVisibleProjectIds={setVisibleProjectIds}
      />
      <CalendarView 
        visibleProjectIds={visibleProjectIds}
      />
    </div>
  );
};