import { useCallback, useContext } from 'react';

import classes from './App.module.less';
import { ModalContext, ModalType } from './contexts/modal_context_provider';
import { Button, ButtonStyle } from './shared-components/button';

function App() {
  const { openModal } = useContext(ModalContext);

  const onSpeakClick = useCallback(() => {
    openModal(ModalType.VideoCall);
  }, [openModal]);

  // TODO(johnli): Find a better place for this.
  // const onIconClick = useCallback(() => {
  //   openModal(ModalType.PrayerList);
  // }, [openModal]);

  return (
    <div className={classes.root}>
      <div className={classes.contents}>
        <div className={classes.mainContent}>
          <h1 className={classes.mainHeading}>Need someone to pray with?</h1>
          <p className={classes.subtitle}>
            Connect with compassionate prayer partners ready to join you in faith and support
          </p>
          <Button buttonStyle={ButtonStyle.Primary} onClick={onSpeakClick}>
            Speak with someone now
          </Button>
        </div>
      </div>
    </div>
  );
}

export default App;
