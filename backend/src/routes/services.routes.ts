import { Router } from 'express';
import { createService, getServices, deleteService, getServiceById } from '../controllers/services.controller';
import { authenticateToken, optionalAuth } from '../middleware/auth.middleware';

const router = Router();

router.get('/', optionalAuth, getServices);
router.get('/:id', optionalAuth, getServiceById);
router.post('/', authenticateToken, createService);
router.delete('/:id', authenticateToken, deleteService);

export default router;
