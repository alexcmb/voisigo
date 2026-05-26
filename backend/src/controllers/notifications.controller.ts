import { Response } from 'express';
import {
    getNotificationsForUser,
    getUnreadNotificationCount,
    markNotificationRead,
    markAllNotificationsRead,
} from '../utils/db';
import { AuthRequest } from '../middleware/auth.middleware';

// GET /api/notifications
export const listNotifications = async (req: AuthRequest, res: Response) => {
    if (!req.user) {
        res.status(401).json({ message: 'Unauthorized' });
        return;
    }

    const notifications = await getNotificationsForUser(req.user.userId);
    const unreadCount = await getUnreadNotificationCount(req.user.userId);
    res.json({ notifications, unreadCount });
};

// GET /api/notifications/unread-count
export const unreadCount = async (req: AuthRequest, res: Response) => {
    if (!req.user) {
        res.status(401).json({ message: 'Unauthorized' });
        return;
    }

    const count = await getUnreadNotificationCount(req.user.userId);
    res.json({ unreadCount: count });
};

// PATCH /api/notifications/:id/read
export const markRead = async (req: AuthRequest, res: Response) => {
    if (!req.user) {
        res.status(401).json({ message: 'Unauthorized' });
        return;
    }

    const id = req.params.id as string;
    await markNotificationRead(id, req.user.userId);
    res.json({ success: true });
};

// PATCH /api/notifications/read-all
export const markAllRead = async (req: AuthRequest, res: Response) => {
    if (!req.user) {
        res.status(401).json({ message: 'Unauthorized' });
        return;
    }

    await markAllNotificationsRead(req.user.userId);
    res.json({ success: true });
};
