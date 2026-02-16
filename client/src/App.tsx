import classes from './App.module.less';
import { DashboardPage } from './components/dashboard_page';
import { Header } from './components/header';
import { InvitePage } from './components/invite_page';
import { LoginPage } from './components/login_page';
import { PrayerChat } from './components/prayer_chat';
import { SessionContext } from './contexts/session_context_provider';
import { useContext } from 'react';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';

function HomePage() {
  const { session, sessionLoading } = useContext(SessionContext);

  if (sessionLoading) return null;
  if (session?.isAuthenticated && session.user) {
    return <Navigate to="/dashboard" replace />;
  }
  return <PrayerChat />;
}

function App() {
  return (
    <div className={classes.root}>
      <BrowserRouter>
        <Header />
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/chats/:chatroomId" element={<PrayerChat startsExpanded={true} />} />
          <Route path="/invite" element={<InvitePage />} />
          <Route path="/login" element={<LoginPage />} />
        </Routes>
      </BrowserRouter>
    </div>
  );
}

export default App;
