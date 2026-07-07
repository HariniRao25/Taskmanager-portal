const express = require('express');
const cors = require('cors');
const http = require('http');
const { Server } = require('socket.io');
const dotenv = require('dotenv');
const connectDB = require('./config/db');
const errorHandler = require('./middleware/errorHandler');

dotenv.config();
connectDB();

const app = express();
const server = http.createServer(app);

// Allow localhost (dev), any ngrok tunnel, and an optional explicit CLIENT_URL.
const allowedOrigin = (origin, callback) => {
  if (
    !origin || // non-browser clients (curl, mobile) send no Origin
    /^https?:\/\/localhost(:\d+)?$/.test(origin) ||
    /\.ngrok(-free)?\.(app|dev|io)$/.test(origin) ||
    (process.env.CLIENT_URL && origin === process.env.CLIENT_URL)
  ) {
    return callback(null, true);
  }
  return callback(new Error(`Not allowed by CORS: ${origin}`));
};

const io = new Server(server, {
  cors: {
    origin: allowedOrigin,
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    credentials: true
  }
});

// Middleware
app.use(cors({ origin: allowedOrigin, credentials: true }));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Socket.IO real-time notifications
io.on('connection', (socket) => {
  console.log(`🔌 Client connected: ${socket.id}`);

  socket.on('join', (userId) => {
    socket.join(userId);
    console.log(`👤 User ${userId} joined room`);
  });

  socket.on('disconnect', () => {
    console.log(`❌ Client disconnected: ${socket.id}`);
  });
});

// Make io available to routes
app.set('io', io);

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/projects', require('./routes/projects'));
app.use('/api/tasks', require('./routes/tasks'));
app.use('/api/incidents', require('./routes/incidents'));
app.use('/api/notifications', require('./routes/notifications'));
app.use('/api/reviews', require('./routes/reviews'));
app.use('/api/reports', require('./routes/reports'));

// Health check
app.get('/api/health', (req, res) => res.json({ status: 'OK', timestamp: new Date() }));

// Serve the built frontend from the same origin (single-tunnel deploy).
// Run `npm run build` in ../frontend first. Falls back silently if not built.
const path = require('path');
const fs = require('fs');
const clientBuild = path.join(__dirname, '..', 'frontend', 'build');
if (fs.existsSync(clientBuild)) {
  app.use(express.static(clientBuild));
  // Any non-API route serves the React app (client-side routing).
  app.get(/^\/(?!api).*/, (req, res) =>
    res.sendFile(path.join(clientBuild, 'index.html'))
  );
}

// Error Handler
app.use(errorHandler);

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`🚀 TeamFlow Server running on port ${PORT}`);
  console.log(`📊 Environment: ${process.env.NODE_ENV}`);
});
