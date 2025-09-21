import React, { useState } from 'react';
import { useAppState } from '../hooks/useAppContext';
import { ProjectColumn } from './ProjectColumn';
import { AddProjectModal } from './modals/AddProjectModal';
import { PlusIcon } from './icons/PlusIcon';
import { ProjectFilter } from './ProjectFilter';

interface ProjectsKanbanProps {
  visibleProjectIds: Set<string>;
  setVisibleProjectIds: React.Dispatch<React.SetStateAction<Set<string>>>;
}

export const ProjectsKanban: React.FC<ProjectsKanbanProps> = ({ visibleProjectIds, setVisibleProjectIds }) => {
  const { projects, tasks, subtasks } = useAppState();
  const [isAddProjectModalOpen, setIsAddProjectModalOpen] = useState(false);

  return (
    <>
      <div className="w-full md:w-1/3 lg:w-2/5 p-4 bg-gray-800/50 overflow-hidden flex flex-col">
        <div className="flex justify-between items-center mb-4 px-2">
          <h2 className="text-2xl font-bold text-center">Projects</h2>
          <button
            onClick={() => setIsAddProjectModalOpen(true)}
            className="p-2 rounded-full bg-indigo-600/80 text-white hover:bg-indigo-500 transition-colors"
            title="Add new project"
          >
            <PlusIcon className="w-5 h-5" />
          </button>
        </div>
        <ProjectFilter
          visibleProjectIds={visibleProjectIds}
          setVisibleProjectIds={setVisibleProjectIds}
        />
        <div className="flex-grow overflow-y-auto pb-4 pr-2 mt-4">
          <div>
            {projects.map(project => (
              <ProjectColumn key={project.id} project={project} tasks={tasks} subtasks={subtasks} />
            ))}
          </div>
        </div>
      </div>
      <AddProjectModal
        isOpen={isAddProjectModalOpen}
        onClose={() => setIsAddProjectModalOpen(false)}
      />
    </>
  );
};