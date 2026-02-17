import { Header } from '@client/components/header';
import { ModalManager } from '@client/seeker/components/modal_manager';
import { Outlet } from 'react-router-dom';

export function SeekerLayout() {
  return (
    <ModalManager>
      <Header />
      <Outlet />
    </ModalManager>
  );
}
