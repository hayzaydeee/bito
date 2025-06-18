import React from 'react';
import ContentGrid from '../components/dashboard/ContentGrid';
import WelcomeCard from '../components/dashboard/WelcomeCard';

const Dashboard = () => {
  return (
    <div className="p-6 page-container space-y-8">
      {/* Welcome Section - Enhanced positioning */}
      <div className="relative">
        <WelcomeCard userName="Alex" />
      </div>
      
      {/* Main Content Grid - Better integration */}
      <div className="relative">
        <ContentGrid />
      </div>
    </div>
  );
};

export default Dashboard;