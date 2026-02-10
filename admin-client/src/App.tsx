import { AdminLayout } from './components/admin_layout';
import { ChurchesPage } from './components/churches_page';
import { LoginPage } from './components/login_page';
import { UsersPage } from './components/users_page';
import { SessionContext } from './contexts/session_context';
import { useContext } from 'react';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { session, sessionLoading } = useContext(SessionContext);

  if (sessionLoading) {
    return null;
  }

  if (!session?.isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route
          path="/*"
          element={
            <ProtectedRoute>
              <AdminLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<Navigate to="/churches" replace />} />
          <Route path="churches" element={<ChurchesPage />} />
          <Route path="users" element={<UsersPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
