'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { AuthForm } from '@/components/auth';
import { Modal } from '@/components/ui/Modal';

export default function LoginPage() {
  const [isOpen, setIsOpen] = useState(true);
  const router = useRouter();

  const handleClose = () => {
    setIsOpen(false);
    router.push('/');
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose}>
      <AuthForm mode="login" />
    </Modal>
  );
}
