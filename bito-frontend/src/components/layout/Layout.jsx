import React, { useState, useEffect } from "react";
import { Outlet, useLocation } from "react-router-dom";
import VerticalMenu from "./VerticalMenu";
import StatusBar from "./StatusBar";
import BottomTabBar from "./BottomTabBar";
import { useAuth, withAuth } from "../../contexts/AuthContext";

const Layout = () => {
  const [isMenuCollapsed, setIsMenuCollapsed] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const { user } = useAuth();
  const location = useLocation();

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
          isMobile={isMobile}
        />

        {/* Content Pane */}
        <div
          className="flex-1 overflow-y-auto overflow-x-hidden"
          style={{
            backgroundColor: "var(--color-bg-primary)",
            paddingBottom: isMobile ? "calc(64px + env(safe-area-inset-bottom, 0px))" : "0",
          }}
        >
          <div key={location.pathname} className="page-enter">
            <Outlet />
          </div>
        </div>
      </div>

      {/* Mobile Bottom Tab Bar — hidden on desktop */}
      {isMobile && <BottomTabBar />}
    </div>
  );
};

export default withAuth(Layout);
