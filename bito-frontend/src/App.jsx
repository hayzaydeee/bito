import React, { useState } from "react";
import { Theme, Flex } from "@radix-ui/themes";
import VerticalMenu from "./components/layout/VerticalMenu";
import ContentPane from "./components/layout/ContentPane";
import StatusBar from "./components/layout/StatusBar";

function App() {
  const [currentPage, setCurrentPage] = useState("dashboard");
  const [isMenuCollapsed, setIsMenuCollapsed] = useState(false);

  return (
    <Theme
      appearance="dark"
      accentColor="indigo"
      grayColor="slate"
      radius="large"
      scaling="100%"
    >
      <div className="min-h-screen bg-gradient-to-br from-[var(--color-bg-primary)] via-[var(--color-bg-secondary)] to-[var(--color-bg-tertiary)]">
        {/* Main Layout - Full Height */}
        <Flex className="h-screen relative">
          {/* Vertical Menu - Full Height */}
          <div className="relative z-10 animate-in-left">
            <VerticalMenu
              currentPage={currentPage}
              onPageChange={setCurrentPage}
              isCollapsed={isMenuCollapsed}
            />
          </div>

          {/* Right Side Content - Content Area Only */}
          <div className="flex-1 flex flex-col relative animate-in-right h-full">
            {/* Content Area with Glass Effect */}
            <div className="flex-1 relative overflow-hidden">
              <div
                className="h-full glass shadow-2xl overflow-hidden mr-4 mb-4 flex flex-col"
                style={{ borderRadius: "0 0 1rem 1rem" }}
              >
                {/* Status Bar with User Actions - No rounded top corners */}
                <StatusBar
                  currentPage={currentPage}
                  isMenuCollapsed={isMenuCollapsed}
                  setIsMenuCollapsed={setIsMenuCollapsed}
                  userName="Alex"
                />

                {/* Content Pane */}
                <div className="flex-1 overflow-hidden">
                  <ContentPane currentPage={currentPage} />
                </div>
              </div>
            </div>
          </div>
        </Flex>
      </div>
    </Theme>
  );
}

export default App;
