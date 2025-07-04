import React, { useState, useEffect } from 'react';
import { Dialog, Button, Flex, Text, TextField, TextArea, Select } from '@radix-ui/themes';
import { CalendarIcon, InfoCircledIcon, RocketIcon, Cross2Icon, CheckIcon } from '@radix-ui/react-icons';
import { groupsAPI } from '../../services/api';

const ChallengeCreateModal = ({ workspaceId, onClose, onSuccess }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    type: 'streak',
    target: 7,
    duration: 7,
    reward: '🏆 Challenge Completion Badge',
  });
  const [workspaceHabits, setWorkspaceHabits] = useState([]);
  const [selectedHabits, setSelectedHabits] = useState([]);

  // Fetch workspace habits for habit-specific challenges
  useEffect(() => {
    const fetchHabits = async () => {
      try {
        const response = await groupsAPI.getHabits(workspaceId);
        if (response.success && response.habits) {
          setWorkspaceHabits(response.habits);
        }
      } catch (error) {
        // Failed to fetch workspace habits
        setWorkspaceHabits([]);
      }
    };

    if (workspaceId) {
      fetchHabits();
    }
  }, [workspaceId]);

  // Handle form input changes
  const handleChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));

    // Clear errors when user types
    if (error) setError('');
  };

  // Handle habit selection/deselection
  const toggleHabitSelection = (habitId) => {
    if (selectedHabits.includes(habitId)) {
      setSelectedHabits(prev => prev.filter(id => id !== habitId));
    } else {
      setSelectedHabits(prev => [...prev, habitId]);
    }
  };

  // Calculate challenge end date
  const calculateEndDate = () => {
    const start = new Date();
    const end = new Date(start);
    end.setDate(start.getDate() + parseInt(formData.duration, 10));
    return end.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.title) {
      setError('Title is required');
      return;
    }
    
    if (!formData.type) {
      setError('Challenge type is required');
      return;
    }
    
    if (!formData.target || formData.target < 1) {
      setError('Target must be at least 1');
      return;
    }
    
    try {
      setIsLoading(true);
      
      const challengeData = {
        ...formData,
        target: parseInt(formData.target, 10),
        duration: parseInt(formData.duration, 10),
        habitIds: formData.type === 'habit-specific' ? selectedHabits : []
      };
      
      const response = await groupsAPI.createChallenge(workspaceId, challengeData);
      
      if (response.success && response.challenge) {
        onSuccess(response.challenge);
      } else {
        setError(response.error || 'Failed to create challenge');
      }
    } catch (error) {
      setError('An error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog.Root open onOpenChange={onClose}>
      <Dialog.Content style={{ maxWidth: 500 }}>
        <Dialog.Title>Create Group Challenge</Dialog.Title>
        <Dialog.Description size="2" mb="4">
          Create a new challenge for your workspace members
        </Dialog.Description>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-800 rounded-md p-3 mb-4">
            <div className="flex items-center gap-2">
              <InfoCircledIcon className="text-red-500" />
              <span>{error}</span>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <Flex direction="column" gap="3">
            <div>
              <Text as="label" size="2" mb="1" display="block">
                Challenge Title
              </Text>
              <TextField.Input
                placeholder="e.g., 7-Day Streak Challenge"
                value={formData.title}
                onChange={(e) => handleChange('title', e.target.value)}
                required
              />
            </div>

            <div>
              <Text as="label" size="2" mb="1" display="block">
                Description
              </Text>
              <TextArea
                placeholder="Describe the challenge and motivate your team"
                value={formData.description}
                onChange={(e) => handleChange('description', e.target.value)}
                rows={3}
              />
            </div>

            <div>
              <Text as="label" size="2" mb="1" display="block">
                Challenge Type
              </Text>
              <Select.Root 
                value={formData.type}
                onValueChange={(value) => handleChange('type', value)}
              >
                <Select.Trigger />
                <Select.Content>
                  <Select.Group>
                    <Select.Label>Challenge Types</Select.Label>
                    <Select.Item value="streak">Streak Challenge</Select.Item>
                    <Select.Item value="collective">Collective Goal</Select.Item>
                    <Select.Item value="completion">Completion Count</Select.Item>
                    <Select.Item value="habit-specific">Habit-Specific</Select.Item>
                  </Select.Group>
                </Select.Content>
              </Select.Root>
              
              <Text as="p" size="1" color="gray" mt="1">
                {formData.type === 'streak' && 'Complete habits for consecutive days to build a streak'}
                {formData.type === 'collective' && 'Work together to reach a total number of completions'}
                {formData.type === 'completion' && 'Track individual habit completion counts'}
                {formData.type === 'habit-specific' && 'Focus on specific habits for this challenge'}
              </Text>
            </div>

            <Flex gap="3">
              <div style={{ flex: 1 }}>
                <Text as="label" size="2" mb="1" display="block">
                  Target Goal
                </Text>
                <TextField.Input
                  type="number"
                  min="1"
                  value={formData.target}
                  onChange={(e) => handleChange('target', e.target.value)}
                  required
                />
                <Text as="p" size="1" color="gray" mt="1">
                  {formData.type === 'streak' && 'Consecutive days'}
                  {formData.type === 'collective' && 'Total completions'}
                  {formData.type === 'completion' && 'Completions per person'}
                  {formData.type === 'habit-specific' && 'Habit completions'}
                </Text>
              </div>
              
              <div style={{ flex: 1 }}>
                <Text as="label" size="2" mb="1" display="block">
                  Duration (days)
                </Text>
                <TextField.Input
                  type="number"
                  min="1"
                  max="90"
                  value={formData.duration}
                  onChange={(e) => handleChange('duration', e.target.value)}
                  required
                />
                <Text as="p" size="1" color="gray" mt="1">
                  Ends on {calculateEndDate()}
                </Text>
              </div>
            </Flex>
            
            {formData.type === 'habit-specific' && workspaceHabits.length > 0 && (
              <div>
                <Text as="label" size="2" mb="2" display="block">
                  Select Habits for Challenge
                </Text>
                <div className="grid grid-cols-2 gap-2 max-h-32 overflow-y-auto p-1">
                  {workspaceHabits.map(habit => (
                    <div 
                      key={habit.id || habit._id} 
                      className={`p-2 border rounded-md cursor-pointer flex items-center gap-2 ${
                        selectedHabits.includes(habit.id || habit._id) 
                          ? 'border-[var(--color-brand-500)] bg-[var(--color-brand-100)]' 
                          : 'border-[var(--color-border-primary)]'
                      }`}
                      onClick={() => toggleHabitSelection(habit.id || habit._id)}
                    >
                      <div className="w-4 h-4 flex-shrink-0">
                        {selectedHabits.includes(habit.id || habit._id) ? (
                          <CheckIcon className="text-[var(--color-brand-500)]" />
                        ) : null}
                      </div>
                      <span className="text-sm truncate">{habit.name}</span>
                    </div>
                  ))}
                </div>
                {selectedHabits.length === 0 && (
                  <Text as="p" size="1" color="gray" mt="1">
                    Select at least one habit for this challenge
                  </Text>
                )}
              </div>
            )}

            <div>
              <Text as="label" size="2" mb="1" display="block">
                Reward
              </Text>
              <TextField.Input
                placeholder="e.g., 🏆 Challenge Completion Badge"
                value={formData.reward}
                onChange={(e) => handleChange('reward', e.target.value)}
              />
            </div>
          </Flex>

          <Flex gap="3" mt="4" justify="end">
            <Dialog.Close>
              <Button variant="soft" color="gray">
                Cancel
              </Button>
            </Dialog.Close>
            <Button disabled={isLoading} type="submit">
              {isLoading ? (
                <>
                  <span className="animate-spin mr-1">⟳</span>
                  Creating...
                </>
              ) : (
                <>
                  <RocketIcon />
                  Create Challenge
                </>
              )}
            </Button>
          </Flex>
        </form>
      </Dialog.Content>
    </Dialog.Root>
  );
};

export default ChallengeCreateModal;
