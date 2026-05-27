import { Router } from 'express';
import { register, login } from '../controllers/auth.controller';
import rateLimit from 'express-rate-limit';

const router = Router();

const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 20, // Max 20 requêtes par IP par 15min
    message: { message: 'Trop de tentatives depuis cette adresse IP. Veuillez réessayer dans 15 minutes.' },
    standardHeaders: true,
    legacyHeaders: false,
});

router.post('/register', authLimiter, register);
router.post('/login', authLimiter, login);

export default router;
