import { Router } from 'express';
import { listNotifications, unreadCount, markRead, markAllRead } from '../controllers/notifications.controller';
import { authenticateToken } from '../middleware/auth.middleware';

const router = Router();

router.get('/', authenticateToken, listNotifications);
router.get('/unread-count', authenticateToken, unreadCount);
router.patch('/:id/read', authenticateToken, markRead);
router.patch('/read-all', authenticateToken, markAllRead);

export default router;
