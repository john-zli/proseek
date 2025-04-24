import { useCallback, useContext } from 'react';

import { ModalContext, ModalType } from '../../contexts/modal_context_provider';
import { Button, ButtonStyle } from '../../shared-components/button';
import { ModalContainer } from '../../shared-components/modal_container';
import classes from './video_call_modal.module.less';

interface Props {
  prompt?: string;
}

export function VideoCallModal({ prompt = "What's keeping you up at night this week?" }: Props) {
  const { openModal, closeModal } = useContext(ModalContext);

  // TODO(johnli): Send prayer to backend.
  const onRecordClick = useCallback(() => {
    openModal(ModalType.Confirmation);
  }, [openModal]);

  const onClose = useCallback(() => {
    closeModal();
  }, [closeModal]);

  return (
    <ModalContainer>
      <div className={classes.webcamContainer}>
        <img className={classes.webcamImage} src="../assets/baby.webp" />
      </div>
      <div className={classes.modalHeader}>
        <div className={classes.modalTwoRow}>
          <span className={classes.caption}>PROMPT</span>
          <span className={classes.prompt}>{prompt}</span>
        </div>

        <Button buttonStyle={ButtonStyle.Secondary} onClick={() => {}}>
          Give me another prompt
        </Button>
      </div>

      <div className={classes.modalFooter}>
        <Button buttonStyle={ButtonStyle.Primary} onClick={onRecordClick}>
          Start recording
        </Button>
        <Button buttonStyle={ButtonStyle.Secondary} onClick={onClose}>
          Go back
        </Button>
      </div>
    </ModalContainer>
  );
}
