import { Router } from 'express';
import { getProfile, updateProfile, getPublicProfile, getDashboardStatsController, upgradeProfileToPremium, submitIdentityVerification } from '../controllers/user.controller';
import { authenticateToken } from '../middleware/auth.middleware';

const router = Router();

router.get('/profile', authenticateToken, getProfile);
router.put('/profile', authenticateToken, updateProfile);
router.get('/dashboard-stats', authenticateToken, getDashboardStatsController);
router.post('/profile/upgrade', authenticateToken, upgradeProfileToPremium);
router.post('/profile/verify', authenticateToken, submitIdentityVerification);
router.get('/:id/public', getPublicProfile);

export default router;
