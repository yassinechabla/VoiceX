import mongoose, { Document, Schema } from 'mongoose';

export interface IOpeningHours {
  dayOfWeek: number; // 0 = Sunday, 6 = Saturday
  open: string; // HH:mm
  close: string; // HH:mm
  closed?: boolean;
}

export interface IRestaurant extends Document {
  name: string;
  timezone: string;
  phoneNumber: string;
  slotMinutes: number;
  avgDurationMin: number;
  bufferMin: number;
  openingHours: IOpeningHours[];
  createdAt: Date;
  updatedAt: Date;
}

const OpeningHoursSchema = new Schema<IOpeningHours>({
  dayOfWeek: { type: Number, required: true, min: 0, max: 6 },
  open: { type: String, required: true },
  close: { type: String, required: true },
  closed: { type: Boolean, default: false },
});

const RestaurantSchema = new Schema<IRestaurant>(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    timezone: {
      type: String,
      default: 'Europe/Paris',
    },
    phoneNumber: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    slotMinutes: {
      type: Number,
      default: 15,
      min: 5,
      max: 60,
    },
    avgDurationMin: {
      type: Number,
      default: 90,
      min: 30,
    },
    bufferMin: {
      type: Number,
      default: 10,
      min: 0,
    },
    openingHours: {
      type: [OpeningHoursSchema],
      default: [
        { dayOfWeek: 1, open: '12:00', close: '14:00' }, // Monday lunch
        { dayOfWeek: 1, open: '19:00', close: '22:00' }, // Monday dinner
        { dayOfWeek: 2, open: '12:00', close: '14:00' },
        { dayOfWeek: 2, open: '19:00', close: '22:00' },
        { dayOfWeek: 3, open: '12:00', close: '14:00' },
        { dayOfWeek: 3, open: '19:00', close: '22:00' },
        { dayOfWeek: 4, open: '12:00', close: '14:00' },
        { dayOfWeek: 4, open: '19:00', close: '22:00' },
        { dayOfWeek: 5, open: '12:00', close: '14:00' },
        { dayOfWeek: 5, open: '19:00', close: '22:00' },
        { dayOfWeek: 6, open: '12:00', close: '14:00' },
        { dayOfWeek: 6, open: '19:00', close: '22:00' },
      ],
    },
  },
  {
    timestamps: true,
  }
);

RestaurantSchema.index({ phoneNumber: 1 }, { unique: true });

export const Restaurant = mongoose.model<IRestaurant>('Restaurant', RestaurantSchema);

