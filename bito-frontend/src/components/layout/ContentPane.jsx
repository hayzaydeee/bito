import React from "react";
import { Flex, Text } from "@radix-ui/themes";
import Dashboard from "../../pages/Dashboard";
import LandingPage from "../../pages/LandingPage";

const ContentPane = ({ currentPage }) => {  const renderPageContent = () => {
    switch (currentPage) {
      case "landing":
        return <LandingPage />;
      case "dashboard":
        return <Dashboard />;
      case "habits":
        return (
          <div className="p-8 page-container">
            <div className="glass-card p-8 rounded-3xl">
              {" "}
              <Text className="text-3xl font-bold mb-6 gradient-text font-dmSerif">
                Habits Management
              </Text>
              <Text
                className="text-lg font-outfit"
                style={{ color: "var(--color-text-secondary)" }}
              >
                Create, edit, and manage your habits here. Build consistency and
                track your progress.
              </Text>
            </div>
          </div>
        );
      case "calendar":
        return (
          <div className="p-8 page-container">
            <div className="glass-card p-8 rounded-3xl">
              {" "}
              <Text className="text-3xl font-bold mb-6 gradient-text font-dmSerif">
                Calendar View
              </Text>
              <Text
                className="text-lg font-outfit"
                style={{ color: "var(--color-text-secondary)" }}
              >
                View your habit progress in calendar format. Visualize your
                consistency over time.
              </Text>
            </div>
          </div>
        );
      case "analytics":
        return (
          <div className="p-8 page-container">
            <div className="glass-card p-8 rounded-3xl">
              {" "}
              <Text className="text-3xl font-bold mb-6 gradient-text font-dmSerif">
                Analytics
              </Text>
              <Text
                className="text-lg font-outfit"
                style={{ color: "var(--color-text-secondary)" }}
              >
                Track your progress with detailed analytics and insights.
                Understand your patterns.
              </Text>
            </div>
          </div>
        );
      case "settings":
        return (
          <div className="p-8 page-container">
            <div className="glass-card p-8 rounded-3xl">
              {" "}
              <Text className="text-3xl font-bold mb-6 gradient-text font-dmSerif">
                Settings
              </Text>
              <Text
                className="text-lg font-outfit"
                style={{ color: "var(--color-text-secondary)" }}
              >
                Customize your app preferences and account settings. Make the
                app work for you.
              </Text>
            </div>
          </div>
        );
      default:
        return <Dashboard />;
    }
  };
  return (
    <div
      className="flex-1 h-full overflow-hidden"
      style={{ backgroundColor: "var(--color-surface-primary)" }}
    >
      <div className="h-full overflow-y-auto overflow-x-hidden">
        {renderPageContent()}
      </div>
    </div>
  );
};

export default ContentPane;
