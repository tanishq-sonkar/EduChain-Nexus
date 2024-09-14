// Required dependencies
const express = require('express');
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const path = require('path');
const multer = require('multer');


const app = express();
const port = process.env.PORT || 3000;

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
  password: { type: String, required: true },
  institute: { type:String},
  location: { type:String},
  jobTitle: { type:String},
  interests:{ type: String},
  bioNote: { type:String},
  profileImage: { type:String }
});

// Define collections // Create models
const requests = mongoose.model('requests', {
  requester: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  itemName: String,
  itemDescription: String,  
  status: { type: String, enum: ['open', 'accepted', 'completed'], default: 'open' },
  createdAt: { type: Date, default: Date.now }
});

const deliveries = mongoose.model('deliveries',{
  request: { type: mongoose.Schema.Types.ObjectId, ref: 'Request' },
  deliverer: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  status: { type: String, enum: ['in-progress', 'completed'], default: 'in-progress' },
  createdAt: { type: Date, default: Date.now }
});

const items = mongoose.model('items',{
  itemName: String,
  itemDescription: String,
  ownerName: String,
  ownerEmail: String
});


// Routes
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.get('/about', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'about.html'));
});

app.get('/service', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'deliveryServices.html'));
});

app.get('/home', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'home.html'));
});

app.get('/contact', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'contact.html'));
});

app.get('/profile', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'profile.html'));
});

app.get('/faq', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'FAQ.html'));
});

app.get('/login', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'signup.html'));
});


//Post Function
app.post('/signup', async (req, res) => {
  try {
    const { username, email, password } = req.body;
    const hashedPassword = await bcrypt.hash(password, 10);

    // Log input data for debugging
    console.log('Signup data:', { username, email });
    
    //Insert new user into the databse
    const user = new User({ username, email, password: hashedPassword });
    await user.save();
    
    res.json({ success: true });
  } catch (error) {
    res.status(500).send({ success: false, message: 'Error signing up' });
  }
});

app.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;

    // Find User by email
    const user = await User.findOne({ username });

    console.log(user);
    //Find user in database
    if (user && await bcrypt.compare(password, user.password)) {
      res.json({ message: 'Login successful', user, success: true });

    } else {
      res.status(400).send('Invalid credentials');
    }
  } catch (error) {
    res.status(500).send('Error logging in');
  }
});

// Set up multer for handling file uploads
const storage = multer.diskStorage({
  destination: function(req, file, cb) {
    cb(null, 'uploads/');
  },
  filename: function(req, file, cb) {
    cb(null, file.fieldname + '-' + Date.now() + path.extname(file.originalname));
  }
});

const upload = multer({ storage: storage });

// Serve static files
app.use('/uploads', express.static('uploads'));

// Routes
app.get('/api/profile/:userId', async (req, res) => {
  try {
    const user = await User.findById(req.params.userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.json(user);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching user profile', error: error.message });
  }
});

app.post('/api/profile/:userId', upload.single('profileImage'), async (req, res) => {
  try {
    const userId = req.params.userId;
    const updateData = req.body;
    
    if (req.file) {
      updateData.profileImage = '/uploads/' + req.file.filename;
    }

    const updatedUser = await User.findByIdAndUpdate(userId, updateData, { new: true });
    
    if (!updatedUser) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    res.json(updatedUser);
  } catch (error) {
    res.status(500).json({ message: 'Error updating user profile', error: error.message });
  }
});

//Borrowing and lending
app.post('/items', async (req, res) => {
  try {
      const {name:itemName, description:itemDescription,username:userName,contact:userEmail} = req.body;
      console.log(req.body);

      // Create a new item object
      const newItem = new items({
        name: itemName,
        description: itemDescription,
        username: userName,
        contact: userEmail
      });
      await newItem.save();

      // Send response
      res.json({ success: true });
  } catch (error) {
      console.error('Error adding item:', error);
      res.status(500).send('Error adding random item');
  }
});

app.get('/items', async (req, res) => {
  try {
    // Fetch all items from the database
    const items = await Item.find();  // Item is the model you've defined

    // Return the items as a JSON response
    res.status(200).json(items);
  } catch (error) {
    console.error('Error fetching items:', error);
    res.status(500).json({ success: false, message: 'Error fetching items' });
  }
});


// API Endpoints

// POST /api/requests (create a new request)
app.post('/requests', async (req, res) => {
  try {
    const { username, itemName, itemdescription } = req.body;
    const request = new Request({
      requester: requesterId,
      title,
      description,
    });
    await request.save();
    res.status(201).json(request);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// GET /api/requests (list all open requests)
app.get('/requests', async (req, res) => {
  try {
    const requests = await Request.find({ status: 'open' }).populate('requester', 'name');
    res.json(requests);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// GET /api/requests/:id (get details of a specific request)
app.get('/requests/:id', async (req, res) => {
  try {
    const request = await Request.findById(req.params.id).populate('requester', 'name');
    if (!request) {
      return res.status(404).json({ message: 'Request not found' });
    }
    res.json(request);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// POST /api/deliveries (accept a request/create a delivery)
app.post('/deliveries', async (req, res) => {
  try {
    const { requestId, delivererId } = req.body;
    const request = await Request.findById(requestId);
    if (!request || request.status !== 'open') {
      return res.status(400).json({ message: 'Invalid or already accepted request' });
    }
    
    const newDelivery = new Delivery({
      request: requestId,
      deliverer: delivererId,
    });
    await newDelivery.save();
    
    request.status = 'accepted';
    await request.save();
    
    res.status(201).json(newDelivery);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// PUT /api/deliveries/:id (update delivery status)
app.put('/deliveries/:id', async (req, res) => {
  try {
    const { status } = req.body;
    const delivery = await Delivery.findById(req.params.id);
    if (!delivery) {
      return res.status(404).json({ message: 'Delivery not found' });
    }
    
    delivery.status = status;
    await delivery.save();
    
    if (status === 'completed') {
      const request = await Request.findById(delivery.request);
      request.status = 'completed';
      await request.save();
    }
    
    res.json(delivery);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

//Start the server
app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});
