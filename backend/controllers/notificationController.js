// backend/controllers/notificationController.js
import Notification from '../models/Notification.js';

// Get user's notifications
export const getNotifications = async (req, res) => {
  try {
    const { limit = 20, page = 1 } = req.query;
    const skip = (page - 1) * limit;

    const notifications = await Notification.find({ recipient: req.user._id })
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .skip(skip)
      .populate('sender', 'username avatar')
      .populate('relatedPost', 'content image')
      .populate('relatedComment', 'content')
      .lean();

    const unreadCount = await Notification.getUnreadCount(req.user._id);

    res.status(200).json({
      notifications,
      unreadCount,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        hasMore: notifications.length === parseInt(limit)
      }
    });
  } catch (err) {
    console.error('Error fetching notifications:', err);
    res.status(500).json({ message: 'Error fetching notifications' });
  }
};

// Get unread count only
export const getUnreadCount = async (req, res) => {
  try {
    const unreadCount = await Notification.getUnreadCount(req.user._id);
    res.status(200).json({ unreadCount });
  } catch (err) {
    console.error('Error fetching unread count:', err);
    res.status(500).json({ message: 'Error fetching unread count' });
  }
};

// Mark single notification as read
export const markAsRead = async (req, res) => {
  try {
    const { notificationId } = req.params;

    const notification = await Notification.findOne({
      _id: notificationId,
      recipient: req.user._id
    });

    if (!notification) {
      return res.status(404).json({ message: 'Notification not found' });
    }

    await notification.markAsRead();

    res.status(200).json({ message: 'Notification marked as read' });
  } catch (err) {
    console.error('Error marking notification as read:', err);
    res.status(500).json({ message: 'Error marking notification as read' });
  }
};

// Mark all notifications as read
export const markAllAsRead = async (req, res) => {
  try {
    await Notification.markAllAsRead(req.user._id);
    res.status(200).json({ message: 'All notifications marked as read' });
  } catch (err) {
    console.error('Error marking all notifications as read:', err);
    res.status(500).json({ message: 'Error marking all notifications as read' });
  }
};

// Delete a notification
export const deleteNotification = async (req, res) => {
  try {
    const { notificationId } = req.params;

    const notification = await Notification.findOne({
      _id: notificationId,
      recipient: req.user._id
    });

    if (!notification) {
      return res.status(404).json({ message: 'Notification not found' });
    }

    await Notification.findByIdAndDelete(notificationId);
    res.status(200).json({ message: 'Notification deleted' });
  } catch (err) {
    console.error('Error deleting notification:', err);
    res.status(500).json({ message: 'Error deleting notification' });
  }
};

// Helper function to create notification (used by other controllers)
export const createNotification = async (data) => {
  try {
    return await Notification.createNotification(data);
  } catch (err) {
    console.error('Error creating notification:', err);
    return null;
  }
};