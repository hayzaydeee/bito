# Analytics Components

This directory contains all the analytics-related components for the Bito habit tracking application. These components provide comprehensive insights into user habit data with a design that matches the existing Bito design language.

## Components Overview

### 1. OverviewCards.jsx
**Purpose**: Displays key performance indicators (KPIs) in a card format
**Features**:
- Total habits count
- Total completions in selected time range
- Average success rate
- Active habits count
- Responsive grid layout
- Animated hover effects
- Color-coded categories

### 2. HabitStreakChart.jsx
**Purpose**: Shows habit streaks over time with trend visualization
**Features**:
- Line chart showing streak progression
- Top performers list
- Max streak tracking
- Interactive data points
- Multiple habit comparison (up to 3 habits displayed)
- Current vs. best streak comparison

### 3. CompletionRateChart.jsx
**Purpose**: Displays completion rates over time in a bar chart format
**Features**:
- Weekly completion rate breakdown
- Trend indicators (up/down)
- Average rate calculation
- Total completions summary
- Interactive tooltips
- Historical data scrolling

### 4. WeeklyHeatmap.jsx
**Purpose**: GitHub-style heatmap showing activity patterns
**Features**:
- Calendar heatmap visualization
- Activity intensity color coding
- Perfect days tracking
- Active days count
- Hover tooltips with daily details
- Time range adaptability
- Legend for activity levels

### 5. TopHabits.jsx
**Purpose**: Leaderboard-style component showing best performing habits
**Features**:
- Three categories: Most Active, Best Rate, Best Streaks
- Tab-based navigation between categories
- Medal system (🥇🥈🥉) for top 3
- Habit color indicators
- Detailed stats per category
- Performance metrics

### 6. InsightsPanel.jsx
**Purpose**: AI-powered insights and recommendations based on habit data
**Features**:
- Smart pattern recognition
- Best/worst day identification
- Streak achievement celebrations
- Completion rate analysis
- Time-of-day preferences
- Trend analysis
- Actionable recommendations
- Color-coded insight types (success, warning, info)

## Design Language

All components follow the established Bito design system:

### Color Palette
- **Brand Colors**: `--color-brand-400` to `--color-brand-600`
- **Status Colors**: `--color-success`, `--color-warning`, `--color-error`, `--color-info`
- **Surface Colors**: `--color-surface-primary`, `--color-surface-elevated`
- **Text Colors**: `--color-text-primary`, `--color-text-secondary`, `--color-text-tertiary`

### Typography
- **Headings**: DM Serif Text (`font-dmSerif`)
- **Body Text**: Outfit (`font-outfit`)
- **Font Weights**: Consistent with existing components

### Components Styling
- **Glass Cards**: `.glass-card` class for consistent container styling
- **Gradients**: Subtle background gradients and brand color gradients
- **Icons**: Radix UI icons with consistent sizing
- **Animations**: Smooth transitions and hover effects
- **Responsive**: Mobile-first responsive design

## Data Requirements

### Expected Props
All components expect these common props:
- `habits`: Array of habit objects from HabitContext
- `entries`: Object containing habit entry data
- `timeRange`: String indicating the analysis period ('7d', '30d', '90d', '1y')

### Habit Object Structure
```javascript
{
  _id: string,
  name: string,
  color: string, // Hex color code
  // ... other habit properties
}
```

### Entries Object Structure
```javascript
{
  [habitId]: {
    [dateString]: {
      completed: boolean,
      completedAt: Date, // Optional
      // ... other entry properties
    }
  }
}
```

## Usage Example

```jsx
import { OverviewCards, HabitStreakChart } from '../components/analytics';
import { useHabits } from '../contexts/HabitContext';

const AnalyticsPage = () => {
  const { habits, entries, isLoading } = useHabits();
  const timeRange = '30d';

  if (isLoading) return <LoadingSpinner />;

  return (
    <div className="space-y-6">
      <OverviewCards 
        data={analyticsData} 
        timeRange={timeRange}
      />
      <HabitStreakChart 
        habits={habits}
        entries={entries}
        timeRange={timeRange}
      />
    </div>
  );
};
```

## Performance Considerations

- **Memoization**: All components use `useMemo` for expensive calculations
- **Data Processing**: Calculations are optimized to process data only once
- **Rendering**: Components handle empty states gracefully
- **Memory**: Large datasets are chunked and processed efficiently

## Accessibility

- **WCAG Compliance**: All components follow WCAG 2.1 AA guidelines
- **Keyboard Navigation**: Interactive elements support keyboard navigation
- **Screen Readers**: Proper ARIA labels and semantic HTML
- **Color Contrast**: All text meets contrast requirements
- **Focus Management**: Clear focus indicators

## Future Enhancements

### Planned Features
- Export functionality for charts and data
- Custom date range selection
- Habit goal tracking and progress
- Comparative analysis between users
- Advanced filtering options
- Custom chart types and visualization options

### Integration Opportunities
- Real AI/ML integration for insights
- Integration with external fitness/health data
- Social features for habit sharing
- Gamification elements
- Advanced reporting and analytics

## File Structure

```
components/analytics/
├── index.js                 # Barrel export file
├── OverviewCards.jsx        # KPI cards
├── HabitStreakChart.jsx     # Streak visualization
├── CompletionRateChart.jsx  # Rate trends
├── WeeklyHeatmap.jsx        # Activity heatmap
├── TopHabits.jsx            # Performance leaderboard
├── InsightsPanel.jsx        # AI insights
└── README.md                # This file
```

## Contributing

When adding new analytics components:

1. Follow the established design patterns
2. Use consistent prop interfaces
3. Include loading and empty states
4. Add proper TypeScript types (if applicable)
5. Test with various data scenarios
6. Ensure responsive design
7. Update this README

## Dependencies

- React (hooks-based)
- Radix UI Icons
- Existing Bito design system (CSS custom properties)
- HabitContext for data management