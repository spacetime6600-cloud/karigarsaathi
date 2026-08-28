import { Suspense, lazy } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { I18nextProvider } from 'react-i18next';
import i18n from '@/i18n';

const LanguageSelectionPage = lazy(() => import('@/pages/LanguageSelectionPage').then(m => ({ default: m.LanguageSelectionPage })));
const ConsentPage = lazy(() => import('@/pages/ConsentPage').then(m => ({ default: m.ConsentPage })));
const RecordingPage = lazy(() => import('@/pages/RecordingPage').then(m => ({ default: m.RecordingPage })));
const TranscriptReviewPage = lazy(() => import('@/pages/TranscriptReviewPage').then(m => ({ default: m.TranscriptReviewPage })));
const ClarificationPage = lazy(() => import('@/pages/ClarificationPage').then(m => ({ default: m.ClarificationPage })));
const CatalogueReviewPage = lazy(() => import('@/pages/CatalogueReviewPage').then(m => ({ default: m.CatalogueReviewPage })));
const ApprovalPage = lazy(() => import('@/pages/ApprovalPage').then(m => ({ default: m.ApprovalPage })));
const DeletionPage = lazy(() => import('@/pages/DeletionPage').then(m => ({ default: m.DeletionPage })));
const SessionResumePage = lazy(() => import('@/pages/SessionResumePage').then(m => ({ default: m.SessionResumePage })));

function LoadingFallback() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary-600 border-t-transparent mx-auto mb-4" />
        <p className="text-gray-600">Loading...</p>
      </div>
    </div>
  );
}

function App() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 1000 * 60 * 5,
        retry: 1,
        refetchOnWindowFocus: false,
      },
    },
  });

  return (
    <QueryClientProvider client={queryClient}>
      <I18nextProvider i18n={i18n}>
        <BrowserRouter>
          <div className="min-h-screen bg-gray-50">
            <Suspense fallback={<LoadingFallback />}>
              <Routes>
                <Route path="/language" element={<LanguageSelectionPage />} />
                <Route path="/consent" element={<ConsentPage />} />
                <Route path="/recording" element={<RecordingPage />} />
                <Route path="/transcript-review" element={<TranscriptReviewPage />} />
                <Route path="/clarification" element={<ClarificationPage />} />
                <Route path="/catalogue-review" element={<CatalogueReviewPage />} />
                <Route path="/approval" element={<ApprovalPage />} />
                <Route path="/deletion" element={<DeletionPage />} />
                <Route path="/resume" element={<SessionResumePage />} />
                <Route path="/" element={<Navigate to="/language" replace />} />
                <Route path="*" element={<Navigate to="/language" replace />} />
              </Routes>
            </Suspense>
          </div>
        </BrowserRouter>
      </I18nextProvider>
    </QueryClientProvider>
  );
}

export default App;