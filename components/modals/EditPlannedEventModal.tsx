import React from 'react';
import { Modal } from '../common/Modal';
import { useAppDispatch } from '../../hooks/useAppContext';
import type { ScheduledBlock } from '../../types';
import { v4 as uuidv4 } from 'uuid';
import { MINUTES_IN_DAY } from '../../constants';

interface EditPlannedEventModalProps {
  isOpen: boolean;
  onClose: () => void;
  onDelete: (id: string) => void;
  event: ScheduledBlock;
  title: string;
}

export const EditPlannedEventModal: React.FC<EditPlannedEventModalProps> = ({ isOpen, onClose, onDelete, event, title }) => {
    const dispatch = useAppDispatch();

    const handleDelete = () => {
        if (window.confirm("Are you sure you want to delete this planned event?")) {
            onDelete(event.id);
        }
    };

    const handleDuplicate = () => {
        const duration = event.end - event.start;
        const newEnd = event.end + duration;

        // Prevent duplicate from spilling over to the next day
        if (newEnd > MINUTES_IN_DAY) {
            alert("Cannot duplicate this event as it would extend past midnight.");
            return;
        }

        const newBlock: ScheduledBlock = {
            ...event,
            id: uuidv4(),
            start: event.end,
            end: newEnd,
        };

        dispatch({ type: 'ADD_SCHEDULED_BLOCK', payload: newBlock });
        onClose();
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={`Edit Event: ${title}`}>
            <div className="space-y-4">
                <p className="text-gray-300">What would you like to do with this planned event?</p>
                <div className="flex justify-end space-x-3 pt-4 border-t border-gray-700 mt-4">
                    <button
                        type="button"
                        onClick={handleDuplicate}
                        className="px-4 py-2 bg-blue-600 hover:bg-blue-500 rounded-md text-sm font-semibold transition-colors"
                    >
                        Duplicate
                    </button>
                    <button
                        type="button"
                        onClick={handleDelete}
                        className="px-4 py-2 bg-red-700 hover:bg-red-600 rounded-md text-sm font-semibold transition-colors"
                    >
                        Delete
                    </button>
                </div>
            </div>
        </Modal>
    );
};
