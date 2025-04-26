import { createContext } from 'react';

export enum ModalType {
  Confirmation = 'Confirmation',
  ContactInfo = 'ContactInfo',
  ChatroomVerification = 'ChatroomVerification',
}

interface ConfirmationPayload {
  title?: string;
  message?: string;
}

interface ContactInfoPayload {
  onSubmit: (email: string | undefined, phone: string | undefined) => void;
}

interface ChatroomVerificationPayload {
  onSubmit: (email: string | undefined, phone: string | undefined) => void;
}

// Union type for all possible payloads
export type ModalPayload = {
  [ModalType.Confirmation]: ConfirmationPayload;
  [ModalType.ContactInfo]: ContactInfoPayload;
  [ModalType.ChatroomVerification]: ChatroomVerificationPayload;
};

interface ModalContext {
  modalType?: ModalType;
  isOpen: boolean;
  openModal: <T extends ModalType>(type: T, payload: ModalPayload[T]) => void;
  closeModal: () => void;
}

export const ModalContext = createContext<ModalContext>({
  modalType: ModalType.ContactInfo,
  isOpen: false,
  openModal: () => {},
  closeModal: () => {},
});
