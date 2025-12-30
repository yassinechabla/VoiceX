import mongoose, { Document, Schema, Types } from 'mongoose';

export interface ITable extends Document {
  restaurantId: Types.ObjectId;
  name: string;
  capacity: number;
  zone?: string;
  isJoinable: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const TableSchema = new Schema<ITable>(
  {
    restaurantId: {
      type: Schema.Types.ObjectId,
      ref: 'Restaurant',
      required: true,
      index: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    capacity: {
      type: Number,
      required: true,
      min: 1,
    },
    zone: {
      type: String,
      trim: true,
    },
    isJoinable: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

TableSchema.index({ restaurantId: 1 });

export const Table = mongoose.model<ITable>('Table', TableSchema);

