import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { Theme } from "@radix-ui/themes";
import Layout from "./components/layout/Layout";
import LandingPage from "./pages/LandingPage";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import Dashboard from "./pages/Dashboard";
import HabitsPage from "./pages/HabitsPage";
import CalendarPage from "./pages/CalendarPage";
import AnalyticsPage from "./pages/AnalyticsPage";
import SettingsPage from "./pages/SettingsPage";

// Import new store (Phase 1 - Foundation)
import { useHabitStore } from "./store";
import { autoMigrateFromLocalStorage } from "./utils/dataMigration";

function App() {
  // Initialize new store (non-breaking - just makes it available)
  const newStore = useHabitStore();
  
  // Log store status for development (remove in production)
  React.useEffect(() => {
    console.log('🏗️ Phase 1: New store initialized alongside existing code');
    console.log('New store habits count:', Array.from(newStore.habits.values()).length);
    console.log('New store completions count:', newStore.completions.size);
    
    // Phase 2: Auto-migrate existing data if store is empty
    if (Array.from(newStore.habits.values()).length === 0 && newStore.completions.size === 0) {
      console.log('🔄 Phase 2: Attempting auto-migration...');
      autoMigrateFromLocalStorage();
    }
  }, [newStore]);

  return (
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
            
            {/* App routes with layout */}
            <Route path="/app" element={<Layout />}>
              <Route index element={<Dashboard />} />
              <Route path="dashboard" element={<Dashboard />} />
              <Route path="habits" element={<HabitsPage />} />
              <Route path="calendar" element={<CalendarPage />} />
              <Route path="analytics" element={<AnalyticsPage />} />
              <Route path="settings" element={<SettingsPage />} />
            </Route>
          </Routes>
        </div>
      </Router>
    </Theme>
  );
}

export default App;
