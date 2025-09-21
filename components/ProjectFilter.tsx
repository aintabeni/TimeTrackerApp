import React, { useState } from 'react';
import { useAppState } from '../hooks/useAppContext';
import { PROJECT_THEME_COLORS } from '../constants';
import { ChevronDownIcon } from './icons/ChevronDownIcon';

interface ProjectFilterProps {
  visibleProjectIds: Set<string>;
  setVisibleProjectIds: React.Dispatch<React.SetStateAction<Set<string>>>;
}

export const ProjectFilter: React.FC<ProjectFilterProps> = ({ visibleProjectIds, setVisibleProjectIds }) => {
  const { projects } = useAppState();
  const [isExpanded, setIsExpanded] = useState(false);

  const handleToggleProject = (projectId: string) => {
    setVisibleProjectIds(prev => {
      const newSet = new Set(prev);
      if (newSet.has(projectId)) {
        newSet.delete(projectId);
      } else {
        newSet.add(projectId);
      }
      return newSet;
    });
  };

  const handleToggleAll = () => {
    if (visibleProjectIds.size === projects.length) {
      setVisibleProjectIds(new Set()); // Deselect all
    } else {
      setVisibleProjectIds(new Set(projects.map(p => p.id))); // Select all
    }
  };

  if (projects.length === 0) {
      return null;
  }

  return (
    <div className="bg-gray-900/50 rounded-lg text-sm">
      <button
        className="w-full flex justify-between items-center p-2 font-semibold text-gray-300 hover:bg-gray-700/50"
        onClick={() => setIsExpanded(prev => !prev)}
      >
        <span>Filter Calendars</span>
        <ChevronDownIcon className={`w-5 h-5 transition-transform ${isExpanded ? 'rotate-180' : 'rotate-0'}`} />
      </button>
      <div className={`transition-all duration-300 ease-in-out overflow-hidden ${isExpanded ? 'max-h-96' : 'max-h-0'}`}>
        <div className="p-3 border-t border-gray-700">
           <div className="mb-2">
             <label className="flex items-center space-x-2 cursor-pointer">
                <input
                    type="checkbox"
                    checked={visibleProjectIds.size === projects.length}
                    onChange={handleToggleAll}
                    className="form-checkbox h-4 w-4 rounded bg-gray-700 border-gray-600 text-indigo-600 focus:ring-indigo-500"
                />
                <span className="font-medium">All Projects</span>
             </label>
           </div>
           <div className="space-y-1 pl-1">
             {projects.map(project => (
                 <label key={project.id} className="flex items-center space-x-2 cursor-pointer">
                    <input
                        type="checkbox"
                        checked={visibleProjectIds.has(project.id)}
                        onChange={() => handleToggleProject(project.id)}
                        className="form-checkbox h-4 w-4 rounded bg-gray-700 border-gray-600 text-indigo-600 focus:ring-indigo-500"
                    />
                    <div className={`w-3 h-3 rounded-full ${PROJECT_THEME_COLORS[project.color]?.bg || 'bg-gray-500'}`}></div>
                    <span>{project.name}</span>
                 </label>
             ))}
           </div>
        </div>
      </div>
    </div>
  );
};