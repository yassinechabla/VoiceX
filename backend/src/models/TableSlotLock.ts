import mongoose, { Document, Schema, Types } from 'mongoose';

export interface ITableSlotLock extends Document {
  restaurantId: Types.ObjectId;
  tableId: Types.ObjectId;
  slotStart: Date;
  reservationId: Types.ObjectId;
  expiresAt: Date;
}

const TableSlotLockSchema = new Schema<ITableSlotLock>(
  {
    restaurantId: {
      type: Schema.Types.ObjectId,
      ref: 'Restaurant',
      required: true,
    },
    tableId: {
      type: Schema.Types.ObjectId,
      ref: 'Table',
      required: true,
    },
    slotStart: {
      type: Date,
      required: true,
    },
    reservationId: {
      type: Schema.Types.ObjectId,
      ref: 'Reservation',
      required: true,
    },
    expiresAt: {
      type: Date,
      required: true,
      index: { expireAfterSeconds: 0 }, // TTL index
    },
  },
  {
    timestamps: false,
  }
);

// Unique compound index to prevent double booking
TableSlotLockSchema.index(
  { restaurantId: 1, tableId: 1, slotStart: 1 },
  { unique: true }
);

export const TableSlotLock = mongoose.model<ITableSlotLock>('TableSlotLock', TableSlotLockSchema);

