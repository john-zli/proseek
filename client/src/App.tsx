import { BrowserRouter, Route, Routes } from 'react-router-dom';

import classes from './App.module.less';
import { Header } from './components/header';
import { LoginPage } from './components/login_page';
import { PrayerChat } from './components/prayer_chat';

function App() {
  return (
    <div className={classes.root}>
      <BrowserRouter>
        <Header />
        <Routes>
          <Route path="/" element={<PrayerChat />} />
          <Route path="/chats/:chatroomId" element={<PrayerChat startsExpanded={true} />} />
          <Route path="/login" element={<LoginPage />} />
        </Routes>
      </BrowserRouter>
    </div>
  );
}

export default App;
