import React, { useState } from "react";
import { Outlet } from "react-router-dom";
import { Flex } from "@radix-ui/themes";
import VerticalMenu from "./VerticalMenu";
import StatusBar from "./StatusBar";

const Layout = () => {
  const [isMenuCollapsed, setIsMenuCollapsed] = useState(false);

  return (
    <Flex className="h-screen relative">
      {/* Vertical Menu - Full Height */}
      <div className="relative z-10 animate-in-left">
        <VerticalMenu isCollapsed={isMenuCollapsed} />
      </div>

      {/* Right Side Content - Content Area Only */}
      <div className="flex-1 flex flex-col relative animate-in-right h-full">
        {/* Content Area with Glass Effect */}
        <div className="flex-1 relative overflow-hidden">
          <div
            className="h-full glass shadow-2xl overflow-hidden mr-4 mb-4 flex flex-col"
            style={{ borderRadius: "0 0 1rem 1rem" }}
          >
            {/* Status Bar with User Actions */}
            <StatusBar
              isMenuCollapsed={isMenuCollapsed}
              setIsMenuCollapsed={setIsMenuCollapsed}
              userName="Alex"
            />

            {/* Content Pane - This will render the current route */}
            <div className="flex-1 overflow-hidden">
              <div
                className="flex-1 h-full overflow-hidden"
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

export default Layout;
