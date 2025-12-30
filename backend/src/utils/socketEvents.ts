import { Server as SocketIOServer } from 'socket.io';
import { Reservation } from '../models/Reservation';

let ioInstance: SocketIOServer | null = null;

export const setSocketIO = (io: SocketIOServer) => {
  ioInstance = io;
};

export const broadcastReservationEvent = (
  event: 'reservation:created' | 'reservation:updated' | 'reservation:cancelled',
  reservation: any
) => {
  if (!ioInstance) {
    console.warn('Socket.io not initialized, skipping broadcast');
    return;
  }
  
  ioInstance.to('admin').emit(event, reservation);
};

export const notifyReservationChange = async (reservationId: string) => {
  if (!ioInstance) return;
  
  try {
    const reservation = await Reservation.findById(reservationId)
      .populate('tablesAssigned')
      .lean();
    
    if (!reservation) return;
    
    if (reservation.status === 'HOLD' || reservation.status === 'CONFIRMED') {
      broadcastReservationEvent('reservation:created', reservation);
    } else if (reservation.status === 'CANCELLED' || reservation.status === 'NO_SHOW') {
      broadcastReservationEvent('reservation:cancelled', reservation);
    } else {
      broadcastReservationEvent('reservation:updated', reservation);
    }
  } catch (error) {
    console.error('Error broadcasting reservation event:', error);
  }
};

