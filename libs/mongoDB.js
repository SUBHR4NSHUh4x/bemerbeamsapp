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
      serverSelectionTimeoutMS: 10000, // Increased timeout from 5s to 10s
      socketTimeoutMS: 45000, // Close sockets after 45s of inactivity
      connectTimeoutMS: 10000, // Connection timeout
      // Vercel-specific optimizations
      bufferCommands: false, // Disable buffering for Vercel serverless
      autoIndex: false, // Disable autoIndex in production
      retryWrites: true, // Enable retry writes for better reliability
      retryReads: true, // Enable retry reads for better reliability
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
    
    // Add connection timeout handling
    mongoose.connection.on('timeout', () => {
      console.error('MongoDB connection timeout');
      isConnected = false;
    });
    
  } catch (error) {
    console.error('Error connecting to MongoDB:', error.message);
    isConnected = false;
    
    // Retry logic for Vercel
    if (error.message.includes('buffermaxentries') || error.message.includes('bufferCommands')) {
      console.log('Retrying connection without deprecated options...');
      try {
        await mongoose.connect(mongoUri, {
          maxPoolSize: 10,
          serverSelectionTimeoutMS: 5000,
          socketTimeoutMS: 45000,
        });
        isConnected = true;
        console.log('Connected to MongoDB on retry!');
        return;
      } catch (retryError) {
        console.error('Retry connection failed:', retryError.message);
        throw retryError;
      }
    }
    
    throw error;
  }
}
