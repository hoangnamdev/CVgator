# 🚀 CVgator Deployment Guide

This guide will help you deploy CVgator to the cloud for free using modern cloud services.

## 📋 Prerequisites

- GitHub account
- MongoDB Atlas account (free)
- Cloudinary account (free)
- Railway account (free with $5 credit)

## 🗄️ Step 1: Set up MongoDB Atlas (Database)

1. **Create MongoDB Atlas Account**
   - Go to [mongodb.com/atlas](https://www.mongodb.com/atlas)
   - Sign up for free account
   - Create a new project

2. **Create Free Cluster**
   - Click "Build a Database"
   - Choose "M0 Sandbox" (Free tier)
   - Select a region close to your users
   - Name your cluster (e.g., "cvgator-cluster")

3. **Set up Database Access**
   - Go to "Database Access" in the left sidebar
   - Click "Add New Database User"
   - Create username/password (save these!)
   - Set privileges to "Read and write to any database"

4. **Set up Network Access**
   - Go to "Network Access" in the left sidebar
   - Click "Add IP Address"
   - Choose "Allow Access from Anywhere" (0.0.0.0/0)

5. **Get Connection String**
   - Go to "Database" in the left sidebar
   - Click "Connect" on your cluster
   - Choose "Connect your application"
   - Copy the connection string
   - Replace `<password>` with your database user password
   - Replace `<dbname>` with `cvgator`

## ☁️ Step 2: Set up Cloudinary (File Storage)

1. **Create Cloudinary Account**
   - Go to [cloudinary.com](https://cloudinary.com)
   - Sign up for free account

2. **Get API Credentials**
   - Go to your dashboard
   - Copy the following values:
     - Cloud Name
     - API Key
     - API Secret

## 🚂 Step 3: Deploy Backend to Railway

1. **Create Railway Account**
   - Go to [railway.app](https://railway.app)
   - Sign up with GitHub

2. **Deploy from GitHub**
   - Click "New Project"
   - Choose "Deploy from GitHub repo"
   - Select your CVgator repository
   - Railway will automatically detect it's a Node.js app

3. **Set Environment Variables**
   - Go to your project settings
   - Add these environment variables:
     ```
     MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/cvgator?retryWrites=true&w=majority
     CLOUDINARY_CLOUD_NAME=your_cloud_name
     CLOUDINARY_API_KEY=your_api_key
     CLOUDINARY_API_SECRET=your_api_secret
     NODE_ENV=production
     ```

4. **Deploy**
   - Railway will automatically build and deploy
   - You'll get a URL like `https://your-app.railway.app`

## 🌐 Step 4: Deploy Frontend to Vercel

1. **Create Vercel Account**
   - Go to [vercel.com](https://vercel.com)
   - Sign up with GitHub

2. **Import Project**
   - Click "New Project"
   - Import your CVgator repository
   - Set build command: `npm run build` (if needed)
   - Set output directory: `public`

3. **Set Environment Variables**
   - Add environment variable:
     ```
     VITE_API_URL=https://your-app.railway.app
     ```

4. **Deploy**
   - Vercel will automatically deploy
   - You'll get a URL like `https://your-app.vercel.app`

## 🔧 Step 5: Update Frontend API URLs

Update your frontend JavaScript files to use the production API URL:

```javascript
// In all your .js files, replace localhost:3000 with your Railway URL
const API_BASE = process.env.VITE_API_URL || 'https://your-app.railway.app';
```

## 📊 Cost Breakdown (Free Forever)

| Service | Free Tier | Your Usage | Cost |
|---------|-----------|------------|------|
| MongoDB Atlas | 512MB storage | ~50MB | $0 |
| Cloudinary | 25GB storage, 25GB bandwidth | ~1GB | $0 |
| Railway | $5 credit/month | ~$2/month | $0 |
| Vercel | Unlimited static hosting | ~100MB | $0 |
| **Total** | | | **$0/month** |

## 🔄 Step 6: Update File Upload Logic

The current code uses local file storage. You'll need to update the upload endpoints to use Cloudinary:

1. **Install new dependencies:**
   ```bash
   npm install cloudinary dotenv
   ```

2. **Update upload endpoints** to use `uploadUtils.js`

3. **Test file uploads** work with Cloudinary URLs

## 🚨 Important Notes

- **Database**: MongoDB Atlas free tier is permanent
- **File Storage**: Cloudinary free tier is permanent
- **Hosting**: Railway gives $5/month credit (more than enough)
- **Frontend**: Vercel free tier is unlimited for static sites
- **Backup**: Your data is automatically backed up by cloud providers

## 🔍 Troubleshooting

### Common Issues:

1. **Environment Variables Not Loading**
   - Make sure `.env` file is in root directory
   - Restart the server after adding variables

2. **File Uploads Not Working**
   - Check Cloudinary credentials
   - Verify file size limits
   - Check CORS settings

3. **Database Connection Issues**
   - Verify MongoDB connection string
   - Check IP whitelist settings
   - Ensure database user has correct permissions

## 📈 Scaling (Future)

When you outgrow free tiers:

- **MongoDB Atlas**: Upgrade to M2 ($9/month)
- **Cloudinary**: Upgrade to Plus ($89/month)
- **Railway**: Upgrade to Pro ($20/month)
- **Vercel**: Upgrade to Pro ($20/month)

But for most use cases, the free tiers will be sufficient for years!

## 🎉 You're Live!

Once deployed, your CVgator app will be:
- ✅ Accessible from anywhere
- ✅ Automatically backed up
- ✅ Scalable and reliable
- ✅ Free to run forever
- ✅ Professional-grade infrastructure

Your users can now upload CVs, create profiles, and interact with the platform from anywhere in the world!
