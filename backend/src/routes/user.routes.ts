import { Router } from 'express';
import { getProfile, updateProfile, getPublicProfile } from '../controllers/user.controller';
import { authenticateToken } from '../middleware/auth.middleware';

const router = Router();

router.get('/profile', authenticateToken, getProfile);
router.put('/profile', authenticateToken, updateProfile);
router.get('/:id/public', getPublicProfile);

export default router;
