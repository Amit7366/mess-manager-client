'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import type { UserRole } from '@/types';

export function useAuthGuard(allowedRoles?: UserRole[]) {
  const router = useRouter();
  const { user, hydrated, hydrate, fetchMe, token } = useAuthStore();

  useEffect(() => {
    hydrate();
  }, [hydrate]);

  useEffect(() => {
    if (!hydrated) return;
    if (!token) {
      router.replace('/login');
      return;
    }
    fetchMe();
  }, [hydrated, token, fetchMe, router]);

  useEffect(() => {
    if (!hydrated || !user || !allowedRoles) return;
    if (!allowedRoles.includes(user.role)) {
      router.replace('/dashboard');
    }
  }, [hydrated, user, allowedRoles, router]);

  return {
    user,
    loading: !hydrated || (!!token && !user),
    isAuthenticated: !!user,
  };
}
