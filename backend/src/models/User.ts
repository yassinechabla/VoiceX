import mongoose, { Document, Schema } from 'mongoose';
import passportLocalMongoose from 'passport-local-mongoose';

export interface IUser extends Document {
  username: string;
  role: 'ADMIN';
  createdAt: Date;
}

const UserSchema = new Schema<IUser>({
  username: {
    type: String,
    required: true,
    unique: true,
    trim: true,
  },
  role: {
    type: String,
    enum: ['ADMIN'],
    default: 'ADMIN',
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

// Use passport-local-mongoose plugin (handles password hashing/salting)
UserSchema.plugin(passportLocalMongoose, {
  usernameField: 'username',
  errorMessages: {
    UserExistsError: 'A user with the given username is already registered',
    MissingPasswordError: 'No password was given',
    AttemptTooSoonError: 'Account is currently locked. Try again later',
    TooManyAttemptsError: 'Account locked due to too many failed login attempts',
    NoSaltValueStoredError: 'Authentication not possible. No salt value stored',
    IncorrectPasswordError: 'Password or username are incorrect',
    IncorrectUsernameError: 'Password or username are incorrect',
    MissingUsernameError: 'No username was given',
  },
});

export const User = mongoose.model<IUser>('User', UserSchema);

