import { Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import {
    findUserById,
    getTripsEnriched,
    findTripEnrichedById,
    createTrip as dbCreateTrip,
    findTripById,
    deleteTripById,
    completeTripById,
    getBookingsForTrip,
    createNotification,
    Trip,
    Notification,
} from '../utils/db';
import { z } from 'zod';
import { AuthRequest } from '../middleware/auth.middleware';

const tripSchema = z.object({
    departure: z.string().min(2),
    destination: z.string().min(2),
    departureLat: z.number().optional(),
    departureLon: z.number().optional(),
    destinationLat: z.number().optional(),
    destinationLon: z.number().optional(),
    date: z.string(),
    price: z.number().min(0),
    seats: z.number().min(1),
    description: z.string().optional(),
    vehicleType: z.string().optional(),
    fuelType: z.string().optional(),
});

export const createTrip = async (req: AuthRequest, res: Response) => {
    try {
        if (!req.user) {
            res.status(401).json({ message: 'Unauthorized' });
            return;
        }

        const data = tripSchema.parse(req.body);
        const driver = await findUserById(req.user.userId);
        const driverName = driver ? driver.name : 'Unknown Driver';

        const newTrip: Trip = {
            id: uuidv4(),
            driverId: req.user.userId,
            driverName,
            ...data,
            createdAt: new Date().toISOString(),
        };

        await dbCreateTrip(newTrip);
        res.status(201).json({ message: 'Trip created successfully', trip: newTrip });
    } catch (error: any) {
        res.status(400).json({ message: error.message || 'Validation error' });
    }
};

// GET /api/trips — List enriched trips
export const getTrips = async (req: AuthRequest, res: Response) => {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const driverId = req.query.my === 'true' && req.user ? req.user.userId : undefined;

    const { trips, total } = await getTripsEnriched(page, limit, driverId);

    const shaped = trips.map(t => ({
        ...t,
        driverRating: t.driverRatingCount > 0
            ? { avg: t.driverRatingAvg ?? 0, count: t.driverRatingCount }
            : null,
    }));

    res.json({
        data: shaped,
        meta: {
            total,
            page,
            totalPages: Math.ceil(total / limit),
        }
    });
};

// GET /api/trips/:id
export const getTripById = async (req: AuthRequest, res: Response) => {
    const id = req.params.id as string;
    const trip = await findTripEnrichedById(id);

    if (!trip) {
        res.status(404).json({ message: 'Trip not found' });
        return;
    }

    const shaped = {
        ...trip,
        driverRating: trip.driverRatingCount > 0
            ? { avg: trip.driverRatingAvg ?? 0, count: trip.driverRatingCount }
            : null,
    };

    if (req.user && req.user.userId === trip.driverId) {
        const bookings = await getBookingsForTrip(id);
        res.json({ trip: shaped, bookings });
        return;
    }

    res.json({ trip: shaped, bookings: [] });
};

export const deleteTrip = async (req: AuthRequest, res: Response) => {
    try {
        if (!req.user) {
            res.status(401).json({ message: 'Unauthorized' });
            return;
        }

        const id = req.params.id as string;
        const trip = await findTripById(id);

        if (!trip) {
            res.status(404).json({ message: 'Trip not found' });
            return;
        }

        if (trip.driverId !== req.user.userId) {
            res.status(403).json({ message: 'You can only delete your own trips' });
            return;
        }

        await deleteTripById(id);
        res.json({ message: 'Trip deleted successfully' });
    } catch (error: any) {
        res.status(400).json({ message: error.message || 'Error deleting trip' });
    }
};

// PATCH /api/trips/:id/complete
export const completeTrip = async (req: AuthRequest, res: Response) => {
    try {
        if (!req.user) {
            res.status(401).json({ message: 'Unauthorized' });
            return;
        }

        const id = req.params.id as string;
        const trip = await findTripById(id);

        if (!trip) {
            res.status(404).json({ message: 'Trip not found' });
            return;
        }

        if (trip.driverId !== req.user.userId) {
            res.status(403).json({ message: 'Only the driver can complete a trip' });
            return;
        }

        if (trip.completed) {
            res.status(400).json({ message: 'Trip already completed' });
            return;
        }

        await completeTripById(id);

        const bookings = await getBookingsForTrip(id);
        for (const booking of bookings) {
            const notif: Notification = {
                id: uuidv4(),
                userId: booking.passengerId,
                type: 'trip_completed',
                title: 'Trajet terminé !',
                message: `Le trajet ${trip.departure} → ${trip.destination} est terminé. Laissez un avis au conducteur !`,
                relatedType: 'trip',
                relatedId: trip.id,
                read: 0,
                createdAt: new Date().toISOString(),
            };
            await createNotification(notif);
        }

        res.json({ message: 'Trip marked as completed' });
    } catch (error: any) {
        res.status(400).json({ message: error.message || 'Error completing trip' });
    }
};
