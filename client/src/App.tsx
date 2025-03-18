import { useCallback, useContext } from 'react'

import classes from './App.module.less';
import { Button, ButtonStyle } from './shared-components/button';
import { ModalContext, ModalType } from './contexts/modal_context_provider';

function App() {
  const {openModal} = useContext(ModalContext);

  const onRecordClick = useCallback(() => {
    openModal(ModalType.VideoCall);
  }, [openModal]);

  // TODO(johnli): Find a better place for this.
  const onIconClick = useCallback(() => {
    openModal(ModalType.PrayerList);
  }, [openModal]);

  return (
    <div className={classes.root}>
      <div className={classes.contents}>
        <div className={classes.header}>
          <span className={classes.starttext}>About</span>
          <img className={classes.logo} src="../assets/logo.png" onClick={onIconClick}/>
          <span className="endtext">Invite my church</span>
        </div>

        <div className={classes.mainAction}>
          <span className={classes.bigger}>
            What can your neighborhood pray for you about?
          </span>
          <div className={classes.modal}>
            <span className={classes.modalTitle}>
              Need prayer?
            </span>

            <div className={classes.textRow}>
              <div className={classes.textColumn}>
                <span className={classes.titleBold}>Record a video</span>
                <span>Max 30 seconds, tell us what we can pray for you about.</span>
              </div>
              <Button buttonStyle={ButtonStyle.Primary} onClick={onRecordClick}>
                Start now
              </Button>
            </div>
            <div className={classes.textRow}>
              <div className={classes.textColumn}>
                <span className={classes.titleBold}>Video shy?</span>
                <span>You can write a request, we'll give you a few prompts to start</span>
              </div>
              <Button buttonStyle={ButtonStyle.Secondary} onClick={() => {}}>
                Start now
              </Button>
            </div>
          </div>
        </div>
        
        <div className={classes.zipCode}>
          Not your neighborhood? <a href="#">Enter your zip code</a>
        </div>
      </div>
    </div>
  )
}

export default App;
