import classes from '@client/App.module.less';
import { DashboardPage } from '@client/portal/components/dashboard_page';
import { InvitePage } from '@client/portal/components/invite_page';
import { LoginPage } from '@client/portal/components/login_page';
import { PortalLayout } from '@client/portal/portal_layout';
import { PrayerChat } from '@client/seeker/components/prayer_chat';
import { SeekerLayout } from '@client/seeker/seeker_layout';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';

function App() {
  return (
    <div className={classes.root}>
      <BrowserRouter>
        <Routes>
          {/* Seeker */}
          <Route element={<SeekerLayout />}>
            <Route path="/" element={<PrayerChat />} />
            <Route path="/chats/:chatroomId" element={<PrayerChat startsExpanded={true} />} />
          </Route>

          {/* Portal - standalone pages */}
          <Route path="/portal/login" element={<LoginPage />} />
          <Route path="/portal/invite" element={<InvitePage />} />

          {/* Portal - authenticated pages */}
          <Route path="/portal" element={<PortalLayout />}>
            <Route index element={<Navigate to="/portal/dashboard" replace />} />
            <Route path="dashboard" element={<DashboardPage />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </div>
  );
}

export default App;
