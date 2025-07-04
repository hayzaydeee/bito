import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  PersonIcon,
  RocketIcon,
  CheckCircledIcon,
  StarIcon,
  CalendarIcon,
  ActivityLogIcon,
  Cross1Icon,
  DotFilledIcon
} from '@radix-ui/react-icons';
import { notificationsAPI } from '../../services/api';

const NotificationsDropdown = ({ isOpen, onClose, onNotificationCountChange }) => {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (isOpen) {
      fetchNotifications();
    }
  }, [isOpen]);

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await notificationsAPI.getNotifications({
        limit: 20,
        types: 'habit_completed,habit_adopted,streak_milestone,member_joined,badge_earned'
      });
      
      setNotifications(response.data?.notifications || []);
      
    } catch (err) {
      console.error('Error fetching notifications:', err);
      setError('Failed to load notifications');
    } finally {
      setLoading(false);
    }
  };

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'habit_completed':
        return <CheckCircledIcon className="w-4 h-4 text-green-500" />;
      case 'habit_adopted':
        return <RocketIcon className="w-4 h-4 text-blue-500" />;
      case 'streak_milestone':
        return <StarIcon className="w-4 h-4 text-yellow-500" />;
      case 'member_joined':
        return <PersonIcon className="w-4 h-4 text-purple-500" />;
      case 'badge_earned':
        return <StarIcon className="w-4 h-4 text-orange-500" />;
      default:
        return <ActivityLogIcon className="w-4 h-4 text-gray-500" />;
    }
  };

  const getNotificationMessage = (notification) => {
    const { type, data, userId } = notification;
    const userName = userId?.name || data?.memberName || 'Someone';
    
    switch (type) {
      case 'habit_completed':
        return `${userName} completed "${data?.habitName || 'a habit'}"`;
      case 'habit_adopted':
        return `${userName} adopted a new habit: "${data?.habitName || 'Unknown'}"`;
      case 'streak_milestone':
        return `${userName} reached a ${data?.streakCount || 0}-day streak!`;
      case 'member_joined':
        return `${userName} joined the workspace`;
      case 'badge_earned':
        return `${userName} earned a new badge!`;
      default:
        return `${userName} had activity in the workspace`;
    }
  };

  const handleNotificationClick = async (notification) => {
    const { workspaceId, type, data, _id } = notification;
    
    // Extract workspaceId as string - handle both object and string cases
    let workspaceIdStr;
    if (typeof workspaceId === 'object' && workspaceId?._id) {
      workspaceIdStr = workspaceId._id.toString();
    } else if (typeof workspaceId === 'string') {
      workspaceIdStr = workspaceId;
    } else {
      console.error('Invalid workspaceId in notification:', notification);
      return;
    }

    // Mark notification as read
    try {
      if (_id && !notification.isRead) {
        await notificationsAPI.markAsRead(_id);
        
        // Update local state to remove or mark the notification as read
        setNotifications(prevNotifications => 
          prevNotifications.filter(n => n._id !== _id)
        );
        
        // Update parent component's notification count
        if (onNotificationCountChange) {
          onNotificationCountChange();
        }
      }
    } catch (error) {
      console.error('Error marking notification as read:', error);
      // Continue with navigation even if marking as read fails
    }
    
    // Navigate based on notification type - using correct routes from App.jsx
    switch (type) {
      case 'habit_completed':
      case 'habit_adopted':
      case 'streak_milestone':
        // Navigate to workspace overview (main group page)
        navigate(`/app/groups/${workspaceIdStr}`);
        break;
      case 'member_joined':
        // Navigate to workspace overview (main group page)
        navigate(`/app/groups/${workspaceIdStr}`);
        break;
      case 'badge_earned':
        // Navigate to user's analytics
        navigate(`/app/analytics`);
        break;
      default:
        // Default to workspace overview
        navigate(`/app/groups/${workspaceIdStr}`);
    }
    
    onClose();
  };

  const formatTimeAgo = (date) => {
    const now = new Date();
    const diffMs = now - new Date(date);
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return new Date(date).toLocaleDateString();
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 z-40" 
        onClick={onClose}
      />
      
      {/* Dropdown */}
      <div className="absolute top-full right-0 mt-2 w-80 bg-[var(--color-surface-elevated)] border border-[var(--color-border-primary)] rounded-lg shadow-lg z-50 max-h-96 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-3 border-b border-[var(--color-border-primary)]">
          <h3 className="font-semibold text-[var(--color-text-primary)]">Notifications</h3>
          <button
            onClick={onClose}
            className="p-1 rounded-lg hover:bg-[var(--color-surface-hover)] transition-colors"
          >
            <Cross1Icon className="w-4 h-4 text-[var(--color-text-secondary)]" />
          </button>
        </div>

        {/* Content */}
        <div className="max-h-80 overflow-y-auto">
          {loading ? (
            <div className="p-4 text-center text-[var(--color-text-secondary)]">
              Loading notifications...
            </div>
          ) : error ? (
            <div className="p-4 text-center text-red-500">
              {error}
            </div>
          ) : notifications.length === 0 ? (
            <div className="p-4 text-center text-[var(--color-text-secondary)]">
              No recent notifications
            </div>
          ) : (
            notifications.map((notification, index) => (
              <div
                key={`${notification._id}-${index}`}
                onClick={() => handleNotificationClick(notification)}
                className="flex items-start gap-3 p-3 hover:bg-[var(--color-surface-hover)] border-b border-[var(--color-border-primary)]/30 cursor-pointer transition-colors last:border-b-0"
              >
                {/* Icon */}
                <div className="flex-shrink-0 mt-0.5">
                  {getNotificationIcon(notification.type)}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-[var(--color-text-primary)] mb-1">
                    {getNotificationMessage(notification)}
                  </p>
                  <div className="flex items-center gap-2 text-xs text-[var(--color-text-secondary)]">
                    <span>{notification.workspaceName || 'Workspace'}</span>
                    <DotFilledIcon className="w-2 h-2" />
                    <span>{formatTimeAgo(notification.createdAt)}</span>
                  </div>
                </div>

                {/* Unread indicator */}
                {!notification.isRead && (
                  <div className="flex-shrink-0">
                    <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </>
  );
};

export default NotificationsDropdown;
