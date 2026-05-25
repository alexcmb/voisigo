import { Router } from 'express';
import { createTrip, getTrips, getTripById, deleteTrip, completeTrip } from '../controllers/trips.controller';
import { authenticateToken, optionalAuth } from '../middleware/auth.middleware';

const router = Router();

// Retrieve all trips (enriched with availableSeats, driverRating, pendingCount)
router.get('/', optionalAuth, getTrips);

// Get a single trip by id (enriched, with bookings if driver)
router.get('/:id', optionalAuth, getTripById);

// Create a trip (protected)
router.post('/', authenticateToken, createTrip);

// Complete a trip (protected, driver only)
router.patch('/:id/complete', authenticateToken, completeTrip);

// Delete a trip (protected, owner only)
router.delete('/:id', authenticateToken, deleteTrip);

export default router;

