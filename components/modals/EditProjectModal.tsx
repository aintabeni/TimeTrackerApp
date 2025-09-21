import React, { useState, useEffect } from 'react';
import { Modal } from '../common/Modal';
import { useAppDispatch } from '../../hooks/useAppContext';
import type { Project } from '../../types';
import { PROJECT_THEME_COLORS } from '../../constants';

interface EditProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  project: Project;
}

export const EditProjectModal: React.FC<EditProjectModalProps> = ({ isOpen, onClose, project }) => {
    const dispatch = useAppDispatch();
    const [name, setName] = useState(project.name);
    const [color, setColor] = useState(project.color);

    useEffect(() => {
        setName(project.name);
        setColor(project.color);
    }, [project]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!name.trim()) return;

        const updatedProject: Project = {
            ...project,
            name: name.trim(),
            color: color
        };

        dispatch({ type: 'UPDATE_PROJECT', payload: updatedProject });
        onClose();
    };
    
    return (
        <Modal isOpen={isOpen} onClose={onClose} title={`Edit Project`}>
            <form onSubmit={handleSubmit}>
                <div className="mb-4">
                    <label htmlFor="project-name" className="block text-sm font-medium text-gray-300 mb-1">Project Name</label>
                    <input
                        type="text"
                        id="project-name"
                        value={name}
                        onChange={e => setName(e.target.value)}
                        className="w-full bg-gray-700 border border-gray-600 rounded-md p-2 text-white focus:ring-indigo-500 focus:border-indigo-500"
                        required
                        autoFocus
                    />
                </div>
                
                <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-300 mb-2">Color</label>
                    <div className="flex space-x-3">
                        {Object.entries(PROJECT_THEME_COLORS).map(([colorName, theme]) => (
                            <button
                                type="button"
                                key={colorName}
                                onClick={() => setColor(colorName)}
                                className={`w-8 h-8 rounded-full ${theme.bg} transition-transform hover:scale-110 ${color === colorName ? 'ring-2 ring-offset-2 ring-offset-gray-800 ring-white' : ''}`}
                                aria-label={colorName}
                            />
                        ))}
                    </div>
                </div>

                <div className="flex justify-end space-x-2 pt-4 border-t border-gray-700 mt-6">
                    <button type="button" onClick={onClose} className="px-4 py-2 bg-gray-600 hover:bg-gray-500 rounded-md text-sm font-semibold">Cancel</button>
                    <button type="submit" className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 rounded-md text-sm font-semibold">Save Changes</button>
                </div>
            </form>
        </Modal>
    );
}