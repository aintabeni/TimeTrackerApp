import React, { useState } from 'react';
import { Modal } from '../common/Modal';
import { useAppDispatch } from '../../hooks/useAppContext';
import type { Project, Task, Subtask } from '../../types';
import { v4 as uuidv4 } from 'uuid';

interface AddTaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  project: Project;
}

export const AddTaskModal: React.FC<AddTaskModalProps> = ({ isOpen, onClose, project }) => {
    const dispatch = useAppDispatch();
    const [title, setTitle] = useState('');
    const [duration, setDuration] = useState('');
    const [subtasks, setSubtasks] = useState<{ title: string; duration: string }[]>([]);

    const handleAddSubtask = () => {
        setSubtasks([...subtasks, { title: '', duration: '' }]);
    };

    const handleSubtaskChange = (index: number, field: 'title' | 'duration', value: string) => {
        const newSubtasks = [...subtasks];
        (newSubtasks[index] as any)[field] = value;
        setSubtasks(newSubtasks);
    };

    const handleRemoveSubtask = (index: number) => {
        const newSubtasks = subtasks.filter((_, i) => i !== index);
        setSubtasks(newSubtasks);
    };

    const handleClose = () => {
        setTitle('');
        setDuration('');
        setSubtasks([]);
        onClose();
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if(!title.trim()) return;

        const newTask: Task = {
            id: uuidv4(),
            projectId: project.id,
            title: title.trim(),
            estDuration: subtasks.length > 0 ? undefined : (duration ? parseInt(duration, 10) : undefined)
        };
        
        const newSubtasks: Subtask[] = subtasks
            .filter(st => st.title.trim() !== '')
            .map(st => ({
                id: uuidv4(),
                taskId: newTask.id,
                title: st.title.trim(),
                estDuration: st.duration ? parseInt(st.duration, 10) : undefined
            }));

        dispatch({
            type: 'ADD_TASK',
            payload: {
                task: newTask,
                subtasks: newSubtasks
            }
        });
        
        handleClose();
    };


    return (
        <Modal isOpen={isOpen} onClose={handleClose} title={`Add Task to ${project.name}`}>
            <form onSubmit={handleSubmit}>
                <div className="mb-4">
                    <label htmlFor="task-title" className="block text-sm font-medium text-gray-300 mb-1">Title</label>
                    <input
                        type="text"
                        id="task-title"
                        value={title}
                        onChange={e => setTitle(e.target.value)}
                        className="w-full bg-gray-700 border border-gray-600 rounded-md p-2 text-white focus:ring-indigo-500 focus:border-indigo-500"
                        required
                        autoFocus
                    />
                </div>
                
                {subtasks.length === 0 && (
                    <div className="mb-4">
                        <label htmlFor="task-duration" className="block text-sm font-medium text-gray-300 mb-1">Estimated Duration (minutes)</label>
                        <input
                            type="number"
                            id="task-duration"
                            value={duration}
                            onChange={e => setDuration(e.target.value)}
                            className="w-full bg-gray-700 border border-gray-600 rounded-md p-2 text-white focus:ring-indigo-500 focus:border-indigo-500"
                            min="1"
                        />
                    </div>
                )}
                
                <div className="mb-4 space-y-2">
                    <label className="block text-sm font-medium text-gray-300">Subtasks</label>
                    {subtasks.map((subtask, index) => (
                        <div key={index} className="flex items-center space-x-2 bg-gray-700/50 p-2 rounded-md">
                            <input
                                type="text"
                                placeholder="Subtask title"
                                value={subtask.title}
                                onChange={e => handleSubtaskChange(index, 'title', e.target.value)}
                                className="flex-grow bg-gray-600 border border-gray-500 rounded-md p-2 text-white focus:ring-indigo-500 focus:border-indigo-500"
                            />
                            <input
                                type="number"
                                placeholder="mins"
                                value={subtask.duration}
                                onChange={e => handleSubtaskChange(index, 'duration', e.target.value)}
                                className="w-24 bg-gray-600 border border-gray-500 rounded-md p-2 text-white focus:ring-indigo-500 focus:border-indigo-500"
                                min="1"
                            />
                            <button type="button" onClick={() => handleRemoveSubtask(index)} className="text-red-400 hover:text-red-300 text-2xl leading-none px-1">&times;</button>
                        </div>
                    ))}
                     <button type="button" onClick={handleAddSubtask} className="text-sm text-indigo-400 hover:text-indigo-300 pt-1">+ Add Subtask</button>
                </div>


                <div className="flex justify-end space-x-2 pt-4 border-t border-gray-700 mt-6">
                    <button type="button" onClick={handleClose} className="px-4 py-2 bg-gray-600 hover:bg-gray-500 rounded-md text-sm font-semibold">Cancel</button>
                    <button type="submit" className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 rounded-md text-sm font-semibold">Add Task</button>
                </div>
            </form>
        </Modal>
    );
}