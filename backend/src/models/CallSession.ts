import mongoose, { Document, Schema, Types } from 'mongoose';

export type CallSessionState = 'COLLECTING' | 'CONFIRMING' | 'DONE';
export type CallSessionLanguage = 'FR' | 'EN' | 'UNKNOWN';

export interface ICallHistory {
  role: 'user' | 'assistant';
  text: string;
  at: Date;
}

export interface ICallSession extends Document {
  callSid: string;
  restaurantId: Types.ObjectId;
  fromPhone: string;
  language: CallSessionLanguage;
  state: CallSessionState;
  draft: any; // Partial reservation JSON
  history: ICallHistory[];
  pendingJob: boolean;
  lastError?: string;
  createdAt: Date;
  updatedAt: Date;
}

const CallHistorySchema = new Schema<ICallHistory>({
  role: {
    type: String,
    enum: ['user', 'assistant'],
    required: true,
  },
  text: {
    type: String,
    required: true,
  },
  at: {
    type: Date,
    default: Date.now,
  },
});

const CallSessionSchema = new Schema<ICallSession>(
  {
    callSid: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    restaurantId: {
      type: Schema.Types.ObjectId,
      ref: 'Restaurant',
      required: true,
    },
    fromPhone: {
      type: String,
      required: true,
    },
    language: {
      type: String,
      enum: ['FR', 'EN', 'UNKNOWN'],
      default: 'UNKNOWN',
    },
    state: {
      type: String,
      enum: ['COLLECTING', 'CONFIRMING', 'DONE'],
      default: 'COLLECTING',
    },
    draft: {
      type: Schema.Types.Mixed,
      default: {},
    },
    history: {
      type: [CallHistorySchema],
      default: [],
    },
    pendingJob: {
      type: Boolean,
      default: false,
    },
    lastError: {
      type: String,
    },
  },
  {
    timestamps: true,
  }
);

CallSessionSchema.index({ callSid: 1 }, { unique: true });
CallSessionSchema.index({ updatedAt: 1 });

export const CallSession = mongoose.model<ICallSession>('CallSession', CallSessionSchema);

