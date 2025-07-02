import React, { useState } from "react";
import "./DialogAnimation.css";
import {
  Flex,
  Button,
  Text,
  Box,
  Separator,
  Switch,
  Tabs,
} from "@radix-ui/themes";
import * as Dialog from "@radix-ui/react-dialog";
import {
  Cross2Icon,
  CheckIcon,
  LockClosedIcon,
  LockOpen1Icon,
  InfoCircledIcon,
  PlusIcon,
  HomeIcon,
  PersonIcon,
  GlobeIcon,
} from "@radix-ui/react-icons";

// Predefined color options for workspace (matching HabitEditModal)
const colorOptions = [
  "#4f46e5", // indigo
  "#0ea5e9", // sky
  "#10b981", // emerald
  "#f59e0b", // amber
  "#ef4444", // red
  "#8b5cf6", // purple
  "#ec4899", // pink
  "#14b8a6", // teal
];

// Workspace type options with better descriptions
const WORKSPACE_TYPES = [
  { 
    id: "personal", 
    name: "Personal", 
    description: "Track your own habits privately", 
    icon: "PersonIcon"
  },
  { 
    id: "group", 
    name: "Group", 
    description: "Collaborate with friends, family, or team", 
    icon: "GlobeIcon"
  },
  { 
    id: "work", 
    name: "Work", 
    description: "Track professional goals and team habits", 
    icon: "HomeIcon"
  },
];

const WorkspaceCreationModal = ({ isOpen, onClose, onSave }) => {
  const [activeTab, setActiveTab] = useState("details");
  const [errors, setErrors] = useState({});
  
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    color: "#4f46e5", // Default color
    type: "group", // Default type
    isPrivate: false,
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: "" }));
    }
  };

  const handleTypeSelect = (type) => {
    setFormData((prev) => ({
      ...prev,
      type,
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    // Validation
    const newErrors = {};
    if (!formData.name.trim()) {
      newErrors.name = "Group name is required";
    }
    
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }
    
    onSave(formData);
    onClose();
  };

  const resetForm = () => {
    setFormData({
      name: "",
      description: "",
      color: "#4f46e5",
      type: "group",
      isPrivate: false,
    });
    setErrors({});
    setActiveTab("details");
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  return (
    <Dialog.Root open={isOpen} onOpenChange={handleClose}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/50 backdrop-blur-sm animate-fade-in" />
        <Dialog.Content className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 max-w-md w-full bg-[var(--color-surface-primary)] rounded-xl p-6 shadow-xl border border-[var(--color-border-primary)] animate-zoom-in">
          <Flex direction="column" gap="5">
            <Dialog.Title className="text-2xl font-dmSerif gradient-text">
              Create New Group
            </Dialog.Title>

            <Tabs.Root defaultValue="details" value={activeTab} onValueChange={setActiveTab}>
              <Tabs.List>
                <Tabs.Trigger value="details">Details</Tabs.Trigger>
                <Tabs.Trigger value="appearance">Appearance</Tabs.Trigger>
                <Tabs.Trigger value="settings">Settings</Tabs.Trigger>
              </Tabs.List>
              
              <Box pt="4">
                <Tabs.Content value="details">
                  <form onSubmit={handleSubmit}>
                    <Flex direction="column" gap="4">
                      <div>
                        <Text as="label" size="2" weight="bold" htmlFor="name">
                          Group Name *
                        </Text>
                        <input
                          id="name"
                          name="name"
                          value={formData.name}
                          onChange={handleChange}
                          placeholder="e.g., Fitness Squad"
                          autoFocus
                          className="w-full px-3 py-2 border border-[var(--color-border-primary)] rounded-md bg-[var(--color-surface-primary)] text-[var(--color-text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--accent-9)] focus:border-transparent"
                        />
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
                        <textarea
                          id="description"
                          name="description"
                          value={formData.description}
                          onChange={handleChange}
                          placeholder="What's this group about?"
                          rows="4"
                          className="w-full px-3 py-2 border border-[var(--color-border-primary)] rounded-md bg-[var(--color-surface-primary)] text-[var(--color-text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--accent-9)] focus:border-transparent resize-none"
                        />
                      </div>

                      <div>
                        <Text as="label" size="2" weight="bold" mb="1" display="block">
                          Group Type
                        </Text>
                        <Text as="p" size="1" color="gray" mb="2">
                          Choose the type that best fits your group's purpose
                        </Text>
                        
                        <Flex direction="column" gap="2">
                          {WORKSPACE_TYPES.map((type) => {
                            const getIcon = (iconName) => {
                              switch (iconName) {
                                case "PersonIcon":
                                  return <PersonIcon />;
                                case "GlobeIcon":
                                  return <GlobeIcon />;
                                case "HomeIcon":
                                  return <HomeIcon />;
                                default:
                                  return <GlobeIcon />;
                              }
                            };
                            
                            return (
                              <Box
                                key={type.id}
                                className={`p-3 border rounded-md cursor-pointer transition-all ${
                                  formData.type === type.id 
                                    ? 'border-[var(--accent-9)] bg-[var(--accent-3)]' 
                                    : 'border-[var(--color-border-primary)] hover:border-[var(--accent-6)]'
                                }`}
                                onClick={() => handleTypeSelect(type.id)}
                              >
                                <Flex align="center" gap="2">
                                  <Box className="text-[var(--accent-9)]">
                                    {getIcon(type.icon)}
                                  </Box>
                                  <Box>
                                    <Text weight="bold">{type.name}</Text>
                                    <Text size="1" color="gray">{type.description}</Text>
                                  </Box>
                                  {formData.type === type.id && (
                                    <CheckIcon className="ml-auto text-[var(--accent-9)]" />
                                  )}
                                </Flex>
                              </Box>
                            );
                          })}
                        </Flex>
                      </div>
                    </Flex>
                  </form>
                </Tabs.Content>

                <Tabs.Content value="appearance">
                  <Flex direction="column" gap="4">
                    <div>
                      <Text as="label" size="2" weight="bold" mb="1" display="block">
                        Group Color
                      </Text>
                      <Text as="p" size="1" color="gray" mb="2">
                        Pick a color that represents your group's theme
                      </Text>
                      
                      <Flex gap="2" wrap="wrap">
                        {colorOptions.map((color) => (
                          <Button
                            key={color}
                            type="button"
                            variant="ghost"
                            onClick={() => setFormData({...formData, color})}
                            className="w-12 h-12 rounded-full p-0"
                            style={{ 
                              backgroundColor: color,
                              border: formData.color === color ? "3px solid white" : "none",
                              outline: formData.color === color ? `2px solid ${color}` : "none"
                            }}
                          />
                        ))}
                      </Flex>

                      <Box 
                        mt="4" 
                        p="3" 
                        className="rounded-md" 
                        style={{ 
                          backgroundColor: formData.color, 
                          color: "#fff" 
                        }}
                      >
                        <Text weight="bold">Preview: {formData.name || "Your Group Name"}</Text>
                        <Text size="1">{formData.description || "Group description will appear here"}</Text>
                      </Box>
                    </div>
                  </Flex>
                </Tabs.Content>

                <Tabs.Content value="settings">
                  <Flex direction="column" gap="4">
                    <Box>
                      <Flex justify="between" align="center" mb="2">
                        <div>
                          <Text as="label" size="2" weight="bold" htmlFor="isPrivate">
                            Private Group
                          </Text>
                          <Text as="p" size="1" color="gray">
                            Only invited members can join
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
                    
                    <Box className="p-3 border rounded-md bg-[var(--color-surface-secondary)]">
                      <Flex gap="2" align="center">
                        <InfoCircledIcon className="text-[var(--color-text-secondary)]" />
                        <Box>
                          <Text as="p" size="2" weight="medium">
                            {formData.isPrivate ? "Private Group" : "Public Group"}
                          </Text>
                          <Text as="p" size="1" color="gray">
                            {formData.isPrivate 
                              ? "Members need an invitation to join. You can control who has access."
                              : "Anyone with the link can request to join your group."
                            }
                          </Text>
                        </Box>
                        {formData.isPrivate ? (
                          <LockClosedIcon className="ml-auto text-[var(--color-text-secondary)]" />
                        ) : (
                          <LockOpen1Icon className="ml-auto text-[var(--color-text-secondary)]" />
                        )}
                      </Flex>
                    </Box>
                  </Flex>
                </Tabs.Content>
              </Box>
            </Tabs.Root>

            <Separator size="4" />
            
            <Flex gap="3" justify="end">
              <Button 
                variant="soft" 
                color="gray" 
                onClick={handleClose}
              >
                Cancel
              </Button>
              <Button 
                onClick={handleSubmit}
              >
                <PlusIcon />
                Create Group
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

export default WorkspaceCreationModal;
