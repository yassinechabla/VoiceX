import { Router, Response, Request } from 'express';
import { authenticateJWT, AuthRequest } from '../middleware/auth';
import { Restaurant } from '../models/Restaurant';
import { Table } from '../models/Table';
import { Reservation, ReservationStatus } from '../models/Reservation';
import { checkAndHoldAvailability, confirmReservation, cancelReservation } from '../services/availability';
import { notifyReservationChange } from '../utils/socketEvents';

const router = Router();

// All routes require authentication
router.use(authenticateJWT as any);

/**
 * GET /api/admin/restaurant
 * Get restaurant settings
 */
router.get('/restaurant', async (req: Request, res: Response) => {
  try {
    const restaurant = await Restaurant.findOne();
    if (!restaurant) {
      return res.status(404).json({ error: 'Restaurant not found' });
    }
    res.json(restaurant);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * PUT /api/admin/restaurant
 * Update restaurant settings
 */
router.put('/restaurant', async (req: Request, res: Response) => {
  try {
    const restaurant = await Restaurant.findOneAndUpdate(
      {},
      req.body,
      { new: true, upsert: true }
    );
    res.json(restaurant);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/admin/tables
 * Get all tables
 */
router.get('/tables', async (req: Request, res: Response) => {
  try {
    const tables = await Table.find().populate('restaurantId');
    res.json(tables);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/admin/tables
 * Create a new table
 */
router.post('/tables', async (req: Request, res: Response) => {
  try {
    const restaurant = await Restaurant.findOne();
    if (!restaurant) {
      return res.status(404).json({ error: 'Restaurant not found' });
    }
    
    const table = new Table({
      ...req.body,
      restaurantId: restaurant._id,
    });
    await table.save();
    res.status(201).json(table);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * PUT /api/admin/tables/:id
 * Update a table
 */
router.put('/tables/:id', async (req: Request, res: Response) => {
  try {
    const table = await Table.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!table) {
      return res.status(404).json({ error: 'Table not found' });
    }
    res.json(table);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * DELETE /api/admin/tables/:id
 * Delete a table
 */
router.delete('/tables/:id', async (req: Request, res: Response) => {
  try {
    const table = await Table.findByIdAndDelete(req.params.id);
    if (!table) {
      return res.status(404).json({ error: 'Table not found' });
    }
    res.json({ message: 'Table deleted' });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/admin/reservations
 * Get all reservations with filters
 */
router.get('/reservations', async (req: Request, res: Response) => {
  try {
    const { date, status, startDate, endDate } = req.query;
    
    const query: any = {};
    
    if (date) {
      const dateObj = new Date(date as string);
      const startOfDay = new Date(dateObj.setHours(0, 0, 0, 0));
      const endOfDay = new Date(dateObj.setHours(23, 59, 59, 999));
      query.startAt = { $gte: startOfDay, $lte: endOfDay };
    }
    
    if (startDate && endDate) {
      query.startAt = { $gte: new Date(startDate as string), $lte: new Date(endDate as string) };
    }
    
    if (status) {
      query.status = status;
    }
    
    const reservations = await Reservation.find(query)
      .populate('tablesAssigned')
      .populate('restaurantId')
      .sort({ startAt: -1 });
    
    res.json(reservations);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/admin/reservations/:id
 * Get a single reservation
 */
router.get('/reservations/:id', async (req: Request, res: Response) => {
  try {
    const reservation = await Reservation.findById(req.params.id)
      .populate('tablesAssigned')
      .populate('restaurantId');
    
    if (!reservation) {
      return res.status(404).json({ error: 'Reservation not found' });
    }
    
    res.json(reservation);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/admin/reservations
 * Create a reservation (admin)
 */
router.post('/reservations', async (req: Request, res: Response) => {
  try {
    const restaurant = await Restaurant.findOne();
    if (!restaurant) {
      return res.status(404).json({ error: 'Restaurant not found' });
    }
    
    const { startAt, partySize, customerName, customerPhone, notes } = req.body;
    
    const result = await checkAndHoldAvailability(
      restaurant._id,
      new Date(startAt),
      partySize,
      customerName,
      customerPhone,
      undefined,
      'FR'
    );
    
    if (!result.available) {
      return res.status(409).json({
        error: 'Time slot not available',
        alternatives: result.alternatives,
      });
    }
    
    // Find the HOLD reservation and confirm it
    const holdReservation = await Reservation.findOne({
      customerPhone,
      status: 'HOLD',
    }).sort({ createdAt: -1 });
    
    if (holdReservation) {
      await confirmReservation(holdReservation._id);
      if (notes) {
        holdReservation.notes = notes;
        await holdReservation.save();
      }
      await notifyReservationChange(holdReservation._id.toString());
      return res.json(holdReservation);
    }
    
    res.status(500).json({ error: 'Failed to create reservation' });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * PATCH /api/admin/reservations/:id
 * Update reservation status
 */
router.patch('/reservations/:id', async (req: Request, res: Response) => {
  try {
    const { status } = req.body;
    
    if (!['HOLD', 'CONFIRMED', 'CANCELLED', 'NO_SHOW'].includes(status)) {
      return res.status(400).json({ error: 'Invalid status' });
    }
    
    const reservation = await Reservation.findById(req.params.id);
    if (!reservation) {
      return res.status(404).json({ error: 'Reservation not found' });
    }
    
    if (status === 'CONFIRMED' && reservation.status === 'HOLD') {
      await confirmReservation(reservation._id);
    } else if (status === 'CANCELLED') {
      await cancelReservation(reservation._id);
    } else {
      reservation.status = status as ReservationStatus;
      await reservation.save();
    }
    
    await notifyReservationChange(reservation._id.toString());
    res.json(reservation);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;

