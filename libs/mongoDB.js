'use server';
import mongoose from 'mongoose';

export async function connectToDB() {
  try {
    if (mongoose.connection.readyState === 1) {
      console.log('Already connected to MongoDB...');
      return;
    }
    
    const mongoUri = process.env.MONGO_URL || process.env.MONGODB_URI;
    
    if (!mongoUri) {
      throw new Error('MongoDB connection string is not defined. Please set MONGO_URL or MONGODB_URI environment variable.');
    }
    
    console.log('Attempting to connect to MongoDB...');
    console.log('MongoDB URI:', mongoUri.substring(0, 20) + '...'); // Log partial URI for security
    
    await mongoose.connect(mongoUri, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('Connected to MongoDB successfully!');
    console.log('Database name:', mongoose.connection.db.databaseName);
  } catch (error) {
    console.error('Error connecting to MongoDB:', error.message);
    throw error;
  }
}
