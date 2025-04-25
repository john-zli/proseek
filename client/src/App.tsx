import { BrowserRouter, Route, Routes } from 'react-router-dom';

import classes from './App.module.less';
import { PrayerChat } from './components/prayer_chat';

function App() {
  return (
    <div className={classes.root}>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<PrayerChat />} />
          <Route path="/chats/:chatroomId" element={<PrayerChat startsExpanded={true} />} />
        </Routes>
      </BrowserRouter>
    </div>
  );
}

export default App;
