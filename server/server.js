require('dotenv').config();

// ── Startup secrets validation — crash fast if placeholders are still in use ──
const PLACEHOLDER_JWT    = 'your_super_secret_jwt_key_change_this_in_production';
const PLACEHOLDER_ENC    = 'your_32_character_encryption_key_here_change_this';
const PLACEHOLDER_MONGO  = 'mongodb+srv://Meghashyam:tnUGyApj7wON7UgS@';

if (!process.env.JWT_SECRET || process.env.JWT_SECRET === PLACEHOLDER_JWT) {
  console.error('❌ FATAL: JWT_SECRET is not set or is still the default placeholder. Set a strong random secret.');
  process.exit(1);
}
if (!process.env.ENCRYPTION_KEY || process.env.ENCRYPTION_KEY === PLACEHOLDER_ENC) {
  console.error('❌ FATAL: ENCRYPTION_KEY is not set or is still the default placeholder. Set a 32-character random key.');
  process.exit(1);
}
if (process.env.MONGODB_URI && process.env.MONGODB_URI.startsWith(PLACEHOLDER_MONGO)) {
  console.error('❌ FATAL: MONGODB_URI still uses the committed credentials. Rotate your Atlas password immediately.');
  process.exit(1);
}

const express = require('express');
const cors = require('cors'); // keep this
const morgan = require('morgan');
const helmet = require('helmet');
const compression = require('compression');
const rateLimit = require('express-rate-limit');
const jwt = require('jsonwebtoken');
const path = require('path');
const fs = require('fs');
const connectDB = require('./config/db');
const { initCronJobs } = require('./utils/cronJobs');

// Initialize express app
const app = express();

// Create necessary directories
const dirs = ['uploads', 'receipts'];
dirs.forEach(dir => {
  const dirPath = path.join(__dirname, dir);
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
});

// ------------------- ✅ CORS CONFIG START -------------------
const allowedOrigins = (process.env.ALLOWED_ORIGINS || 'http://localhost:3000')
  .split(',').map(o => o.trim()).filter(Boolean);

app.use(cors({
  origin: (origin, cb) => {
    // Allow server-to-server / curl / Postman (no origin header)
    if (!origin) return cb(null, true);
    if (allowedOrigins.includes('*') || allowedOrigins.includes(origin)) return cb(null, true);
    cb(new Error('Not allowed by CORS'));
  },
  credentials: true
}));
// ------------------- ✅ CORS CONFIG END -------------------

// Middleware
app.use(helmet());
app.use(compression());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Logging
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

// ── Global rate limiter ──
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000,
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100,
  message: { success: false, message: 'Too many requests. Please try again later.' }
});
app.use('/api/', limiter);

// ── Serve receipt files — require valid JWT ──
const receiptAuth = (req, res, next) => {
  try {
    const token = (req.headers.authorization || '').replace('Bearer ', '') || (req.query.token || '');
    if (!token) return res.status(401).send('Unauthorized');
    jwt.verify(token, process.env.JWT_SECRET);
    next();
  } catch {
    res.status(401).send('Unauthorized');
  }
};
app.use('/receipts', receiptAuth, express.static(path.join(__dirname, 'receipts')));

// Routes
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/admins', require('./routes/adminRoutes'));
app.use('/api/customers', require('./routes/customerRoutes'));
app.use('/api/bills', require('./routes/billRoutes'));
app.use('/api/payments', require('./routes/paymentRoutes'));
app.use('/api/settings', require('./routes/settingsRoutes'));
app.use('/api/portal', require('./routes/portal'));

// Health check
app.get('/api/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Server is running',
    timestamp: new Date().toISOString()
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found'
  });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error('Error:', err);

  if (err.code === 'LIMIT_FILE_SIZE') {
    return res.status(400).json({
      success: false,
      message: 'File size too large. Maximum size is 5MB.'
    });
  }

  if (err.message === 'Only Excel files are allowed') {
    return res.status(400).json({
      success: false,
      message: err.message
    });
  }

  if (err.name === 'ValidationError') {
    const errors = Object.values(err.errors).map(e => e.message);
    return res.status(400).json({
      success: false,
      message: 'Validation error',
      errors
    });
  }

  if (err.code === 11000) {
    const field = Object.keys(err.keyPattern)[0];
    return res.status(400).json({
      success: false,
      message: `${field} already exists`
    });
  }

  if (err.name === 'JsonWebTokenError') {
    return res.status(401).json({
      success: false,
      message: 'Invalid token'
    });
  }

  if (err.name === 'TokenExpiredError') {
    return res.status(401).json({
      success: false,
      message: 'Token expired'
    });
  }

  res.status(err.statusCode || 500).json({
    success: false,
    message: err.message || 'Server error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
});

// Initialize cron jobs
initCronJobs();

// Start server
const PORT = process.env.PORT || 5000;

const startServer = async () => {
  try {
    await connectDB();

    app.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT}`);
    });
  } catch (err) {
    console.error('Failed to connect to database:', err);
    process.exit(1);
  }
};

if (require.main === module) {
  startServer();
}

// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
  console.error('❌ Unhandled Rejection:', err);
  process.exit(1);
});

module.exports = app;
