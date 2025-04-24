import { createContext } from 'react';

export enum ModalType {
  VideoCall = 'VideoCall',
  Confirmation = 'Confirmation',
  ContactInfo = 'ContactInfo',
}

// Payload interfaces for each modal type
interface VideoCallPayload {
  prompt?: string;
}

interface ConfirmationPayload {
  title?: string;
  message?: string;
}

interface ContactInfoPayload {
  onSubmit: (email: string, phone: string) => void;
}

// Union type for all possible payloads
export type ModalPayload = {
  [ModalType.VideoCall]: VideoCallPayload;
  [ModalType.Confirmation]: ConfirmationPayload;
  [ModalType.ContactInfo]: ContactInfoPayload;
};

interface ModalContext {
  modalType?: ModalType;
  isOpen: boolean;
  openModal: <T extends ModalType>(type: T, payload: ModalPayload[T]) => void;
  closeModal: () => void;
}

export const ModalContext = createContext<ModalContext>({
  modalType: ModalType.VideoCall,
  isOpen: false,
  openModal: () => {},
  closeModal: () => {},
});
