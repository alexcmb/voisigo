import { Router } from 'express';
import { getProfile, updateProfile, getPublicProfile, getDashboardStatsController } from '../controllers/user.controller';
import { authenticateToken } from '../middleware/auth.middleware';

const router = Router();

router.get('/profile', authenticateToken, getProfile);
router.put('/profile', authenticateToken, updateProfile);
router.get('/dashboard-stats', authenticateToken, getDashboardStatsController);
router.get('/:id/public', getPublicProfile);

export default router;
