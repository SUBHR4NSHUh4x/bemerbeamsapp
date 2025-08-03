# Vercel Deployment Guide for Results/Review Panel

## Environment Variables Setup

### 1. Required Environment Variables
Make sure to set these environment variables in your Vercel dashboard:

```
MONGO_URL=mongodb+srv://aparajitapriyadarshini079:nbcLH3P6RXebsCCF@cluster0.jvcwiba.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0
MONGODB_URI=mongodb+srv://aparajitapriyadarshini079:nbcLH3P6RXebsCCF@cluster0.jvcwiba.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0

# Clerk Authentication
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_YWxlcnQtc25pcGUtNTkuY2xlcmsuYWNjb3VudHMuZGV2JA
CLERK_SECRET_KEY=sk_test_RlrCrEm1NstsVtEy4gI5FE4uSVzuReSTISogxQMHYM

NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up
NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL=/dashboard
NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL=/dashboard

# Admin Authentication
NEXT_PUBLIC_ADMIN_USERNAME=beamer
NEXT_PUBLIC_ADMIN_PASSWORD=BemerBrands@admin
```

### 2. How to Set Environment Variables in Vercel

1. Go to your Vercel dashboard
2. Select your project
3. Go to Settings → Environment Variables
4. Add each variable with the correct name and value
5. Make sure to select "Production", "Preview", and "Development" environments
6. Click "Save"

## Database Configuration

### MongoDB Atlas Setup
1. Ensure your MongoDB Atlas cluster allows connections from all IP addresses (0.0.0.0/0)
2. Make sure your database user has the correct permissions
3. Verify the connection string is correct

### Connection String Format
```
mongodb+srv://username:password@cluster.mongodb.net/database?retryWrites=true&w=majority
```

## Deployment Steps

### 1. Build and Deploy
```bash
# Install dependencies
npm install

# Build the project
npm run build

# Deploy to Vercel
vercel --prod
```

### 2. Verify Deployment
After deployment, check these endpoints:

- **Health Check**: `https://your-domain.vercel.app/api/health`
- **Results/Review Panel**: `https://your-domain.vercel.app/results-review`

### 3. Test the Results/Review Panel
1. Create a quiz in the admin panel
2. Have someone take the quiz via `/test-access`
3. Go to Results/Review panel
4. Test the "View & Edit" functionality
5. Verify manual grading works

## Troubleshooting

### Common Issues and Solutions

#### 1. Database Connection Errors
- **Error**: "MongoDB connection string is not defined"
- **Solution**: Check environment variables in Vercel dashboard

#### 2. Score Validation Errors
- **Error**: "Validation failed: score: Path `score` is required"
- **Solution**: The app now has robust score validation and debugging
- **Debug**: Check `/api/debug-score` endpoint for score calculation issues
- **Check**: Verify answers have valid `points` and `isCorrect` values

#### 3. Timeout Errors
- **Error**: "Database query timeout"
- **Solution**: The app now has optimized timeouts and retry mechanisms

#### 4. API Route Errors
- **Error**: "Failed to fetch quiz attempts"
- **Solution**: Check the health endpoint first: `/api/health`

#### 5. CORS Issues
- **Error**: CORS errors in browser console
- **Solution**: Vercel handles CORS automatically for API routes

### Debug Steps

1. **Check Health Endpoint**:
   ```
   GET https://your-domain.vercel.app/api/health
   ```

2. **Debug Score Calculation**:
   ```
   POST https://your-domain.vercel.app/api/debug-score
   Content-Type: application/json
   
   {
     "answers": [
       {
         "points": 10,
         "isCorrect": true,
         "studentAnswer": "test"
       }
     ]
   }
   ```

3. **Check Environment Variables**:
   - Go to Vercel dashboard → Settings → Environment Variables
   - Verify all variables are set correctly

4. **Check Function Logs**:
   - Go to Vercel dashboard → Functions
   - Check for any error logs

5. **Test Database Connection**:
   - Use MongoDB Compass or similar tool
   - Test the connection string directly

## Performance Optimizations

The app now includes:

1. **Connection Pooling**: Optimized for serverless functions
2. **Timeout Management**: 30-second timeouts for API calls
3. **Retry Mechanisms**: Automatic retries for failed requests
4. **Error Handling**: Specific error messages for different issues
5. **Caching**: Proper cache headers for API responses

## Monitoring

### Vercel Analytics
- Enable Vercel Analytics to monitor performance
- Check Function Execution times
- Monitor error rates

### Custom Monitoring
- Health check endpoint: `/api/health`
- Check function logs in Vercel dashboard
- Monitor database connection status

## Security Considerations

1. **Environment Variables**: Never commit sensitive data to git
2. **Database Access**: Use IP whitelisting if possible
3. **Admin Authentication**: Change default admin credentials in production
4. **API Rate Limiting**: Consider implementing rate limiting for production

## Support

If you encounter issues:

1. Check the health endpoint first
2. Review Vercel function logs
3. Verify environment variables
4. Test database connectivity
5. Check browser console for errors

The Results/Review panel is now optimized for Vercel deployment with:
- ✅ Optimized database connections
- ✅ Timeout handling
- ✅ Retry mechanisms
- ✅ Better error messages
- ✅ Health monitoring
- ✅ Vercel-specific configurations 