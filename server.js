const express = require('express');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const cors = require('cors');
const bodyParser = require('body-parser');
const path = require('path');
const multer = require('multer');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static('public'));

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/');
  },
  filename: function (req, file, cb) {
    // Generate unique filename with timestamp
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'cv-' + uniqueSuffix + '.pdf');
  }
});

// File filter to only allow PDF files
const fileFilter = (req, file, cb) => {
  if (file.mimetype === 'application/pdf') {
    cb(null, true);
  } else {
    cb(new Error('Only PDF files are allowed!'), false);
  }
};

const upload = multer({ 
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB limit
  }
});

// Create uploads directory if it doesn't exist
const fs = require('fs');
const uploadsDir = 'uploads';
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir);
}

// MongoDB connection
mongoose.connect('mongodb://localhost:27017/cvgator', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => console.log('Connected to MongoDB'))
.catch(err => console.error('MongoDB connection error:', err));

// User Schema
const userSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },
  username: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    minlength: 3,
    maxlength: 20
  },
  password: {
    type: String,
    required: true,
    minlength: 6
  }
});

const User = mongoose.model('User', userSchema);

// Post Schema
const postSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  name: {
    type: String,
    required: true,
    trim: true
  },
  date: {
    type: String,
    required: true
  },
  link: {
    type: String,
    required: true,
    trim: true
  },
  text: {
    type: String,
    trim: true,
    default: ''
  },
  tags: [{
    type: String,
    trim: true
  }],
  authorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }
}, {
  timestamps: true
});

const Post = mongoose.model('Post', postSchema);

// Comment Schema
const commentSchema = new mongoose.Schema({
  content: {
    type: String,
    required: true,
    trim: true
  },
  authorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  postId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Post',
    required: true
  },
  authorName: {
    type: String,
    required: true
  }
}, {
  timestamps: true
});

const Comment = mongoose.model('Comment', commentSchema);

// Hashtag Schema
const hashtagSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true
  },
  usageCount: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true
});

const Hashtag = mongoose.model('Hashtag', hashtagSchema);

// Validation functions
function validateEmail(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

function validateUsername(username) {
  const usernameRegex = /^[a-zA-Z0-9]+$/;
  return usernameRegex.test(username) && username.length >= 3 && username.length <= 20;
}

function validatePassword(password) {
  const passwordRegex = /^[a-zA-Z0-9]+$/;
  return passwordRegex.test(password) && password.length >= 6;
}

// Routes
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.get('/register', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'register.html'));
});

app.get('/submissions', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'submissions.html'));
});

app.get('/cv-post', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'cv-post.html'));
});

app.get('/recruit', (req, res) => {
  res.send('Recruit page - Coming soon!');
});

app.get('/mission', (req, res) => {
  res.send('Mission page - Coming soon!');
});

app.get('/profile', (req, res) => {
  res.send('Profile page - Coming soon!');
});

app.get('/upload', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'upload.html'));
});

app.get('/hashtags', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'hashtags.html'));
});

// Serve uploaded files
app.use('/uploads', express.static('uploads'));

// Hashtags API
app.get('/api/hashtags', async (req, res) => {
  try {
    const hashtags = await Hashtag.find().sort({ usageCount: -1 });
    res.json({ success: true, hashtags });
  } catch (error) {
    console.error('Error fetching hashtags:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

app.get('/api/hashtags/popular', async (req, res) => {
  try {
    const hashtags = await Hashtag.find().sort({ usageCount: -1 }).limit(10);
    res.json({ success: true, hashtags });
  } catch (error) {
    console.error('Error fetching popular hashtags:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

app.get('/api/hashtags/all', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'hashtags.html'));
});

// Posts API
app.get('/api/posts', async (req, res) => {
  try {
    const posts = await Post.find().sort({ createdAt: -1 });
    res.json({ success: true, posts });
  } catch (error) {
    console.error('Error fetching posts:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

app.get('/api/posts/:id', async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) {
      return res.status(404).json({ success: false, message: 'Post not found' });
    }
    res.json({ success: true, post });
  } catch (error) {
    console.error('Error fetching post:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Comments API
app.get('/api/posts/:postId/comments', async (req, res) => {
  try {
    const comments = await Comment.find({ postId: req.params.postId }).sort({ createdAt: 1 });
    res.json({ success: true, comments });
  } catch (error) {
    console.error('Error fetching comments:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

app.post('/api/posts/:postId/comments', async (req, res) => {
  try {
    const { content, authorName, authorId } = req.body;
    const { postId } = req.params;

    if (!content || !content.trim()) {
      return res.status(400).json({ success: false, message: 'Comment content is required' });
    }

    if (!authorName || !authorId) {
      return res.status(400).json({ success: false, message: 'Authentication required to post comments' });
    }

    // Check if post exists
    const post = await Post.findById(postId);
    if (!post) {
      return res.status(404).json({ success: false, message: 'Post not found' });
    }

    const comment = new Comment({
      content: content.trim(),
      postId: postId,
      authorName: authorName,
      authorId: authorId
    });

    await comment.save();

    res.json({ 
      success: true, 
      message: 'Comment posted successfully',
      comment: {
        _id: comment._id,
        content: comment.content,
        authorName: comment.authorName,
        createdAt: comment.createdAt
      }
    });

  } catch (error) {
    console.error('Error posting comment:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Login API
app.post('/api/login', async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ 
        success: false, 
        message: 'Username and password are required' 
      });
    }

    const user = await User.findOne({ username });
    if (!user) {
      return res.status(401).json({ 
        success: false, 
        message: 'Invalid credentials' 
      });
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({ 
        success: false, 
        message: 'Invalid credentials' 
      });
    }

    res.json({ 
      success: true, 
      message: 'Login successful',
      user: { id: user._id, username: user.username, email: user.email }
    });

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error' 
    });
  }
});

// Register API
app.post('/api/register', async (req, res) => {
  try {
    const { email, username, password } = req.body;

    // Validation
    if (!email || !username || !password) {
      return res.status(400).json({ 
        success: false, 
        message: 'All fields are required' 
      });
    }

    if (!validateEmail(email)) {
      return res.status(400).json({ 
        success: false, 
        message: 'Invalid email format' 
      });
    }

    if (!validateUsername(username)) {
      return res.status(400).json({ 
        success: false, 
        message: 'Username must be 3-20 characters long and contain only letters and numbers' 
      });
    }

    if (!validatePassword(password)) {
      return res.status(400).json({ 
        success: false, 
        message: 'Password must be at least 6 characters long and contain only letters and numbers' 
      });
    }

    // Check if user already exists
    const existingUser = await User.findOne({ 
      $or: [{ email }, { username }] 
    });

    if (existingUser) {
      return res.status(400).json({ 
        success: false, 
        message: existingUser.email === email ? 'Email already exists' : 'Username already exists' 
      });
    }

    // Hash password
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // Create user
    const user = new User({
      email,
      username,
      password: hashedPassword
    });

    await user.save();

    res.json({ 
      success: true, 
      message: 'Registration successful',
      user: { id: user._id, username: user.username, email: user.email }
    });

  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error' 
    });
  }
});

// CV Upload API
app.post('/api/upload-cv', upload.single('cvFile'), async (req, res) => {
  try {
    const { title, hashtags, context } = req.body;
    const cvFile = req.file;

    // Validate all required fields
    if (!title || !hashtags || !context || !cvFile) {
      // Delete uploaded file if validation fails
      if (cvFile) {
        fs.unlinkSync(cvFile.path);
      }
      return res.status(400).json({ 
        success: false, 
        message: 'All fields are required' 
      });
    }

    // Validate file type (server-side validation)
    if (cvFile.mimetype !== 'application/pdf') {
      // Delete uploaded file if invalid type
      fs.unlinkSync(cvFile.path);
      return res.status(400).json({ 
        success: false, 
        message: 'Only PDF files are allowed' 
      });
    }

    // Format and validate hashtags
    const tagNames = hashtags
      .split(' ')
      .filter(tag => tag.trim())
      .map(tag => tag.trim().toLowerCase().replace('#', ''));
    
    // Validate that all hashtags exist in the database
    const existingHashtags = await Hashtag.find({ name: { $in: tagNames } });
    const existingTagNames = existingHashtags.map(tag => tag.name);
    
    const invalidTags = tagNames.filter(tag => !existingTagNames.includes(tag));
    if (invalidTags.length > 0) {
      // Delete uploaded file if validation fails
      fs.unlinkSync(cvFile.path);
      return res.status(400).json({ 
        success: false, 
        message: 'You\'re using an invalid hashtag!' 
      });
    }
    
    const formattedTags = tagNames.map(tag => '#' + tag);
    
    // Update hashtag usage counts
    await Hashtag.updateMany(
      { name: { $in: tagNames } },
      { $inc: { usageCount: 1 } }
    );

    // Get current date in DDMMYY format
    const now = new Date();
    const day = String(now.getDate()).padStart(2, '0');
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const year = String(now.getFullYear()).slice(-2);
    const dateString = day + month + year;

    // Get author information from request (should come from frontend authentication)
    const { authorName } = req.body;

    // Create new post
    const post = new Post({
      title: title.trim(),
      name: authorName,
      date: dateString,
      link: `/uploads/${cvFile.filename}`,
      text: context.trim(),
      tags: formattedTags,
      authorId: new mongoose.Types.ObjectId()
    });

    await post.save();

    // Update hashtag usage counts after new post is created
    await updateHashtagUsageCounts();

    res.json({ 
      success: true, 
      message: 'CV uploaded successfully',
      post: {
        _id: post._id,
        title: post.title,
        name: post.name,
        date: post.date,
        link: post.link,
        text: post.text,
        tags: post.tags
      }
    });

  } catch (error) {
    console.error('Upload error:', error);
    
    // Delete uploaded file if there's an error
    if (req.file) {
      fs.unlinkSync(req.file.path);
    }
    
    res.status(500).json({ 
      success: false, 
      message: 'Server error during upload' 
    });
  }
});

// Function to update hashtag usage counts based on actual posts
async function updateHashtagUsageCounts() {
  try {
    console.log('Updating hashtag usage counts...');
    
    // Get all posts and count hashtag usage
    const posts = await Post.find({}, 'tags');
    const hashtagCounts = {};
    
    // Count usage of each hashtag
    posts.forEach(post => {
      if (post.tags && Array.isArray(post.tags)) {
        post.tags.forEach(tag => {
          // Remove # prefix if present
          const tagName = tag.replace('#', '').toLowerCase();
          hashtagCounts[tagName] = (hashtagCounts[tagName] || 0) + 1;
        });
      }
    });
    
    // Update hashtag usage counts in database
    for (const [tagName, count] of Object.entries(hashtagCounts)) {
      await Hashtag.updateOne(
        { name: tagName },
        { usageCount: count }
      );
    }
    
    // Reset usage count for hashtags not used in any posts
    await Hashtag.updateMany(
      { name: { $nin: Object.keys(hashtagCounts) } },
      { usageCount: 0 }
    );
    
    console.log('Hashtag usage counts updated successfully!');
  } catch (error) {
    console.error('Error updating hashtag usage counts:', error);
  }
}

// Initialize sample data if no posts exist
async function initializeSampleData() {
  try {
    // Initialize hashtags if none exist
    const hashtagCount = await Hashtag.countDocuments();
    if (hashtagCount === 0) {
      console.log('No hashtags found, creating sample hashtags...');
      
      const techHashtags = [
        'design', 'ui-ux', 'typography', 'marketing', 'software-engineer',
        'junior', 'senior', 'entry-level', 'data-science', 'algorithms',
        'project-lead', 'frontend', 'backend', 'full-stack', 'web-development',
        'mobile-development', 'ios', 'android', 'react', 'angular',
        'vue', 'nodejs', 'python', 'java', 'javascript',
        'typescript', 'sql', 'mongodb', 'aws', 'azure',
        'devops', 'machine-learning', 'artificial-intelligence', 'blockchain',
        'cybersecurity', 'product-manager', 'business-analyst', 'sales',
        'customer-success', 'content-marketing', 'social-media', 'seo',
        'analytics', 'user-research', 'wireframing', 'prototyping',
        'agile', 'scrum', 'remote', 'freelance', 'startup',
        'enterprise', 'fintech', 'healthtech', 'edtech', 'ecommerce'
      ];
      
      const hashtagDocs = techHashtags.map(name => ({ name, usageCount: 0 }));
      await Hashtag.insertMany(hashtagDocs);
      console.log('Sample hashtags created successfully!');
    }
    
    // Update hashtag usage counts on server start
    await updateHashtagUsageCounts();
    
    const postCount = await Post.countDocuments();
    if (postCount === 0) {
      console.log('No posts found, creating sample data...');
      
      // Create sample posts
      const samplePosts = [
        {
          title: "Software Engineer CV - Looking for feedback on technical skills section",
          name: "john_doe",
          date: "231023",
          link: "/uploads/sample-cv-1.pdf",
          text: "I'm a recent computer science graduate looking to break into the software engineering field. I'd appreciate feedback on my technical skills section and any suggestions for improvement. I'm particularly interested in full-stack development roles.",
          tags: ["#software-engineer", "#tech", "#entry-level"],
          authorId: new mongoose.Types.ObjectId()
        },
        {
          title: "Marketing Manager Resume - Need help with quantifiable achievements",
          name: "sarah_smith",
          date: "231023",
          link: "/uploads/sample-cv-2.pdf",
          text: "I have 5+ years of experience in digital marketing and I'm looking to transition into a management role. I need help making my achievements more quantifiable and impactful. Any advice on structuring my experience section would be greatly appreciated.",
          tags: ["#marketing", "#manager", "#senior"],
          authorId: new mongoose.Types.ObjectId()
        },
        {
          title: "UX Designer Portfolio - Seeking advice on project descriptions",
          name: "mike_wilson",
          date: "221023",
          link: "/uploads/sample-cv-3.pdf",
          text: "I'm a UX designer with 3 years of experience looking to improve my portfolio presentation. I'd like feedback on how I describe my design process and project outcomes. I'm targeting senior UX positions.",
          tags: ["#design", "#ux", "#portfolio"],
          authorId: new mongoose.Types.ObjectId()
        },
        {
          title: "Data Scientist CV - How to highlight machine learning projects?",
          name: "alex_chen",
          date: "211023",
          link: "/uploads/sample-cv-4.pdf",
          text: "I have a strong background in data science and machine learning, but I'm struggling to effectively communicate my technical projects on my CV. I need help highlighting my ML models and their business impact.",
          tags: ["#data-science", "#machine-learning", "#tech"],
          authorId: new mongoose.Types.ObjectId()
        },
        {
          title: "Sales Representative Resume - Tips for showcasing results",
          name: "emma_brown",
          date: "201023",
          link: "/uploads/sample-cv-5.pdf",
          text: "I'm in sales and want to move into a more strategic role. I need help quantifying my sales achievements and presenting my results in a compelling way. Looking for advice on structuring my sales metrics.",
          tags: ["#sales", "#results", "#entry-level"],
          authorId: new mongoose.Types.ObjectId()
        },
        {
          title: "UI/UX Designer working with Figma",
          name: "Stephan0",
          date: "111025",
          link: "Placeholder",
          text: "I'm looking for suggestions on what changes I can make to polish my CV! I work primarily with Figma, and most of the times I work with web projects. You can check out my work below, and let me know if my bulletpoints are relevant or optimal.",
          tags: ["#ui-ux", "#figma", "#web-design"],
          authorId: new mongoose.Types.ObjectId()
        }
      ];

      const createdPosts = await Post.insertMany(samplePosts);
      console.log('Sample posts created successfully!');
      
      // Create sample comments for the UI/UX Designer post
      const uiUxPost = createdPosts.find(post => post.title === "UI/UX Designer working with Figma");
      if (uiUxPost) {
        const sampleComments = [
          {
            content: "Your work is brilliant. I would strongly consider emphasizing your 5 years of experience in the field in your bulletpoints.",
            postId: uiUxPost._id,
            authorName: "Joe_Hart",
            authorId: new mongoose.Types.ObjectId()
          },
          {
            content: "I would really be careful to not sound too boastful in the bulletpoints. It's fair to be confident, but at one point you may come off as arrogant.",
            postId: uiUxPost._id,
            authorName: "sarah_ant",
            authorId: new mongoose.Types.ObjectId()
          }
        ];
        
        await Comment.insertMany(sampleComments);
        console.log('Sample comments created successfully!');
      }
    }
  } catch (error) {
    console.error('Error initializing sample data:', error);
  }
}

// Set up periodic hashtag usage count updates (every 6 hours)
setInterval(updateHashtagUsageCounts, 6 * 60 * 60 * 1000); // 6 hours in milliseconds

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
  initializeSampleData();
});
