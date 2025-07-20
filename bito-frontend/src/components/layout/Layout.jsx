import React, { useState, useEffect } from "react";
import { Outlet } from "react-router-dom";
import { Flex } from "@radix-ui/themes";
import VerticalMenu from "./VerticalMenu";
import StatusBar from "./StatusBar";
import { useAuth, withAuth } from "../../contexts/AuthContext";

const Layout = () => {
  const [isMenuCollapsed, setIsMenuCollapsed] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { user } = useAuth();

  // Detect mobile screen size
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 768);
      if (window.innerWidth > 768) {
        setMobileMenuOpen(false);
      }
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Close mobile menu when clicking outside or on overlay
  const closeMobileMenu = () => {
    setMobileMenuOpen(false);
  };

  return (
    <Flex className={`h-screen relative ${isMobile ? 'layout-mobile-fix' : ''}`}>
      {/* Mobile overlay */}
      {isMobile && mobileMenuOpen && (
        <div 
          className="mobile-overlay active"
          onClick={closeMobileMenu}
        />
      )}

      {/* Vertical Menu */}
      <div className={`relative z-10 animate-in-left ${
        isMobile 
          ? `sidebar-mobile ${mobileMenuOpen ? 'open' : ''}` 
          : ''
      }`}>
        <VerticalMenu 
          isCollapsed={isMenuCollapsed} 
          isMobile={isMobile}
          onMobileMenuClose={closeMobileMenu}
        />
      </div>

      {/* Right Side Content - Content Area Only */}
      <div className={`flex-1 flex flex-col relative animate-in-right h-full ${
        isMobile ? 'main-content-mobile' : ''
      }`}>
        {/* Content Area with Glass Effect */}
        <div className="flex-1 relative overflow-hidden">
          <div
            className={`h-full glass shadow-2xl overflow-hidden flex flex-col ${
              isMobile 
                ? 'mr-0 mb-0 main-content-mobile' 
                : 'mr-4 mb-4'
            }`}
            style={{ borderRadius: isMobile ? "0" : "0 0 1rem 1rem" }}
          >
            {/* Status Bar with User Actions */}
            <StatusBar
              isMenuCollapsed={isMenuCollapsed}
              setIsMenuCollapsed={setIsMenuCollapsed}
              userName={user?.name || user?.username || 'User'}
              isMobile={isMobile}
              mobileMenuOpen={mobileMenuOpen}
              setMobileMenuOpen={setMobileMenuOpen}
            />

            {/* Content Pane - This will render the current route */}
            <div className="flex-1 overflow-hidden">
              <div
                className={`flex-1 h-full overflow-hidden ${
                  isMobile ? 'container-mobile' : ''
                }`}
                style={{ backgroundColor: "var(--color-surface-primary)" }}
              >
                <div className="h-full overflow-y-auto overflow-x-hidden">
                  <Outlet />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Flex>
  );
};

export default withAuth(Layout);
