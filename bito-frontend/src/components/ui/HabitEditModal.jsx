import React, { useState, useEffect } from "react";
import "./DialogAnimation.css";
import {
  Flex,
  Button,
  Text,
  TextField,
  TextArea,
  Box,
  Separator,
  Switch,
  Tabs,
  Popover,
} from "@radix-ui/themes";
import * as Dialog from "@radix-ui/react-dialog";
import {
  Cross2Icon,
  TrashIcon,
  CheckIcon,
  ArchiveIcon,
  LockOpen1Icon,
  InfoCircledIcon,
  PlusIcon,
} from "@radix-ui/react-icons";

const EMOJI_CATEGORIES = {
  common: ["✅", "🔴", "🔵", "🟢", "⭐", "🎯", "💪", "🧠", "📚", "💧", "🏃", "🥗", "😊"],
  activity: ["🏋️", "🧘", "🚶", "🏃", "🚴", "🏊", "⚽", "🎮", "🎨", "🎵", "📝", "📚", "💻"],
  health: ["💧", "🥗", "🍎", "🥦", "💊", "😴", "🧠", "🧘", "❤️", "🦷", "🚭", "🧹", "☀️"],
  productivity: ["📝", "⏰", "📅", "📚", "💼", "💻", "📱", "✉️", "📊", "🔍", "⚙️", "🏆", "💯"],
  mindfulness: ["🧘", "😌", "🌱", "🌈", "🌞", "🌙", "💭", "🧠", "❤️", "🙏", "✨", "💫", "🔮"],
};

const HabitEditModal = ({ 
  isOpen, 
  onClose, 
  habit = null, 
  onSave,
  onDelete, 
  onArchive 
}) => {
  // Initialize state with habit data or empty values
  const [formData, setFormData] = useState({
    name: "",
    icon: "✅",
    description: "",
    color: "#4f46e5",
    isActive: true,
    schedule: {
      days: [0, 1, 2, 3, 4, 5, 6], // Default to every day (0=Sunday, 6=Saturday)
      reminderTime: "",
      reminderEnabled: false
    },
    isPrivate: false,
  });
  
  const [activeTab, setActiveTab] = useState("details");
  const [emojiCategory, setEmojiCategory] = useState("common");
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [errors, setErrors] = useState({});

  // Update form when habit changes
  useEffect(() => {
    if (habit) {
      setFormData({
        name: habit.name || "",
        icon: habit.icon || "✅",
        description: habit.description || "",
        color: habit.color || "#4f46e5",
        isActive: habit.isActive !== undefined ? habit.isActive : true,
        schedule: {
          days: habit.schedule?.days || habit.frequency || [0, 1, 2, 3, 4, 5, 6], // Support legacy frequency
          reminderTime: habit.schedule?.reminderTime || "",
          reminderEnabled: habit.schedule?.reminderEnabled || false
        },
        isPrivate: habit.isPrivate || false,
      });
    }
  }, [habit]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleIconSelect = (icon) => {
    setFormData((prev) => ({
      ...prev,
      icon,
    }));
  };

  const handleFrequencyToggle = (day) => {
    setFormData((prev) => {
      // If day is in schedule.days, remove it, otherwise add it
      const newDays = prev.schedule.days.includes(day)
        ? prev.schedule.days.filter((d) => d !== day)
        : [...prev.schedule.days, day].sort();
      
      return {
        ...prev,
        schedule: {
          ...prev.schedule,
          days: newDays
        }
      };
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    // Validation
    const newErrors = {};
    if (!formData.name.trim()) {
      newErrors.name = "Name is required";
    }
    
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }
    
    onSave(formData);
    onClose();
  };
  
  const handleArchive = () => {
    onArchive({ 
      ...habit, 
      isActive: !formData.isActive 
    });
    onClose();
  };

  const handleDelete = () => {
    if (showDeleteConfirm) {
      onDelete(habit._id);
      onClose();
    } else {
      setShowDeleteConfirm(true);
    }
  };

  // Days of the week for frequency selector (0=Sunday to 6=Saturday to match backend)
  const daysOfWeek = [
    { id: 1, short: "Mon", fullName: "Monday" },
    { id: 2, short: "Tue", fullName: "Tuesday" },
    { id: 3, short: "Wed", fullName: "Wednesday" },
    { id: 4, short: "Thu", fullName: "Thursday" },
    { id: 5, short: "Fri", fullName: "Friday" },
    { id: 6, short: "Sat", fullName: "Saturday" },
    { id: 0, short: "Sun", fullName: "Sunday" },
  ];

  // Predefined colors
  const colorOptions = [
    "#4f46e5", // indigo
    "#0ea5e9", // sky
    "#10b981", // emerald
    "#f59e0b", // amber
    "#ef4444", // red
    "#8b5cf6", // purple
    "#ec4899", // pink
  ];

  return (
    <Dialog.Root open={isOpen} onOpenChange={onClose}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/50 backdrop-blur-sm animate-fade-in" />
        <Dialog.Content className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 max-w-md w-full bg-[var(--color-surface-primary)] rounded-xl p-6 shadow-xl border border-[var(--color-border-primary)] animate-zoom-in">
          <Flex direction="column" gap="5">
            <Dialog.Title className="text-2xl font-dmSerif gradient-text">
              {habit ? "Edit Habit" : "Create New Habit"}
            </Dialog.Title>

          <Tabs.Root defaultValue="details" value={activeTab} onValueChange={setActiveTab}>
            <Tabs.List>
              <Tabs.Trigger value="details">Details</Tabs.Trigger>
              <Tabs.Trigger value="appearance">Appearance</Tabs.Trigger>
              <Tabs.Trigger value="settings">Settings</Tabs.Trigger>
              {habit && <Tabs.Trigger value="danger">Manage</Tabs.Trigger>}
            </Tabs.List>
            
            <Box pt="4">
              <Tabs.Content value="details">
                <form onSubmit={handleSubmit}>
                  <Flex direction="column" gap="4">
                    <div>
                      <Text as="label" size="2" weight="bold" htmlFor="name">
                        Habit Name *
                      </Text>
                      <TextField.Root>
                        <TextField.Input
                          id="name"
                          name="name"
                          value={formData.name}
                          onChange={handleChange}
                          placeholder="e.g., Drink water"
                          autoFocus
                        />
                      </TextField.Root>
                      {errors.name && (
                        <Text color="red" size="1">
                          {errors.name}
                        </Text>
                      )}
                    </div>
                    
                    <div>
                      <Text as="label" size="2" weight="bold" htmlFor="description">
                        Description
                      </Text>
                      <TextArea
                        id="description"
                        name="description"
                        value={formData.description}
                        onChange={handleChange}
                        placeholder="Why this habit matters to you"
                        style={{ minHeight: "100px" }}
                      />
                    </div>
                    
                    <div>
                      <Text as="label" size="2" weight="bold" mb="1" display="block">
                        Schedule
                      </Text>
                      <Text as="p" size="1" color="gray" mb="2">
                        Which days should you perform this habit?
                      </Text>
                      <Flex gap="1" wrap="nowrap">
                        {daysOfWeek.map((day) => (
                          <Button
                            key={day.id}
                            type="button"
                            variant={formData.schedule.days.includes(day.id) ? "solid" : "outline"}
                            style={{
                              width: "40px",
                              padding: "0",
                              backgroundColor: formData.schedule.days.includes(day.id)
                                ? formData.color
                                : "transparent",
                            }}
                            onClick={() => handleFrequencyToggle(day.id)}
                            title={day.fullName}
                          >
                            {day.short}
                          </Button>
                        ))}
                      </Flex>
                      <Text as="p" size="1" color="gray" mt="2">
                        {formData.schedule.days.length === 7 
                          ? "Every day" 
                          : formData.schedule.days.length === 0 
                          ? "No days selected" 
                          : `${formData.schedule.days.length} day${formData.schedule.days.length > 1 ? 's' : ''} per week`}
                      </Text>
                    </div>
                  </Flex>
                </form>
              </Tabs.Content>

              <Tabs.Content value="appearance">
                <Flex direction="column" gap="4">
                  <div>
                    <Text as="label" size="2" weight="bold" mb="1" display="block">
                      Icon
                    </Text>
                    <Box className="flex items-center gap-2 mb-2">
                      <Box
                        className="w-12 h-12 rounded-md flex items-center justify-center text-2xl"
                        style={{ backgroundColor: formData.color, color: "#fff" }}
                      >
                        {formData.icon}
                      </Box>
                      <Text>Current icon</Text>
                    </Box>
                    
                    <Box className="mb-4">
                      <Flex gap="1" mb="2">
                        {Object.keys(EMOJI_CATEGORIES).map((category) => (
                          <Button
                            key={category}
                            type="button"
                            variant={emojiCategory === category ? "solid" : "outline"}
                            size="1"
                            onClick={() => setEmojiCategory(category)}
                          >
                            {category.charAt(0).toUpperCase() + category.slice(1)}
                          </Button>
                        ))}
                      </Flex>
                      
                      <Box className="border border-[var(--color-border-primary)] p-2 rounded-md">
                        <Flex gap="2" wrap="wrap">
                          {EMOJI_CATEGORIES[emojiCategory].map((emoji) => (
                            <Button
                              key={emoji}
                              type="button"
                              variant="ghost"
                              onClick={() => handleIconSelect(emoji)}
                              className="hover:bg-[var(--color-surface-hover)] text-xl"
                            >
                              {emoji}
                            </Button>
                          ))}
                        </Flex>
                      </Box>
                    </Box>
                  </div>
                  
                  <div>
                    <Text as="label" size="2" weight="bold" mb="1" display="block">
                      Color
                    </Text>
                    <Flex gap="2" wrap="wrap">
                      {colorOptions.map((color) => (
                        <Button
                          key={color}
                          type="button"
                          variant="ghost"
                          onClick={() => setFormData({...formData, color})}
                          className="w-8 h-8 rounded-full p-0"
                          style={{ 
                            backgroundColor: color,
                            border: formData.color === color ? "3px solid white" : "none",
                            outline: formData.color === color ? `2px solid ${color}` : "none"
                          }}
                        />
                      ))}
                    </Flex>
                  </div>
                </Flex>
              </Tabs.Content>

              <Tabs.Content value="settings">
                <Flex direction="column" gap="4">
                  <Box>
                    <Text as="label" size="2" weight="bold" mb="2" display="block">
                      Reminder Settings
                    </Text>
                    
                    <Flex justify="between" align="center" mb="3">
                      <div>
                        <Text as="label" size="2" weight="medium" htmlFor="reminderEnabled">
                          Enable Reminders
                        </Text>
                        <Text as="p" size="1" color="gray">
                          Get notified to complete this habit
                        </Text>
                      </div>
                      <Switch
                        id="reminderEnabled"
                        checked={formData.schedule.reminderEnabled}
                        onCheckedChange={(checked) => 
                          setFormData({
                            ...formData, 
                            schedule: { 
                              ...formData.schedule, 
                              reminderEnabled: checked 
                            }
                          })
                        }
                      />
                    </Flex>
                    
                    {formData.schedule.reminderEnabled && (
                      <div>
                        <Text as="label" size="2" weight="medium" mb="1" display="block">
                          Reminder Time
                        </Text>
                        <TextField.Root>
                          <TextField.Input
                            type="time"
                            value={formData.schedule.reminderTime}
                            onChange={(e) => 
                              setFormData({
                                ...formData, 
                                schedule: { 
                                  ...formData.schedule, 
                                  reminderTime: e.target.value 
                                }
                              })
                            }
                          />
                        </TextField.Root>
                      </div>
                    )}
                  </Box>
                  
                  <Separator />
                  
                  <Box>
                    <Flex justify="between" align="center" mb="2">
                      <div>
                        <Text as="label" size="2" weight="bold" htmlFor="isPrivate">
                          Private Habit
                        </Text>
                        <Text as="p" size="1" color="gray">
                          Hidden from workspace members
                        </Text>
                      </div>
                      <Switch
                        id="isPrivate"
                        checked={formData.isPrivate}
                        onCheckedChange={(checked) => 
                          setFormData({...formData, isPrivate: checked})
                        }
                      />
                    </Flex>
                  </Box>
                  
                  <Box>
                    <Flex justify="between" align="center">
                      <div>
                        <Text as="label" size="2" weight="bold" htmlFor="isActive">
                          {formData.isActive ? "Active" : "Archived"}
                        </Text>
                        <Text as="p" size="1" color="gray">
                          {formData.isActive 
                            ? "Visible in your habit tracker" 
                            : "Hidden from your habit tracker"
                          }
                        </Text>
                      </div>
                      <Switch
                        id="isActive"
                        checked={formData.isActive}
                        onCheckedChange={(checked) => 
                          setFormData({...formData, isActive: checked})
                        }
                      />
                    </Flex>
                  </Box>
                </Flex>
              </Tabs.Content>

              {habit && (
                <Tabs.Content value="danger">
                  <Flex direction="column" gap="4">
                    <Box className="p-3 border border-[var(--color-border-warning)] rounded-md bg-[var(--color-surface-warning)]">
                      <Flex gap="2" align="center">
                        <InfoCircledIcon className="text-[var(--color-text-warning)]" />
                        <Text as="p" size="2" className="text-[var(--color-text-warning)]">
                          The actions below can't be undone. Please be certain.
                        </Text>
                      </Flex>
                    </Box>
                    
                    <Button
                      type="button"
                      variant="outline"
                      onClick={handleArchive}
                      className="border-[var(--color-border-warning)] text-[var(--color-text-warning)]"
                    >
                      <ArchiveIcon />
                      {formData.isActive ? "Archive Habit" : "Restore Habit"}
                    </Button>
                    
                    <Button
                      type="button"
                      color="red"
                      onClick={handleDelete}
                    >
                      <TrashIcon />
                      {showDeleteConfirm ? "Are you sure? Click again to delete" : "Delete Habit"}
                    </Button>
                  </Flex>
                </Tabs.Content>
              )}
            </Box>
          </Tabs.Root>

          <Separator size="4" />
          
          <Flex gap="3" justify="end">
            <Button 
              variant="soft" 
              color="gray" 
              onClick={onClose}
            >
              Cancel
            </Button>
            <Button 
              onClick={handleSubmit}
            >
              <CheckIcon />
              {habit ? "Update Habit" : "Create Habit"}
            </Button>
          </Flex>
        </Flex>
        
        <Dialog.Close asChild>
          <Button 
            variant="ghost" 
            color="gray" 
            className="absolute top-[12px] right-[12px]"
          >
            <Cross2Icon />
          </Button>
        </Dialog.Close>
      </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
};

export default HabitEditModal;
