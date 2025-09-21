import React from 'react';
import { useAppState } from '../hooks/useAppContext';
import { ProjectColumn } from './ProjectColumn';

export const ProjectsKanban: React.FC = () => {
  const { projects, tasks, subtasks } = useAppState();

  return (
    <div className="w-full md:w-1/3 lg:w-2/5 p-4 bg-gray-800/50 overflow-hidden flex flex-col">
      <h2 className="text-2xl font-bold mb-4 text-center">Projects</h2>
      <div className="flex-grow overflow-y-auto pb-4 pr-2">
        <div>
          {projects.map(project => (
            <ProjectColumn key={project.id} project={project} tasks={tasks} subtasks={subtasks} />
          ))}
        </div>
      </div>
    </div>
  );
};