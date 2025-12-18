// ===== lib/hooks/use-notifications.ts - UPDATED =====
"use client";

import { useEffect, useState, useCallback } from "react";
import { useAuth } from "./use-auth";
import {
  notificationService,
  type Notification,
} from "../services/notification-service";
import { toast } from "sonner";

export function useNotifications() {
  const { isAuthenticated } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);

  const loadNotifications = useCallback(async () => {
    try {
      setLoading(true);
      const data = await notificationService.getNotifications();
      setNotifications(data);
    } catch (error) {
      console.error("Failed to load notifications:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  const loadUnreadCount = useCallback(async () => {
    try {
      const count = await notificationService.getUnreadCount();
      setUnreadCount(count);
    } catch (error) {
      console.error("Failed to load unread count:", error);
    }
  }, []);

  // Connect to notification service
  useEffect(() => {
    if (isAuthenticated) {
      // Connect using API route (no token needed in frontend)
      notificationService.connect();

      // Listen for new notifications
      const handleNotification = (notification: Notification) => {
        setNotifications((prev) => [notification, ...prev]);

        // Show toast notification
        if (notification.severity === "DANGER") {
          toast.error(notification.title, {
            description: notification.message,
          });
        } else {
          toast(notification.title, {
            description: notification.message,
          });
        }

        // Play sound if enabled
        if (typeof Audio !== "undefined") {
          const audio = new Audio("/notification.mp3");
          audio.play().catch(() => {}); // Ignore errors
        }
      };

      const handleUnreadCount = (count: number) => {
        setUnreadCount(count);
      };

      notificationService.on("notification", handleNotification);
      notificationService.on("unread-count", handleUnreadCount);

      // Load initial data
      loadNotifications();
      loadUnreadCount();

      return () => {
        notificationService.off("notification", handleNotification);
        notificationService.off("unread-count", handleUnreadCount);
        notificationService.disconnect();
      };
    }
  }, [isAuthenticated, loadNotifications, loadUnreadCount]);

  const markAsRead = useCallback(async (notificationId: number) => {
    try {
      await notificationService.markAsRead(notificationId);
      setNotifications((prev) =>
        prev.map((n) =>
          n.id === notificationId
            ? { ...n, read: true, read_at: new Date().toISOString() }
            : n
        )
      );
    } catch (error) {
      console.error("Failed to mark as read:", error);
    }
  }, []);

  const markAllAsRead = useCallback(async () => {
    try {
      await notificationService.markAllAsRead();
      setNotifications((prev) =>
        prev.map((n) => ({
          ...n,
          read: true,
          read_at: new Date().toISOString(),
        }))
      );
      setUnreadCount(0);
    } catch (error) {
      console.error("Failed to mark all as read:", error);
    }
  }, []);

  const deleteNotification = useCallback(async (notificationId: number) => {
    try {
      await notificationService.deleteNotification(notificationId);
      setNotifications((prev) => prev.filter((n) => n.id !== notificationId));
    } catch (error) {
      console.error("Failed to delete notification:", error);
    }
  }, []);

  return {
    notifications,
    unreadCount,
    loading,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    refresh: loadNotifications,
  };
}
