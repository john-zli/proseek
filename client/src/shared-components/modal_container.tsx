import { ModalContext } from '@client/contexts/modal_context_provider';
import classes from '@client/shared-components/modal_container.module.less';
import { useCallback, useContext } from 'react';

interface ModalContainerProps {
  onClose?: () => void;
  children?: React.ReactNode;
  isUncloseable?: boolean;
}

export function ModalContainer(props: ModalContainerProps) {
  const { onClose, children, isUncloseable } = props;
  const { closeModal, isOpen } = useContext(ModalContext);

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

  if (!isOpen) {
    return null;
  }

  return (
    <div className={classes.modalContainer} onClick={isUncloseable ? undefined : onCloseModal}>
      <div className={classes.popupModal} onClick={stopPropagation}>
        {children}
      </div>
    </div>
  );
}
