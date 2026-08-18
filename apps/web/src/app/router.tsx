import { lazy, Suspense, type ReactNode } from 'react';
import { Navigate, createBrowserRouter, RouterProvider } from 'react-router-dom';
import { ProtectedRoute, PublicRoute } from '../features/auth/components/ProtectedRoute';
import { LoginPage } from '../features/auth/pages/LoginPage';
import { InitialSetupPage } from '../features/auth/pages/InitialSetupPage';
import {
  ChangePasswordPage,
  ForgotPasswordPage,
  ResetPasswordPage,
} from '../features/auth/pages/AccountPages';
import { ProfilePageContainer } from '../features/profile/pages/ProfilePage';
import { DashboardHomePage } from '../features/dashboard/pages/DashboardHomePage';
import { PatientsDirectoryPage } from '../features/dashboard/pages/PatientsDirectoryPage';
import { PatientDetailPage } from '../features/dashboard/pages/PatientDetailPage';
import { ReportsPage } from '../features/dashboard/pages/ReportsPage';
import { SyncPage } from '../features/dashboard/pages/SyncPage';
import { CasesPage } from '../features/dashboard/pages/CasesPage';
import { ExportPage } from '../features/dashboard/pages/ExportPage';
import { UsersPage } from '../features/dashboard/pages/UsersPage';
import { ClinicalRulesPage } from '../features/dashboard/pages/ClinicalRulesPage';
import { AuditPage } from '../features/dashboard/pages/AuditPage';
import { SettingsPage } from '../features/settings/pages/SettingsPage';
import { CampaignSelectionPage } from '../features/campaign/pages/CampaignSelectionPage';
import { CampaignsPage } from '../features/campaign/pages/CampaignsPage';
import { MainLayout } from '../features/shell/components/MainLayout';
import { RoleRoute, getRouteRoles } from '../features/shell/components/RoleRoute';

const ScreeningConversationPage = lazy(() =>
  import('../features/screening/pages/ScreeningConversationPage').then((m) => ({
    default: m.ScreeningConversationPage,
  })),
);
const ScreeningAnamnesisPage = lazy(() =>
  import('../features/screening/pages/ScreeningAnamnesisPage').then((m) => ({
    default: m.ScreeningAnamnesisPage,
  })),
);
const ScreeningMeasurementsPage = lazy(() =>
  import('../features/screening/measurements/pages/ScreeningMeasurementsPage').then((m) => ({
    default: m.ScreeningMeasurementsPage,
  })),
);
const ScreeningResultsPage = lazy(() =>
  import('../features/screening/clinical/pages/ScreeningResultsPage').then((m) => ({
    default: m.ScreeningResultsPage,
  })),
);
const ScreeningReportPage = lazy(() =>
  import('../features/screening/report/pages/ScreeningReportPage').then((m) => ({
    default: m.ScreeningReportPage,
  })),
);
const ScreeningSignaturePage = lazy(() =>
  import('../features/screening/signature/pages/ScreeningSignaturePage').then((m) => ({
    default: m.ScreeningSignaturePage,
  })),
);
const ScreeningCompletionPage = lazy(() =>
  import('../features/screening/completion/pages/ScreeningCompletionPage').then((m) => ({
    default: m.ScreeningCompletionPage,
  })),
);
const ReportPrintPage = lazy(() =>
  import('../features/screening/report/pages/ReportPrintPage').then((m) => ({
    default: m.ReportPrintPage,
  })),
);

function RouteFallback() {
  return (
    <div className="flex min-h-[40vh] items-center justify-center">
      <p className="text-sm text-slate-600">Se încarcă...</p>
    </div>
  );
}

function lazyScreening(element: ReactNode) {
  return (
    <Suspense fallback={<RouteFallback />}>
      {element}
    </Suspense>
  );
}

function withRole(path: string, element: ReactNode) {
  return <RoleRoute allowedRoles={getRouteRoles(path)}>{element}</RoleRoute>;
}

const router = createBrowserRouter([
  {
    path: '/report-print',
    element: (
      <Suspense fallback={<RouteFallback />}>
        <ReportPrintPage />
      </Suspense>
    ),
  },
  {
    element: <PublicRoute />,
    children: [
      { path: '/login', element: <LoginPage /> },
      { path: '/setup', element: <InitialSetupPage /> },
      { path: '/forgot-password', element: <ForgotPasswordPage /> },
      { path: '/reset-password', element: <ResetPasswordPage /> },
    ],
  },
  {
    element: <ProtectedRoute />,
    children: [
      {
        element: <MainLayout />,
        children: [
          { index: true, element: <DashboardHomePage /> },
          {
            path: 'campaigns/select',
            element: <CampaignSelectionPage />,
          },
          {
            path: 'screening',
            element: withRole('/screening', lazyScreening(<ScreeningConversationPage />)),
          },
          {
            path: 'screening/anamnesis',
            element: withRole('/screening', lazyScreening(<ScreeningAnamnesisPage />)),
          },
          {
            path: 'screening/measurements',
            element: withRole('/screening', lazyScreening(<ScreeningMeasurementsPage />)),
          },
          {
            path: 'screening/results',
            element: withRole('/screening', lazyScreening(<ScreeningResultsPage />)),
          },
          {
            path: 'screening/report',
            element: withRole('/screening', lazyScreening(<ScreeningReportPage />)),
          },
          {
            path: 'screening/signature',
            element: withRole('/screening', lazyScreening(<ScreeningSignaturePage />)),
          },
          {
            path: 'screening/complete',
            element: withRole('/screening', lazyScreening(<ScreeningCompletionPage />)),
          },
          {
            path: 'patients',
            element: <PatientsDirectoryPage />,
          },
          {
            path: 'patients/:patientId',
            element: <PatientDetailPage />,
          },
          {
            path: 'sync',
            element: withRole('/sync', <SyncPage />),
          },
          {
            path: 'cases',
            element: withRole('/cases', <CasesPage />),
          },
          {
            path: 'export',
            element: withRole('/export', <ExportPage />),
          },
          {
            path: 'users',
            element: withRole('/users', <UsersPage />),
          },
          {
            path: 'campaigns',
            element: withRole('/campaigns', <CampaignsPage />),
          },
          {
            path: 'clinical-rules',
            element: withRole('/clinical-rules', <ClinicalRulesPage />),
          },
          {
            path: 'audit',
            element: withRole('/audit', <AuditPage />),
          },
          {
            path: 'settings',
            element: withRole('/settings', <SettingsPage />),
          },
          {
            path: 'profile',
            element: <ProfilePageContainer />,
          },
          {
            path: 'change-password',
            element: <ChangePasswordPage />,
          },
          {
            path: 'reports',
            element: withRole('/reports', <ReportsPage />),
          },
        ],
      },
    ],
  },
  {
    path: '*',
    element: <Navigate to="/" replace />,
  },
]);

export function AppRouter() {
  return <RouterProvider router={router} />;
}
