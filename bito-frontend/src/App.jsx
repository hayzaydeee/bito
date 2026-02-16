import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { Theme } from "@radix-ui/themes";
import Layout from "./components/layout/Layout";
import LandingPage from "./pages/LandingPage";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import OAuthCallback from "./pages/OAuthCallback";
import Dashboard from "./pages/Dashboard";
// import HabitsPage from "./pages/HabitsPage";
import AnalyticsPage from "./pages/AnalyticsPage";
import JournalPage from "./pages/JournalPage";
import SettingsPage from "./pages/SettingsPage";
import WorkspaceOverview from "./pages/WorkspaceOverview";

import WorkspaceSettings from "./pages/WorkspaceSettings";
import MemberDashboardView from "./pages/MemberDashboardView";
import GroupSelection from "./pages/GroupSelection";
import OnboardingPage from "./pages/OnboardingPage";
import InvitationPage from "./pages/InvitationPage";
import { HabitProvider } from "./contexts/HabitContext";
import { NotificationProvider } from "./contexts/NotificationContext";
import ToastContainer from "./components/ui/ToastContainer";

// Import authentication and theme contexts
import { AuthProvider } from "./contexts/AuthContext";
import { ThemeProvider, useTheme } from "./contexts/ThemeContext";

// ThemedApp component to use theme context
const ThemedApp = () => {
  const { effectiveTheme, isLoading } = useTheme();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--color-bg-primary)]">
        <div className="w-8 h-8 border-2 border-[var(--color-brand-500)] border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <Theme
      appearance={effectiveTheme}
      accentColor="indigo"
      grayColor="slate"
      radius="large"
      scaling="100%"
    >
      <Router>
        <div className="min-h-screen bg-gradient-to-br from-[var(--color-bg-primary)] via-[var(--color-bg-secondary)] to-[var(--color-bg-tertiary)]">
          <Routes>
            {/* Landing page without layout */}
            <Route path="/" element={<LandingPage />} />
            
            {/* Auth routes without layout */}
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<Signup />} />
            <Route path="/auth/callback" element={<OAuthCallback />} />
            
            {/* Invitation route without layout */}
            <Route path="/invite/:token" element={<InvitationPage />} />
            
            {/* Onboarding (no layout) */}
            <Route path="/onboarding" element={<OnboardingPage />} />
            
            {/* App routes with layout */}
            <Route path="/app" element={<Layout />}>
              <Route index element={<Dashboard />} />
              <Route path="dashboard" element={<Dashboard />} />
              {/* <Route path="habits" element={<HabitsPage />} /> */}
              <Route path="analytics" element={<AnalyticsPage />} />
              <Route path="journal" element={<JournalPage />} />
              <Route path="settings" element={<SettingsPage />} />
              <Route path="settings/habit-privacy/:habitId" element={<SettingsPage section="habit-privacy" />} />
              <Route path="settings/personality" element={<SettingsPage section="personality" />} />
              <Route path="groups" element={<GroupSelection />} />
              <Route path="groups/:groupId" element={<WorkspaceOverview />} />
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
        <NotificationProvider>
          <HabitProvider>
            <ThemedApp />
          </HabitProvider>
        </NotificationProvider>
      </ThemeProvider>
    </AuthProvider>
  );
}

export default App;
