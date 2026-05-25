import { Response } from 'express';
import {
    getNotificationsForUser,
    getUnreadNotificationCount,
    markNotificationRead,
    markAllNotificationsRead,
} from '../utils/db';
import { AuthRequest } from '../middleware/auth.middleware';

// GET /api/notifications — List my notifications + unread count
export const listNotifications = (req: AuthRequest, res: Response) => {
    if (!req.user) {
        res.status(401).json({ message: 'Unauthorized' });
        return;
    }

    const notifications = getNotificationsForUser(req.user.userId);
    const unreadCount = getUnreadNotificationCount(req.user.userId);
    res.json({ notifications, unreadCount });
};

// GET /api/notifications/unread-count — Just the count (for polling)
export const unreadCount = (req: AuthRequest, res: Response) => {
    if (!req.user) {
        res.status(401).json({ message: 'Unauthorized' });
        return;
    }

    const count = getUnreadNotificationCount(req.user.userId);
    res.json({ unreadCount: count });
};

// PATCH /api/notifications/:id/read — Mark one as read
export const markRead = (req: AuthRequest, res: Response) => {
    if (!req.user) {
        res.status(401).json({ message: 'Unauthorized' });
        return;
    }

    const id = req.params.id as string;
    markNotificationRead(id, req.user.userId);
    res.json({ success: true });
};

// PATCH /api/notifications/read-all — Mark all as read
export const markAllRead = (req: AuthRequest, res: Response) => {
    if (!req.user) {
        res.status(401).json({ message: 'Unauthorized' });
        return;
    }

    markAllNotificationsRead(req.user.userId);
    res.json({ success: true });
};
