import classes from '@client/App.module.less';
import { InvitePage } from '@client/portal/components/invite_page';
import { LoginPage } from '@client/portal/components/login_page';
import { PortalPage } from '@client/portal/components/portal_page';
import { PortalLayout } from '@client/portal/portal_layout';
import { PrayerChat } from '@client/seeker/components/prayer_chat';
import { SeekerLayout } from '@client/seeker/seeker_layout';
import { BrowserRouter, Route, Routes } from 'react-router-dom';

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
          <Route path="/portal/:churchId" element={<PortalLayout />}>
            <Route index element={<PortalPage />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </div>
  );
}

export default App;
