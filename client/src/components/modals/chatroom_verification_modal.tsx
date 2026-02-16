import classes from '@client/components/modals/contact_info_modal.module.less';
import { useContactForm } from '@client/hooks/use_contact_form';
import { Button, ButtonStyle } from '@client/shared-components/button';
import { CheckboxView } from '@client/shared-components/checkbox_view';
import { ModalContainer } from '@client/shared-components/modal_container';
import { TextInput } from '@client/shared-components/text_input';
import clsx from 'clsx';
import { useCallback, useMemo } from 'react';

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
    [onVerify, disabled]
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
                  <TextInput
                    type="email"
                    id="email"
                    value={email || ''}
                    onChange={onEmailChange}
                    onKeyDown={handleKeyDown}
                    placeholder="your@email.com"
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
                  <TextInput
                    type="tel"
                    id="phone"
                    value={phone || ''}
                    onChange={onPhoneChange}
                    onKeyDown={handleKeyDown}
                    placeholder="(123) 456-7890"
                    error={!!phoneError}
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
