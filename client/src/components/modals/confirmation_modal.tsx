import { ModalContainer } from '../../shared-components/modal_container';
import classes from './confirmation_modal.module.less';

export function ConfirmationModal() {
  return (
    <ModalContainer>
      <div className={classes.confirmationContainer}>
        <div className={classes.checkMark}>
          <svg xmlns="http://www.w3.org/2000/svg" width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="feather feather-check-circle"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>
        </div>
        <span className={classes.hugetext}>
          Prayer request submitted
        </span>
        <span className={classes.hugetextcaption}>
          You'll get updates about your prayer request soon!
        </span>
      </div>
    </ModalContainer>
  );
}
