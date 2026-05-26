import { Response } from 'express';
import { findUserById, updateUser, getReviewsForUser, getAverageRating } from '../utils/db';
import { z } from 'zod';
import { AuthRequest } from '../middleware/auth.middleware';

const updateProfileSchema = z.object({
    name: z.string().min(2).optional(),
    bio: z.string().optional(),
    avatarUrl: z.string().optional(),
});

export const getProfile = async (req: AuthRequest, res: Response) => {
    if (!req.user) {
        res.status(401).json({ message: 'Unauthorized' });
        return;
    }

    const user = await findUserById(req.user.userId);
    if (!user) {
        res.status(404).json({ message: 'User not found' });
        return;
    }

    res.json({ id: user.id, name: user.name, email: user.email, bio: user.bio, avatarUrl: user.avatarUrl });
};

export const updateProfile = async (req: AuthRequest, res: Response) => {
    try {
        if (!req.user) {
            res.status(401).json({ message: 'Unauthorized' });
            return;
        }

        const data = updateProfileSchema.parse(req.body);
        const user = await findUserById(req.user.userId);
        if (!user) {
            res.status(404).json({ message: 'User not found' });
            return;
        }

        await updateUser(req.user.userId, data);

        const updated = await findUserById(req.user.userId);
        res.json({
            message: 'Profile updated',
            user: { id: updated!.id, name: updated!.name, email: updated!.email, bio: updated!.bio, avatarUrl: updated!.avatarUrl },
        });
    } catch (error: any) {
        res.status(400).json({ message: error.message || 'Validation error' });
    }
};

// GET /api/users/:id/public
export const getPublicProfile = async (req: AuthRequest, res: Response) => {
    const id = req.params.id as string;
    const user = await findUserById(id);

    if (!user) {
        res.status(404).json({ message: 'Utilisateur introuvable' });
        return;
    }

    const reviews = await getReviewsForUser(id);
    const { avg, count } = await getAverageRating(id);

    res.json({
        user: {
            id: user.id,
            name: user.name,
            bio: user.bio || '',
            avatarUrl: user.avatarUrl || '',
            createdAt: user.createdAt,
        },
        averageRating: Math.round(avg * 10) / 10,
        totalReviews: count,
        reviews,
    });
};
