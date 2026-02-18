import React, { useState, useEffect, useCallback } from "react";
import { Outlet, useLocation, Navigate } from "react-router-dom";
import VerticalMenu from "./VerticalMenu";
import StatusBar from "./StatusBar";
import BottomTabBar from "./BottomTabBar";
import HabitCreationWizard from "../ui/HabitCreationWizard";
import { useAuth, withAuth } from "../../contexts/AuthContext";
import { useHabits } from "../../contexts/HabitContext";

const Layout = () => {
  const [isMenuCollapsed, setIsMenuCollapsed] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [addHabitModalOpen, setAddHabitModalOpen] = useState(false);
  const { user } = useAuth();
  const { createHabit } = useHabits();
  const location = useLocation();

  // Route guard: redirect to profile-setup or onboarding if needed
  if (user && !user.profileComplete) {
    return <Navigate to="/profile-setup" replace />;
  }
  if (user && !user.onboardingComplete) {
    return <Navigate to="/onboarding" replace />;
  }

  const handleOpenAddHabit = useCallback(() => {
    setAddHabitModalOpen(true);
  }, []);

  const handleSaveNewHabit = useCallback(async (habitData) => {
    const result = await createHabit(habitData);
    if (result.success) {
      setAddHabitModalOpen(false);
    }
  }, [createHabit]);

  // Also listen for the addHabit custom event (fallback)
  useEffect(() => {
    const handler = () => setAddHabitModalOpen(true);
    window.addEventListener("addHabit", handler);
    return () => window.removeEventListener("addHabit", handler);
  }, []);

  // Detect mobile screen size
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 768);
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  return (
    <div className="h-screen flex relative" style={{ backgroundColor: "var(--color-bg-primary)" }}>
      {/* Desktop Sidebar — hidden on mobile */}
      {!isMobile && (
        <div className="relative z-10 flex-shrink-0">
          <VerticalMenu 
            isCollapsed={isMenuCollapsed} 
            isMobile={false}
          />
        </div>
      )}

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 h-full">
        {/* Status Bar */}
        <StatusBar
          isMenuCollapsed={isMenuCollapsed}
          setIsMenuCollapsed={setIsMenuCollapsed}
          userName={user?.name || user?.username || 'User'}
          userAvatar={user?.avatar}
          firstName={user?.firstName}
          isMobile={isMobile}
        />

        {/* Content Pane */}
        <div
          className="flex-1 overflow-y-auto overflow-x-hidden layout-scroll-container"
          style={{
            backgroundColor: "var(--color-bg-primary)",
            paddingBottom: isMobile ? "calc(64px + env(safe-area-inset-bottom, 0px))" : "0",
          }}
        >
          <div key={location.pathname} className="page-enter h-full">
            <Outlet />
          </div>
        </div>
      </div>

      {/* Mobile Bottom Tab Bar — hidden on desktop */}
      {isMobile && <BottomTabBar onAddHabit={handleOpenAddHabit} />}

      {/* Global Add Habit Wizard (accessible from BottomTabBar on any page) */}
      <HabitCreationWizard
        isOpen={addHabitModalOpen}
        onClose={() => setAddHabitModalOpen(false)}
        onSave={handleSaveNewHabit}
        userId={user?._id || user?.id}
      />
    </div>
  );
};

export default withAuth(Layout);
