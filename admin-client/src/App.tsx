import { AdminLayout } from './components/admin_layout';
import { ChurchesPage } from './components/churches_page';
import { UsersPage } from './components/users_page';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/*" element={<AdminLayout />}>
          <Route index element={<Navigate to="/churches" replace />} />
          <Route path="churches" element={<ChurchesPage />} />
          <Route path="users" element={<UsersPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
