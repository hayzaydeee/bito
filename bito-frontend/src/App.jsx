import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { Theme } from "@radix-ui/themes";
import Layout from "./components/layout/Layout";
import LandingPage from "./pages/LandingPage";
import AuthPage from "./pages/AuthPage";
import MagicLinkVerify from "./pages/MagicLinkVerify";
import OAuthCallback from "./pages/OAuthCallback";
import Dashboard from "./pages/Dashboard";
import HabitsPage from "./pages/HabitsPage";
import AnalyticsPage from "./pages/AnalyticsPage";
import JournalPageV2 from "./components/journal-v2/JournalPageV2";
import './components/journal-v2/journal-v2.css';
import SettingsPage from "./pages/SettingsPage";
import WorkspaceOverview from "./pages/WorkspaceOverview";

import WorkspaceSettings from "./pages/WorkspaceSettings";
import MemberDashboardView from "./pages/MemberDashboardView";
import ChallengeDetailPage from "./pages/ChallengeDetailPage";
import TransformersPage from "./components/transformers/TransformersPage";
import GroupSelection from "./pages/GroupSelection";
import OnboardingPage from "./pages/OnboardingPage";
import ProfileSetupPage from "./pages/ProfileSetupPage";
import InvitationPage from "./pages/InvitationPage";
import { HabitProvider } from "./contexts/HabitContext";
import { NotificationProvider } from "./contexts/NotificationContext";
import ToastContainer from "./components/ui/ToastContainer";

// Import authentication and theme contexts
import { AuthProvider } from "./contexts/AuthContext";
import { ThemeProvider, useTheme } from "./contexts/ThemeContext";
import { ScaleProvider, useScale } from "./contexts/ScaleContext";

// ThemedApp component to use theme context
const ThemedApp = () => {
  const { effectiveTheme, radixAppearance, isLoading } = useTheme();
  const { radixScaling } = useScale();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--color-bg-primary)]">
        <div className="w-8 h-8 border-2 border-[var(--color-brand-500)] border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <Theme
      appearance={radixAppearance}
      accentColor={effectiveTheme === 'bw' ? 'gray' : 'indigo'}
      grayColor="slate"
      radius="large"
      scaling={radixScaling}
    >
      <Router>
        <div className="min-h-screen bg-gradient-to-br from-[var(--color-bg-primary)] via-[var(--color-bg-secondary)] to-[var(--color-bg-tertiary)]">
          <Routes>
            {/* Landing page without layout */}
            <Route path="/" element={<LandingPage />} />
            
            {/* Auth routes without layout */}
            <Route path="/login" element={<AuthPage />} />
            <Route path="/signup" element={<Navigate to="/login" replace />} />
            <Route path="/auth/verify" element={<MagicLinkVerify />} />
            <Route path="/auth/callback" element={<OAuthCallback />} />
            <Route path="/forgot-password" element={<Navigate to="/login" replace />} />
            <Route path="/reset-password" element={<Navigate to="/login" replace />} />
            
            {/* Invitation route without layout */}
            <Route path="/invite/:token" element={<InvitationPage />} />
            
            {/* Profile setup (no layout) */}
            <Route path="/profile-setup" element={<ProfileSetupPage />} />
            
            {/* Onboarding (no layout) */}
            <Route path="/onboarding" element={<OnboardingPage />} />
            
            {/* App routes with layout */}
            <Route path="/app" element={<Layout />}>
              <Route index element={<Dashboard />} />
              <Route path="dashboard" element={<Dashboard />} />
              <Route path="habits" element={<HabitsPage />} />
              <Route path="analytics" element={<AnalyticsPage />} />
              <Route path="journal" element={<JournalPageV2 />} />
              <Route path="transformers" element={<TransformersPage />} />
              <Route path="settings" element={<SettingsPage />} />
              <Route path="settings/habit-privacy/:habitId" element={<SettingsPage section="habit-privacy" />} />
              <Route path="settings/personality" element={<SettingsPage section="personality" />} />
              <Route path="groups" element={<GroupSelection />} />
              <Route path="groups/:groupId" element={<WorkspaceOverview />} />
              <Route path="groups/:groupId/challenges/:challengeId" element={<ChallengeDetailPage />} />
              <Route path="groups/:groupId/members/:memberId/dashboard" element={<MemberDashboardView />} />
              <Route path="groups/:groupId/settings" element={<WorkspaceSettings />} />
              <Route path="invitations" element={<InvitationPage />} />
            </Route>
          </Routes>
        </div>
      </Router>
      <ToastContainer />
    </Theme>
  );
};

function App() {
  return (
    <AuthProvider>
      <ThemeProvider>
        <ScaleProvider>
          <NotificationProvider>
            <HabitProvider>
              <ThemedApp />
            </HabitProvider>
          </NotificationProvider>
        </ScaleProvider>
      </ThemeProvider>
    </AuthProvider>
  );
}

export default App;
