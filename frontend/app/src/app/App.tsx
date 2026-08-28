import React from 'react';
import { RouterProvider } from 'react-router-dom';
import { router } from './router';
import { LanguageProvider } from './providers/LanguageProvider';
import { AuthProvider } from './providers/AuthProvider';
import { SyncProvider } from './providers/SyncProvider';
import { AudioHelpProvider } from './providers/AudioHelpProvider';
import { ProductDraftProvider } from './providers/ProductDraftProvider';

export const App: React.FC = () => {
  return (
    <LanguageProvider>
      <AuthProvider>
        <SyncProvider>
          <AudioHelpProvider>
            <ProductDraftProvider>
              <RouterProvider router={router} future={{ v7_startTransition: true }} />
            </ProductDraftProvider>
          </AudioHelpProvider>
        </SyncProvider>
      </AuthProvider>
    </LanguageProvider>
  );
};
