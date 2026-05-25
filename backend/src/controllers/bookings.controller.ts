import { Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import {
    createBooking as dbCreateBooking,
    getBookingsForTrip,
    getBookingsForUser,
    getAvailableSeats,
    hasAlreadyBooked,
    findBookingById,
    cancelBooking as dbCancelBooking,
    findTripById,
    findUserById,
    createNotification,
    updateBookingStatus,
    Booking,
    Notification,
} from '../utils/db';
import { z } from 'zod';
import { AuthRequest } from '../middleware/auth.middleware';

const createBookingSchema = z.object({
    tripId: z.string(),
    seats: z.number().min(1).default(1),
});

// POST /api/bookings — Reserve a seat
export const createBooking = (req: AuthRequest, res: Response) => {
    try {
        if (!req.user) {
            res.status(401).json({ message: 'Unauthorized' });
            return;
        }

        const data = createBookingSchema.parse(req.body);
        const trip = findTripById(data.tripId);

        if (!trip) {
            res.status(404).json({ message: 'Trip not found' });
            return;
        }

        if (trip.driverId === req.user.userId) {
            res.status(400).json({ message: 'Cannot book your own trip' });
            return;
        }

        if (hasAlreadyBooked(data.tripId, req.user.userId)) {
            res.status(409).json({ message: 'Already booked this trip' });
            return;
        }

        const available = getAvailableSeats(data.tripId);
        if (available < data.seats) {
            res.status(400).json({ message: `Not enough seats available (${available} left)` });
            return;
        }

        const passenger = findUserById(req.user.userId);
        const booking: Booking = {
            id: uuidv4(),
            tripId: data.tripId,
            passengerId: req.user.userId,
            passengerName: passenger?.name || 'Unknown',
            seats: data.seats,
            status: 'pending',
            createdAt: new Date().toISOString(),
        };

        dbCreateBooking(booking);

        // Notify the driver
        const notif: Notification = {
            id: uuidv4(),
            userId: trip.driverId,
            type: 'new_booking_request',
            title: 'Nouvelle demande de réservation',
            message: `${passenger?.name || 'Quelqu\'un'} souhaite réserver ${data.seats} place(s) sur votre trajet ${trip.departure} → ${trip.destination}`,
            relatedType: 'trip',
            relatedId: trip.id,
            read: 0,
            createdAt: new Date().toISOString(),
        };
        createNotification(notif);

        res.status(201).json({ booking, message: 'Booking request sent' });
    } catch (error: any) {
        res.status(400).json({ message: error.message || 'Error creating booking' });
    }
};

// DELETE /api/bookings/:id — Cancel a booking
export const cancelBookingController = (req: AuthRequest, res: Response) => {
    if (!req.user) {
        res.status(401).json({ message: 'Unauthorized' });
        return;
    }

    const bookingId = req.params.id as string;
    const booking = findBookingById(bookingId);

    if (!booking) {
        res.status(404).json({ message: 'Booking not found' });
        return;
    }

    if (booking.passengerId !== req.user.userId) {
        res.status(403).json({ message: 'Access denied' });
        return;
    }

    dbCancelBooking(bookingId);

    // Notify the driver
    const trip = findTripById(booking.tripId);
    if (trip) {
        const notif: Notification = {
            id: uuidv4(),
            userId: trip.driverId,
            type: 'booking_cancelled',
            title: 'Réservation annulée',
            message: `${booking.passengerName} a annulé sa réservation sur ${trip.departure} → ${trip.destination}`,
            relatedType: 'trip',
            relatedId: trip.id,
            read: 0,
            createdAt: new Date().toISOString(),
        };
        createNotification(notif);
    }

    res.json({ success: true });
};

// GET /api/bookings/trip/:tripId — Passengers for a trip
export const getTripPassengers = (req: AuthRequest, res: Response) => {
    if (!req.user) {
        res.status(401).json({ message: 'Unauthorized' });
        return;
    }

    const tripId = req.params.tripId as string;
    const trip = findTripById(tripId);

    if (!trip) {
        res.status(404).json({ message: 'Trip not found' });
        return;
    }

    const bookings = getBookingsForTrip(tripId);
    const available = getAvailableSeats(tripId);
    res.json({ bookings, availableSeats: available, totalSeats: trip.seats });
};

// GET /api/bookings/my — My bookings
export const getMyBookings = (req: AuthRequest, res: Response) => {
    if (!req.user) {
        res.status(401).json({ message: 'Unauthorized' });
        return;
    }

    const bookings = getBookingsForUser(req.user.userId);
    res.json(bookings);
};

// GET /api/bookings/seats/:tripId — Available seats (public)
export const getSeats = (req: AuthRequest, res: Response) => {
    const tripId = req.params.tripId as string;
    const available = getAvailableSeats(tripId);
    const trip = findTripById(tripId);
    res.json({ availableSeats: available, totalSeats: trip?.seats || 0 });
};

// PATCH /api/bookings/:id/approve — Approve a booking
export const approveBooking = (req: AuthRequest, res: Response) => {
    try {
        if (!req.user) {
            res.status(401).json({ message: 'Unauthorized' });
            return;
        }

        const bookingId = req.params.id as string;
        const booking = findBookingById(bookingId);

        if (!booking) {
            res.status(404).json({ message: 'Booking not found' });
            return;
        }

        const trip = findTripById(booking.tripId);
        if (!trip) {
            res.status(404).json({ message: 'Trip not found' });
            return;
        }

        if (trip.driverId !== req.user.userId) {
            res.status(403).json({ message: 'Only driver can approve bookings' });
            return;
        }

        if (booking.status !== 'pending') {
            res.status(400).json({ message: `Booking is already ${booking.status}` });
            return;
        }

        const available = getAvailableSeats(trip.id);
        if (available < booking.seats) {
            res.status(400).json({ message: `Not enough seats available (${available} left)` });
            return;
        }

        updateBookingStatus(bookingId, 'confirmed');

        // Notify passenger
        const notif: Notification = {
            id: uuidv4(),
            userId: booking.passengerId,
            type: 'booking_approved',
            title: 'Réservation validée ! ✅',
            message: `Votre demande pour ${trip.departure} → ${trip.destination} a été acceptée !`,
            relatedType: 'trip',
            relatedId: trip.id,
            read: 0,
            createdAt: new Date().toISOString(),
        };
        createNotification(notif);

        res.json({ message: 'Booking approved', booking: { ...booking, status: 'confirmed' } });
    } catch (error: any) {
        res.status(400).json({ message: error.message || 'Error approving booking' });
    }
};

// PATCH /api/bookings/:id/reject — Reject a booking
export const rejectBooking = (req: AuthRequest, res: Response) => {
    try {
        if (!req.user) {
            res.status(401).json({ message: 'Unauthorized' });
            return;
        }

        const bookingId = req.params.id as string;
        const booking = findBookingById(bookingId);

        if (!booking) {
            res.status(404).json({ message: 'Booking not found' });
            return;
        }

        const trip = findTripById(booking.tripId);
        if (!trip) {
            res.status(404).json({ message: 'Trip not found' });
            return;
        }

        if (trip.driverId !== req.user.userId) {
            res.status(403).json({ message: 'Only driver can reject bookings' });
            return;
        }

        if (booking.status !== 'pending') {
            res.status(400).json({ message: `Booking is already ${booking.status}` });
            return;
        }

        updateBookingStatus(bookingId, 'rejected');

        // Notify passenger
        const notif: Notification = {
            id: uuidv4(),
            userId: booking.passengerId,
            type: 'booking_rejected',
            title: 'Réservation refusée ❌',
            message: `Votre demande pour ${trip.departure} → ${trip.destination} a été refusée.`,
            relatedType: 'trip',
            relatedId: trip.id,
            read: 0,
            createdAt: new Date().toISOString(),
        };
        createNotification(notif);

        res.json({ message: 'Booking rejected', booking: { ...booking, status: 'rejected' } });
    } catch (error: any) {
        res.status(400).json({ message: error.message || 'Error rejecting booking' });
    }
};
