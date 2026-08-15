import type { ReactNode } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import { getToken } from './api';
import Home from './pages/Home';
import Login from './pages/Login';
import Layout from './pages/Layout';
import Dashboard from './pages/Dashboard';
import Users from './pages/Users';
import Documents from './pages/Documents';
import Subscriptions from './pages/Subscriptions';
import Payments from './pages/Payments';
import Reviews from './pages/Reviews';
import AuditLog from './pages/AuditLog';
import OtpLog from './pages/OtpLog';
import ExceptionLog from './pages/ExceptionLog';

import { getStoredUser, getToken as getConsumerToken } from './consumer/api';
import ConsumerLogin from './consumer/pages/Login';
import ConsumerCompleteProfile from './consumer/pages/CompleteProfile';
import ConsumerLayout from './consumer/pages/Layout';
import ConsumerHome from './consumer/pages/Home';
import ConsumerUpload from './consumer/pages/Upload';
import ConsumerReport from './consumer/pages/Report';
import ConsumerChat from './consumer/pages/Chat';
import ConsumerHistory from './consumer/pages/History';
import ConsumerProfile from './consumer/pages/Profile';
import ConsumerSubscription from './consumer/pages/Subscription';
import ConsumerHelp from './consumer/pages/Help';
import ConsumerCompare from './consumer/pages/Compare';
import ConsumerTemplates from './consumer/pages/Templates';
import { useApplyStoredTheme } from './consumer/theme';

function RequireAuth({ children }: { children: ReactNode }) {
  if (!getToken()) return <Navigate to="/login" replace />;
  return <>{children}</>;
}

function RequireConsumerAuth({ children }: { children: ReactNode }) {
  if (!getConsumerToken()) return <Navigate to="/app/login" replace />;
  const user = getStoredUser();
  if (user && !user.profileComplete) return <Navigate to="/app/complete-profile" replace />;
  return <>{children}</>;
}

export default function App() {
  useApplyStoredTheme();

  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/login" element={<Login />} />
      <Route
        element={
          <RequireAuth>
            <Layout />
          </RequireAuth>
        }
      >
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/users" element={<Users />} />
        <Route path="/documents" element={<Documents />} />
        <Route path="/subscriptions" element={<Subscriptions />} />
        <Route path="/payments" element={<Payments />} />
        <Route path="/reviews" element={<Reviews />} />
        <Route path="/audit-log" element={<AuditLog />} />
        <Route path="/otp-log" element={<OtpLog />} />
        <Route path="/exceptions" element={<ExceptionLog />} />
      </Route>

      <Route path="/app/login" element={<ConsumerLogin />} />
      <Route path="/app/complete-profile" element={<ConsumerCompleteProfile />} />
      <Route
        element={
          <RequireConsumerAuth>
            <ConsumerLayout />
          </RequireConsumerAuth>
        }
      >
        <Route path="/app" element={<ConsumerHome />} />
        <Route path="/app/upload" element={<ConsumerUpload />} />
        <Route path="/app/report/:id" element={<ConsumerReport />} />
        <Route path="/app/chat/:id" element={<ConsumerChat />} />
        <Route path="/app/documents" element={<ConsumerHistory />} />
        <Route path="/app/profile" element={<ConsumerProfile />} />
        <Route path="/app/subscription" element={<ConsumerSubscription />} />
        <Route path="/app/help" element={<ConsumerHelp />} />
        <Route path="/app/compare" element={<ConsumerCompare />} />
        <Route path="/app/templates" element={<ConsumerTemplates />} />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
