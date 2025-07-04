import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { BellIcon, CheckCircledIcon, StarIcon, PersonIcon, TargetIcon, PlusIcon } from '@radix-ui/react-icons';
import { useAuth } from '../../contexts/AuthContext';
import { workspacesAPI } from '../../services/api';

// Map activity types to icons
const iconMap = {
  habit_completed: CheckCircledIcon,
  habit_adopted: PlusIcon,
  streak_milestone: StarIcon,
  goal_achieved: StarIcon,
  member_joined: PersonIcon,
  habit_created: TargetIcon
};

// Generate readable description for a notification
const getDescription = (notif) => {
  const { type, data } = notif;
  switch (type) {
    case 'habit_completed':
      return `${data.habitName || 'A habit'} completed by ${notif.userId.name}`;
    case 'habit_adopted':
      return `${notif.userId.name} adopted ${data.habitName || 'a habit'}`;
    case 'streak_milestone':
      return `🔥 ${notif.userId.name} hit ${data.streakCount || ''} day streak on ${data.habitName || 'a habit'}`;
    case 'goal_achieved':
      return `${notif.userId.name} achieved a goal`;
    case 'member_joined':
      return `${notif.userId.name} joined the group`;
    case 'habit_created':
      return `${notif.userId.name} created ${data.habitName || 'a habit'}`;
    default:
      return notif.data.message || 'New activity';
  }
};

// Format timestamp
const formatTime = (iso) => {
  const date = new Date(iso);
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
};

const NotificationsPanel = ({ show, onClose }) => {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { user } = useAuth();

  useEffect(() => {
    if (show) fetchNotifications();
  }, [show]);

  const fetchNotifications = async () => {
    setLoading(true);
    try {
      const res = await workspacesAPI.getWorkspaces();
      if (res.success) {
        const workspaces = res.workspaces;
        const promises = workspaces.map((w) =>
          workspacesAPI.getWorkspaceActivity(w._id, { limit: 5 })
        );
        const results = await Promise.all(promises);
        const all = [];
        results.forEach((r, i) => {
          if (r.success && r.activities) {
            r.activities.forEach((act) => all.push({ ...act, workspaceId: workspaces[i]._id }));
          }
        });
        all.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        setNotifications(all.slice(0, 50));
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleClick = (notif) => {
    onClose();
    navigate(`/app/groups/${notif.workspaceId}`);
  };

  if (!show) return null;

  return (
    <div className="absolute right-0 mt-2 w-80 max-h-96 bg-[var(--color-surface-elevated)] border border-[var(--color-border-primary)] rounded-lg shadow-lg z-50 overflow-auto">
      {loading ? (
        <div className="p-4 text-center">Loading...</div>
      ) : notifications.length === 0 ? (
        <div className="p-4 text-center">No notifications</div>
      ) : (
        notifications.map((notif, idx) => {
          const Icon = iconMap[notif.type] || BellIcon;
          return (
            <button
              key={idx}
              onClick={() => handleClick(notif)}
              className="w-full text-left px-4 py-2 hover:bg-[var(--color-surface-hover)] flex items-start gap-2"
            >
              <Icon className="w-5 h-5 mt-1 text-[var(--color-text-secondary)]" />
              <div>
                <p className="text-sm text-[var(--color-text-primary)]">{getDescription(notif)}</p>
                <p className="text-xs text-[var(--color-text-tertiary)]">{formatTime(notif.createdAt)}</p>
              </div>
            </button>
          );
        })
      )}
    </div>
  );
};

export default NotificationsPanel;
