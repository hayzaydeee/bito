# Context Grid Adapter

## Purpose

The `ContextGridAdapter` component serves as a bridge between components that use context-based data fetching and components that require direct prop-based data.

## Problem It Solves

This adapter was created to solve a specific issue where the refactored `BaseGridContainer` and child components (like `HabitGrid`, `DatabaseWidgetV2`) were updated to use props directly (to support member dashboards), which broke the original dashboard that relied on context access.

## How It Works

The adapter:
1. Consumes data from the `HabitContext` context
2. Forwards that data as props to `BaseGridContainer`
3. Ensures that context handlers are properly wrapped with `useCallback` to prevent excessive re-renders
4. Allows override props when needed (for testing or special cases)

## Usage

```jsx
// In a component that needs to use context data with components that expect props:
import { ContextGridAdapter } from '../components/shared';

// Then in your render function:
return (
  <ContextGridAdapter 
    mode="dashboard"
    chartFilters={chartFilters}
    // other props that aren't from context
    // No need to pass habits, entries, or handlers - they come from context
  />
);
```

## Benefits

1. **Separation of concerns**: Isolates the adaptation logic in a single component
2. **Maintainability**: Makes the codebase more maintainable by avoiding mixed patterns
3. **Flexibility**: Supports both context-based and props-based patterns
4. **Minimal changes**: Required minimal changes to existing components

## When To Use

Use this adapter when you have components that were previously relying on context but now need to work with refactored components that expect props directly.
