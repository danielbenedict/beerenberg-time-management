const express = require('express');
const cors = require('cors');
require('dotenv').config();

const authRoutes = require('./src/routes/authRoutes');
const userRoutes = require('./src/routes/userRoutes');
const rosterRoutes = require('./src/routes/rosterRoutes');
const kioskRoutes = require('./src/routes/kioskRoutes');
const reportRoutes = require('./src/routes/reportRoutes');

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// API Routes
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1', userRoutes);
app.use('/api/v1', rosterRoutes);
app.use('/api/v1', kioskRoutes);
app.use('/api/v1/reports', reportRoutes);

// Health Check Endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'UP', message: 'Beerenberg Backend API is running' });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});