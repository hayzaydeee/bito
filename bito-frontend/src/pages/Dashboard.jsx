import React from 'react';
import { Flex, Text } from '@radix-ui/themes';
import ContentGrid from '../components/dashboard/ContentGrid';

const Dashboard = () => {
  return (
    <div className="p-8 page-container">
      <Flex direction="column" gap="6" className="mb-8">
        <div className="text-center">
          <Text className="text-4xl font-bold gradient-text mb-4" style={{ fontFamily: 'var(--font-dmSerif)' }}>
            Your Habit Dashboard
          </Text>
          <Text className="text-lg max-w-2xl mx-auto" style={{ color: 'var(--color-text-secondary)' }}>
            Customize your habit tracking experience with interactive widgets. 
            Drag, resize, and organize them to create your perfect view.
          </Text>
        </div>
      </Flex>
      
      <ContentGrid />
    </div>
  );
};

export default Dashboard;