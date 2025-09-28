import { useState } from 'react';

export function useNotification() {
  const [showNotification, setShowNotification] = useState(false);
  const [notificationMessage, setNotificationMessage] = useState('');
  const [notificationType, setNotificationType] = useState('success');

  const showSuccess = (message) => {
    setNotificationMessage(message);
    setNotificationType('success');
    setShowNotification(true);
    setTimeout(() => {
      setShowNotification(false);
    }, 4000);
  };

  const showError = (message) => {
    setNotificationMessage(message);
    setNotificationType('error');
    setShowNotification(true);
    setTimeout(() => {
      setShowNotification(false);
    }, 4000);
  };

  const showInfo = (message) => {
    setNotificationMessage(message);
    setNotificationType('info');
    setShowNotification(true);
    setTimeout(() => {
      setShowNotification(false);
    }, 4000);
  };

  const hideNotification = () => {
    setShowNotification(false);
  };

  return {
    showNotification,
    notificationMessage,
    notificationType,
    showSuccess,
    showError,
    showInfo,
    hideNotification
  };
}