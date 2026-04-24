import { useEffect, useMemo, useRef } from "react";
import { FiBell } from "react-icons/fi";
import { formatNotificationTime } from "../../utils/formatters.js";
import useNotifications from "../../hooks/notifications/useNotifications.js";

export default function Topbar({ companyName }) {
  const {
    notifications,
    unreadCount,
    isOpen,
    showAll,
    handleBellClick,
    handlePanelClose,
    handleViewAll,
    markAllAsRead,
    handleNotificationClick
  } = useNotifications();

  const dropdownRef = useRef(null);

  // Close on outside click
  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        handlePanelClose();
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen, handlePanelClose]);

  const displayNotifications = useMemo(() => {
    if (showAll) return notifications;
    return notifications.slice(0, 15);
  }, [notifications, showAll]);

  return (
    <div className="flex items-center justify-between px-8 py-3 border-b border-white/10 bg-black/60">
      {/* Welcome */}
      <div className="text-lg md:text-xl font-semibold text-gray-200">
        Welcome, <span className="text-orange-500">{companyName}</span>
      </div>

      <div className="relative" ref={dropdownRef}>
        <button
          type="button"
          onClick={handleBellClick}
          className="relative inline-flex items-center justify-center h-9 w-9 rounded-full bg-white/5 text-gray-200 border border-white/10 hover:bg-white/10 transition focus:outline-none focus:ring-2 focus:ring-orange-500"
          aria-expanded={isOpen}
          aria-label="Open notifications"
        >
          <span className="sr-only">Notifications</span>
          <FiBell className="h-5 w-5" />
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-orange-500 px-1.5 text-[10px] font-semibold text-black">
              {unreadCount}
            </span>
          )}
        </button>

        {isOpen && (
          <div className="absolute right-0 mt-3 w-96 rounded-2xl border border-white/10 bg-black/95 p-4 shadow-2xl shadow-black/40 backdrop-blur-xl">
            <div className="flex items-center justify-between mb-3">
              <div>
                <h3 className="text-sm font-semibold text-white">Notifications</h3>
                {!showAll && notifications.length > 0 && (
                  <p className="text-xs text-gray-400">
                    {unreadCount} unread notification{unreadCount !== 1 ? "s" : ""}
                  </p>
                )}
              </div>
              {unreadCount > 0 && (
                <button
                  type="button"
                  onClick={markAllAsRead}
                  className="rounded-lg bg-orange-500 px-3 py-1.5 text-xs font-bold text-black hover:bg-orange-600 transition shadow-md hover:shadow-lg"
                >
                  Mark all as read
                </button>
              )}
            </div>

            <div className="max-h-96 overflow-y-auto pr-1 pb-2">
              {displayNotifications.length === 0 ? (
                <div className="px-4 py-8 text-center text-sm text-gray-400">
                  No notifications
                </div>
              ) : (
                <div className="space-y-0">
                  {displayNotifications.map((notification, index) => (
                    <div key={notification.notifId} onClick={() => handleNotificationClick(notification)}>
                      <div
                        className={`px-4 py-3 transition cursor-pointer ${
                          !notification.isRead
                            ? "bg-orange-500/10 text-white"
                            : "text-gray-300 hover:bg-white/5"
                        }`}
                      >
                        <div className="flex items-center justify-between gap-2">
                          <h4 className="text-sm font-semibold text-white">
                            {notification.title}
                          </h4>
                          <span className="text-[10px] uppercase tracking-[0.2em] text-gray-400">
                            {formatNotificationTime(notification.createdAt)}
                          </span>
                        </div>
                        <p className="mt-1 text-sm text-gray-300">
                          {notification.message}
                        </p>
                      </div>
                      {index < displayNotifications.length - 1 && (
                        <div className="mx-4 h-px bg-white/10 rounded-full"></div>
                      )}
                    </div>
                  ))}

                  {!showAll && (
                    <>
                      <div className="mx-4 h-px bg-white/10 rounded-full my-2"></div>
                      <div className="px-4 py-3">
                        <button
                          type="button"
                          onClick={handleViewAll}
                          className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-semibold text-gray-200 transition hover:border-orange-500/30 hover:bg-orange-500/10"
                        >
                          View past 30 days notifications
                        </button>
                      </div>
                    </>
                  )}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
