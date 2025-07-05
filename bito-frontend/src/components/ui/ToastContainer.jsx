import React from 'react';
import * as Toast from '@radix-ui/react-toast';
import { 
  CheckCircledIcon, 
  ExclamationTriangleIcon, 
  InfoCircledIcon, 
  Cross2Icon 
} from '@radix-ui/react-icons';
import { useNotifications } from '../../contexts/NotificationContext';

const getIcon = (type) => {
  switch (type) {
    case 'success':
      return <CheckCircledIcon className="w-5 h-5 text-green-500" />;
    case 'error':
      return <ExclamationTriangleIcon className="w-5 h-5 text-red-500" />;
    case 'warning':
      return <ExclamationTriangleIcon className="w-5 h-5 text-yellow-500" />;
    case 'info':
      return <InfoCircledIcon className="w-5 h-5 text-blue-500" />;
    default:
      return <InfoCircledIcon className="w-5 h-5 text-gray-500" />;
  }
};

const getStyles = (type) => {
  const baseStyles = "glass-card border-l-4 rounded-xl p-4 shadow-lg backdrop-blur-sm";
  
  switch (type) {
    case 'success':
      return `${baseStyles} border-l-green-500 bg-green-50/80 dark:bg-green-900/20`;
    case 'error':
      return `${baseStyles} border-l-red-500 bg-red-50/80 dark:bg-red-900/20`;
    case 'warning':
      return `${baseStyles} border-l-yellow-500 bg-yellow-50/80 dark:bg-yellow-900/20`;
    case 'info':
      return `${baseStyles} border-l-blue-500 bg-blue-50/80 dark:bg-blue-900/20`;
    default:
      return `${baseStyles} border-l-gray-500 bg-gray-50/80 dark:bg-gray-900/20`;
  }
};

const ToastNotification = ({ notification }) => {
  const { removeNotification } = useNotifications();
  const { id, type, title, message, dismissible } = notification;

  return (
    <Toast.Root
      className={getStyles(type)}
      duration={notification.duration}
      onOpenChange={(open) => {
        if (!open) {
          removeNotification(id);
        }
      }}
    >
      <div className="flex items-start gap-3">
        {getIcon(type)}
        
        <div className="flex-1 min-w-0">
          {title && (
            <Toast.Title className="text-sm font-semibold text-[var(--color-text-primary)] mb-1">
              {title}
            </Toast.Title>
          )}
          <Toast.Description className="text-sm text-[var(--color-text-secondary)]">
            {message}
          </Toast.Description>
        </div>

        {dismissible && (
          <Toast.Close
            className="p-1 rounded-lg hover:bg-black/10 dark:hover:bg-white/10 transition-colors"
            onClick={() => removeNotification(id)}
          >
            <Cross2Icon className="w-4 h-4 text-[var(--color-text-tertiary)]" />
          </Toast.Close>
        )}
      </div>
    </Toast.Root>
  );
};

export const ToastContainer = () => {
  const { notifications } = useNotifications();

  return (
    <Toast.Provider swipeDirection="right" duration={4000}>
      {notifications.map(notification => (
        <ToastNotification key={notification.id} notification={notification} />
      ))}
      
      <Toast.Viewport className="fixed bottom-6 right-6 flex flex-col-reverse gap-3 w-full max-w-sm z-50" />
    </Toast.Provider>
  );
};

export default ToastContainer;
