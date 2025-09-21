import React, { useState } from 'react';
import type { Project, Task, Subtask } from '../types';
import { TaskItem } from './TaskItem';
import { PROJECT_THEME_COLORS } from '../constants';
import { useAppDispatch } from '../hooks/useAppContext';
import { Dropdown, DropdownItem } from './common/Dropdown';
import { MoreVerticalIcon } from './icons/MoreVerticalIcon';
import { AddTaskModal } from './modals/AddTaskModal';
import { ChevronDownIcon } from './icons/ChevronDownIcon';
import { AddSubtaskModal } from './modals/AddSubtaskModal';
import { EditTaskModal } from './modals/EditTaskModal';
import { EditProjectModal } from './modals/EditProjectModal';


interface ProjectColumnProps {
  project: Project;
  tasks: Task[];
  subtasks: Subtask[];
}

export const ProjectColumn: React.FC<ProjectColumnProps> = ({ project, tasks, subtasks }) => {
  const [isAddTaskModalOpen, setIsAddTaskModalOpen] = useState(false);
  const [isEditProjectModalOpen, setIsEditProjectModalOpen] = useState(false);
  const [isProjectCollapsed, setIsProjectCollapsed] = useState(false);
  const [collapsedTasks, setCollapsedTasks] = useState<Set<string>>(new Set());

  const [addingSubtaskTo, setAddingSubtaskTo] = useState<Task | null>(null);
  const [editingItem, setEditingItem] = useState<{ item: Task | Subtask; itemType: 'task' | 'subtask' } | null>(null);

  const dispatch = useAppDispatch();
  
  const projectTasks = tasks.filter(t => t.projectId === project.id);
  const projectColor = PROJECT_THEME_COLORS[project.color]?.bg || 'bg-gray-600';

  const handleDeleteProject = () => {
    if (window.confirm(`Are you sure you want to delete the project "${project.name}" and all its tasks? This action is irreversible.`)) {
      dispatch({ type: 'DELETE_PROJECT', payload: { projectId: project.id } });
    }
  };

  const handleDeleteTask = (task: Task) => {
    if (window.confirm(`Are you sure you want to delete "${task.title}" and all its subtasks? This action cannot be undone.`)) {
        dispatch({ type: 'DELETE_TASK', payload: { taskId: task.id } });
    }
  }
  
  const toggleProjectCollapse = () => setIsProjectCollapsed(prev => !prev);
  
  const toggleTaskCollapse = (taskId: string) => {
    setCollapsedTasks(prev => {
        const newSet = new Set(prev);
        if (newSet.has(taskId)) {
            newSet.delete(taskId);
        } else {
            newSet.add(taskId);
        }
        return newSet;
    });
  };

  return (
    <>
      <div className="bg-gray-900/50 rounded-xl mb-4">
        <div 
          className={`flex justify-between items-center p-2 rounded-t-md ${projectColor} text-white cursor-pointer transition-all ${isProjectCollapsed ? 'rounded-b-md' : ''}`}
          onClick={toggleProjectCollapse}
        >
          <div className="flex items-center space-x-2">
            <ChevronDownIcon className={`w-6 h-6 transition-transform ${isProjectCollapsed ? '-rotate-90' : 'rotate-0'}`} />
            <h3 className="text-xl font-bold">{project.name}</h3>
          </div>
          <div onClick={e => e.stopPropagation()}>
            <Dropdown
              trigger={
                <button className="p-1 rounded-full text-white/80 hover:bg-white/20 hover:text-white" title="Project options">
                  <MoreVerticalIcon className="w-5 h-5" />
                </button>
              }
            >
              <DropdownItem onClick={() => setIsAddTaskModalOpen(true)}>Add Task</DropdownItem>
              <DropdownItem onClick={() => setIsEditProjectModalOpen(true)}>Edit Project</DropdownItem>
              <DropdownItem className="text-red-400 hover:bg-red-500/50" onClick={handleDeleteProject}>Delete Project</DropdownItem>
            </Dropdown>
          </div>
        </div>
        <div className={`transition-all duration-300 ease-in-out overflow-hidden ${isProjectCollapsed ? 'max-h-0' : 'max-h-[10000px]'}`}>
          <div className="p-4 space-y-4">
            {projectTasks.map(task => {
              const taskSubtasks = subtasks.filter(st => st.taskId === task.id);
              const hasSubtasks = taskSubtasks.length > 0;
              const isTaskCollapsed = collapsedTasks.has(task.id);

              const totalSubtaskDuration = taskSubtasks.reduce((sum, st) => sum + (st.estDuration || 0), 0);
              const displayDuration = totalSubtaskDuration > 0 ? totalSubtaskDuration : task.estDuration;

              return (
                <div key={task.id}>
                  {!hasSubtasks ? (
                    <TaskItem 
                      item={task} 
                      itemType="task" 
                      project={project} 
                      onEdit={() => setEditingItem({ item: task, itemType: 'task' })}
                    />
                  ) : (
                    <div className="bg-gray-800/50 rounded-lg">
                      <div 
                        className="flex justify-between items-start p-3 cursor-pointer"
                        onClick={() => toggleTaskCollapse(task.id)}
                      >
                         <div className="flex items-center space-x-2 min-w-0">
                           <ChevronDownIcon className={`w-5 h-5 mt-0.5 transition-transform flex-shrink-0 ${isTaskCollapsed ? '-rotate-90' : 'rotate-0'}`} />
                            <div className="min-w-0 flex items-baseline">
                              <p className="font-bold truncate">{task.title}</p>
                              {displayDuration ? <p className="text-xs text-gray-400 ml-2 flex-shrink-0">{displayDuration} min total</p> : null}
                            </div>
                         </div>
                        <div onClick={e => e.stopPropagation()}>
                          <Dropdown
                              trigger={
                                  <button className="p-1 rounded-full text-gray-400 hover:bg-gray-700 hover:text-white flex-shrink-0" title="More options">
                                      <MoreVerticalIcon className="w-5 h-5" />
                                  </button>
                              }
                          >
                              <DropdownItem onClick={() => setAddingSubtaskTo(task)}>Add Subtask</DropdownItem>
                              <DropdownItem onClick={() => setEditingItem({ item: task, itemType: 'task' })}>Edit Task</DropdownItem>
                              <DropdownItem className="text-red-400 hover:bg-red-500/50" onClick={() => handleDeleteTask(task)}>Delete Task</DropdownItem>
                          </Dropdown>
                        </div>
                      </div>
                      <div className={`transition-all duration-300 ease-in-out overflow-hidden ${isTaskCollapsed ? 'max-h-0' : 'max-h-[1000px]'}`}>
                        <div className="pl-4 pb-2 pr-2 space-y-2 border-l-2 border-gray-700 ml-[23px]">
                          {taskSubtasks.map(subtask => (
                            <TaskItem 
                              key={subtask.id} 
                              item={subtask} 
                              itemType="subtask" 
                              project={project} 
                              onEdit={() => setEditingItem({ item: subtask, itemType: 'subtask' })}
                            />
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
      <AddTaskModal
        isOpen={isAddTaskModalOpen}
        onClose={() => setIsAddTaskModalOpen(false)}
        project={project}
      />
      {addingSubtaskTo && (
        <AddSubtaskModal
          isOpen={!!addingSubtaskTo}
          onClose={() => setAddingSubtaskTo(null)}
          parentTask={addingSubtaskTo}
        />
      )}
      {editingItem && (
        <EditTaskModal
          isOpen={!!editingItem}
          onClose={() => setEditingItem(null)}
          item={editingItem.item}
          itemType={editingItem.itemType}
        />
      )}
      {isEditProjectModalOpen && (
        <EditProjectModal
            isOpen={isEditProjectModalOpen}
            onClose={() => setIsEditProjectModalOpen(false)}
            project={project}
        />
      )}
    </>
  );
};