import { useCallback, useContext } from 'react';

import { ModalContext } from '../contexts/modal_context_provider';
import classes from './modal_container.module.less';

interface ModalContainerProps {
  onClose?: () => void;
  children?: React.ReactNode;
  isUncloseable?: boolean;
}

export function ModalContainer(props: ModalContainerProps) {
  const { onClose, children, isUncloseable } = props;
  const { closeModal, isOpen } = useContext(ModalContext);

  if (!isOpen) {
    return null;
  }

  const onCloseModal = useCallback(() => {
    if (!isUncloseable && onClose) {
      closeModal();
      onClose();
    }
  }, [closeModal, onClose, isUncloseable]);

  const stopPropagation = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  return (
    <div className={classes.modalContainer} onClick={isUncloseable ? undefined : onCloseModal}>
      <div className={classes.popupModal} onClick={stopPropagation}>
        {children}
      </div>
    </div>
  );
}
