const express = require('express');
const mongoose = require('mongoose');
const path = require('path');
const dotenv = require('dotenv');
const jwt = require('jsonwebtoken');

const app = express();
const PORT = 3000;

dotenv.config({ path: path.join(__dirname, '..', '.env') });

//require('dotenv').config(); // ??

// Middleware
// Serve static files from the correct "front" directory
app.use(express.static(path.join(__dirname, '..', 'front')));
app.use(express.json());

console.log('Mongo URI:', process.env.MONGO_URI);

mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true })
    .then(() => console.log('Connected to MongoDB Atlas'))
    .catch(err => console.error('Error connecting to MongoDB:', err));


// User Schema and Model
const userSchema = new mongoose.Schema({
    username: { type: String, required: true },
    password: { type: String, required: true },
});

const User = mongoose.model('User', userSchema);

// Serve the index.html file at the root route
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '..', 'front', 'index.html'));
});

// Register a new user
app.post('/api/register', async (req, res) => {
    const { username, password } = req.body;

    try {
        const existingUser = await User.findOne({ username });
        if (existingUser) {
            return res.status(400).json({ message: 'User already exists' });
        }

        const user = new User({ username, password });
        await user.save();
        res.status(201).json({ message: 'User registered successfully' });
    } catch (err) {
        res.status(500).json({ message: 'Error registering user', error: err.message });
    }
});

// Login and generate JWT
app.post('/api/login', async (req, res) => {
    const { username, password } = req.body;

    try {
        const user = await User.findOne({ username });
        if (!user || user.password !== password) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }

        // Generate JWT
        const token = jwt.sign({ id: user._id, username: user.username }, process.env.JWT_SECRET, {
            expiresIn: '1h',
        });
        res.json({ message: 'Login successful', token });
    } catch (err) {
        res.status(500).json({ message: 'Error logging in', error: err.message });
    }
});

// Protected route
app.get('/api/protected', authenticateJWT, (req, res) => {
    res.json({ message: 'You have access to this protected route', user: req.user });
});

// JWT Authentication Middleware
function authenticateJWT(req, res, next) {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
        return res.status(403).json({ message: 'Access denied. No token provided.' });
    }

    jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
        if (err) {
            return res.status(403).json({ message: 'Invalid or expired token' });
        }

        req.user = user;
        next();
    });
}

// Sample Endpoint
app.get('/api/hello', (req, res) => {
    res.json({ message: 'Hello from the backend!' });
});

// Start Server
app.listen(PORT, () => {
    console.log(`Backend running at http://localhost:${PORT}`);
});
