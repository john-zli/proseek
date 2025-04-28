import clsx from 'clsx';
import { useCallback, useMemo } from 'react';

import { useContactForm } from '../../hooks/use_contact_form';
import { Button, ButtonStyle } from '../../shared-components/button';
import { CheckboxView } from '../../shared-components/checkbox_view';
import { ModalContainer } from '../../shared-components/modal_container';
import classes from './contact_info_modal.module.less';

interface Props {
  onSubmit: (email: string | undefined, phone: string | undefined) => void;
}

export function ChatroomVerificationModal({ onSubmit }: Props) {
  const {
    email,
    phone,
    phoneError,
    contactMethods,
    handleContactMethodChange,
    onEmailChange,
    onPhoneChange,
    stopPropagation,
    handleSubmit,
    isValidPhoneNumber,
  } = useContactForm();

  const onVerify = useCallback(() => {
    const result = handleSubmit();
    if (result) {
      onSubmit(result.email, result.phone);
    }
  }, [handleSubmit, onSubmit]);

  const disabled = useMemo(
    () => (contactMethods.email && !email) || (contactMethods.text && !isValidPhoneNumber(phone)),
    [contactMethods, email, isValidPhoneNumber, phone]
  );

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter' && !e.shiftKey && !disabled) {
        e.preventDefault();
        onVerify();
      }
    },
    [onVerify]
  );

  return (
    <ModalContainer isUncloseable>
      <div className={classes.container}>
        <h2>Verify Your Identity</h2>
        <p>
          Please enter the email or phone number you used when creating this prayer request to verify your identity.
        </p>

        <div className={classes.form}>
          <div className={classes.checkboxGroup}>
            <div
              className={clsx(classes.customCheckbox, { [classes.checked]: contactMethods.email })}
              onClick={() => handleContactMethodChange('email')}
            >
              <CheckboxView checked={contactMethods.email} label="Email" />
              {contactMethods.email && (
                // We don't want to uncheck the checkbox when the input is focused
                <div className={classes.inputGroup} onClick={stopPropagation}>
                  <input
                    type="email"
                    id="email"
                    value={email}
                    onChange={onEmailChange}
                    onKeyDown={handleKeyDown}
                    placeholder="your@email.com"
                    className={classes.input}
                  />
                </div>
              )}
            </div>

            <div
              className={clsx(classes.customCheckbox, { [classes.checked]: contactMethods.text })}
              onClick={() => handleContactMethodChange('text')}
            >
              <CheckboxView checked={contactMethods.text} label="Text Message" />
              {contactMethods.text && (
                // We don't want to uncheck the checkbox when the input is focused
                <div className={classes.inputGroup} onClick={stopPropagation}>
                  <input
                    type="tel"
                    id="phone"
                    value={phone}
                    onChange={onPhoneChange}
                    onKeyDown={handleKeyDown}
                    placeholder="(123) 456-7890"
                    className={clsx(classes.input, { [classes.error]: phoneError })}
                  />
                  {phoneError && <span className={classes.errorText}>{phoneError}</span>}
                </div>
              )}
            </div>
          </div>
        </div>

        <div className={classes.actions}>
          <Button buttonStyle={ButtonStyle.Primary} onClick={onVerify} disabled={disabled}>
            Verify
          </Button>
        </div>
      </div>
    </ModalContainer>
  );
}
