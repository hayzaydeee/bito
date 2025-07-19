# DatabaseWidget  Documentation

## Overview
The `DatabaseWidget` is a comprehensive React component for habit tracking and data visualization. It supports multiple view types (gallery cards, professional table) and provides interactive features like completion tracking and statistical summaries. This component has been architected with modularity in mind, separating data management, UI rendering, and user interactions into distinct, reusable modules.

## Structure

```
src/components/widgets/database/
├── hooks/
│   ├── useHabitData.js          # Data management and calculations
│   ├── useHabitActions.js       # CRUD operations for habits
│   └── index.js                 # Hook exports
├── components/
│   ├── DatabaseHeader.jsx       # Widget header with view toggle
│   ├── GalleryView.jsx          # Card-based gallery view
│   ├── ProfessionalTableView.jsx # Compact professional table
│   └── index.js                 # Component exports
└── index.js                     # Main exports

src/components/widgets/
└── DatabaseWidget.jsx           # Main refactored component (now ~125 lines)
```

## Custom Hooks

### `useHabitData({ habits, completions })`
Manages all habit data calculations and provides:
- `daysOfWeek` - Array of weekday names
- `displayHabits` - Processed habits with defaults
- `displayCompletions` - Processed completions with defaults
- `getCompletionStatus(day, habitId)` - Check completion status
- `getDayCompletion(day)` - Calculate daily completion percentage
- `getHabitCompletion(habitId)` - Calculate habit completion across week
- `weekStats` - Overall statistics and metrics

### `useHabitActions({ onToggleCompletion, onAddHabit, onDeleteHabit, onEditHabit })`
Manages habit CRUD operations:
- Form state management (editing, adding)
- Action handlers for all habit operations
- State management for UI interactions

## View Components

### `DatabaseHeader`
- Widget title and icon
- View type toggle (Table/Cards)
- Clean, consistent header layout

### `GalleryView`
- Card-based view for each habit
- Weekly progress visualization
- Add new habit functionality

### `ProfessionalTableView`
- Compact, professional table layout
- Status badges and action buttons
- Zebra striping and hover effects

## Usage Example

```jsx
import { DatabaseWidget } from './DatabaseWidget';

function MyComponent() {
  return (
    <DatabaseWidget
      title="My Habits"
      habits={habits}
      completions={completions}
      onToggleCompletion={handleToggle}
      onAddHabit={handleAdd}
      onDeleteHabit={handleDelete}
      onEditHabit={handleEdit}
      viewType="table"
      breakpoint="lg"
    />
  );
}
```

## Migration Notes

The refactored component maintains 100% API compatibility with the original monolithic version. No changes are required in parent components that use `DatabaseWidget`.

## Future Enhancements

With this modular structure, future enhancements become much easier:

1. **New View Types**: Add new view components in `components/` directory
2. **Additional Features**: Extend hooks with new functionality
3. **Performance Optimizations**: Optimize individual components
4. **Testing**: Write comprehensive tests for each module
5. **Documentation**: Add detailed JSDoc comments for each function

## File Size Reduction

- **Before**: ~1054 lines in single file
- **After**: ~125 lines in main component + modular structure
- **Reduction**: ~90% size reduction in main component
- **Total Lines**: Similar overall, but much better organized
