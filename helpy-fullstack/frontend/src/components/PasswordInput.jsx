import { useState } from 'react';
import { Input, InputGroup, InputRightElement, IconButton } from '@chakra-ui/react';

const ViewIcon = () => (
  <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
    <path d="M10 12.5a2.5 2.5 0 100-5 2.5 2.5 0 000 5z" />
    <path
      fillRule="evenodd"
      d="M.664 10.59a1.651 1.651 0 010-1.186A10.004 10.004 0 0110 3c4.257 0 7.893 2.66 9.336 6.41.147.381.146.804 0 1.186A10.004 10.004 0 0110 17c-4.257 0-7.893-2.66-9.336-6.41zM14 10a4 4 0 11-8 0 4 4 0 018 0z"
      clipRule="evenodd"
    />
  </svg>
);

const ViewOffIcon = () => (
  <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
    <path
      fillRule="evenodd"
      d="M3.28 2.22a.75.75 0 00-1.06 1.06l14.5 14.5a.75.75 0 101.06-1.06l-1.745-1.745A10.029 10.029 0 0019.542 10C18.268 5.943 14.478 3 10 3a9.958 9.958 0 00-4.512 1.074l-1.78-1.781zm4.97 4.97a2.5 2.5 0 113.536 3.536l-3.536-3.536z"
      clipRule="evenodd"
    />
    <path d="M10 6.5a2.5 2.5 0 00-2.5 2.5c0 .667.26 1.273.687 1.727L10 6.5zm-4.78 2.72a4 4 0 005.56 5.56l-1.94-1.94A2.5 2.5 0 016.5 10c0-.54.146-1.04.404-1.47l-1.724-1.724zM15.12 12.88a4 4 0 01-1.44 1.44L10 11.5l-3.68-3.68A4 4 0 0110 6.5c1.38 0 2.5 1.12 2.5 2.5 0 .54-.146 1.04-.404 1.47l1.024 1.024z" />
  </svg>
);

/**
 * Password input with show/hide eye icon. Accepts same props as Chakra Input.
 */
export default function PasswordInput({ value, onChange, ...props }) {
  const [show, setShow] = useState(false);
  return (
    <InputGroup>
      <Input
        type={show ? 'text' : 'password'}
        value={value}
        onChange={onChange}
        pr="10"
        {...props}
      />
      <InputRightElement width="3rem">
        <IconButton
          size="sm"
          h="1.75rem"
          variant="ghost"
          aria-label={show ? 'Hide password' : 'Show password'}
          icon={show ? <ViewOffIcon /> : <ViewIcon />}
          onClick={() => setShow((s) => !s)}
        />
      </InputRightElement>
    </InputGroup>
  );
}
