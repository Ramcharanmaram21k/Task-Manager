import { useRef } from 'react';
import Modal from './Modal';

export default function ConfirmDialog({
  isOpen,
  title,
  description,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  onConfirm,
  onCancel,
}) {
  const confirmRef = useRef(null);

  return (
    <Modal
      isOpen={isOpen}
      title={title}
      description={description}
      onClose={onCancel}
      initialFocusRef={confirmRef}
    >
      <div className="modal-actions">
        <button type="button" className="secondary-button" onClick={onCancel}>
          {cancelText}
        </button>
        <button type="button" className="danger-button" onClick={onConfirm} ref={confirmRef}>
          {confirmText}
        </button>
      </div>
    </Modal>
  );
}
