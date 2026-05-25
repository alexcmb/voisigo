import { Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import {
    createReview as dbCreateReview,
    getReviewsForUser,
    getAverageRating,
    hasAlreadyReviewed,
    findUserById,
    findTripById,
    createNotification,
    Review,
    Notification,
} from '../utils/db';
import { z } from 'zod';
import { AuthRequest } from '../middleware/auth.middleware';

const createReviewSchema = z.object({
    targetUserId: z.string(),
    rating: z.number().min(1).max(5),
    comment: z.string().optional().default(''),
    relatedType: z.enum(['trip', 'service']).optional(),
    relatedId: z.string().optional(),
});

// POST /api/reviews — Leave a review
export const createReview = (req: AuthRequest, res: Response) => {
    try {
        if (!req.user) {
            res.status(401).json({ message: 'Unauthorized' });
            return;
        }

        const data = createReviewSchema.parse(req.body);

        if (data.targetUserId === req.user.userId) {
            res.status(400).json({ message: 'Cannot review yourself' });
            return;
        }

        const targetUser = findUserById(data.targetUserId);
        if (!targetUser) {
            res.status(404).json({ message: 'User not found' });
            return;
        }

        // Prevent duplicate review per context
        if (data.relatedType && data.relatedId) {
            if (hasAlreadyReviewed(req.user.userId, data.relatedType, data.relatedId)) {
                res.status(409).json({ message: 'You have already reviewed this' });
                return;
            }
        }

        // For trips: only allow review after driver has marked trip as completed
        if (data.relatedType === 'trip' && data.relatedId) {
            const trip = findTripById(data.relatedId);
            if (!trip) {
                res.status(404).json({ message: 'Trip not found' });
                return;
            }
            if (!trip.completed) {
                res.status(400).json({ message: 'Le trajet n\'est pas encore terminé. Le conducteur doit d\'abord valider la course.' });
                return;
            }
        }

        const reviewer = findUserById(req.user.userId);
        const review: Review = {
            id: uuidv4(),
            reviewerId: req.user.userId,
            reviewerName: reviewer?.name || 'Unknown',
            targetUserId: data.targetUserId,
            rating: data.rating,
            comment: data.comment || '',
            relatedType: data.relatedType,
            relatedId: data.relatedId,
            createdAt: new Date().toISOString(),
        };

        dbCreateReview(review);

        // Notify the reviewed user
        const notif: Notification = {
            id: uuidv4(),
            userId: data.targetUserId,
            type: 'new_review',
            title: 'Nouvel avis reçu',
            message: `${reviewer?.name || 'Quelqu\'un'} vous a donné ${data.rating}⭐`,
            relatedType: 'review',
            relatedId: review.id,
            read: 0,
            createdAt: new Date().toISOString(),
        };
        createNotification(notif);

        res.status(201).json({ review });
    } catch (error: any) {
        res.status(400).json({ message: error.message || 'Error creating review' });
    }
};

// GET /api/reviews/user/:userId — Reviews for a user
export const getUserReviews = (req: AuthRequest, res: Response) => {
    const userId = req.params.userId as string;
    const reviews = getReviewsForUser(userId);
    const rating = getAverageRating(userId);
    res.json({ reviews, averageRating: Math.round(rating.avg * 10) / 10, totalReviews: rating.count });
};
