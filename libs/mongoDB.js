'use server';
import mongoose from 'mongoose';

export async function connectToDB() {
  try {
    if (mongoose.connection.readyState === 1) {
      console.log('Already connected to MongoDB...');
      return;
    }
    
    const mongoUri = process.env.MONGODB_URI || process.env.MONGO_URL;
    
    if (!mongoUri) {
      throw new Error('MongoDB connection string is not defined. Please set MONGODB_URI environment variable.');
    }
    
    await mongoose.connect(mongoUri, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('Connected to MongoDB...');
  } catch (error) {
    console.error('Error connecting to MongoDB:', error.message);
    throw error;
  }
}
