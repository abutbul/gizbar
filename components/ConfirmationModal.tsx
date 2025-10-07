
import React, { ReactNode } from 'react';
import { Modal } from './Modal.tsx';
import { Button } from './Button.tsx';

interface ConfirmationModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
    title: string;
    children: ReactNode;
    confirmText?: string;
    cancelText?: string;
}

export const ConfirmationModal: React.FC<ConfirmationModalProps> = ({ isOpen, onClose, onConfirm, title, children, confirmText = "Confirm", cancelText = "Cancel" }) => {
    if (!isOpen) return null;

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={title}>
            <div className="text-slate-600 dark:text-slate-300">
                {children}
            </div>
            <div className="mt-6 flex justify-end space-x-3">
                <Button onClick={onClose} variant="secondary">
                    {cancelText}
                </Button>
                <Button onClick={onConfirm} variant="danger">
                    {confirmText}
                </Button>
            </div>
        </Modal>
    );
};