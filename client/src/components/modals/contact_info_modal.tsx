import clsx from 'clsx';
import { useCallback, useContext, useState } from 'react';

import { ModalContext } from '../../contexts/modal_context_provider';
import { Button, ButtonStyle } from '../../shared-components/button';
import { CheckboxView } from '../../shared-components/checkbox_view';
import { ModalContainer } from '../../shared-components/modal_container';
import classes from './contact_info_modal.module.less';

interface ContactMethods {
  email: boolean;
  text: boolean;
}

interface Props {
  onSubmit: (email: string, phone: string) => void;
}

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
    setEmail(e.target.value);
  }, []);

  const onPhoneChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const formattedPhone = formatPhoneNumber(e.target.value);
    setPhone(formattedPhone);
  }, []);

  const stopPropagation = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    e.stopPropagation();
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
        <p>(Optional): Select how you would like to be notified when a church responds to your prayer request.</p>

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
          <Button buttonStyle={ButtonStyle.Secondary} onClick={closeModal}>
            Cancel
          </Button>
          <Button
            buttonStyle={ButtonStyle.Primary}
            onClick={handleSubmit}
            disabled={(contactMethods.email && !email) || (contactMethods.text && !isValidPhoneNumber(phone))}
          >
            Submit
          </Button>
        </div>
      </div>
    </ModalContainer>
  );
}
