import { createContext } from 'react';

export enum ModalType {
  VideoCall = 'VideoCall',
  Confirmation = 'Confirmation',
  PrayerList = 'PrayerList',
}

interface ModalContext {
  modalType?: ModalType;
  isOpen: boolean;
  openModal: (modalType: ModalType) => void;
  closeModal: () => void;
}

export const ModalContext = createContext<ModalContext>({
  modalType: ModalType.VideoCall,
  isOpen: false,
  openModal: () => {},
  closeModal: () => {},
});
