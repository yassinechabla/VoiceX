import { Types } from 'mongoose';
import { Restaurant } from '../models/Restaurant';
import { Table } from '../models/Table';
import { Reservation } from '../models/Reservation';
import { TableSlotLock } from '../models/TableSlotLock';

export interface AvailabilityResult {
  available: boolean;
  tables?: Types.ObjectId[];
  alternatives?: Date[];
  error?: string;
}

export interface TableAssignment {
  tables: Types.ObjectId[];
  wastedSeats: number;
  tableCount: number;
}

/**
 * Normalize time to nearest slot boundary (round up)
 */
export const normalizeToSlot = (date: Date, slotMinutes: number): Date => {
  const minutes = date.getMinutes();
  const remainder = minutes % slotMinutes;
  if (remainder === 0) return new Date(date);
  
  const roundedMinutes = minutes + (slotMinutes - remainder);
  const normalized = new Date(date);
  normalized.setMinutes(roundedMinutes);
  normalized.setSeconds(0);
  normalized.setMilliseconds(0);
  return normalized;
};

/**
 * Check if two time intervals overlap
 */
export const intervalsOverlap = (start1: Date, end1: Date, start2: Date, end2: Date): boolean => {
  return start1 < end2 && end1 > start2;
};

/**
 * Find available tables for a given time slot
 */
export const findAvailableTables = async (
  restaurantId: Types.ObjectId,
  startAt: Date,
  endAt: Date,
  partySize: number
): Promise<TableAssignment | null> => {
  // Get all tables for the restaurant
  const tables = await Table.find({ restaurantId }).sort({ capacity: 1 });
  
  // Get existing reservations and locks that overlap
  const overlappingReservations = await Reservation.find({
    restaurantId,
    status: { $in: ['HOLD', 'CONFIRMED'] },
    $or: [
      { startAt: { $lt: endAt }, endAt: { $gt: startAt } },
    ],
  });

  const overlappingLocks = await TableSlotLock.find({
    restaurantId,
    slotStart: { $gte: startAt, $lt: endAt },
    expiresAt: { $gt: new Date() },
  });

  const lockedTableIds = new Set(overlappingLocks.map(lock => lock.tableId.toString()));
  const reservedTableIds = new Set(
    overlappingReservations.flatMap(res => res.tablesAssigned.map(id => id.toString()))
  );
  
  const unavailableTableIds = new Set([...lockedTableIds, ...reservedTableIds]);
  
  // Try single table first
  for (const table of tables) {
    if (unavailableTableIds.has(table._id.toString())) continue;
    if (table.capacity >= partySize) {
      return {
        tables: [table._id],
        wastedSeats: table.capacity - partySize,
        tableCount: 1,
      };
    }
  }
  
  // Try combinations of 2 joinable tables
  const joinableTables = tables.filter(
    t => t.isJoinable && !unavailableTableIds.has(t._id.toString())
  );
  
  let bestAssignment: TableAssignment | null = null;
  
  for (let i = 0; i < joinableTables.length; i++) {
    for (let j = i + 1; j < joinableTables.length; j++) {
      const table1 = joinableTables[i];
      const table2 = joinableTables[j];
      const totalCapacity = table1.capacity + table2.capacity;
      
      if (totalCapacity >= partySize) {
        const wastedSeats = totalCapacity - partySize;
        const tableCount = 2;
        
        if (!bestAssignment || 
            wastedSeats < bestAssignment.wastedSeats ||
            (wastedSeats === bestAssignment.wastedSeats && tableCount < bestAssignment.tableCount)) {
          bestAssignment = {
            tables: [table1._id, table2._id],
            wastedSeats,
            tableCount,
          };
        }
      }
    }
  }
  
  return bestAssignment;
};

/**
 * Generate alternative time slots
 */
export const generateAlternatives = async (
  restaurantId: Types.ObjectId,
  requestedTime: Date,
  partySize: number,
  windowMinutes: number = 60,
  stepMinutes: number = 15,
  maxOptions: number = 3
): Promise<Date[]> => {
  const restaurant = await Restaurant.findById(restaurantId);
  if (!restaurant) return [];
  
  const alternatives: Date[] = [];
  const slotMinutes = restaurant.slotMinutes;
  
  // Try times before and after requested time
  const offsets = [-30, -15, +15, +30, +45, +60];
  
  for (const offsetMinutes of offsets) {
    if (alternatives.length >= maxOptions) break;
    
    const candidateTime = new Date(requestedTime);
    candidateTime.setMinutes(candidateTime.getMinutes() + offsetMinutes);
    const normalized = normalizeToSlot(candidateTime, slotMinutes);
    
    const endAt = new Date(normalized);
    endAt.setMinutes(endAt.getMinutes() + restaurant.avgDurationMin + restaurant.bufferMin);
    
    const assignment = await findAvailableTables(restaurantId, normalized, endAt, partySize);
    if (assignment) {
      alternatives.push(normalized);
    }
  }
  
  return alternatives.slice(0, maxOptions);
};

/**
 * Check availability and create HOLD reservation with locks
 */
export const checkAndHoldAvailability = async (
  restaurantId: Types.ObjectId,
  startAt: Date,
  partySize: number,
  customerName: string,
  customerPhone: string,
  callSid?: string,
  language?: 'FR' | 'EN'
): Promise<AvailabilityResult> => {
  const restaurant = await Restaurant.findById(restaurantId);
  if (!restaurant) {
    return { available: false, error: 'Restaurant not found' };
  }
  
  // Normalize start time
  const normalizedStart = normalizeToSlot(startAt, restaurant.slotMinutes);
  const endAt = new Date(normalizedStart);
  endAt.setMinutes(endAt.getMinutes() + restaurant.avgDurationMin + restaurant.bufferMin);
  
  // Find available tables
  const assignment = await findAvailableTables(restaurantId, normalizedStart, endAt, partySize);
  
  if (!assignment) {
    // Generate alternatives
    const alternatives = await generateAlternatives(restaurantId, normalizedStart, partySize);
    return {
      available: false,
      alternatives,
    };
  }
  
  // Create HOLD reservation
  const reservation = new Reservation({
    restaurantId,
    status: 'HOLD',
    customerName,
    customerPhone,
    partySize,
    startAt: normalizedStart,
    endAt,
    tablesAssigned: assignment.tables,
    source: callSid ? 'VOICE' : 'ADMIN',
    callSid,
    language,
  });
  
  await reservation.save();
  
  // Generate slot list and create locks
  const slotStarts: Date[] = [];
  let currentSlot = new Date(normalizedStart);
  while (currentSlot < endAt) {
    slotStarts.push(new Date(currentSlot));
    currentSlot.setMinutes(currentSlot.getMinutes() + restaurant.slotMinutes);
  }
  
  const holdMinutes = 3; // 3 minutes hold time
  const expiresAt = new Date(Date.now() + holdMinutes * 60 * 1000);
  
  try {
    // Create locks atomically
    const lockPromises = assignment.tables.flatMap(tableId =>
      slotStarts.map(slotStart =>
        new TableSlotLock({
          restaurantId,
          tableId,
          slotStart,
          reservationId: reservation._id,
          expiresAt,
        }).save()
      )
    );
    
    await Promise.all(lockPromises);
    
    return {
      available: true,
      tables: assignment.tables,
    };
  } catch (error: any) {
    // Duplicate key error means conflict
    if (error.code === 11000) {
      await Reservation.findByIdAndDelete(reservation._id);
      const alternatives = await generateAlternatives(restaurantId, normalizedStart, partySize);
      return {
        available: false,
        alternatives,
        error: 'Time slot was just booked by another customer',
      };
    }
    throw error;
  }
};

/**
 * Confirm a HOLD reservation (extend locks)
 */
export const confirmReservation = async (reservationId: Types.ObjectId): Promise<boolean> => {
  const reservation = await Reservation.findById(reservationId);
  if (!reservation || reservation.status !== 'HOLD') {
    return false;
  }
  
  // Update reservation status
  reservation.status = 'CONFIRMED';
  await reservation.save();
  
  // Extend locks to far future (effectively permanent)
  const farFuture = new Date('2099-12-31');
  await TableSlotLock.updateMany(
    { reservationId },
    { expiresAt: farFuture }
  );
  
  return true;
};

/**
 * Cancel a HOLD reservation (locks will expire via TTL)
 */
export const cancelReservation = async (reservationId: Types.ObjectId): Promise<boolean> => {
  const reservation = await Reservation.findById(reservationId);
  if (!reservation) {
    return false;
  }
  
  reservation.status = 'CANCELLED';
  await reservation.save();
  
  // Locks will expire via TTL, but we can delete them immediately
  await TableSlotLock.deleteMany({ reservationId });
  
  return true;
};

