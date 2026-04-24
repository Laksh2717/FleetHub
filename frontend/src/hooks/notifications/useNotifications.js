import { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useCurrentUser } from "../auth/useCurrentUser";
import config from "../../config";
import toast from "react-hot-toast";
import {
  getNotifications,
  getUnreadCount,
  markAllNotificationsAsRead,
} from "../../services/notifications/notification.service";

export const getNotificationRoute = (type, shipmentId) => {
  switch (type) {
    // carrier
    case "BID_ACCEPTED":        return `/carrier/dashboard/active-shipments`;
    case "BID_REJECTED":        return `/carrier/dashboard/bids?tab=rejected`;
    case "SHIPMENT_EXPIRED_BID": return `/carrier/dashboard/bids?tab=cancelled`;
    case "SHIPMENT_CANCELLED_BID": return `/carrier/dashboard/bids?tab=cancelled`;
    case "PICKUP_REMINDER":     return `/carrier/dashboard/active-shipments`;
    case "PAYMENT_RECEIVED":    return `/carrier/dashboard/shipment-history/${shipmentId}`;
    case "RATING_RECEIVED":     return `/carrier/dashboard/shipment-history/${shipmentId}`;

    // shipper
    case "FIRST_BID":           return `/shipper/dashboard/unassigned-shipments`;
    case "BIDDING_DEADLINE_SOON": return `/shipper/dashboard/unassigned-shipments`;
    case "BIDDING_DEADLINE_PASSED": return `/shipper/dashboard/unassigned-shipments`;
    case "NO_ASSIGNMENT_REMINDER": return `/shipper/dashboard/unassigned-shipments`;
    case "EXPIRY_WARNING":      return `/shipper/dashboard/unassigned-shipments`;
    case "SHIPMENT_EXPIRED":    return `/shipper/dashboard/unassigned-shipments?tab=expired`;
    case "PICKUP_CONFIRMED":    return `/shipper/dashboard/active-shipments`;
    case "DELIVERY_CONFIRMED":  return `/shipper/dashboard/pending-payments`;
    case "PAYMENT_REMINDER":    return `/shipper/dashboard/pending-payments`;
    case "RATING_REMINDER":     return `/shipper/dashboard/shipment-history`;

    default: return null;
  }
};

export default function useNotifications() {
  const { user } = useCurrentUser();
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const [showAll, setShowAll] = useState(false);
  const eventSourceRef = useRef(null);

  // ─── fetch unread count ────────────────────────────────
  const fetchUnreadCount = useCallback(async () => {
    try {
      const count = await getUnreadCount();
      setUnreadCount(count);
    } catch (err) {
      console.error("Failed to fetch unread count:", err);
    }
  }, []);

  // ─── SSE connection ────────────────────────────────────
  const connectSSE = useCallback(function connectSSE() {
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
    }

    eventSourceRef.current = new EventSource(
      `${config.apiBaseUrl}/notifications/stream`,
      { withCredentials: true }
    );

    eventSourceRef.current.onmessage = (event) => {
      const data = JSON.parse(event.data);
      if (data.type === "CONNECTED") return;

      setNotifications((prev) => [data, ...prev]);
      setUnreadCount((prev) => prev + 1);
      toast(`🔔 ${data.message}`, { duration: 4000 });
    };

    eventSourceRef.current.onerror = (err) => {
      console.log("SSE error:", err);
      console.log("SSE readyState:", eventSourceRef.current.readyState);
      eventSourceRef.current.close();
      eventSourceRef.current = null;
      setTimeout(() => {
        if (!eventSourceRef.current) connectSSE();
      }, 5000);
    };
  }, []);

  // ─── start SSE on auth ─────────────────────────────────
  useEffect(() => {
    if (!user?._id) {
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
        eventSourceRef.current = null;
      }
      setNotifications([]);
      setUnreadCount(0);
      delete window.__reconnectSSE;
      return;
    }

    fetchUnreadCount();
    const sseDelay = setTimeout(() => {
    connectSSE();
    window.__reconnectSSE = connectSSE;
  }, 2000); // 2s delay

    return () => {
    clearTimeout(sseDelay);
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
    }
    delete window.__reconnectSSE;
  };
  }, [user?._id, connectSSE, fetchUnreadCount]);
  
  useEffect(() => {
    console.log("useNotifications mounted");
    return () => {
      console.log("useNotifications unmounted");
    };
  }, []);

  // ─── fetch notifications ───────────────────────────────
  const fetchNotifications = async (all = false) => {
    try {
      const data = await getNotifications(all);
      setNotifications(data.notifications ?? []);
    } catch (err) {
      console.error("Failed to fetch notifications:", err);
    }
  };

  // ─── bell click → open panel ──────────────────────────
  const handleBellClick = async () => {
    const opening = !isOpen;
    setIsOpen(opening);
    if (opening) {
      setShowAll(false);
      await fetchNotifications(false);
    } else {
      await handlePanelClose();
    }
  };

  // ─── close panel → mark all as read ───────────────────
  const handlePanelClose = async () => {
    setIsOpen(false);
    setShowAll(false);
    if (unreadCount > 0) {
      try {
        await markAllNotificationsAsRead();
        setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
        setUnreadCount(0);
      } catch (err) {
        console.error("Failed to mark all as read on close:", err);
      }
    }
  };

  // ─── view past 30 days ─────────────────────────────────
  const handleViewAll = async () => {
    setShowAll(true);
    await fetchNotifications(true);
  };

  // ─── mark all as read button ───────────────────────────
  const markAllAsRead = async () => {
    try {
      await markAllNotificationsAsRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      setUnreadCount(0);
    } catch (err) {
      console.error("Failed to mark all as read:", err);
    }
  };

  // ─── notification click → navigate ────────────────────
  const handleNotificationClick = async (notification) => {
    // close panel + mark all read
    await handlePanelClose();

    // navigate to relevant page
    const route = getNotificationRoute(
      notification.type,
      notification.shipmentId
    );
    if (route) navigate(route);
  };

  return {
    notifications,
    unreadCount,
    isOpen,
    showAll,
    handleBellClick,
    handlePanelClose,
    handleViewAll,
    markAllAsRead,
    handleNotificationClick,
  };
}