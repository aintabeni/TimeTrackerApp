import React, { useState } from 'react';
import { Modal } from '../common/Modal';
import { useAppDispatch } from '../../hooks/useAppContext';
import type { Task, Subtask } from '../../types';
import { v4 as uuidv4 } from 'uuid';

interface AddSubtaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  parentTask: Task;
}

export const AddSubtaskModal: React.FC<AddSubtaskModalProps> = ({ isOpen, onClose, parentTask }) => {
    const dispatch = useAppDispatch();
    const [title, setTitle] = useState('');
    const [duration, setDuration] = useState('');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!title.trim()) return;

        const newSubtask: Subtask = {
            id: uuidv4(),
            taskId: parentTask.id,
            title: title.trim(),
            estDuration: duration ? parseInt(duration, 10) : undefined
        };

        dispatch({ type: 'ADD_SUBTASK', payload: newSubtask });
        
        // Reset and close
        setTitle('');
        setDuration('');
        onClose();
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={`Add Subtask to "${parentTask.title}"`}>
            <form onSubmit={handleSubmit}>
                <div className="mb-4">
                    <label htmlFor="subtask-title" className="block text-sm font-medium text-gray-300 mb-1">Title</label>
                    <input
                        type="text"
                        id="subtask-title"
                        value={title}
                        onChange={e => setTitle(e.target.value)}
                        className="w-full bg-gray-700 border border-gray-600 rounded-md p-2 text-white focus:ring-indigo-500 focus:border-indigo-500"
                        required
                        autoFocus
                    />
                </div>
                <div className="mb-4">
                    <label htmlFor="subtask-duration" className="block text-sm font-medium text-gray-300 mb-1">Estimated Duration (minutes)</label>
                    <input
                        type="number"
                        id="subtask-duration"
                        value={duration}
                        onChange={e => setDuration(e.target.value)}
                        className="w-full bg-gray-700 border border-gray-600 rounded-md p-2 text-white focus:ring-indigo-500 focus:border-indigo-500"
                        min="1"
                    />
                </div>
                <div className="flex justify-end space-x-2 pt-4 border-t border-gray-700 mt-6">
                    <button type="button" onClick={onClose} className="px-4 py-2 bg-gray-600 hover:bg-gray-500 rounded-md text-sm font-semibold">Cancel</button>
                    <button type="submit" className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 rounded-md text-sm font-semibold">Add Subtask</button>
                </div>
            </form>
        </Modal>
    );
}