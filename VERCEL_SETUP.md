# Vercel Deployment Setup Guide

## Prerequisites

1. A Vercel account
2. Your project pushed to a GitHub repository
3. MongoDB Atlas account with a cluster set up

## Step 1: Connect Your Repository to Vercel

1. Log in to your Vercel account
2. Click "Add New" → "Project"
3. Import your GitHub repository
4. Select the repository containing your Quiz Spark project

## Step 2: Configure Environment Variables

Before deploying, you need to set up the following environment variables in Vercel:

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

To set these variables:

1. In your Vercel project dashboard, go to "Settings" → "Environment Variables"
2. Add each variable with its corresponding value
3. Make sure to select all environments (Production, Preview, Development)
4. Click "Save"

## Step 3: Configure Build Settings

Vercel should automatically detect that this is a Next.js project, but you can verify the settings:

1. Framework Preset: Next.js
2. Build Command: `npm run build`
3. Output Directory: `.next`
4. Install Command: `npm install`

## Step 4: Deploy

1. Click "Deploy" to start the deployment process
2. Vercel will clone your repository, install dependencies, build the project, and deploy it
3. Once deployment is complete, you'll receive a URL for your deployed application

## Troubleshooting

If you encounter deployment issues:

1. Check the build logs for errors
2. Verify all environment variables are correctly set
3. Ensure your MongoDB Atlas cluster allows connections from Vercel's IP addresses (you may need to allow access from all IPs: 0.0.0.0/0)
4. Check that your Clerk authentication is properly configured

## Redeploying After Changes

When you push changes to your GitHub repository, Vercel will automatically redeploy your application. You can also manually trigger a redeployment from the Vercel dashboard.

## Important Notes

1. The `vercel.json` file in your project contains important configuration settings for your deployment
2. Make sure your MongoDB connection is optimized for serverless environments
3. Consider using Vercel's preview deployments for testing changes before they go to production