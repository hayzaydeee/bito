
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
import SettingsPage from "./pages/SettingsPage";
import WorkspaceOverview from "./pages/WorkspaceOverview";
import WorkspaceDashboard from "./pages/WorkspaceDashboard";
import GroupSelection from "./pages/GroupSelection";

// Import authentication context
import { AuthProvider } from "./contexts/AuthContext";
import { HabitProvider } from "./contexts/HabitContext";

function App() {

  return (
    <AuthProvider>
      <HabitProvider>
        <Theme
          appearance="dark"
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
              
              {/* App routes with layout */}
              <Route path="/app" element={<Layout />}>
                <Route index element={<Dashboard />} />
                <Route path="dashboard" element={<Dashboard />} />
                {/* <Route path="habits" element={<HabitsPage />} /> */}
                <Route path="analytics" element={<AnalyticsPage />} />
                <Route path="settings" element={<SettingsPage />} />
                <Route path="groups" element={<GroupSelection />} />
                <Route path="groups/:groupId" element={<WorkspaceOverview />} />
                <Route path="workspaces/:workspaceId/dashboard" element={<WorkspaceDashboard />} />
              </Route>
            </Routes>
          </div>
        </Router>
      </Theme>
    </HabitProvider>
  </AuthProvider>
  );
}

export default App;
