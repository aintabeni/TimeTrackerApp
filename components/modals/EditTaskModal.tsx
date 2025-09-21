import React, { useState, useEffect } from 'react';
import { Modal } from '../common/Modal';
import { useAppDispatch } from '../../hooks/useAppContext';
import type { Task, Subtask } from '../../types';

interface EditTaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  item: Task | Subtask;
  itemType: 'task' | 'subtask';
}

export const EditTaskModal: React.FC<EditTaskModalProps> = ({ isOpen, onClose, item, itemType }) => {
    const dispatch = useAppDispatch();
    const [title, setTitle] = useState(item.title);
    const [duration, setDuration] = useState(item.estDuration?.toString() || '');

    useEffect(() => {
        setTitle(item.title);
        setDuration(item.estDuration?.toString() || '');
    }, [item]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!title.trim()) return;

        const updatedItem = {
            ...item,
            title: title.trim(),
            estDuration: duration ? parseInt(duration, 10) : undefined
        };

        if (itemType === 'task') {
            dispatch({ type: 'UPDATE_TASK', payload: updatedItem as Task });
        } else {
            dispatch({ type: 'UPDATE_SUBTASK', payload: updatedItem as Subtask });
        }
        
        onClose();
    };

    const hasSubtasks = itemType === 'task' && 'projectId' in item && (
      // A simple check could be to see if there are subtasks. A better approach would require passing subtasks down.
      // For now, we'll just show the duration field. If a task has subtasks, its own duration is ignored in the column view anyway.
      false
    );


    return (
        <Modal isOpen={isOpen} onClose={onClose} title={`Edit ${itemType === 'task' ? 'Task' : 'Subtask'}`}>
            <form onSubmit={handleSubmit}>
                <div className="mb-4">
                    <label htmlFor="edit-item-title" className="block text-sm font-medium text-gray-300 mb-1">Title</label>
                    <input
                        type="text"
                        id="edit-item-title"
                        value={title}
                        onChange={e => setTitle(e.target.value)}
                        className="w-full bg-gray-700 border border-gray-600 rounded-md p-2 text-white focus:ring-indigo-500 focus:border-indigo-500"
                        required
                        autoFocus
                    />
                </div>
                {!hasSubtasks && (
                  <div className="mb-4">
                      <label htmlFor="edit-item-duration" className="block text-sm font-medium text-gray-300 mb-1">Estimated Duration (minutes)</label>
                      <input
                          type="number"
                          id="edit-item-duration"
                          value={duration}
                          onChange={e => setDuration(e.target.value)}
                          className="w-full bg-gray-700 border border-gray-600 rounded-md p-2 text-white focus:ring-indigo-500 focus:border-indigo-500"
                          min="1"
                      />
                  </div>
                )}
                <div className="flex justify-end space-x-2 pt-4 border-t border-gray-700 mt-6">
                    <button type="button" onClick={onClose} className="px-4 py-2 bg-gray-600 hover:bg-gray-500 rounded-md text-sm font-semibold">Cancel</button>
                    <button type="submit" className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 rounded-md text-sm font-semibold">Save Changes</button>
                </div>
            </form>
        </Modal>
    );
}