import mongoose from 'mongoose';

export const connectDatabase = async (): Promise<void> => {
  const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/restaurant-reservations';
  
  try {
    await mongoose.connect(mongoUri);
    console.log('✅ MongoDB connected');
  } catch (error) {
    console.error('❌ MongoDB connection error:', error);
    process.exit(1);
  }
};

