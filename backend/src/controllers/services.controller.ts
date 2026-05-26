import { Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { findUserById, getServices as dbGetServices, createService as dbCreateService, findServiceById, deleteServiceById, Service } from '../utils/db';
import { z } from 'zod';
import { AuthRequest } from '../middleware/auth.middleware';

const serviceSchema = z.object({
    type: z.enum(['request', 'offer']),
    category: z.enum(['courses', 'bricolage', 'jardinage', 'visite', 'autre']),
    title: z.string().min(3),
    description: z.string().min(10),
    location: z.string().optional(),
    lat: z.number().optional(),
    lon: z.number().optional(),
    price: z.number().min(0).optional(),
    date: z.string().optional(),
});

export const createService = async (req: AuthRequest, res: Response) => {
    try {
        if (!req.user) {
            res.status(401).json({ message: 'Unauthorized' });
            return;
        }

        const data = serviceSchema.parse(req.body);
        const author = await findUserById(req.user.userId);
        const authorName = author ? author.name : 'Unknown User';

        const newService: Service = {
            id: uuidv4(),
            authorId: req.user.userId,
            authorName,
            ...data,
            location: data.location,
            lat: data.lat,
            lon: data.lon,
            price: data.price || 0,
            date: data.date || new Date().toISOString(),
            createdAt: new Date().toISOString(),
        };

        await dbCreateService(newService);
        res.status(201).json({ message: 'Service created', service: newService });
    } catch (error: any) {
        res.status(400).json({ message: error.message || 'Validation error' });
    }
};

export const getServices = async (req: AuthRequest, res: Response) => {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const authorId = req.query.my === 'true' && req.user ? req.user.userId : undefined;

    const { services, total } = await dbGetServices(page, limit, authorId);

    res.json({
        data: services,
        meta: {
            total,
            page,
            totalPages: Math.ceil(total / limit),
        }
    });
};

export const deleteService = async (req: AuthRequest, res: Response) => {
    try {
        if (!req.user) {
            res.status(401).json({ message: 'Unauthorized' });
            return;
        }

        const id = req.params.id as string;
        const service = await findServiceById(id);

        if (!service) {
            res.status(404).json({ message: 'Service not found' });
            return;
        }

        if (service.authorId !== req.user.userId) {
            res.status(403).json({ message: 'You can only delete your own services' });
            return;
        }

        await deleteServiceById(id);
        res.json({ message: 'Service deleted successfully' });
    } catch (error: any) {
        res.status(400).json({ message: error.message || 'Error deleting service' });
    }
};
