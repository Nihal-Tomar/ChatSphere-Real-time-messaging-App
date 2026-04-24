# 💬 ChatSphere

A modern, production-ready real-time chat application built with the MERN stack + Socket.IO.

## 🚀 Tech Stack

### Frontend
- React 18 + Vite
- Tailwind CSS
- Socket.IO Client
- Zustand (state management)
- React Router v6
- Axios

### Backend
- Node.js + Express
- Socket.IO
- MongoDB + Mongoose
- JWT Authentication
- bcryptjs
- Cloudinary (file uploads)
- Redis (caching & pub/sub)

## 📁 Project Structure

```
ChatSphere/
├── server/               # Backend (Node.js + Express)
│   ├── config/           # DB, Redis, Cloudinary config
│   ├── controllers/      # Route controllers
│   ├── middleware/        # Auth, error, rate-limit middleware
│   ├── models/           # Mongoose models
│   ├── routes/           # Express routes
│   ├── socket/           # Socket.IO handlers
│   ├── utils/            # Helper utilities
│   └── index.js          # Entry point
├── client/               # Frontend (React + Vite)
│   ├── public/
│   ├── src/
│   │   ├── api/          # Axios instances & API calls
│   │   ├── assets/       # Static assets
│   │   ├── components/   # Reusable UI components
│   │   ├── context/      # React context providers
│   │   ├── hooks/        # Custom hooks
│   │   ├── pages/        # Page components
│   │   ├── store/        # Zustand stores
│   │   ├── utils/        # Utilities & helpers
│   │   ├── App.jsx
│   │   └── main.jsx
│   ├── index.html
│   └── vite.config.js
└── README.md
```

## ⚙️ Environment Setup

### Backend (`server/.env`)
```env
PORT=5000
MONGO_URI=mongodb+srv://<user>:<pass>@cluster.mongodb.net/chatsphere
JWT_SECRET=your_super_secret_jwt_key
JWT_EXPIRES_IN=7d
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
REDIS_URL=redis://localhost:6379
CLIENT_URL=http://localhost:5173
NODE_ENV=development
```

### Frontend (`client/.env`)
```env
VITE_API_URL=http://localhost:5000/api
VITE_SOCKET_URL=http://localhost:5000
```

## 🛠️ Local Development

```bash
# Install backend dependencies
cd server && npm install

# Install frontend dependencies
cd ../client && npm install

# Start backend (from server/)
npm run dev

# Start frontend (from client/)
npm run dev
```

## 🚢 Deployment

- **Frontend**: Deploy `client/` to Vercel
- **Backend**: Deploy `server/` to Render or Railway
- **Database**: MongoDB Atlas
- **Cache**: Redis Cloud / Upstash
- **Files**: Cloudinary
