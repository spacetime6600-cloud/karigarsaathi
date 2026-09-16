import React, { Suspense, lazy } from 'react';
import { createBrowserRouter, Outlet, Navigate } from 'react-router-dom';

// Layouts & Routing Guards
import { RouteScrollManager } from '@/components/layout/RouteScrollManager';
import { AuthGuard } from '@/components/auth/AuthGuard';
import { OnboardingShell } from '@/layouts/OnboardingShell';
import { ArtisanAppShell } from '@/layouts/ArtisanAppShell';
import { ProductCreationShell } from '@/layouts/ProductCreationShell';
import { PublicPassportShell } from '@/layouts/PublicPassportShell';
import { CoordinatorShell } from '@/layouts/CoordinatorShell';

// Eagerly loaded public entry pages for instant first paint
import { LandingPage } from '@/features/landing/LandingPage';
import { SignInPage, SignInSelectionPage } from '@/features/authentication';
import { CoordinatorLoginPage } from '@/features/coordinator';

// Lazy-loaded routes for performance & fast code chunking
const AboutPage = lazy(() => import('@/features/about/AboutPage').then((m) => ({ default: m.AboutPage })));
const MarketplacePage = lazy(() => import('@/features/marketplace/MarketplacePage').then((m) => ({ default: m.MarketplacePage })));
const ProductDetailPage = lazy(() => import('@/features/marketplace/ProductDetailPage').then((m) => ({ default: m.ProductDetailPage })));
const ReviewsPage = lazy(() => import('@/features/reviews/ReviewsPage').then((m) => ({ default: m.ReviewsPage })));
const LanguageSelectionPage = lazy(() => import('@/features/language/LanguageSelectionPage').then((m) => ({ default: m.LanguageSelectionPage })));

const ArtisanDashboardPage = lazy(() => import('@/features/dashboard/ArtisanDashboardPage').then((m) => ({ default: m.ArtisanDashboardPage })));
const InventoryManagementPage = lazy(() => import('@/features/inventory/InventoryManagementPage').then((m) => ({ default: m.InventoryManagementPage })));
const BuyerEnquiryPage = lazy(() => import('@/features/enquiries/BuyerEnquiryPage').then((m) => ({ default: m.BuyerEnquiryPage })));
const EnquiryReplyPage = lazy(() => import('@/features/enquiries/pages/EnquiryReplyPage').then((m) => ({ default: m.EnquiryReplyPage })));

// Product Creation Wizard steps
const AddPhotographsPage = lazy(() => import('@/features/photographs/AddPhotographsPage').then((m) => ({ default: m.AddPhotographsPage })));
const AddProductDetailsPage = lazy(() => import('@/features/voice-details/AddProductDetailsPage').then((m) => ({ default: m.AddProductDetailsPage })));
const ReviewFactsPage = lazy(() => import('@/features/facts-review/ReviewFactsPage').then((m) => ({ default: m.ReviewFactsPage })));
const ChoosePricePage = lazy(() => import('@/features/pricing/ChoosePricePage').then((m) => ({ default: m.ChoosePricePage })));
const ChoosePublicFieldsPage = lazy(() => import('@/features/craft-passport/ChoosePublicFieldsPage').then((m) => ({ default: m.ChoosePublicFieldsPage })));
const ApprovePublicInfoPage = lazy(() => import('@/features/craft-passport/ApprovePublicInfoPage').then((m) => ({ default: m.ApprovePublicInfoPage })));
const QRCraftPassportCreatedPage = lazy(() => import('@/features/craft-passport/QRCraftPassportCreatedPage').then((m) => ({ default: m.QRCraftPassportCreatedPage })));
const ShareOrExportPage = lazy(() => import('@/features/sharing-export/ShareOrExportPage').then((m) => ({ default: m.ShareOrExportPage })));
const PublicCraftPassportPage = lazy(() => import('@/features/craft-passport/PublicCraftPassportPage').then((m) => ({ default: m.PublicCraftPassportPage })));

// Coordinator Workspace
const CoordinatorOverviewPage = lazy(() => import('@/features/coordinator').then((m) => ({ default: m.CoordinatorOverviewPage })));
const CoordinatorArtisansPage = lazy(() => import('@/features/coordinator').then((m) => ({ default: m.CoordinatorArtisansPage })));
const CoordinatorArtisanDetailPage = lazy(() => import('@/features/coordinator').then((m) => ({ default: m.CoordinatorArtisanDetailPage })));
const CoordinatorReviewsPage = lazy(() => import('@/features/coordinator').then((m) => ({ default: m.CoordinatorReviewsPage })));
const CoordinatorEnquiriesPage = lazy(() => import('@/features/coordinator').then((m) => ({ default: m.CoordinatorEnquiriesPage })));
const CoordinatorEnquiryDetailPage = lazy(() => import('@/features/coordinator').then((m) => ({ default: m.CoordinatorEnquiryDetailPage })));
const CoordinatorSalesPage = lazy(() => import('@/features/coordinator').then((m) => ({ default: m.CoordinatorSalesPage })));
const CoordinatorSettingsPage = lazy(() => import('@/features/coordinator').then((m) => ({ default: m.CoordinatorSettingsPage })));

const DevStatesPage = lazy(() => import('@/features/dev/DevStatesPage').then((m) => ({ default: m.DevStatesPage })));
const NotFoundPage = lazy(() => import('@/features/not-found/NotFoundPage').then((m) => ({ default: m.NotFoundPage })));

// Root Layout Shell with Scroll Restoration, Focus Management & Route Title sync
const RootAppLayout: React.FC = () => {
  return (
    <>
      <RouteScrollManager />
      <Suspense
        fallback={
          <div className="w-full min-h-[30vh] flex items-center justify-center p-8 opacity-0 animate-in fade-in duration-150">
            <div className="w-6 h-6 border-2 border-secondary/30 border-t-secondary rounded-full animate-spin" />
          </div>
        }
      >
        <Outlet />
      </Suspense>
    </>
  );
};

export const router = createBrowserRouter([
  {
    element: <RootAppLayout />,
    children: [
      // Public Marketing Landing & Informational Pages
      {
        path: '/',
        element: <LandingPage />,
      },
      {
        path: '/about',
        element: <AboutPage />,
      },
      {
        path: '/marketplace',
        element: <MarketplacePage />,
      },
      {
        path: '/marketplace/products/:productId',
        element: <ProductDetailPage />,
      },
      {
        path: '/reviews',
        element: <ReviewsPage />,
      },

      // Public Onboarding (Language, Artisan Login, Dedicated Coordinator Login)
      {
        element: <OnboardingShell />,
        children: [
          { path: '/language', element: <LanguageSelectionPage /> },
          { path: '/login', element: <SignInPage /> },
          { path: '/sign-in', element: <SignInSelectionPage /> },
          { path: '/coordinator/login', element: <CoordinatorLoginPage /> },
        ],
      },

      // Primary Authenticated Artisan Workspace (Guarded by AuthGuard)
      {
        element: (
          <AuthGuard requiredRole="artisan">
            <ArtisanAppShell />
          </AuthGuard>
        ),
        children: [
          { path: '/artisan/dashboard', element: <ArtisanDashboardPage /> },
          { path: '/artisan/inventory', element: <InventoryManagementPage /> },
          { path: '/inventory', element: <Navigate to="/artisan/inventory" replace /> },
          { path: '/artisan/enquiries', element: <BuyerEnquiryPage /> },
          { path: '/enquiries', element: <Navigate to="/artisan/enquiries" replace /> },
          { path: '/artisan/enquiries/:enquiryId', element: <BuyerEnquiryPage /> },
          { path: '/enquiries/:enquiryId', element: <BuyerEnquiryPage /> },
          { path: '/artisan/enquiries/:enquiryId/reply', element: <EnquiryReplyPage /> },
          { path: '/enquiries/:enquiryId/reply', element: <EnquiryReplyPage /> },
        ],
      },

      // Product Creation 8-Step Transactional Sequence (Guarded by AuthGuard)
      {
        element: (
          <AuthGuard requiredRole="artisan">
            <ProductCreationShell />
          </AuthGuard>
        ),
        children: [
          { path: '/artisan/products/new/photos', element: <AddPhotographsPage /> },
          { path: '/artisan/products/new/details', element: <AddProductDetailsPage /> },
          { path: '/artisan/products/new/review', element: <ReviewFactsPage /> },
          { path: '/artisan/products/new/price', element: <ChoosePricePage /> },
          { path: '/artisan/products/new/public-fields', element: <ChoosePublicFieldsPage /> },
          { path: '/artisan/products/new/approve', element: <ApprovePublicInfoPage /> },
          { path: '/artisan/products/new/passport', element: <QRCraftPassportCreatedPage /> },
          { path: '/artisan/products/new/share', element: <ShareOrExportPage /> },
          // Direct alias routes
          { path: '/products/new/photos', element: <AddPhotographsPage /> },
          { path: '/products/new/details', element: <AddProductDetailsPage /> },
          { path: '/products/new/review', element: <ReviewFactsPage /> },
          { path: '/products/new/price', element: <ChoosePricePage /> },
          { path: '/products/new/public-fields', element: <ChoosePublicFieldsPage /> },
          { path: '/products/new/approve', element: <ApprovePublicInfoPage /> },
          { path: '/products/new/passport', element: <QRCraftPassportCreatedPage /> },
          { path: '/products/new/share', element: <ShareOrExportPage /> },
        ],
      },

      // Public Buyer-Facing Passport (Accessible to anyone without sign-in)
      {
        element: <PublicPassportShell />,
        children: [
          { path: '/passport/:publicSlug', element: <PublicCraftPassportPage /> },
          { path: '/p/:publicSlug', element: <PublicCraftPassportPage /> },
          { path: '/passport/:passportId', element: <PublicCraftPassportPage /> },
        ],
      },

      // Field Coordinator Workspace (Guarded by AuthGuard with coordinator role)
      {
        element: (
          <AuthGuard requiredRole="coordinator">
            <CoordinatorShell />
          </AuthGuard>
        ),
        children: [
          { path: '/coordinator', element: <CoordinatorOverviewPage /> },
          { path: '/coordinator/artisans', element: <CoordinatorArtisansPage /> },
          { path: '/coordinator/artisans/:artisanId', element: <CoordinatorArtisanDetailPage /> },
          { path: '/coordinator/reviews', element: <CoordinatorReviewsPage /> },
          { path: '/coordinator/enquiries', element: <CoordinatorEnquiriesPage /> },
          { path: '/coordinator/enquiries/:enquiryId', element: <CoordinatorEnquiryDetailPage /> },
          { path: '/coordinator/sales', element: <CoordinatorSalesPage /> },
          { path: '/coordinator/settings', element: <CoordinatorSettingsPage /> },
          { path: '/coordinator/incomplete', element: <Navigate to="/coordinator/reviews?tab=needs_review" replace /> },
          { path: '/coordinator/exports', element: <Navigate to="/coordinator/sales" replace /> },
        ],
      },

      // Reviewer Sandbox / Recovery Trigger Harness (Direct URL only)
      {
        path: '/dev/states',
        element: <DevStatesPage />,
      },

      // Catch-All 404 Page
      {
        path: '*',
        element: <NotFoundPage />,
      },
    ],
  },
], {
  future: {
    v7_relativeSplatPath: true,
    v7_fetcherPersist: true,
    v7_normalizeFormMethod: true,
    v7_partialHydration: true,
    v7_skipActionErrorRevalidation: true,
  },
});
