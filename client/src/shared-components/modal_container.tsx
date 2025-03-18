import { useCallback, useContext } from 'react';
import classes from './modal_container.module.less';
import { ModalContext } from '../contexts/modal_context_provider';

interface ModalContainerProps {
  onClose?: () => void;
  children?: React.ReactNode;
}

export function ModalContainer(props: ModalContainerProps) {
  const { onClose, children } = props;
  const {closeModal, isOpen} = useContext(ModalContext);

  if (!isOpen) {
    return null;
  }

  const onCloseModal = useCallback(() => {
    closeModal();
    onClose?.();
  }, [closeModal, onClose]);

  const stopPropagation = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  return (
    <div className={classes.modalContainer} onClick={onCloseModal}>
      <div className={classes.popupModal} onClick={stopPropagation}>
        {children}
      </div>
    </div>
  );
}
