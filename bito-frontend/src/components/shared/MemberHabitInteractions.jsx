import React, { useState } from 'react';
import {
  HeartIcon,
  ChatBubbleIcon,
  StarIcon,
  ExclamationTriangleIcon,
  CheckCircledIcon,
  Cross2Icon,
  PaperPlaneIcon
} from '@radix-ui/react-icons';
import { Button, Text, Flex, Box, TextArea, Dialog, Card } from '@radix-ui/themes';

const MemberHabitInteractions = ({ 
  habit, 
  member, 
  currentUser, 
  workspace,
  onSendEncouragement,
  onCelebrate,
  onReportConcern,
  canInteract = true
}) => {
  const [showEncouragementDialog, setShowEncouragementDialog] = useState(false);
  const [showConcernDialog, setShowConcernDialog] = useState(false);
  const [encouragementMessage, setEncouragementMessage] = useState('');
  const [concernMessage, setConcernMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Check if interactions are allowed based on habit settings and workspace permissions
  const interactionsAllowed = canInteract && 
    habit.workspaceSettings?.allowMemberAccess && 
    habit.workspaceSettings?.shareProgress !== 'private';

  const handleSendEncouragement = async () => {
    if (!encouragementMessage.trim()) return;
    
    setIsSubmitting(true);
    try {
      await onSendEncouragement(habit._id, encouragementMessage);
      setEncouragementMessage('');
      setShowEncouragementDialog(false);
    } catch (error) {
      console.error('Error sending encouragement:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCelebrate = async () => {
    try {
      await onCelebrate(habit._id);
    } catch (error) {
      console.error('Error celebrating:', error);
    }
  };

  const handleReportConcern = async () => {
    if (!concernMessage.trim()) return;
    
    setIsSubmitting(true);
    try {
      await onReportConcern(habit._id, concernMessage);
      setConcernMessage('');
      setShowConcernDialog(false);
    } catch (error) {
      console.error('Error reporting concern:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!interactionsAllowed) {
    return (
      <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-gray-100 text-gray-500">
        <ExclamationTriangleIcon className="w-4 h-4" />
        <Text size="2">Private habit - interactions disabled</Text>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2">
      {/* Celebrate/Cheer Button */}
      <Button
        size="2"
        variant="soft"
        color="green"
        onClick={handleCelebrate}
        className="flex items-center gap-2"
      >
        <StarIcon className="w-4 h-4" />
        Cheer
      </Button>

      {/* Send Encouragement */}
      <Dialog.Root open={showEncouragementDialog} onOpenChange={setShowEncouragementDialog}>
        <Dialog.Trigger asChild>
          <Button
            size="2"
            variant="soft"
            color="blue"
            className="flex items-center gap-2"
          >
            <HeartIcon className="w-4 h-4" />
            Encourage
          </Button>
        </Dialog.Trigger>
        <Dialog.Content style={{ maxWidth: 450 }}>
          <Dialog.Title>Send Encouragement</Dialog.Title>
          <Dialog.Description size="2" mb="4">
            Send a motivational message to {member.name} about their "{habit.name}" habit.
          </Dialog.Description>

          <Box mb="4">
            <TextArea
              placeholder="Write an encouraging message..."
              value={encouragementMessage}
              onChange={(e) => setEncouragementMessage(e.target.value)}
              rows={3}
            />
          </Box>

          <Flex gap="3" mt="4" justify="end">
            <Dialog.Close asChild>
              <Button variant="soft" color="gray">
                Cancel
              </Button>
            </Dialog.Close>
            <Button
              onClick={handleSendEncouragement}
              disabled={!encouragementMessage.trim() || isSubmitting}
            >
              <PaperPlaneIcon className="w-4 h-4 mr-2" />
              {isSubmitting ? 'Sending...' : 'Send'}
            </Button>
          </Flex>
        </Dialog.Content>
      </Dialog.Root>

      {/* Report Concern (for team leaders/managers) */}
      {workspace.userRole === 'admin' || workspace.userRole === 'manager' ? (
        <Dialog.Root open={showConcernDialog} onOpenChange={setShowConcernDialog}>
          <Dialog.Trigger asChild>
            <Button
              size="2"
              variant="soft"
              color="orange"
              className="flex items-center gap-2"
            >
              <ChatBubbleIcon className="w-4 h-4" />
              Check-in
            </Button>
          </Dialog.Trigger>
          <Dialog.Content style={{ maxWidth: 450 }}>
            <Dialog.Title>Team Check-in</Dialog.Title>
            <Dialog.Description size="2" mb="4">
              Send a supportive check-in message to {member.name} about their "{habit.name}" habit.
            </Dialog.Description>

            <Box mb="4">
              <TextArea
                placeholder="Hey! I noticed you might be struggling with this habit. How can the team support you?"
                value={concernMessage}
                onChange={(e) => setConcernMessage(e.target.value)}
                rows={3}
              />
            </Box>

            <Flex gap="3" mt="4" justify="end">
              <Dialog.Close asChild>
                <Button variant="soft" color="gray">
                  Cancel
                </Button>
              </Dialog.Close>
              <Button
                onClick={handleReportConcern}
                disabled={!concernMessage.trim() || isSubmitting}
              >
                <PaperPlaneIcon className="w-4 h-4 mr-2" />
                {isSubmitting ? 'Sending...' : 'Send Check-in'}
              </Button>
            </Flex>
          </Dialog.Content>
        </Dialog.Root>
      ) : null}
    </div>
  );
};

export default MemberHabitInteractions;
