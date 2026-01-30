# YANSY Platform - System Architecture

## 🏛️ System Overview

YANSY is a full-stack SaaS platform built with modern technologies, designed for scalability, maintainability, and production readiness.

## 📐 Architecture Principles

1. **Separation of Concerns**: Clear separation between frontend and backend
2. **RESTful API**: Standard REST endpoints with JWT authentication
3. **Real-time Communication**: Socket.io for instant messaging
4. **Event-Driven Analytics**: Scalable analytics tracking system
5. **Multi-tenancy Ready**: Role-based access control
6. **Internationalization**: Built-in support for multiple languages and RTL

## 🗄️ Database Architecture

### MongoDB Collections

#### Users Collection
```javascript
{
  _id: ObjectId,
  email: String (unique, indexed),
  password: String (hashed),
  name: String,
  role: Enum['admin', 'client'],
  preferences: {
    theme: Enum['light', 'dark', 'auto'],
    language: Enum['en', 'ar']
  },
  lastLogin: Date,
  isActive: Boolean,
  avatar: String (cloud URL),
  createdAt: Date,
  updatedAt: Date
}
```

**Indexes:**
- `email` (unique)
- `role`

#### Projects Collection
```javascript
{
  _id: ObjectId,
  title: String,
  description: String,
  client: ObjectId (ref: User),
  assignedBy: ObjectId (ref: User),
  progress: Number (0-100),
  phase: Enum['planning', 'design', 'development', 'testing', 'launch', 'completed'],
  status: Enum['active', 'on-hold', 'completed', 'cancelled'],
  updates: [{
    title: String,
    content: String,
    postedBy: ObjectId (ref: User),
    attachments: [ObjectId (ref: File)],
    createdAt: Date
  }],
  files: [ObjectId (ref: File)],
  startDate: Date,
  targetDate: Date,
  completedDate: Date,
  createdAt: Date,
  updatedAt: Date
}
```

**Indexes:**
- `client` + `status` (compound)
- `phase`

#### Messages Collection
```javascript
{
  _id: ObjectId,
  threadId: ObjectId (ref: MessageThread),
  sender: ObjectId (ref: User),
  recipient: ObjectId (ref: User),
  content: String,
  attachments: [ObjectId (ref: File)],
  isRead: Boolean,
  readAt: Date,
  project: ObjectId (ref: Project),
  createdAt: Date,
  updatedAt: Date
}
```

**Indexes:**
- `threadId` + `createdAt` (compound, descending)
- `recipient` + `isRead`

#### MessageThreads Collection
```javascript
{
  _id: ObjectId,
  participants: [ObjectId (ref: User)],
  project: ObjectId (ref: Project),
  subject: String,
  status: Enum['open', 'replied', 'closed'],
  lastMessage: ObjectId (ref: Message),
  lastActivity: Date,
  createdAt: Date,
  updatedAt: Date
}
```

**Indexes:**
- `participants`
- `lastActivity` (descending)

#### AnalyticsEvents Collection
```javascript
{
  _id: ObjectId,
  sessionId: String (indexed),
  userId: ObjectId (ref: User, indexed),
  eventType: Enum['page_view', 'section_view', 'scroll', 'click', 'session_start', 'session_end'],
  page: String (indexed),
  section: String,
  scrollDepth: Number (0-100),
  viewTime: Number (milliseconds),
  elementId: String,
  elementType: String,
  metadata: Mixed,
  userAgent: String,
  ip: String,
  referrer: String,
  createdAt: Date
}
```

**Indexes:**
- `sessionId` + `createdAt` (compound, descending)
- `userId` + `createdAt` (compound, descending)
- `eventType` + `createdAt` (compound, descending)
- `page` + `createdAt` (compound, descending)

#### Sessions Collection
```javascript
{
  _id: ObjectId,
  sessionId: String (unique, indexed),
  userId: ObjectId (ref: User),
  startTime: Date,
  endTime: Date,
  duration: Number (milliseconds),
  pages: [{
    page: String,
    viewTime: Number,
    scrollDepth: Number,
    enteredAt: Date
  }],
  userAgent: String,
  ip: String,
  referrer: String,
  isActive: Boolean,
  createdAt: Date,
  updatedAt: Date
}
```

**Indexes:**
- `sessionId` (unique)
- `userId` + `startTime` (compound, descending)
- `isActive`

#### Files Collection
```javascript
{
  _id: ObjectId,
  filename: String,
  originalName: String,
  mimeType: String,
  size: Number,
  url: String (cloud URL),
  cloudProvider: Enum['cloudinary', 's3', 'firebase'],
  cloudId: String,
  uploadedBy: ObjectId (ref: User, indexed),
  project: ObjectId (ref: Project, indexed),
  message: ObjectId (ref: Message, indexed),
  isPublic: Boolean,
  tags: [String],
  createdAt: Date,
  updatedAt: Date
}
```

**Indexes:**
- `uploadedBy` + `createdAt` (compound, descending)
- `project`
- `message`

## 🔌 API Architecture

### RESTful Endpoints

All endpoints follow REST conventions:
- `GET` - Retrieve resources
- `POST` - Create resources
- `PATCH` - Update resources
- `DELETE` - Delete resources

### Authentication Flow

1. **Registration/Login**
   - Client sends credentials
   - Server validates and creates/verifies user
   - JWT token generated and set in HttpOnly cookie
   - Token also returned in response body for localStorage

2. **Protected Routes**
   - Client sends request with token (cookie or header)
   - Middleware verifies token
   - User object attached to request
   - Role-based access control applied

3. **Token Refresh**
   - Tokens expire after 7 days (configurable)
   - Client should re-authenticate on 401

### Real-time Architecture (Socket.io)

**Connection Flow:**
1. Client connects with auth token
2. Server verifies token
3. Client joins user-specific room: `user:${userId}`
4. Client joins thread rooms: `thread:${threadId}`

**Events:**
- `join` - Join user room
- `join-thread` - Join thread room
- `new-message` - Broadcast new message
- `message-received` - Receive message
- `typing` - Typing indicator
- `user-typing` - Receive typing indicator
- `notification` - Push notification

## 🎨 Frontend Architecture

### Component Hierarchy

```
App
├── Router
│   ├── Public Routes
│   │   ├── Home (Landing Page)
│   │   ├── Login
│   │   └── Register
│   └── Protected Routes
│       └── Layout
│           ├── Navigation
│           ├── Dashboard
│           ├── Projects
│           ├── Messages
│           └── Admin (if admin)
```

### State Management

**Redux Store Structure:**
```javascript
{
  auth: {
    user: User | null,
    token: String | null,
    isAuthenticated: Boolean,
    loading: Boolean,
    error: String | null
  }
}
```

**Future additions:**
- `projects` slice
- `messages` slice
- `analytics` slice
- `ui` slice (theme, language)

### Routing Strategy

- **Public Routes**: `/`, `/login`, `/register`
- **Protected Routes**: `/dashboard`, `/projects`, `/messages`
- **Admin Routes**: `/admin/*` (requires admin role)
- **404 Handler**: Redirect to dashboard

### Analytics Tracking

**Event Types:**
1. `session_start` - When user session begins
2. `page_view` - When page is viewed
3. `section_view` - When section enters viewport
4. `scroll` - Scroll depth tracking
5. `click` - Click events on tracked elements
6. `session_end` - When user leaves

**Implementation:**
- Automatic tracking via middleware
- Manual tracking via utility functions
- Batch events for performance
- Non-blocking (doesn't affect UX)

## 🔒 Security Architecture

### Authentication & Authorization

1. **Password Security**
   - Bcrypt hashing (12 rounds)
   - Minimum 6 characters
   - No plain text storage

2. **JWT Tokens**
   - HttpOnly cookies (prevents XSS)
   - Secure flag in production
   - SameSite: lax
   - 7-day expiration

3. **Role-Based Access Control**
   - Middleware checks user role
   - Admin-only endpoints protected
   - Client can only access own resources

4. **Input Validation**
   - Mongoose schema validation
   - Express validation middleware
   - Sanitization of user input

### CORS Configuration

- Whitelist allowed origins
- Credentials enabled
- Preflight handling

### File Upload Security

- File type validation
- Size limits (10MB default)
- Virus scanning (recommended for production)
- Cloud storage (prevents server overload)

## 📊 Analytics Architecture

### Event Collection

1. **Client-side Tracking**
   - JavaScript utility functions
   - Automatic scroll/click tracking
   - Session management

2. **Server-side Processing**
   - Event storage in MongoDB
   - Aggregation pipelines for analytics
   - Real-time dashboard updates

### Data Flow

```
User Action → Analytics Utility → API Endpoint → MongoDB
                                           ↓
                                    Aggregation Pipeline
                                           ↓
                                    Dashboard Display
```

### Performance Considerations

- Non-blocking event tracking
- Batch processing for heavy loads
- Indexed queries for fast retrieval
- Aggregation pipelines for complex analytics

## 🌐 Internationalization Architecture

### Language Support

- **English (LTR)**: Default language
- **Arabic (RTL)**: Full RTL support

### Implementation

1. **Translation Files**: JSON files in `src/i18n/locales/`
2. **Language Detection**: Browser + localStorage
3. **RTL Handling**: CSS direction + font switching
4. **Dynamic Loading**: Load translations on demand

### RTL Considerations

- Layout mirroring
- Animation direction adaptation
- Font selection (Cairo/Tajawal for Arabic)
- Text alignment

## 🎨 Theme Architecture

### Theme Modes

1. **Light Mode**: Default light theme
2. **Dark Mode**: Dark color scheme
3. **Auto**: Follows system preference

### Implementation

- CSS variables (Tailwind dark mode)
- `prefers-color-scheme` media query
- localStorage persistence
- Per-user preferences (stored in DB)

### Color System

- Primary colors (configurable)
- Gray scale for backgrounds/text
- Semantic colors (success, error, warning)
- Dark mode variants

## 📁 File Storage Architecture

### Cloud Storage Strategy

**Supported Providers:**
1. Cloudinary (images/media)
2. AWS S3 (general files)
3. Firebase Storage (alternative)

**Flow:**
1. Client uploads file
2. Server receives file (multer)
3. Upload to cloud provider
4. Store metadata in MongoDB
5. Return URL to client

**Benefits:**
- Scalable storage
- CDN delivery
- Reduced server load
- Automatic optimization (Cloudinary)

## 🚀 Scalability Considerations

### Backend Scalability

1. **Database**
   - MongoDB Atlas for horizontal scaling
   - Indexed queries
   - Aggregation pipelines

2. **API**
   - Stateless design
   - Load balancing ready
   - Caching layer (Redis recommended)

3. **File Storage**
   - Cloud storage (no server storage)
   - CDN for delivery

### Frontend Scalability

1. **Code Splitting**
   - Route-based splitting
   - Lazy loading components

2. **Performance**
   - Optimized builds (Vite)
   - Image optimization
   - Lazy loading images

3. **Caching**
   - Service worker (PWA ready)
   - Browser caching
   - CDN caching

## 🔄 Deployment Architecture

### Recommended Stack

**Backend:**
- Node.js runtime
- MongoDB Atlas
- Cloud storage (Cloudinary/S3)
- Environment variables

**Frontend:**
- Static hosting (Vercel/Netlify)
- CDN delivery
- Environment variables

### Environment Configuration

**Development:**
- Local MongoDB
- Local file storage (optional)
- Hot reload enabled

**Production:**
- MongoDB Atlas
- Cloud storage
- Optimized builds
- Error tracking (Sentry recommended)
- Monitoring (recommended)

## 📈 Monitoring & Observability

### Recommended Tools

1. **Error Tracking**: Sentry
2. **Analytics**: Custom + Google Analytics
3. **Performance**: Lighthouse, Web Vitals
4. **Logging**: Winston, Morgan
5. **Monitoring**: PM2, New Relic

## 🔮 Future Enhancements

1. **Microservices**: Split into services (auth, projects, messaging)
2. **GraphQL**: Add GraphQL API layer
3. **WebSockets**: Enhanced real-time features
4. **PWA**: Progressive Web App capabilities
5. **Mobile Apps**: React Native apps
6. **AI Integration**: Chatbot, recommendations
7. **Advanced Analytics**: Machine learning insights

