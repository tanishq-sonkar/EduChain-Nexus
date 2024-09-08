// Required dependencies
const express = require('express');
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const path = require('path');

const app = express();
const port = 3000;
const { User, verifyAndLogin } = require('./userModel');

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static files from the 'public' directory
app.use(express.static('public'));

// Updated MongoDB connection
mongoose.connect('mongodb://127.0.0.1:27017/userauth')
  .then(() => console.log('Connected to MongoDB'))
  .catch(err => {
    console.error('Failed to connect to MongoDB:', err);
    process.exit(1);
  });

// Connection error handling
mongoose.connection.on('error', err => {
  console.error('MongoDB connection error:', err);
});

// User model
const User = mongoose.model('User', {
  username: { type: String, required: true, unique: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true }
});

// Routes
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.get('/about', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'about.html'));
});

app.get('/service', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'services.html'));
});

app.get('/home', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'home.html'));
});

app.get('/contact', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'contact.html'));
});

// Serve login page
app.get('/login', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'signup.html'));
});

//Post Function
app.post('/signup', async (req, res) => {
  try {
    const { username, email, password } = req.body;
    const hashedPassword = await bcrypt.hash(password, 10);
    
    //Insert new user into the databse
    const user = new User({ username, email, password: hashedPassword });
    await user.save();
    
    res.json({ success: true });;
  } catch (error) {
    res.status(500).send('Error signing up');
  }
});

app.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    // Find User by email
    const user = await User.findOne({ email });

    //Find user in datbase
    if (user && await bcrypt.compare(password, user.password)) {
      const { email, password } = req.body;
      const user = await verifyAndLogin(email, password);
      res.json({ message: 'Login successful', user });
      res.json({ success: true });;
    } else {
      res.status(400).send('Invalid credentials');
    }
  } catch (error) {
    res.status(500).send('Error logging in');
  }
});

//Start the server
app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});