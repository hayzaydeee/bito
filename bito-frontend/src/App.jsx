import React, { useState } from "react";
import { Theme, Flex } from "@radix-ui/themes";
import WelcomeBar from "./components/layout/WelcomeBar";
import VerticalMenu from "./components/layout/VerticalMenu";
import ContentPane from "./components/layout/ContentPane";

function App() {
  const [currentPage, setCurrentPage] = useState('dashboard');

  return (
    <Theme
      appearance="dark"
      accentColor="indigo"
      grayColor="slate"
      radius="large"
      scaling="100%"
    >
      <div className="min-h-screen bg-gradient-to-br from-[var(--color-bg-primary)] via-[var(--color-bg-secondary)] to-[var(--color-bg-tertiary)]">
        {/* Background Pattern */}
        <div className="fixed inset-0 opacity-5 pointer-events-none">
          <div className="absolute inset-0" style={{
            backgroundImage: `radial-gradient(circle at 2px 2px, rgba(255,255,255,0.15) 1px, transparent 0)`,
            backgroundSize: '40px 40px'
          }}></div>
        </div>
        
        {/* Welcome Bar */}
        <WelcomeBar userName="Alex" />
        
        {/* Main Layout */}
        <Flex className="min-h-[calc(100vh-4rem)] relative">
          {/* Vertical Menu */}
          <div className="relative z-10 animate-in-left">
            <VerticalMenu 
              currentPage={currentPage} 
              onPageChange={setCurrentPage}
            />
          </div>
          
          {/* Content Area with Glass Effect */}
          <div className="flex-1 relative p-4 animate-in-right">
            <div className="h-full glass rounded-2xl shadow-2xl overflow-hidden hover-lift">
              <ContentPane currentPage={currentPage} />
            </div>
          </div>
        </Flex>
        
        {/* Floating Elements */}
        <div className="fixed bottom-8 right-8 z-50 pointer-events-none">
          <div className="animate-float">
            <div className="w-4 h-4 bg-gradient-to-r from-[var(--color-brand-400)] to-[var(--color-brand-600)] rounded-full opacity-60 animate-glow"></div>
          </div>
        </div>
      </div>
    </Theme>
  );
}

export default App;
