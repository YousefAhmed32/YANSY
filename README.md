# YANSY Platform

A full-scale, production-ready platform featuring an immersive website, client portal, admin dashboard, advanced analytics, internal messaging system, and multi-language support.

## 🏗️ Architecture Overview

### Backend (Node.js + Express)
- **Framework**: Express.js
- **Database**: MongoDB (Mongoose ODM)
- **Authentication**: JWT with HttpOnly cookies
- **Real-time**: Socket.io for messaging
- **File Storage**: Cloud storage integration (Cloudinary/S3/Firebase)
- **Analytics**: Event-driven tracking system

### Frontend (React + Vite)
- **Framework**: React 19 with Vite
- **Styling**: Tailwind CSS
- **Animations**: GSAP + ScrollTrigger, Framer Motion
- **State Management**: Redux Toolkit
- **Internationalization**: react-i18next (English + Arabic RTL)
- **Forms**: react-hook-form
- **HTTP Client**: Axios

## 📁 Project Structure

```
Company-YANSY/
├── server/
│   ├── models/          # MongoDB schemas
│   ├── controllers/     # Business logic
│   ├── routes/          # API routes
│   ├── middleware/      # Auth, error handling, analytics
│   └── server.js        # Entry point
│
└── client/
    └── vite-project/
        └── src/
            ├── components/   # Reusable components
            ├── pages/        # Page components
            ├── store/        # Redux store
            ├── i18n/         # Translations
            ├── utils/        # Utilities (API, analytics, theme)
            └── App.jsx       # Main app component
```

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ 
- MongoDB (local or Atlas)
- npm or yarn

### Backend Setup

1. Navigate to server directory:
```bash
cd server
```

2. Install dependencies:
```bash
npm install
```

3. Create `.env` file (copy from `.env.example`):
```bash
PORT=5000
NODE_ENV=development
MONGODB_URI=mongodb://localhost:27017/yansy
JWT_SECRET=your-super-secret-jwt-key
JWT_EXPIRES_IN=7d
CLIENT_URL=http://localhost:5173
CLOUD_PROVIDER=cloudinary
```

4. Start the server:
```bash
npm run dev
```

Server will run on `http://localhost:5000`

### Frontend Setup

1. Navigate to client directory:
```bash
cd client/vite-project
```

2. Install dependencies:
```bash
npm install
```

3. Create `.env` file (optional):
```bash
VITE_API_URL=http://localhost:5000/api
```

4. Start the development server:
```bash
npm run dev
```

Frontend will run on `http://localhost:5173`

## 📊 Database Models

### User
- Authentication (email, password)
- Role (admin/client)
- Preferences (theme, language)
- Activity tracking

### Project
- Client assignment
- Progress tracking (0-100%)
- Phase management (planning, design, development, testing, launch)
- Updates and file attachments

### Message & MessageThread
- Real-time messaging
- Thread-based conversations
- File attachments
- Read/unread status

### AnalyticsEvent & Session
- Page views
- Section engagement
- Scroll depth tracking
- Click events
- Session duration

### File
- Cloud storage URLs
- Metadata (size, type, uploader)
- Project/message associations

## 🔐 Authentication

- JWT-based authentication
- HttpOnly cookies for security
- Role-based access control (admin/client)
- Protected routes
- Session tracking

## 🌐 Features

### Client Portal
- Project dashboard
- Progress tracking
- File management
- Internal messaging
- Theme & language preferences

### Admin Dashboard
- Analytics dashboard
- User management
- Project management
- Messaging system
- Content management

### Public Website
- Motion-driven landing page
- GSAP animations
- Responsive design
- Dark/Light mode

### Analytics System
- Real-time event tracking
- Session analytics
- Page view tracking
- Scroll depth analysis
- Click heatmaps
- Section engagement metrics

### Multi-language Support
- English (LTR)
- Arabic (RTL)
- Full layout mirroring
- Easy to extend

### Theme System
- Dark/Light mode
- Auto-detect system preference
- Manual override
- Per-user preferences

## 🔧 API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login
- `POST /api/auth/logout` - Logout
- `GET /api/auth/me` - Get current user
- `PATCH /api/auth/preferences` - Update preferences

### Projects
- `GET /api/projects` - Get all projects
- `GET /api/projects/:id` - Get project by ID
- `POST /api/projects` - Create project (admin)
- `PATCH /api/projects/:id` - Update project
- `POST /api/projects/:id/updates` - Add update (admin)
- `POST /api/projects/:id/files` - Add files

### Messages
- `GET /api/messages/threads` - Get all threads
- `GET /api/messages/threads/:id` - Get thread with messages
- `POST /api/messages/threads` - Create thread
- `POST /api/messages/threads/:id/messages` - Send message

### Analytics
- `POST /api/analytics/events` - Track event
- `POST /api/analytics/sessions/end` - End session
- `GET /api/analytics/dashboard` - Get dashboard data (admin)

### Files
- `POST /api/files/upload` - Upload files
- `GET /api/files` - Get files
- `GET /api/files/:id` - Get file by ID
- `DELETE /api/files/:id` - Delete file

## 🔒 Security Best Practices

- Password hashing with bcryptjs
- JWT tokens in HttpOnly cookies
- CORS configuration
- Input validation
- Error handling middleware
- Rate limiting (recommended for production)
- Environment variables for secrets

## 📦 Cloud Storage Integration

The platform supports multiple cloud storage providers:

1. **Cloudinary** (recommended for images)
2. **AWS S3**
3. **Firebase Storage**

Configure in `.env`:
```env
CLOUD_PROVIDER=cloudinary
CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-api-secret
```

**Note**: Update `server/controllers/fileController.js` with actual cloud upload implementation.

## 🎨 Styling

- Tailwind CSS for utility-first styling
- Dark mode support via `dark:` classes
- RTL support for Arabic
- Custom fonts (Inter for English, Cairo/Tajawal for Arabic)

## 🧪 Development

### Backend
```bash
npm run dev    # Development with nodemon
npm start      # Production
```

### Frontend
```bash
npm run dev    # Development server
npm run build  # Production build
npm preview    # Preview production build
```

## 📝 Environment Variables

### Backend (.env)
- `PORT` - Server port
- `NODE_ENV` - Environment (development/production)
- `MONGODB_URI` - MongoDB connection string
- `JWT_SECRET` - Secret for JWT tokens
- `JWT_EXPIRES_IN` - Token expiration
- `CLIENT_URL` - Frontend URL
- `CLOUD_PROVIDER` - Cloud storage provider
- Cloud provider credentials

### Frontend (.env)
- `VITE_API_URL` - Backend API URL

## 🚢 Deployment

### Backend
1. Set `NODE_ENV=production`
2. Configure MongoDB Atlas
3. Set secure `JWT_SECRET`
4. Configure cloud storage
5. Deploy to Heroku, Railway, or similar

### Frontend
1. Build: `npm run build`
2. Deploy `dist/` folder to Vercel, Netlify, or similar
3. Set environment variables

## 📚 Next Steps

1. **Cloud Storage**: Implement actual cloud upload in `fileController.js`
2. **Socket.io Auth**: Add JWT verification for socket connections
3. **Email Service**: Add email notifications
4. **File Validation**: Enhance file type/size validation
5. **Rate Limiting**: Add rate limiting middleware
6. **Testing**: Add unit and integration tests
7. **CI/CD**: Set up continuous integration/deployment

## 🤝 Contributing

This is a production-ready architecture. Customize as needed for your specific requirements.

## 📄 License

ISC

