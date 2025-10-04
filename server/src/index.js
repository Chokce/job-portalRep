const express = require('express');
const cors = require('cors');
require('dotenv').config();
const jobsRouter = require('./routes/jobs');
require('./lib/firebase.js'); // Initialize Firebase

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/jobs', jobsRouter);
app.use('/api/users', require('./routes/users'));
app.use('/api/applications', require('./routes/applications'));

// Basic route
app.get('/', (req, res) => {
    res.json({ message: 'JobConnect API is running!' });
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ message: 'Something went wrong!' });
});

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
