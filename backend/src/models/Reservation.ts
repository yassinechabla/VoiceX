import mongoose, { Document, Schema, Types } from 'mongoose';

export type ReservationStatus = 'HOLD' | 'CONFIRMED' | 'CANCELLED' | 'NO_SHOW';
export type ReservationSource = 'VOICE' | 'ADMIN';
export type Language = 'FR' | 'EN';

export interface IReservation extends Document {
  restaurantId: Types.ObjectId;
  status: ReservationStatus;
  customerName: string;
  customerPhone: string;
  partySize: number;
  startAt: Date;
  endAt: Date;
  tablesAssigned: Types.ObjectId[];
  notes?: string;
  source: ReservationSource;
  callSid?: string;
  language?: Language;
  createdAt: Date;
  updatedAt: Date;
}

const ReservationSchema = new Schema<IReservation>(
  {
    restaurantId: {
      type: Schema.Types.ObjectId,
      ref: 'Restaurant',
      required: true,
      index: true,
    },
    status: {
      type: String,
      enum: ['HOLD', 'CONFIRMED', 'CANCELLED', 'NO_SHOW'],
      required: true,
      default: 'HOLD',
    },
    customerName: {
      type: String,
      required: true,
      trim: true,
    },
    customerPhone: {
      type: String,
      required: true,
      trim: true,
    },
    partySize: {
      type: Number,
      required: true,
      min: 1,
    },
    startAt: {
      type: Date,
      required: true,
      index: true,
    },
    endAt: {
      type: Date,
      required: true,
      index: true,
    },
    tablesAssigned: [
      {
        type: Schema.Types.ObjectId,
        ref: 'Table',
      },
    ],
    notes: {
      type: String,
      trim: true,
    },
    source: {
      type: String,
      enum: ['VOICE', 'ADMIN'],
      required: true,
      default: 'ADMIN',
    },
    callSid: {
      type: String,
      index: true,
    },
    language: {
      type: String,
      enum: ['FR', 'EN'],
    },
  },
  {
    timestamps: true,
  }
);

ReservationSchema.index({ restaurantId: 1, startAt: 1 });
ReservationSchema.index({ restaurantId: 1, endAt: 1 });
ReservationSchema.index({ callSid: 1 });

export const Reservation = mongoose.model<IReservation>('Reservation', ReservationSchema);

