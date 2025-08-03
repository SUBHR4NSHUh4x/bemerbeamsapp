import mongoose from 'mongoose';

// Global variable to track connection status
let isConnected = false;

export async function connectToDB() {
  try {
    // If already connected, return
    if (isConnected) {
      console.log('Already connected to MongoDB...');
      return;
    }

    // Check if there's an existing connection
    if (mongoose.connection.readyState === 1) {
      isConnected = true;
      console.log('Already connected to MongoDB...');
      return;
    }
    
    const mongoUri = process.env.MONGO_URL || process.env.MONGODB_URI;
    
    if (!mongoUri) {
      throw new Error('MongoDB connection string is not defined. Please set MONGO_URL or MONGODB_URI environment variable.');
    }
    
    console.log('Attempting to connect to MongoDB...');
    console.log('MongoDB URI:', mongoUri.substring(0, 20) + '...'); // Log partial URI for security
    
    // Connect with optimized settings for Vercel
    await mongoose.connect(mongoUri, {
      maxPoolSize: 10, // Limit connection pool size for serverless
      serverSelectionTimeoutMS: 5000, // Timeout after 5s instead of 30s
      socketTimeoutMS: 45000, // Close sockets after 45s of inactivity
    });
    
    isConnected = true;
    console.log('Connected to MongoDB successfully!');
    console.log('Database name:', mongoose.connection.db.databaseName);
    
    // Handle connection events
    mongoose.connection.on('error', (err) => {
      console.error('MongoDB connection error:', err);
      isConnected = false;
    });
    
    mongoose.connection.on('disconnected', () => {
      console.log('MongoDB disconnected');
      isConnected = false;
    });
    
  } catch (error) {
    console.error('Error connecting to MongoDB:', error.message);
    isConnected = false;
    throw error;
  }
}
