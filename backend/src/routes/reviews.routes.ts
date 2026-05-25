import { Router } from 'express';
import { createReview, getUserReviews } from '../controllers/reviews.controller';
import { authenticateToken } from '../middleware/auth.middleware';

const router = Router();

router.post('/', authenticateToken, createReview);
router.get('/user/:userId', getUserReviews);

export default router;
