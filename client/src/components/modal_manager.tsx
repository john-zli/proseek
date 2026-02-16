import { ModalContext, ModalPayload, ModalType } from '../contexts/modal_context_provider';
import { ChatroomVerificationModal } from './modals/chatroom_verification_modal';
import { ConfirmationModal } from './modals/confirmation_modal';
import { ContactInfoModal } from './modals/contact_info_modal';
import { useCallback, useState } from 'react';

type ModalState = {
  [K in ModalType]: { type: K; payload: ModalPayload[K] };
}[ModalType];

interface Props {
  children?: React.ReactNode;
}

export function ModalManager(props: Props) {
  const [modal, setModal] = useState<ModalState | undefined>();
  const [isOpen, setIsOpen] = useState<boolean>(false);

  const openModal = useCallback(<T extends ModalType>(type: T, payload: ModalPayload[T]) => {
    setModal({ type, payload } as ModalState);
    setIsOpen(true);
  }, []);

  const closeModal = useCallback(() => {
    setModal(undefined);
    setIsOpen(false);
  }, []);

  const renderModal = () => {
    if (!modal?.type) {
      return null;
    }

    switch (modal.type) {
      case ModalType.Confirmation:
        return <ConfirmationModal {...modal.payload} />;
      case ModalType.ContactInfo:
        return <ContactInfoModal {...modal.payload} />;
      case ModalType.ChatroomVerification:
        return <ChatroomVerificationModal {...modal.payload} />;
      default:
        return null;
    }
  };

  return (
    <ModalContext.Provider
      value={{
        modalType: modal?.type,
        isOpen,
        openModal,
        closeModal,
      }}
    >
      {renderModal()}
      {props.children}
    </ModalContext.Provider>
  );
}
