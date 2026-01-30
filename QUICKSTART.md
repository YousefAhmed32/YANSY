# YANSY Platform - Quick Start Guide

## 🚀 Quick Setup (5 minutes)

### Step 1: Backend Setup

```bash
cd server
npm install
```

Create `server/.env`:
```env
PORT=5000
NODE_ENV=development
MONGODB_URI=mongodb://localhost:27017/yansy
JWT_SECRET=your-secret-key-change-this
JWT_EXPIRES_IN=7d
CLIENT_URL=http://localhost:5173
CLOUD_PROVIDER=cloudinary
```

Start backend:
```bash
npm run dev
```

### Step 2: Frontend Setup

```bash
cd client/vite-project
npm install
```

Start frontend:
```bash
npm run dev
```

### Step 3: Access the Platform

- Frontend: http://localhost:5173
- Backend API: http://localhost:5000
- Health Check: http://localhost:5000/api/health

## 📝 First Steps

1. **Register an Account**
   - Go to http://localhost:5173/register
   - Create your account
   - You'll be redirected to dashboard

2. **Create Admin User** (via MongoDB or API)
   ```javascript
   // In MongoDB shell or Compass
   db.users.updateOne(
     { email: "your-email@example.com" },
     { $set: { role: "admin" } }
   )
   ```

3. **Test Features**
   - Create projects (admin only)
   - Send messages
   - Upload files
   - View analytics (admin only)

## 🔧 Common Issues

### MongoDB Connection Error
- Ensure MongoDB is running
- Check MONGODB_URI in .env
- For Atlas: Use connection string format

### Port Already in Use
- Change PORT in server/.env
- Update CLIENT_URL accordingly

### CORS Errors
- Ensure CLIENT_URL matches frontend URL
- Check backend CORS configuration

### Missing Dependencies
- Run `npm install` in both directories
- Clear node_modules and reinstall if needed

## 📚 Next Steps

1. Configure cloud storage (Cloudinary/S3)
2. Set up production environment variables
3. Deploy backend and frontend
4. Set up monitoring and error tracking

For detailed documentation, see README.md and ARCHITECTURE.md

