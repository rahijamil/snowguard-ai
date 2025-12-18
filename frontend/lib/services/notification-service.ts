// ===== lib/services/notification-service.ts - UPDATED =====
import { io, Socket } from "socket.io-client";

export interface Notification {
  id: number;
  user_id: number;
  type: "HAZARD_ALERT" | "ROUTE_UPDATE" | "AI_RESPONSE" | "SYSTEM";
  title: string;
  message: string;
  severity: "INFO" | "WARNING" | "DANGER";
  data?: any;
  read: boolean;
  read_at?: string;
  created_at: string;
}

// Define proper callback types
type NotificationCallback = (notification: Notification) => void;
type UnreadCountCallback = (count: number) => void;
type GenericEventCallback = (...args: any[]) => void;

class NotificationService {
  private socket: Socket | null = null;
  private listeners: Map<string, Set<GenericEventCallback>> = new Map();

  /**
   * Connect to notification service using token from API route
   */
  async connect() {
    if (this.socket?.connected) {
      return;
    }

    try {
      // Get WebSocket token from API route (which has access to httpOnly cookie)
      const response = await fetch("/api/notifications/socket-token");

      if (!response.ok) {
        console.error("Failed to get socket token:", response.statusText);
        return;
      }

      const { token } = await response.json();

      const NOTIFICATION_URL =
        `${process.env.NEXT_PUBLIC_API_URL}/api/notifications` ||
        "http://localhost:8000/api/notifications";

      this.socket = io(NOTIFICATION_URL, {
        auth: { token },
        transports: ["websocket", "polling"],
        reconnection: true,
        reconnectionDelay: 1000,
        reconnectionAttempts: 5,
      });

      this.socket.on("connect", () => {
        console.log("✅ Notification service connected");
      });

      this.socket.on("disconnect", () => {
        console.log("❌ Notification service disconnected");
      });

      // Listen for notifications
      this.socket.on("notification", (notification: Notification) => {
        this.emit("notification", notification);
      });

      // Listen for unread count updates
      this.socket.on("unread-count", (count: number) => {
        this.emit("unread-count", count);
      });

      this.socket.on("connect_error", (error) => {
        console.error("Notification connection error:", error);
      });
    } catch (error) {
      console.error("Failed to connect to notification service:", error);
    }
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }

  // Type-safe event listeners
  on(event: "notification", callback: NotificationCallback): void;
  on(event: "unread-count", callback: UnreadCountCallback): void;
  on(event: string, callback: GenericEventCallback): void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event)!.add(callback);
  }

  off(event: "notification", callback: NotificationCallback): void;
  off(event: "unread-count", callback: UnreadCountCallback): void;
  off(event: string, callback: GenericEventCallback): void {
    this.listeners.get(event)?.delete(callback);
  }

  private emit(event: string, ...args: any[]) {
    this.listeners.get(event)?.forEach((callback) => callback(...args));
  }

  // API Methods - now using Next.js API routes as proxy
  async getNotifications(unreadOnly = false): Promise<Notification[]> {
    const response = await fetch(
      `/api/notifications?unreadOnly=${unreadOnly}`,
      {
        credentials: "include", // Important: include cookies
      }
    );

    if (!response.ok) {
      throw new Error("Failed to fetch notifications");
    }

    const data = await response.json();
    return data.notifications;
  }

  async getUnreadCount(): Promise<number> {
    const response = await fetch("/api/notifications/unread-count", {
      credentials: "include",
    });

    if (!response.ok) {
      throw new Error("Failed to fetch unread count");
    }

    const data = await response.json();
    return data.count;
  }

  async markAsRead(notificationId: number): Promise<void> {
    const response = await fetch(`/api/notifications/${notificationId}/read`, {
      method: "PUT",
      credentials: "include",
    });

    if (!response.ok) {
      throw new Error("Failed to mark as read");
    }
  }

  async markAllAsRead(): Promise<void> {
    const response = await fetch("/api/notifications/mark-all-read", {
      method: "PUT",
      credentials: "include",
    });

    if (!response.ok) {
      throw new Error("Failed to mark all as read");
    }
  }

  async deleteNotification(notificationId: number): Promise<void> {
    const response = await fetch(`/api/notifications/${notificationId}`, {
      method: "DELETE",
      credentials: "include",
    });

    if (!response.ok) {
      throw new Error("Failed to delete notification");
    }
  }
}

export const notificationService = new NotificationService();
