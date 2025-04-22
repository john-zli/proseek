import clsx from 'clsx';
import { useCallback, useContext, useState } from 'react';

import { ModalContext } from '../../contexts/modal_context_provider';
import { Button, ButtonStyle } from '../../shared-components/button';
import { ModalContainer } from '../../shared-components/modal_container';
import classes from './contact_info_modal.module.less';

interface ContactMethods {
  email: boolean;
  text: boolean;
}

interface Props {
  onSubmit: (email: string, phone: string) => void;
}

const CheckIcon = () => (
  <svg width="14" height="14" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path
      d="M11.6666 3.5L5.24992 9.91667L2.33325 7"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

const formatPhoneNumber = (value: string): string => {
  // Remove all non-numeric characters
  const numbers = value.replace(/\D/g, '');

  // Format the number as (XXX) XXX-XXXX
  if (numbers.length <= 3) {
    return numbers;
  } else if (numbers.length <= 6) {
    return `(${numbers.slice(0, 3)}) ${numbers.slice(3)}`;
  } else {
    return `(${numbers.slice(0, 3)}) ${numbers.slice(3, 6)}-${numbers.slice(6, 10)}`;
  }
};

const isValidPhoneNumber = (phone: string): boolean => {
  const numbers = phone.replace(/\D/g, '');
  return numbers.length === 10;
};

export function ContactInfoModal({ onSubmit }: Props) {
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [phoneError, setPhoneError] = useState('');
  const [contactMethods, setContactMethods] = useState<ContactMethods>({
    email: false,
    text: false,
  });
  const { closeModal } = useContext(ModalContext);

  const handleContactMethodChange = useCallback(
    (method: keyof ContactMethods) => {
      setContactMethods(prev => ({
        ...prev,
        [method]: !prev[method],
      }));

      // Clear the fields when unchecking
      if (method === 'email' && !contactMethods.email) {
        setEmail('');
      }
      if (method === 'text' && !contactMethods.text) {
        setPhone('');
        setPhoneError('');
      }
    },
    [contactMethods]
  );

  const onEmailChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    e.stopPropagation();
    e.preventDefault();
    setEmail(e.target.value);
  }, []);

  const onPhoneChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    e.stopPropagation();
    e.preventDefault();
    const formattedPhone = formatPhoneNumber(e.target.value);
    setPhone(formattedPhone);
  }, []);

  const handleSubmit = useCallback(() => {
    // Validate phone if text is selected
    if (contactMethods.text && !isValidPhoneNumber(phone)) {
      setPhoneError('Please enter a valid 10-digit phone number');
      return;
    }
    // Validate email if email is selected
    if (contactMethods.email && !email) {
      return;
    }
    onSubmit(contactMethods.email ? email : '', contactMethods.text ? phone : '');
    setPhoneError('');
    closeModal();
  }, [email, phone, contactMethods, onSubmit, closeModal]);

  return (
    <ModalContainer>
      <div className={classes.container}>
        <h2>How can we reach you?</h2>
        <p>Please select how you would like to be notified when a church responds to your prayer request.</p>

        <div className={classes.form}>
          <div className={classes.checkboxGroup}>
            <div
              className={clsx(classes.customCheckbox, { [classes.checked]: contactMethods.email })}
              onClick={() => handleContactMethodChange('email')}
            >
              <div className={classes.checkboxContent}>
                <div className={clsx(classes.checkbox, { [classes.checked]: contactMethods.email })}>
                  {contactMethods.email && <CheckIcon />}
                </div>
                <span className={classes.checkboxLabel}>Email</span>
              </div>
              {contactMethods.email && (
                // We don't want to uncheck the checkbox when the input is focused
                <div className={classes.inputGroup} onClick={e => e.stopPropagation()}>
                  <input
                    type="email"
                    id="email"
                    value={email}
                    onChange={onEmailChange}
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
              <div className={classes.checkboxContent}>
                <div className={clsx(classes.checkbox, { [classes.checked]: contactMethods.text })}>
                  {contactMethods.text && <CheckIcon />}
                </div>
                <span className={classes.checkboxLabel}>Text Message</span>
              </div>
              {contactMethods.text && (
                // We don't want to uncheck the checkbox when the input is focused
                <div className={classes.inputGroup} onClick={e => e.stopPropagation()}>
                  <input
                    type="tel"
                    id="phone"
                    value={phone}
                    onChange={onPhoneChange}
                    placeholder="(123) 456-7890"
                    className={`${classes.input} ${phoneError ? classes.error : ''}`}
                  />
                  {phoneError && <span className={classes.errorText}>{phoneError}</span>}
                </div>
              )}
            </div>
          </div>
        </div>

        <div className={classes.actions}>
          <Button buttonStyle={ButtonStyle.Secondary} onClick={closeModal}>
            Cancel
          </Button>
          <Button
            buttonStyle={ButtonStyle.Primary}
            onClick={handleSubmit}
            disabled={
              (contactMethods.email && !email) ||
              (contactMethods.text && !isValidPhoneNumber(phone)) ||
              (!contactMethods.email && !contactMethods.text)
            }
          >
            Submit
          </Button>
        </div>
      </div>
    </ModalContainer>
  );
}
