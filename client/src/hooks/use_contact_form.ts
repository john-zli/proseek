import { useCallback, useState } from 'react';

interface ContactMethods {
  email: boolean;
  text: boolean;
}

interface UseContactFormResult {
  email: string | undefined;
  phone: string | undefined;
  phoneError: string;
  contactMethods: ContactMethods;
  handleContactMethodChange: (method: keyof ContactMethods) => void;
  onEmailChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onPhoneChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  stopPropagation: (e: React.MouseEvent<HTMLDivElement>) => void;
  handleSubmit: () => { email: string | undefined; phone: string | undefined } | null;
  isValidPhoneNumber: (phone: string | undefined) => boolean;
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

export function useContactForm(): UseContactFormResult {
  const [email, setEmail] = useState<string | undefined>();
  const [phone, setPhone] = useState<string | undefined>();
  const [phoneError, setPhoneError] = useState('');
  const [contactMethods, setContactMethods] = useState<ContactMethods>({
    email: false,
    text: false,
  });

  const handleContactMethodChange = useCallback(
    (method: keyof ContactMethods) => {
      setContactMethods(prev => ({
        ...prev,
        [method]: !prev[method],
      }));

      // Clear the fields when unchecking
      if (method === 'email' && !contactMethods.email) {
        setEmail(undefined);
      }
      if (method === 'text' && !contactMethods.text) {
        setPhone(undefined);
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

  const isValidPhoneNumber = useCallback((phone: string | undefined): boolean => {
    if (!phone) {
      return false;
    }
    const numbers = phone.replace(/\D/g, '');
    return numbers.length === 10;
  }, []);

  const handleSubmit = useCallback(() => {
    // Validate phone if text is selected
    if (contactMethods.text && !isValidPhoneNumber(phone)) {
      setPhoneError('Please enter a valid 10-digit phone number');
      return null;
    }
    // Validate email if email is selected
    if (contactMethods.email && !email) {
      return null;
    }
    setPhoneError('');
    return {
      email: contactMethods.email ? email : undefined,
      phone: contactMethods.text ? phone : undefined,
    };
  }, [email, phone, contactMethods, isValidPhoneNumber]);

  return {
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
  };
}
