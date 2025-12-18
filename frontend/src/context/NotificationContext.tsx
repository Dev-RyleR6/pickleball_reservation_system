import { createContext, useContext, useState, useEffect, useRef, type ReactNode } from "react";
import type { Notification } from "../types/notification";
import { useAuth } from "../hooks/useAuth";

interface NotificationContextType {
  notifications: Notification[];
  unreadCount: number;
  addNotification: (notification: Omit<Notification, "id" | "timestamp" | "read">) => void;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  removeNotification: (id: string) => void;
  clearAll: () => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const NotificationProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const previousUserIdRef = useRef<number | null>(null);

  // Clear notifications when user logs out or changes
  useEffect(() => {
    if (!user) {
      // User logged out - clear all notifications
      setNotifications([]);
      previousUserIdRef.current = null;
      return;
    }

    // User changed - clear old notifications and load new user's notifications
    if (previousUserIdRef.current !== null && previousUserIdRef.current !== user.id) {
      setNotifications([]);
    }

    // Load notifications for current user
    const saved = localStorage.getItem(`notifications_${user.id}`);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        // Convert timestamp strings back to Date objects
        const notificationsWithDates = parsed.map((n: any) => ({
          ...n,
          timestamp: new Date(n.timestamp),
        }));
        setNotifications(notificationsWithDates);
      } catch (err) {
        console.error("Failed to load notifications:", err);
        setNotifications([]);
      }
    } else {
      // No saved notifications for this user - ensure state is empty
      setNotifications([]);
    }

    // Update the ref to track current user
    previousUserIdRef.current = user.id;
  }, [user]);

  // Save notifications to localStorage whenever they change (only if user is logged in)
  useEffect(() => {
    if (!user) return;

    if (notifications.length > 0) {
      localStorage.setItem(`notifications_${user.id}`, JSON.stringify(notifications));
    } else {
      localStorage.removeItem(`notifications_${user.id}`);
    }
  }, [notifications, user]);

  const addNotification = (notification: Omit<Notification, "id" | "timestamp" | "read">) => {
    // Only add notification if user is logged in
    if (!user) {
      console.warn("Cannot add notification: no user logged in");
      return;
    }

    const newNotification: Notification = {
      ...notification,
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date(),
      read: false,
    };
    setNotifications((prev) => [newNotification, ...prev].slice(0, 50)); // Keep last 50 notifications
  };

  const markAsRead = (id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    );
  };

  const markAllAsRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  const removeNotification = (id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  };

  const clearAll = () => {
    setNotifications([]);
  };

  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        unreadCount,
        addNotification,
        markAsRead,
        markAllAsRead,
        removeNotification,
        clearAll,
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (context === undefined) {
    throw new Error("useNotifications must be used within a NotificationProvider");
  }
  return context;
};

