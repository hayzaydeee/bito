import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import path from 'path'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@components': path.resolve(__dirname, './src/components'),
      '@features': path.resolve(__dirname, './src/features'),
      '@shared': path.resolve(__dirname, './src/components/shared'),
      '@pages': path.resolve(__dirname, './src/pages'),
      '@contexts': path.resolve(__dirname, './src/contexts'),
      '@hooks': path.resolve(__dirname, './src/hooks'),
      '@utils': path.resolve(__dirname, './src/utils'),
      '@services': path.resolve(__dirname, './src/services'),
    }
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          // Vendor libraries
          'react-vendor': ['react', 'react-dom'],
          'radix-vendor': ['@radix-ui/themes', '@radix-ui/react-icons'],
          'chart-vendor': ['recharts'],
          'grid-vendor': ['react-grid-layout', 'react-resizable'],
          
          // Feature chunks
          'analytics': [
            '/src/components/analytics/widgets/OverviewCardsWidget.jsx',
            '/src/components/analytics/widgets/HabitStreakChartWidget.jsx',
            '/src/components/analytics/widgets/CompletionRateChartWidget.jsx',
            '/src/components/analytics/widgets/WeeklyHeatmapWidget.jsx',
            '/src/components/analytics/widgets/TopHabitsWidget.jsx',
            '/src/components/analytics/widgets/InsightsPanelWidget.jsx'
          ],
          'workspace': [
            '/src/components/widgets/GroupOverviewWidget.jsx',
            '/src/components/widgets/GroupLeaderboardWidget.jsx',
            '/src/components/widgets/GroupChallengesWidget.jsx',
            '/src/components/widgets/MemberProgressWidget.jsx'
          ]
        }
      }
    },
    chunkSizeWarningLimit: 600
  }
})
