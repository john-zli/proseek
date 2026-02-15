import classes from './App.module.less';
import { Header } from './components/header';
import { InvitePage } from './components/invite_page';
import { LoginPage } from './components/login_page';
import { PrayerChat } from './components/prayer_chat';
import { BrowserRouter, Route, Routes } from 'react-router-dom';

function App() {
  return (
    <div className={classes.root}>
      <BrowserRouter>
        <Header />
        <Routes>
          <Route path="/" element={<PrayerChat />} />
          <Route path="/chats/:chatroomId" element={<PrayerChat startsExpanded={true} />} />
          <Route path="/invite" element={<InvitePage />} />
          <Route path="/login" element={<LoginPage />} />
        </Routes>
      </BrowserRouter>
    </div>
  );
}

export default App;
