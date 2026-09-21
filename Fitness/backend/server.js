const express = require('express');
const http = require('http');
const cors = require('cors');
const dotenv = require('dotenv');
const connectDB = require('./config/db');
const seedDatabase = require('./config/seed');

// Load environment variables
dotenv.config();

// Initialize Express
const app = express();

// Allowed Origins for CORS
const allowedOrigins = [
  'http://localhost:4200',
  'http://localhost:3000',
  'http://localhost:5173',
  'http://127.0.0.1:4200',
  'http://127.0.0.1:3000',
  process.env.CLIENT_URL,
  process.env.CORS_ORIGIN,
].filter(Boolean);

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (like mobile apps, curl, or Postman)
      if (!origin || allowedOrigins.includes(origin)) {
        return callback(null, true);
      }
      return callback(null, true); // Dev-friendly fallback
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
);

// Body Parsers
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Import Routes
const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');
const memberRoutes = require('./routes/memberRoutes');
const trainerRoutes = require('./routes/trainerRoutes');
const workoutRoutes = require('./routes/workoutRoutes');
const exerciseRoutes = require('./routes/exerciseRoutes');
const attendanceRoutes = require('./routes/attendanceRoutes');
const membershipRoutes = require('./routes/membershipRoutes');
const paymentRoutes = require('./routes/paymentRoutes');
const dashboardRoutes = require('./routes/dashboardRoutes');
const nutritionRoutes = require('./routes/nutritionRoutes');
const progressRoutes = require('./routes/progressRoutes');
const aiRoutes = require('./routes/aiRoutes');
const chatRoutes = require('./routes/chatRoutes');
const { initSocket } = require('./socket');
const { seedFoodsIfEmpty } = require('./controllers/nutritionController');
const { seedTrainersIfEmpty } = require('./controllers/trainerController');
const { seedExercisesIfEmpty } = require('./controllers/exerciseController');
const { seedDefaultChatIfEmpty } = require('./controllers/chatController');
const { seedWorkoutHistoryIfEmpty } = require('./controllers/progressController');
const { notFound, errorHandler } = require('./middleware/errorMiddleware');

// Root Route
app.get('/', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Fitness Platform Backend API is running',
    version: '1.0.0',
    endpoints: {
      auth: '/api/auth',
      members: '/api/members',
      trainers: '/api/trainers',
      workouts: '/api/workouts',
      exercises: '/api/exercises',
      nutrition: '/api/nutrition',
      ai: '/api/ai',
      chat: '/api/chat',
      attendance: '/api/attendance',
      memberships: '/api/memberships',
      payments: '/api/payments',
      dashboard: '/api/dashboard',
    },
  });
});

// Health check endpoint
const healthHandler = (req, res) => {
  res.status(200).json({
    success: true,
    message: 'System health check completed successfully',
    data: {
      service: 'Fitness Management Platform API',
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
    },
  });
};

app.get('/api/health', healthHandler);
app.get('/api/v1/health', healthHandler);

// Mount API routes under /api
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/members', memberRoutes);
app.use('/api/trainers', trainerRoutes);
app.use('/api/workouts', workoutRoutes);
app.use('/api/exercises', exerciseRoutes);
app.use('/api/nutrition', nutritionRoutes);
app.use('/api/progress', progressRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/attendance', attendanceRoutes);
app.use('/api/memberships', membershipRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/dashboard', dashboardRoutes);

// Mount identical routes under /api/v1 for 100% frontend backwards compatibility
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/members', memberRoutes);
app.use('/api/v1/trainers', trainerRoutes);
app.use('/api/v1/workouts', workoutRoutes);
app.use('/api/v1/exercises', exerciseRoutes);
app.use('/api/v1/nutrition', nutritionRoutes);
app.use('/api/v1/progress', progressRoutes);
app.use('/api/v1/ai', aiRoutes);
app.use('/api/v1/chat', chatRoutes);
app.use('/api/v1/attendance', attendanceRoutes);
app.use('/api/v1/memberships', membershipRoutes);
app.use('/api/v1/payments', paymentRoutes);
app.use('/api/v1/dashboard', dashboardRoutes);

// Support existing frontend profile route (/api/v1/users/profile)
app.use('/api/v1/users', userRoutes);

// 404 & Error Handlers
app.use(notFound);
app.use(errorHandler);

// Start Server after connecting to MongoDB
const PORT = process.env.PORT || 5000;

const startServer = async () => {
  // Connect to Database
  const conn = await connectDB();
  if (conn) {
    // Seed database if collections are empty
    await seedDatabase();
    await seedFoodsIfEmpty();
    await seedTrainersIfEmpty();
    await seedExercisesIfEmpty();
    await seedDefaultChatIfEmpty();
    await seedWorkoutHistoryIfEmpty();
  }

  const server = http.createServer(app);

  // Attach Socket.IO to HTTP server
  initSocket(server);

  server.listen(PORT, () => {
    console.log(`====================================================`);
    console.log(`🚀 Fitness Platform Backend Running on port ${PORT}!`);
    console.log(`📡 URL: http://localhost:${PORT}`);
    console.log(`💬 Socket.IO: Initialized & listening for chat events`);
    console.log(`🏥 Health Check: http://localhost:${PORT}/api/health`);
    console.log(`====================================================`);
  });

  // Handle unhandled promise rejections
  process.on('unhandledRejection', (err) => {
    console.error(`[Unhandled Rejection]: ${err.message}`);
  });
};

startServer();

module.exports = app;
