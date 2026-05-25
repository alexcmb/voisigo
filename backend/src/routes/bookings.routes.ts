import { Router } from 'express';
import { createBooking, cancelBookingController, getTripPassengers, getMyBookings, getSeats, approveBooking, rejectBooking } from '../controllers/bookings.controller';
import { authenticateToken } from '../middleware/auth.middleware';

const router = Router();

router.post('/', authenticateToken, createBooking);
router.delete('/:id', authenticateToken, cancelBookingController);
router.get('/trip/:tripId', authenticateToken, getTripPassengers);
router.get('/my', authenticateToken, getMyBookings);
router.get('/seats/:tripId', getSeats);
router.patch('/:id/approve', authenticateToken, approveBooking);
router.patch('/:id/reject', authenticateToken, rejectBooking);

export default router;
