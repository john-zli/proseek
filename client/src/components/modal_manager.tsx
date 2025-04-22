import { useState } from 'react';

import { ModalContext, ModalType } from '../contexts/modal_context_provider';
import { ConfirmationModal } from './modals/confirmation_modal';
import { ContactInfoModal } from './modals/contact_info_modal';
import { PrayerListModal } from './modals/prayer_list_modal';
import { VideoCallModal } from './modals/video_call_modal';

interface Props {
  children?: React.ReactNode;
  onContactInfoSubmit?: (email: string, phone: string) => void;
}

export function ModalManager(props: Props) {
  const [modalType, setModalType] = useState<ModalType | undefined>();
  const [isOpen, setIsOpen] = useState<boolean>(false);

  const openModal = (modalType: ModalType) => {
    setModalType(modalType);
    setIsOpen(true);
  };

  const closeModal = () => {
    setModalType(undefined);
    setIsOpen(false);
  };

  const renderModal = () => {
    if (!modalType) {
      return null;
    }

    switch (modalType) {
      case ModalType.VideoCall:
        return <VideoCallModal />;
      case ModalType.Confirmation:
        return <ConfirmationModal />;
      case ModalType.PrayerList:
        return <PrayerListModal />;
      case ModalType.ContactInfo:
        return <ContactInfoModal onSubmit={props.onContactInfoSubmit || (() => {})} />;
      default:
        return null;
    }
  };

  return (
    <ModalContext.Provider value={{ modalType, isOpen, openModal, closeModal }}>
      {renderModal()}
      {props.children}
    </ModalContext.Provider>
  );
}
