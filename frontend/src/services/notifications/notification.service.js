import axios from "../../utils/axios";

export const getNotifications = async (all = false) => {
  const params = all ? '?all=true' : '?limit=15';
  const res = await axios.get(`/notifications${params}`);
  return res.data.data;
};

export const getUnreadCount = async () => {
  const res = await axios.get("/notifications/unread-count");
  return res.data.data.unreadCount ?? 0;
};

export const markNotificationAsRead = async (notifId) => {
  const res = await axios.patch(`/notifications/${notifId}/read`);
  return res.data.data;
};

export const markAllNotificationsAsRead = async () => {
  const res = await axios.patch("/notifications/read-all");
  return res.data.data;
};