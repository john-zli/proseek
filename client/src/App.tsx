import classes from './App.module.less';
import { PrayerChat } from './components/prayer_chat';

function App() {
  return (
    <div className={classes.root}>
      <PrayerChat />
    </div>
  );
}

export default App;
