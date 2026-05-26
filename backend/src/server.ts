import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import dotenv from 'dotenv';
import { initDb } from './utils/db';
import authRoutes from './routes/auth.routes';
import tripsRoutes from './routes/trips.routes';
import servicesRoutes from './routes/services.routes';
import userRoutes from './routes/user.routes';
import messagesRoutes from './routes/messages.routes';
import notificationsRoutes from './routes/notifications.routes';
import reviewsRoutes from './routes/reviews.routes';
import bookingsRoutes from './routes/bookings.routes';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(helmet());

// CORS — autorise localhost (dev) + tous les *.vercel.app (demo) + origines configurées
const allowedOrigins = process.env.ALLOWED_ORIGINS
    ? process.env.ALLOWED_ORIGINS.split(',').map(o => o.trim())
    : [];

app.use(cors({
    origin: (origin, callback) => {
        if (!origin) return callback(null, true); // curl, Postman, etc.
        if (origin.startsWith('http://localhost')) return callback(null, true);
        if (origin.endsWith('.vercel.app')) return callback(null, true);
        if (allowedOrigins.some(o => origin.startsWith(o))) return callback(null, true);
        callback(new Error(`CORS bloqué pour l'origine: ${origin}`));
    },
    credentials: true,
}));

app.use(express.json());

app.use('/api/auth', authRoutes);
app.use('/api/trips', tripsRoutes);
app.use('/api/services', servicesRoutes);
app.use('/api/users', userRoutes);
app.use('/api/messages', messagesRoutes);
app.use('/api/notifications', notificationsRoutes);
app.use('/api/reviews', reviewsRoutes);
app.use('/api/bookings', bookingsRoutes);

app.get('/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date() });
});

// Global JSON error handler (évite les réponses HTML sur les erreurs Express)
app.use((err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
    console.error(err.message);
    res.status(500).json({ message: err.message || 'Internal server error' });
});

initDb()
    .then(() => {
        app.listen(PORT, () => {
            console.log(`Server running on port ${PORT}`);
        });
    })
    .catch(err => {
        console.error('❌ Failed to initialize database:', err);
        process.exit(1);
    });
