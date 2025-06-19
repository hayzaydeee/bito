import { useState, memo } from "react";
import {
  useHabitData,
  useHabitActions,
  DatabaseHeader,
  GalleryView,
  ProfessionalTableView,
} from "../index.js";

const DatabaseWidget = memo(
  ({
    title = "Habit Tracker",
    habits = [],
    completions = {},
    onToggleCompletion,
    onAddHabit,
    onDeleteHabit,
    onEditHabit,
    viewType: initialViewType = "table",
    breakpoint = "lg",
    availableColumns = 8,
    availableRows = 6,
  }) => {
    const [viewType, setViewType] = useState(initialViewType);

    // Use custom hooks for data management
    const {
      daysOfWeek,
      displayHabits,
      displayCompletions,
      getCompletionStatus,
      getDayCompletion,
      getHabitCompletion,
      weekStats,    } = useHabitData({ habits, completions });

    const {
      editingHabit,
      setEditingHabit,
      newHabitName,
      setNewHabitName,
      showAddForm,
      setShowAddForm,
      handleToggleCompletion,
      handleAddHabit,
      handleCancelAdd,
      handleEditHabit,
      handleDeleteHabit,
    } = useHabitActions({
      onToggleCompletion,
      onAddHabit,
      onDeleteHabit,
      onEditHabit,
    });

    // Common props for all views
    const commonProps = {
      daysOfWeek,
      displayHabits,
      displayCompletions,
      getCompletionStatus,
      getDayCompletion,
      getHabitCompletion,
      weekStats,
      handleToggleCompletion,
      breakpoint,
    };

    const renderContent = () => {
      switch (viewType) {        case "table":
          return <ProfessionalTableView {...commonProps} />;
        case "professional":
          return <ProfessionalTableView {...commonProps} />;
        case "gallery":
        default:
          return (
            <GalleryView
              {...commonProps}
              showAddForm={showAddForm}
              setShowAddForm={setShowAddForm}
              newHabitName={newHabitName}
              setNewHabitName={setNewHabitName}
              handleAddHabit={handleAddHabit}
              handleCancelAdd={handleCancelAdd}
            />
          );
      }
    };

    return (
      <div className="w-full h-full flex flex-col">
        <DatabaseHeader
          title={title}
          viewType={viewType}
          setViewType={setViewType}
        />
        <div className="flex-1 min-h-0 overflow-auto">
          {renderContent()}
        </div>
      </div>
    );
  }
);

DatabaseWidget.displayName = "DatabaseWidget";

export { DatabaseWidget };
