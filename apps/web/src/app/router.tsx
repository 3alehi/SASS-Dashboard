import { createBrowserRouter } from 'react-router-dom';

import { GuestRoute } from '@/components/auth/guest-route';
import { ProtectedRoute } from '@/components/auth/protected-route';
import { AppLayout } from '@/components/layout/app-layout';
import { AuditLogsPage } from '@/pages/audit-logs-page';
import { ForgotPasswordPage } from '@/pages/auth/forgot-password-page';
import { LoginPage } from '@/pages/auth/login-page';
import { RegisterPage } from '@/pages/auth/register-page';
import { CustomerDetailPage } from '@/pages/customer-detail-page';
import { CustomersPage } from '@/pages/customers-page';
import { DashboardPage } from '@/pages/dashboard-page';
import { DealDetailPage } from '@/pages/deal-detail-page';
import { DealsPage } from '@/pages/deals-page';
import { ForbiddenPage } from '@/pages/forbidden-page';
import { LandingPage } from '@/pages/landing-page';
import { LeadDetailPage } from '@/pages/lead-detail-page';
import { LeadsPage } from '@/pages/leads-page';
import { NotFoundPage } from '@/pages/not-found-page';
import { PipelinePage } from '@/pages/pipeline-page';
import { ReportsPage } from '@/pages/reports-page';
import { AppearanceSettingsPage } from '@/pages/settings/appearance-settings-page';
import { NotificationsSettingsPage } from '@/pages/settings/notifications-settings-page';
import { OrganizationSettingsPage } from '@/pages/settings/organization-settings-page';
import { ProfileSettingsPage } from '@/pages/settings/profile-settings-page';
import { RolesSettingsPage } from '@/pages/settings/roles-settings-page';
import { SecuritySettingsPage } from '@/pages/settings/security-settings-page';
import { SettingsLayout } from '@/pages/settings/settings-layout';
import { TeamSettingsPage } from '@/pages/settings/team-settings-page';
import { TasksPage } from '@/pages/tasks-page';
import { TeamPage } from '@/pages/team-page';
import { TicketDetailPage } from '@/pages/ticket-detail-page';
import { TicketsPage } from '@/pages/tickets-page';

export const router = createBrowserRouter([
  {
    path: '/',
    element: <LandingPage />,
  },
  {
    path: '/login',
    element: (
      <GuestRoute>
        <LoginPage />
      </GuestRoute>
    ),
  },
  {
    path: '/register',
    element: (
      <GuestRoute>
        <RegisterPage />
      </GuestRoute>
    ),
  },
  {
    path: '/forgot-password',
    element: (
      <GuestRoute>
        <ForgotPasswordPage />
      </GuestRoute>
    ),
  },
  {
    path: '/app',
    element: (
      <ProtectedRoute>
        <AppLayout />
      </ProtectedRoute>
    ),
    children: [
      { index: true, element: <DashboardPage /> },
      { path: 'dashboard', element: <DashboardPage /> },
      { path: 'customers', element: <CustomersPage /> },
      { path: 'customers/:id', element: <CustomerDetailPage /> },
      { path: 'leads', element: <LeadsPage /> },
      { path: 'leads/:id', element: <LeadDetailPage /> },
      { path: 'deals', element: <DealsPage /> },
      { path: 'deals/:id', element: <DealDetailPage /> },
      { path: 'pipeline', element: <PipelinePage /> },
      { path: 'tasks', element: <TasksPage /> },
      { path: 'tickets', element: <TicketsPage /> },
      { path: 'tickets/:id', element: <TicketDetailPage /> },
      { path: 'reports', element: <ReportsPage /> },
      { path: 'team', element: <TeamPage /> },
      { path: 'audit-logs', element: <AuditLogsPage /> },
      {
        path: 'settings',
        element: <SettingsLayout />,
        children: [
          { index: true, element: <ProfileSettingsPage /> },
          { path: 'profile', element: <ProfileSettingsPage /> },
          { path: 'organization', element: <OrganizationSettingsPage /> },
          { path: 'team', element: <TeamSettingsPage /> },
          { path: 'roles', element: <RolesSettingsPage /> },
          { path: 'notifications', element: <NotificationsSettingsPage /> },
          { path: 'appearance', element: <AppearanceSettingsPage /> },
          { path: 'security', element: <SecuritySettingsPage /> },
        ],
      },
    ],
  },
  {
    path: '/403',
    element: <ForbiddenPage />,
  },
  {
    path: '*',
    element: <NotFoundPage />,
  },
]);
