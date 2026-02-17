import { AdminLayout } from './components/admin_layout';
import { ChurchDetailPage } from './components/church_detail_page';
import { ChurchesPage } from './components/churches_page';
import { InvitationsPage } from './components/invitations_page';
import { UserDetailPage } from './components/user_detail_page';
import { UsersPage } from './components/users_page';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/*" element={<AdminLayout />}>
          <Route index element={<Navigate to="/churches" replace />} />
          <Route path="churches" element={<ChurchesPage />} />
          <Route path="churches/:churchId" element={<ChurchDetailPage />} />
          <Route path="users" element={<UsersPage />} />
          <Route path="users/:userId" element={<UserDetailPage />} />
          <Route path="invitations" element={<InvitationsPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
