/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { QueryProvider } from '@/app/providers/QueryProvider';
import { AuthProvider } from '@/features/auth/AuthContext';
import { ToastProvider } from '@/app/providers/ToastProvider';
import { AppRouter } from '@/app/router/AppRouter';

export default function App() {
  return (
    <QueryProvider>
      <AuthProvider>
        <ToastProvider>
          <AppRouter />
        </ToastProvider>
      </AuthProvider>
    </QueryProvider>
  );
}
