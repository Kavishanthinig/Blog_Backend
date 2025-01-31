const express = require('express');
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const cors = require('cors');
const nodemailer = require('nodemailer');
const app = express();

app.use(cors({
    origin: 'http://localhost:3000',
    credentials: true
}));

app.use(express.json());

mongoose.connect('mongodb+srv://kavishanthinig:kavi2114@kavi.docd8.mongodb.net/', {
    useNewUrlParser: true,
    useUnifiedTopology: true,
}).then(() => console.log('Connected to MongoDB'))
  .catch(err => console.error('Could not connect to MongoDB:', err));

// User Schema
const UserSchema = new mongoose.Schema({
    username: { type: String, required: true, unique: true },
    password: { type: String, required: true },
});

const User = mongoose.model('User', UserSchema);

// Subscriber Schema
const SubscriberSchema = new mongoose.Schema({
    email: { type: String, required: true, unique: true },
});

const Subscriber = mongoose.model('Subscriber', SubscriberSchema);

// Blog Schema
const BlogSchema = new mongoose.Schema({
  title: { type: String, required: true },
  content: { type: String, required: true },
  author: { type: String, required: true },
  category: { type: String, required: true },
  externalLink: { type: String },
  comments: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Comment' }]
});

const Blog = mongoose.model('Blog', BlogSchema);


// Register endpoint
app.post('/register', async (req, res) => {
    const { username, password } = req.body;

    try {
        const existingUser = await User.findOne({ username });
        if (existingUser) {
            return res.status(400).json({ message: 'Username already exists' });
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        const newUser = new User({ username, password: hashedPassword });
        await newUser.save();

        res.status(200).json({ message: 'Registration successful' });
    } catch (err) {
        res.status(500).json({ message: 'Registration failed', error: err.message });
    }
});

// Login endpoint
app.post('/login', async (req, res) => {
    const { username, password } = req.body;

    try {
        const user = await User.findOne({ username });
        if (!user) {
            return res.status(400).json({ message: 'User not found' });
        }

        const isPasswordValid = await bcrypt.compare(password, user.password);
        if (!isPasswordValid) {
            return res.status(401).json({ message: 'Invalid password' });
        }

        res.status(200).json({ message: 'Login successful' });
    } catch (err) {
        res.status(500).json({ message: 'Login failed', error: err.message });
    }
});

// Subscribe endpoint
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: 'kavishanthini2114@gmail.com',
    pass: 'vajc gmpl enhx ljyj',
  },
});

const sendNotificationEmail = async (email) => {
    const mailOptions = {
      from: 'kavishanthini2114@gmail.com',
      to: email,
      subject: 'Thank You for Subscribing!',
      text: `Thank you for subscribing to our blog! You will receive updates from us soon.`,
    };

    try {
        await transporter.sendMail(mailOptions);
        console.log('Email sent');
    } catch (error) {
        console.error('Error sending email:', error);
    }
};

app.post('/subscribe', async (req, res) => {
  const { email } = req.body;

  try {
    const existingSubscriber = await Subscriber.findOne({ email });
    if (existingSubscriber) {
      return res.status(400).json({ message: 'Email already subscribed' });
    }

    const newSubscriber = new Subscriber({ email });
    await newSubscriber.save();

    await sendNotificationEmail(email);
    res.status(200).json({ message: 'Subscription added successfully' });
  } catch (err) {
    res.status(500).json({ message: 'Failed to subscribe', error: err.message });
  }
});

// Create Blog Route
app.post('/blogs/create', async (req, res) => {
    const { title, content, author, category, externalLink } = req.body;

    if (!title || !content || !author || !category) {
        return res.status(400).json({ message: 'Please fill all the required fields' });
    }

    try {
        const newBlog = new Blog({
            title,
            content,
            author,
            category,
            externalLink,
            comments: [], // Initialize an empty array for comments
        });

        await newBlog.save();
        res.status(200).json({ message: 'Blog created successfully', blog: newBlog });
    } catch (error) {
        res.status(500).json({ message: 'Error creating blog, please try again', error: error.message });
    }
});

// Get all blogs
app.get('/blogs', async (req, res) => {
    try {
        const blogs = await Blog.find();
        res.status(200).json({ blogs });
    } catch (error) {
        res.status(500).json({ message: 'Error fetching blogs', error: error.message });
    }
});
app.put('/blogs/update/:id', async (req, res) => {
  const { id } = req.params;
  const { title, content, author, category, externalLink } = req.body;

  try {
    const updatedBlog = await Blog.findByIdAndUpdate(
      id,
      { title, content, author, category, externalLink },
      { new: true } // Returns the updated document
    );

    if (!updatedBlog) {
      return res.status(404).json({ message: 'Blog not found' });
    }

    res.status(200).json({ message: 'Blog updated successfully', blog: updatedBlog });
  } catch (error) {
    res.status(500).json({ message: 'Error updating the blog' });
  }
});


app.delete('/blogs/delete/:id', async (req, res) => {
  const { id } = req.params;

  try {
      
      const deletedBlog = await Blog.findByIdAndDelete(id);

      if (!deletedBlog) {
          return res.status(404).json({ message: 'Blog not found' });
      }

      res.status(200).json({ message: 'Blog deleted successfully' });
  } catch (error) {
      res.status(500).json({ message: 'Error deleting blog', error: error.message });
  }
});


// Start the server
app.listen(4000, () => {
  console.log('Server is running on port http://localhost:4000');
});
