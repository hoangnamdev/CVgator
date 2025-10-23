require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const cors = require('cors');
const bodyParser = require('body-parser');
const path = require('path');
const multer = require('multer');
const cloudinary = require('cloudinary').v2;
// Optional AI dependencies - completely optional
let GoogleGenerativeAI, pdfParse;
try {
  console.log('Attempting to load AI dependencies...');
  const genAI = require('@google/generative-ai');
  GoogleGenerativeAI = genAI.GoogleGenerativeAI;
  console.log('GoogleGenerativeAI loaded successfully');
} catch (error) {
  console.log('GoogleGenerativeAI not available:', error.message);
  GoogleGenerativeAI = null;
}

try {
  pdfParse = require('pdf-parse');
  console.log('pdf-parse loaded successfully');
} catch (error) {
  console.log('pdf-parse not available:', error.message);
  pdfParse = null;
}

console.log('AI setup complete - GoogleGenerativeAI:', !!GoogleGenerativeAI, 'pdf-parse:', !!pdfParse);

const app = express();
const PORT = process.env.PORT || 3000;

// Cloudinary configuration
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

// Google Gemini AI configuration (optional)
let genAI = null;
try {
  console.log('Checking AI setup:');
  console.log('- GoogleGenerativeAI available:', !!GoogleGenerativeAI);
  console.log('- GEMINI_API_KEY available:', !!process.env.GEMINI_API_KEY);
  console.log('- GEMINI_API_KEY length:', process.env.GEMINI_API_KEY ? process.env.GEMINI_API_KEY.length : 0);
  
  if (GoogleGenerativeAI && process.env.GEMINI_API_KEY) {
    genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    console.log('Gemini AI initialized successfully');
  } else {
    console.log('Gemini API key not provided or dependencies not available, AI features disabled');
  }
} catch (error) {
  console.error('Failed to initialize Gemini AI:', error);
  console.log('AI features will be disabled');
}

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static('public'));

// Configure multer for file uploads (memory storage for Cloudinary)
const storage = multer.memoryStorage();

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

// Configure multer for profile picture uploads (memory storage for Cloudinary)
const profileStorage = multer.memoryStorage();

const profileFileFilter = (req, file, cb) => {
  const allowedTypes = /jpeg|jpg|png|gif|webp/;
  const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = allowedTypes.test(file.mimetype);
  
  if (mimetype && extname) {
    cb(null, true);
  } else {
    cb(new Error('Only image files are allowed for profile pictures'));
  }
};

const profileUpload = multer({ 
  storage: profileStorage,
  fileFilter: profileFileFilter,
  limits: {
    fileSize: 3 * 1024 * 1024 // 3MB limit for profile pictures
  }
});

// Note: No longer need local uploads directory since we're using Cloudinary

// MongoDB connection (non-blocking)
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/cvgator';
mongoose.connect(MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  serverSelectionTimeoutMS: 5000, // 5 second timeout
  connectTimeoutMS: 10000, // 10 second timeout
})
.then(() => console.log('Connected to MongoDB'))
.catch(err => {
  console.error('MongoDB connection error:', err);
  console.log('Server will continue without MongoDB connection');
});

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
  },
  profilePicture: {
    type: String,
    default: '/uploads/default-avatar.svg'
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
  },
  aiFeedback: {
    type: String,
    trim: true,
    default: ''
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
  },
  isHardcoded: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

const Hashtag = mongoose.model('Hashtag', hashtagSchema);

// Recruit Schema (for published CVs)
const recruitSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  contactInformation: {
    type: String,
    required: true,
    trim: true
  },
  postId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Post',
    required: true
  },
  authorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  publishedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

const Recruit = mongoose.model('Recruit', recruitSchema);

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

// AI Feedback Generation Function
async function generateAIFeedback(pdfBuffer, title, context) {
  try {
    console.log('AI Feedback Debug:');
    console.log('- GoogleGenerativeAI available:', !!GoogleGenerativeAI);
    console.log('- pdf-parse available:', !!pdfParse);
    console.log('- GEMINI_API_KEY available:', !!process.env.GEMINI_API_KEY);
    
    // Check if AI dependencies are available
    if (!GoogleGenerativeAI || !pdfParse || !process.env.GEMINI_API_KEY) {
      console.log('AI dependencies not available, skipping AI feedback');
      return 'AI feedback is not available.';
    }

    // Extract text from PDF using pdf-parse with timeout
    console.log('Starting PDF text extraction...');
    const pdfData = await Promise.race([
      pdfParse(pdfBuffer),
      new Promise((_, reject) => setTimeout(() => reject(new Error('PDF parsing timeout')), 10000))
    ]);
    
    const cvText = pdfData.text;
    console.log(`PDF text extraction complete, ${cvText.length} characters extracted`);
    
    if (!cvText.trim()) {
      console.log('No text extracted from PDF');
      return 'AI feedback is not available - unable to extract text from PDF.';
    }
    
    // Truncate text if too long (Gemini has token limits)
    const maxLength = 8000; // Leave room for prompt
    const truncatedText = cvText.length > maxLength ? cvText.substring(0, maxLength) + '...' : cvText;
    
    // Create AI prompt
    const prompt = `Analyze this CV and provide feedback in the SAME LANGUAGE as the CV content. First, identify the primary language of the CV, then respond entirely in that language using markdown formatting.

CV Title: ${title}
Additional Context: ${context || 'No additional context provided'}

CV Content:
${truncatedText}

Please provide a structured analysis in the CV's language, covering these specific areas:

## **1. Why it is fitting (what works)**
- What aspects make this CV suitable for its intended purpose?
- What elements demonstrate competence and professionalism?

## **2. Why is it not fitting (what doesn't work)**
- What aspects detract from the CV's effectiveness?
- What elements create negative impressions?

## **3. What are the strengths?**
- Key achievements and competencies
- Well-presented sections
- Professional highlights

## **4. What are weaknesses that can be improved upon?**
Categorize improvements by difficulty level:

### **Easy to improve upon:**
- Minor formatting issues
- Simple content additions
- Basic presentation improvements

### **Medium to improve upon:**
- Content restructuring
- Skill presentation enhancements
- Moderate formatting changes

### **Hard to improve upon:**
- Major content gaps
- Fundamental structural issues
- Significant experience limitations

Use markdown formatting:
- **bold** for emphasis
- *italics* for subtle emphasis
- bullet points (-) for lists
- ## for section headers
- ### for subsection headers

Be specific, actionable, and constructive in your feedback.`;

    // Generate AI response with timeout
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
    
    // Add timeout to prevent hanging
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error('AI feedback timeout')), 60000); // 60 second timeout
    });
    
    const aiPromise = model.generateContent(prompt).then(result => result.response.text());
    
    const aiFeedback = await Promise.race([aiPromise, timeoutPromise]);
    
    return aiFeedback;
  } catch (error) {
    console.error('Error generating AI feedback:', error);
    // Return a simple fallback message instead of trying to do anything complex
    return 'AI feedback is currently unavailable. The CV has been uploaded successfully.';
  }
}

// Asynchronous AI feedback generation (runs in background)
async function generateAIFeedbackAsync(postId, pdfBuffer, title, context) {
  try {
    console.log(`Starting background AI feedback generation for post ${postId}...`);
    
    // Generate the AI feedback with retry logic for API overload
    const aiFeedback = await generateAIFeedbackWithRetry(pdfBuffer, title, context);
    
    // Update the post with the generated feedback
    await updatePostAIFeedback(postId, aiFeedback);
    
    console.log(`AI feedback generated and saved for post ${postId}`);
  } catch (error) {
    console.error(`Error in background AI feedback generation for post ${postId}:`, error);
    
    // Check if it's a service overload error
    let errorMessage = 'AI feedback is currently unavailable.';
    if (error.message && error.message.includes('503')) {
      errorMessage = 'AI service is temporarily overloaded. Please try again later.';
    } else if (error.message && error.message.includes('overloaded')) {
      errorMessage = 'AI service is temporarily overloaded. Please try again later.';
    }
    
    // Update with appropriate error message
    await updatePostAIFeedback(postId, errorMessage);
  }
}

// Generate AI feedback with retry logic for service overload
async function generateAIFeedbackWithRetry(pdfBuffer, title, context, maxRetries = 3) {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      console.log(`AI feedback attempt ${attempt}/${maxRetries}`);
      return await generateAIFeedback(pdfBuffer, title, context);
    } catch (error) {
      console.error(`AI feedback attempt ${attempt} failed:`, error.message);
      
      // If it's a service overload error and we have retries left, wait and try again
      if ((error.message.includes('503') || error.message.includes('overloaded')) && attempt < maxRetries) {
        const waitTime = attempt * 10000; // 10s, 20s, 30s
        console.log(`Waiting ${waitTime/1000}s before retry...`);
        await new Promise(resolve => setTimeout(resolve, waitTime));
        continue;
      }
      
      // If it's the last attempt or not a retryable error, throw
      throw error;
    }
  }
}

// Update post with AI feedback
async function updatePostAIFeedback(postId, aiFeedback) {
  try {
    await Post.findByIdAndUpdate(postId, { aiFeedback: aiFeedback });
    console.log(`Updated AI feedback for post ${postId}`);
  } catch (error) {
    console.error(`Error updating AI feedback for post ${postId}:`, error);
  }
}

// Health check endpoint for Railway
app.get('/api/health', (req, res) => {
  try {
    // Check MongoDB connection status
    const mongoStatus = mongoose.connection.readyState === 1 ? 'connected' : 'disconnected';
    
    res.status(200).json({ 
      status: 'healthy', 
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      mongodb: mongoStatus,
      port: PORT
    });
  } catch (error) {
    // Even if there's an error, return healthy status for Railway
    res.status(200).json({ 
      status: 'healthy', 
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      error: 'Health check error but server is running'
    });
  }
});

// Routes
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Simple health check for Railway (alternative to /api/health)
app.get('/health', (req, res) => {
  res.status(200).send('OK');
});

app.get('/register', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'register.html'));
});

app.get('/profile', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'profile.html'));
});

app.get('/submissions', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'submissions.html'));
});

app.get('/cv-post', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'cv-post.html'));
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

app.get('/recruit', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'recruit.html'));
});

app.get('/publish-cv', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'publish-cv.html'));
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

// Recruit API endpoints
app.get('/api/recruits', async (req, res) => {
  try {
    const { experience, technologies, fields } = req.query;
    
    // Build filter query
    let filterQuery = {};
    
    if (experience || technologies || fields) {
      const tagFilters = [];
      
      if (experience) {
        const experienceArray = experience.split(',');
        tagFilters.push(...experienceArray);
      }
      
      if (technologies) {
        const techArray = technologies.split(',');
        tagFilters.push(...techArray);
      }
      
      if (fields) {
        const fieldArray = fields.split(',');
        tagFilters.push(...fieldArray);
      }
      
      // Find posts that contain ALL the required tags
      const matchingPosts = await Post.find({
        tags: { $all: tagFilters.map(tag => '#' + tag) }
      });
      
      const postIds = matchingPosts.map(post => post._id);
      filterQuery.postId = { $in: postIds };
    }
    
    const recruits = await Recruit.find(filterQuery)
      .populate('postId')
      .sort({ publishedAt: -1 });
    
    // Get user profile pictures for each recruit
    const recruitsWithProfiles = await Promise.all(recruits.map(async (recruit) => {
      try {
        const user = await User.findById(recruit.authorId);
        return {
          ...recruit.toObject(),
          profilePicture: user ? user.profilePicture : '/uploads/default-avatar.svg'
        };
      } catch (error) {
        console.error('Error fetching user profile for recruit:', error);
        return {
          ...recruit.toObject(),
          profilePicture: '/uploads/default-avatar.svg'
        };
      }
    }));
    
    console.log(`Found ${recruitsWithProfiles.length} recruits in database:`, recruitsWithProfiles.map(r => ({ id: r._id, authorId: r.authorId, name: r.name })));
    
    res.json({ success: true, recruits: recruitsWithProfiles });
  } catch (error) {
    console.error('Error fetching recruits:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

app.post('/api/user-posts', async (req, res) => {
  try {
    const { userId } = req.body;
    
    if (!userId) {
      return res.status(400).json({ 
        success: false, 
        message: 'User ID is required' 
      });
    }
    
    // Filter posts by the specific user
    const posts = await Post.find({ authorId: userId }, 'title createdAt')
      .sort({ createdAt: -1 });
    
    res.json({ success: true, posts });
  } catch (error) {
    console.error('Error fetching user posts:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

app.post('/api/publish-cv', async (req, res) => {
  try {
    const { fullName, cvSelect, contactInfo, userId } = req.body;
    
    if (!fullName || !cvSelect || !contactInfo || !userId) {
      return res.status(400).json({ 
        success: false, 
        message: 'All fields are required' 
      });
    }
    
    // Check if post exists and belongs to the user
    const post = await Post.findById(cvSelect);
    if (!post) {
      return res.status(400).json({ 
        success: false, 
        message: 'Selected CV not found' 
      });
    }
    
    // Verify that the post belongs to the current user
    if (post.authorId.toString() !== userId) {
      return res.status(403).json({ 
        success: false, 
        message: 'You can only publish your own CVs' 
      });
    }
    
    console.log(`Publishing CV for user: ${userId}, post.authorId: ${post.authorId}`);
    console.log(`userId type: ${typeof userId}, post.authorId type: ${typeof post.authorId}`);
    console.log(`userId === post.authorId: ${userId === post.authorId.toString()}`);
    
    // Check existing recruits for this user before deletion (try both userId and post.authorId)
    const existingRecruitsByUserId = await Recruit.find({ authorId: userId });
    const existingRecruitsByPostAuthorId = await Recruit.find({ authorId: post.authorId });
    console.log(`Found ${existingRecruitsByUserId.length} recruits by userId ${userId}:`, existingRecruitsByUserId.map(r => r._id));
    console.log(`Found ${existingRecruitsByPostAuthorId.length} recruits by post.authorId ${post.authorId}:`, existingRecruitsByPostAuthorId.map(r => r._id));
    
    // Remove any existing published CVs for this user (only one publish per user allowed)
    // Try deleting by userId first, then by post.authorId
    const deleteResultByUserId = await Recruit.deleteMany({ authorId: userId });
    const deleteResultByPostAuthorId = await Recruit.deleteMany({ authorId: post.authorId });
    console.log(`Deleted ${deleteResultByUserId.deletedCount} recruits by userId ${userId}`);
    console.log(`Deleted ${deleteResultByPostAuthorId.deletedCount} recruits by post.authorId ${post.authorId}`);
    
    // Create new recruit entry - use userId from request, not post.authorId
    const recruit = new Recruit({
      name: fullName.trim(),
      contactInformation: contactInfo.trim(),
      postId: cvSelect,
      authorId: userId  // Use userId from request, not post.authorId
    });
    
    await recruit.save();
    
    res.json({ 
      success: true, 
      message: 'CV published successfully! Any previous publish has been replaced.',
      recruit: {
        _id: recruit._id,
        name: recruit.name,
        contactInformation: recruit.contactInformation,
        publishedAt: recruit.publishedAt
      }
    });
    
  } catch (error) {
    console.error('Publish CV error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error during publishing' 
    });
  }
});

// Debug endpoint to check database state
app.get('/api/debug-recruits', async (req, res) => {
  try {
    const recruits = await Recruit.find({}).populate('postId');
    const users = await User.find({});
    
    res.json({
      success: true,
      recruits: recruits.map(r => ({
        id: r._id,
        name: r.name,
        authorId: r.authorId,
        postId: r.postId?._id,
        publishedAt: r.publishedAt
      })),
      users: users.map(u => ({
        id: u._id,
        username: u.username
      }))
    });
  } catch (error) {
    console.error('Debug error:', error);
    res.status(500).json({ success: false, message: 'Debug error' });
  }
});

// Profile API endpoints
app.post('/api/user-profile', async (req, res) => {
  try {
    const { userId } = req.body;
    
    if (!userId) {
      return res.status(400).json({ 
        success: false, 
        message: 'User ID is required' 
      });
    }
    
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ 
        success: false, 
        message: 'User not found' 
      });
    }
    
    res.json({ 
      success: true, 
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        profilePicture: user.profilePicture
      }
    });
  } catch (error) {
    console.error('Error fetching user profile:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

app.post('/api/update-profile', profileUpload.single('profilePicture'), async (req, res) => {
  try {
    const { userId, username } = req.body;
    const profilePictureFile = req.file;
    
    if (!userId || !username) {
      return res.status(400).json({ 
        success: false, 
        message: 'User ID and username are required' 
      });
    }
    
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ 
        success: false, 
        message: 'User not found' 
      });
    }
    
    // Check if username is already taken by another user
    const existingUser = await User.findOne({ 
      username: username.trim(), 
      _id: { $ne: userId } 
    });
    
    if (existingUser) {
      return res.status(400).json({ 
        success: false, 
        message: 'Username is already taken' 
      });
    }
    
    // Update username
    user.username = username.trim();
    
    // Update profile picture if provided
    if (profilePictureFile) {
      // Upload new profile picture to Cloudinary
      let cloudinaryResult;
      try {
        cloudinaryResult = await cloudinary.uploader.upload(
          `data:${profilePictureFile.mimetype};base64,${profilePictureFile.buffer.toString('base64')}`,
          {
            folder: 'cvgator/profiles',
            use_filename: true,
            unique_filename: true
          }
        );
      } catch (uploadError) {
        console.error('Cloudinary upload error:', uploadError);
        return res.status(500).json({ 
          success: false, 
          message: 'Failed to upload profile picture' 
        });
      }
      
      // Delete old profile picture from Cloudinary if it exists
      if (user.profilePicture && user.profilePicture !== '/uploads/default-avatar.svg') {
        try {
          // Extract public_id from old Cloudinary URL
          const oldPublicId = user.profilePicture.split('/').pop().split('.')[0];
          await cloudinary.uploader.destroy(`cvgator/profiles/${oldPublicId}`);
        } catch (deleteError) {
          console.error('Failed to delete old profile picture:', deleteError);
        }
      }
      
      user.profilePicture = cloudinaryResult.secure_url;
    }
    
    await user.save();
    
    res.json({ 
      success: true, 
      message: 'Profile updated successfully',
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        profilePicture: user.profilePicture
      }
    });
  } catch (error) {
    console.error('Error updating profile:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

app.post('/api/user-recruit', async (req, res) => {
  try {
    const { userId } = req.body;
    
    if (!userId) {
      return res.status(400).json({ 
        success: false, 
        message: 'User ID is required' 
      });
    }
    
    const recruit = await Recruit.findOne({ authorId: userId }).populate('postId');
    
    res.json({ 
      success: true, 
      recruit: recruit ? {
        _id: recruit._id,
        name: recruit.name,
        contactInformation: recruit.contactInformation,
        publishedAt: recruit.publishedAt,
        postId: recruit.postId?._id
      } : null
    });
  } catch (error) {
    console.error('Error fetching user recruit:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

app.post('/api/delete-recruit', async (req, res) => {
  try {
    const { recruitId } = req.body;
    
    if (!recruitId) {
      return res.status(400).json({ 
        success: false, 
        message: 'Recruit ID is required' 
      });
    }
    
    const recruit = await Recruit.findById(recruitId);
    if (!recruit) {
      return res.status(404).json({ 
        success: false, 
        message: 'Published CV not found' 
      });
    }
    
    await Recruit.findByIdAndDelete(recruitId);
    
    res.json({ 
      success: true, 
      message: 'Published CV deleted successfully' 
    });
  } catch (error) {
    console.error('Error deleting recruit:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

app.post('/api/delete-post', async (req, res) => {
  try {
    const { postId } = req.body;
    
    if (!postId) {
      return res.status(400).json({ 
        success: false, 
        message: 'Post ID is required' 
      });
    }
    
    const post = await Post.findById(postId);
    if (!post) {
      return res.status(404).json({ 
        success: false, 
        message: 'Post not found' 
      });
    }
    
    // Delete the CV file from Cloudinary
    if (post.link && post.link.includes('cloudinary.com')) {
      try {
        // Extract public_id from Cloudinary URL
        const publicId = post.link.split('/').slice(-2).join('/').split('.')[0];
        await cloudinary.uploader.destroy(publicId);
      } catch (deleteError) {
        console.error('Failed to delete file from Cloudinary:', deleteError);
      }
    }
    
    // Delete associated recruit if exists
    await Recruit.findOneAndDelete({ postId: postId });
    
    // Delete all comments associated with this post
    await Comment.deleteMany({ postId: postId });
    
    // Handle hashtag cleanup - only remove user-created hashtags
    if (post.tags && Array.isArray(post.tags)) {
      const tagNames = post.tags.map(tag => tag.replace('#', '').toLowerCase());
      
      // Decrease usage count for all hashtags used in this post
      await Hashtag.updateMany(
        { name: { $in: tagNames } },
        { $inc: { usageCount: -1 } }
      );
      
      // Remove user-created hashtags that now have 0 usage
      await Hashtag.deleteMany({
        name: { $in: tagNames },
        isHardcoded: false,
        usageCount: { $lte: 0 }
      });
    }
    
    // Delete the post
    await Post.findByIdAndDelete(postId);
    
    res.json({ 
      success: true, 
      message: 'CV post deleted successfully' 
    });
  } catch (error) {
    console.error('Error deleting post:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

app.post('/api/delete-account', async (req, res) => {
  try {
    const { userId, password } = req.body;
    
    if (!userId || !password) {
      return res.status(400).json({ 
        success: false, 
        message: 'User ID and password are required' 
      });
    }
    
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ 
        success: false, 
        message: 'User not found' 
      });
    }
    
    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(400).json({ 
        success: false, 
        message: 'Incorrect password' 
      });
    }
    
    // Delete user's posts and associated files from Cloudinary
    const userPosts = await Post.find({ authorId: userId });
    for (const post of userPosts) {
      if (post.link && post.link.includes('cloudinary.com')) {
        try {
          // Extract public_id from Cloudinary URL
          const publicId = post.link.split('/').slice(-2).join('/').split('.')[0];
          await cloudinary.uploader.destroy(publicId);
        } catch (deleteError) {
          console.error('Failed to delete file from Cloudinary:', deleteError);
        }
      }
    }
    
    // Delete user's profile picture from Cloudinary if it exists
    if (user.profilePicture && user.profilePicture !== '/uploads/default-avatar.svg' && user.profilePicture.includes('cloudinary.com')) {
      try {
        // Extract public_id from Cloudinary URL
        const publicId = user.profilePicture.split('/').slice(-2).join('/').split('.')[0];
        await cloudinary.uploader.destroy(publicId);
      } catch (deleteError) {
        console.error('Failed to delete profile picture from Cloudinary:', deleteError);
      }
    }
    
    // Delete user's published CV
    await Recruit.deleteMany({ authorId: userId });
    
    // Handle hashtag cleanup for all user's posts - only remove user-created hashtags
    const allUserTagNames = [];
    for (const post of userPosts) {
      if (post.tags && Array.isArray(post.tags)) {
        const tagNames = post.tags.map(tag => tag.replace('#', '').toLowerCase());
        allUserTagNames.push(...tagNames);
      }
    }
    
    if (allUserTagNames.length > 0) {
      // Decrease usage count for all hashtags used in user's posts
      await Hashtag.updateMany(
        { name: { $in: allUserTagNames } },
        { $inc: { usageCount: -1 } }
      );
      
      // Remove user-created hashtags that now have 0 usage
      await Hashtag.deleteMany({
        name: { $in: allUserTagNames },
        isHardcoded: false,
        usageCount: { $lte: 0 }
      });
    }
    
    // Delete comments on user's posts
    const userPostIds = userPosts.map(post => post._id);
    await Comment.deleteMany({ postId: { $in: userPostIds } });
    
    // Delete user's posts
    await Post.deleteMany({ authorId: userId });
    
    // Delete user's comments (comments made by the user)
    await Comment.deleteMany({ authorId: userId });
    
    // Finally, delete the user account
    await User.findByIdAndDelete(userId);
    
    res.json({ 
      success: true, 
      message: 'Account deleted successfully' 
    });
  } catch (error) {
    console.error('Error deleting account:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// CV Upload API
app.post('/api/upload-cv', upload.single('cvFile'), async (req, res) => {
  const startTime = Date.now();
  console.log('Upload started at:', new Date().toISOString());
  
  try {
    const { title, hashtags, context } = req.body;
    const cvFile = req.file;

    // Validate all required fields
    if (!title || !hashtags || !context || !cvFile) {
      return res.status(400).json({ 
        success: false, 
        message: 'All fields are required' 
      });
    }

    // Validate file type (server-side validation)
    if (cvFile.mimetype !== 'application/pdf') {
      return res.status(400).json({ 
        success: false, 
        message: 'Only PDF files are allowed' 
      });
    }
    
    // Validate file size (max 10MB)
    const maxSize = 10 * 1024 * 1024; // 10MB in bytes
    if (cvFile.size > maxSize) {
      return res.status(400).json({ 
        success: false, 
        message: 'File size too large. Maximum allowed size is 10MB.' 
      });
    }
    
    console.log(`File size: ${(cvFile.size / 1024 / 1024).toFixed(2)}MB`);

    // Upload file to Cloudinary with timeout
    console.log('Starting Cloudinary upload...');
    const cloudinaryStartTime = Date.now();
    let cloudinaryResult;
    try {
      // Add timeout to Cloudinary upload (45 seconds)
      const cloudinaryPromise = cloudinary.uploader.upload(
        `data:${cvFile.mimetype};base64,${cvFile.buffer.toString('base64')}`,
        {
          folder: 'cvgator/cvs',
          resource_type: 'raw',
          use_filename: true,
          unique_filename: true
        }
      );
      
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Cloudinary upload timeout')), 45000); // 45 second timeout
      });
      
      cloudinaryResult = await Promise.race([cloudinaryPromise, timeoutPromise]);
      const cloudinaryTime = Date.now() - cloudinaryStartTime;
      console.log(`Cloudinary upload completed in ${cloudinaryTime}ms`);
    } catch (uploadError) {
      console.error('Cloudinary upload error:', uploadError);
      return res.status(500).json({ 
        success: false, 
        message: 'Failed to upload file to cloud storage. Upload may be taking too long.' 
      });
    }

    // Format and validate hashtags
    const tagNames = hashtags
      .split(' ')
      .filter(tag => tag.trim())
      .map(tag => tag.trim().toLowerCase().replace('#', ''));
    
    // Check which hashtags already exist
    const existingHashtags = await Hashtag.find({ name: { $in: tagNames } });
    const existingTagNames = existingHashtags.map(tag => tag.name);
    
    // Create new hashtags for ones that don't exist
    const newTagNames = tagNames.filter(tag => !existingTagNames.includes(tag));
    if (newTagNames.length > 0) {
      const newHashtags = newTagNames.map(name => ({
        name,
        usageCount: 1,
        isHardcoded: false
      }));
      await Hashtag.insertMany(newHashtags);
      console.log(`Created ${newTagNames.length} new hashtags:`, newTagNames);
    }
    
    const formattedTags = tagNames.map(tag => '#' + tag);
    
    // Update hashtag usage counts for existing hashtags
    if (existingTagNames.length > 0) {
    await Hashtag.updateMany(
        { name: { $in: existingTagNames } },
      { $inc: { usageCount: 1 } }
    );
    }

    // Get current date in DD/MM/YY format
    const now = new Date();
    const day = String(now.getDate()).padStart(2, '0');
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const year = String(now.getFullYear()).slice(-2);
    const dateString = day + '/' + month + '/' + year;

    // Get author information from request (should come from frontend authentication)
    const { authorName, authorId } = req.body;

    if (!authorId) {
      // Delete uploaded file from Cloudinary if no author ID
      try {
        await cloudinary.uploader.destroy(cloudinaryResult.public_id);
      } catch (deleteError) {
        console.error('Failed to delete file from Cloudinary:', deleteError);
      }
      return res.status(400).json({ 
        success: false, 
        message: 'User authentication required' 
      });
    }

    // Set initial AI feedback message
    let aiFeedback = 'AI feedback is being generated...';

    // Create new post
    const post = new Post({
      title: title.trim(),
      name: authorName,
      date: dateString,
      link: cloudinaryResult.secure_url,
      text: context.trim(),
      tags: formattedTags,
      authorId: new mongoose.Types.ObjectId(authorId),
      aiFeedback: aiFeedback
    });

    console.log('Saving post to database...');
    const dbStartTime = Date.now();
    await post.save();
    const dbTime = Date.now() - dbStartTime;
    console.log(`Database save completed in ${dbTime}ms`);

    // Start AI feedback generation in background (don't await)
    generateAIFeedbackAsync(post._id, cvFile.buffer, title.trim(), context.trim())
      .catch(error => {
        console.error('Background AI feedback generation failed:', error);
        // Update the post with error message
        updatePostAIFeedback(post._id, 'AI feedback is currently unavailable.');
      });

    // Update hashtag usage counts in background (don't await)
    updateHashtagUsageCounts()
      .catch(error => {
        console.error('Background hashtag usage count update failed:', error);
      });

    const totalTime = Date.now() - startTime;
    console.log(`Total upload time: ${totalTime}ms`);

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
    
    // Note: No need to delete file from memory storage on error
    
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
    
    // Remove user-created hashtags that have 0 usage
    await Hashtag.deleteMany({
      isHardcoded: false,
      usageCount: 0
    });
    
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
        // Experience Levels
        'entry-level', 'junior', 'mid-level', 'senior',
        
        // Technologies - Programming Languages
        'python', 'java', 'javascript', 'typescript', 'csharp', 'cpp', 'c', 'go', 'rust', 'kotlin',
        'swift', 'php', 'ruby', 'scala', 'r', 'matlab', 'perl', 'haskell', 'clojure', 'elixir',
        
        // Technologies - Web Development
        'react', 'angular', 'vue', 'nodejs', 'express', 'django', 'flask', 'spring', 'laravel',
        'rails', 'aspnet', 'nextjs', 'nuxt', 'svelte', 'ember', 'backbone', 'jquery',
        
        // Technologies - Mobile Development
        'ios', 'android', 'react-native', 'flutter', 'xamarin', 'ionic', 'cordova',
        
        // Technologies - Databases
        'sql', 'mongodb', 'postgresql', 'mysql', 'redis', 'elasticsearch', 'cassandra',
        'dynamodb', 'firebase', 'supabase', 'sqlite', 'oracle', 'sql-server',
        
        // Technologies - Cloud & DevOps
        'aws', 'azure', 'gcp', 'docker', 'kubernetes', 'terraform', 'jenkins', 'gitlab',
        'github-actions', 'ansible', 'chef', 'puppet', 'vagrant', 'nginx', 'apache',
        
        // Technologies - Data & AI
        'machine-learning', 'artificial-intelligence', 'deep-learning', 'tensorflow',
        'pytorch', 'pandas', 'numpy', 'scikit-learn', 'opencv', 'spark', 'hadoop',
        'kafka', 'airflow', 'jupyter', 'tableau', 'power-bi', 'looker',
        
        // Fields of Work
        'frontend', 'backend', 'full-stack', 'mobile-development', 'web-development',
        'data-science', 'data-analytics', 'devops', 'cloud-engineering', 'cybersecurity',
        'product-manager', 'project-manager', 'business-analyst', 'qa-engineer',
        'ui-ux', 'design', 'graphic-design', 'product-design', 'user-research',
        'marketing', 'digital-marketing', 'content-marketing', 'social-media',
        'seo', 'sem', 'analytics', 'growth-hacking', 'sales', 'customer-success',
        'technical-writing', 'documentation', 'training', 'consulting',
        
        // Specializations
        'blockchain', 'cryptocurrency', 'fintech', 'healthtech', 'edtech', 'ecommerce',
        'gaming', 'iot', 'embedded-systems', 'robotics', 'computer-vision',
        'natural-language-processing', 'recommendation-systems', 'microservices',
        'api-development', 'graphql', 'rest', 'websockets', 'real-time-systems',
        
        // Methodologies & Practices
        'agile', 'scrum', 'kanban', 'lean', 'tdd', 'bdd', 'ci-cd', 'test-automation',
        'code-review', 'pair-programming', 'refactoring', 'clean-code',
        
        // Work Arrangements
        'remote', 'freelance', 'contract', 'part-time', 'full-time', 'startup',
        'enterprise', 'consulting', 'agency', 'non-profit'
      ];
      
      const hashtagDocs = techHashtags.map(name => ({ name, usageCount: 0, isHardcoded: true }));
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
          date: "23/10/23",
          link: "/uploads/sample-cv-1.pdf",
          text: "I'm a recent computer science graduate looking to break into the software engineering field. I'd appreciate feedback on my technical skills section and any suggestions for improvement. I'm particularly interested in full-stack development roles.",
          tags: ["#software-engineer", "#tech", "#entry-level"],
          authorId: new mongoose.Types.ObjectId()
        },
        {
          title: "Marketing Manager Resume - Need help with quantifiable achievements",
          name: "sarah_smith",
          date: "23/10/23",
          link: "/uploads/sample-cv-2.pdf",
          text: "I have 5+ years of experience in digital marketing and I'm looking to transition into a management role. I need help making my achievements more quantifiable and impactful. Any advice on structuring my experience section would be greatly appreciated.",
          tags: ["#marketing", "#manager", "#senior"],
          authorId: new mongoose.Types.ObjectId()
        },
        {
          title: "UX Designer Portfolio - Seeking advice on project descriptions",
          name: "mike_wilson",
          date: "22/10/23",
          link: "/uploads/sample-cv-3.pdf",
          text: "I'm a UX designer with 3 years of experience looking to improve my portfolio presentation. I'd like feedback on how I describe my design process and project outcomes. I'm targeting senior UX positions.",
          tags: ["#design", "#ux", "#portfolio"],
          authorId: new mongoose.Types.ObjectId()
        },
        {
          title: "Data Scientist CV - How to highlight machine learning projects?",
          name: "alex_chen",
          date: "21/10/23",
          link: "/uploads/sample-cv-4.pdf",
          text: "I have a strong background in data science and machine learning, but I'm struggling to effectively communicate my technical projects on my CV. I need help highlighting my ML models and their business impact.",
          tags: ["#data-science", "#machine-learning", "#tech"],
          authorId: new mongoose.Types.ObjectId()
        },
        {
          title: "Sales Representative Resume - Tips for showcasing results",
          name: "emma_brown",
          date: "20/10/23",
          link: "/uploads/sample-cv-5.pdf",
          text: "I'm in sales and want to move into a more strategic role. I need help quantifying my sales achievements and presenting my results in a compelling way. Looking for advice on structuring my sales metrics.",
          tags: ["#sales", "#results", "#entry-level"],
          authorId: new mongoose.Types.ObjectId()
        },
        {
          title: "UI/UX Designer working with Figma",
          name: "Stephan0",
          date: "11/10/25",
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

// PDF download endpoint with proper headers
app.get('/download-cv/:postId', async (req, res) => {
  try {
    const { postId } = req.params;
    const post = await Post.findById(postId);
    
    if (!post || !post.link) {
      return res.status(404).json({ 
        success: false, 
        message: 'CV not found' 
      });
    }
    
    // Use Node.js https module to fetch the PDF from Cloudinary
    const https = require('https');
    const url = require('url');
    
    const cloudinaryUrl = new url.URL(post.link);
    
    const options = {
      hostname: cloudinaryUrl.hostname,
      port: 443,
      path: cloudinaryUrl.pathname + cloudinaryUrl.search,
      method: 'GET'
    };
    
    const request = https.request(options, (response) => {
      if (response.statusCode !== 200) {
        return res.status(404).json({ 
          success: false, 
          message: 'CV file not found' 
        });
      }
      
      // Set proper headers for PDF download
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="CV.pdf"`);
      res.setHeader('Content-Length', response.headers['content-length']);
      
      // Pipe the response from Cloudinary to our response
      response.pipe(res);
    });
    
    request.on('error', (error) => {
      console.error('Error fetching PDF from Cloudinary:', error);
      res.status(500).json({ 
        success: false, 
        message: 'Error downloading CV' 
      });
    });
    
    request.end();
  } catch (error) {
    console.error('Error serving PDF:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error downloading CV' 
    });
  }
});

// Set up periodic hashtag usage count updates (every 6 hours)
setInterval(updateHashtagUsageCounts, 6 * 60 * 60 * 1000);

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
  console.log(`Health check available at: http://localhost:${PORT}/api/health`);
  
  // Only initialize sample data in development (non-blocking)
  if (process.env.NODE_ENV !== 'production') {
    initializeSampleData().catch(err => {
      console.error('Sample data initialization failed:', err);
      console.log('Server continues without sample data');
    });
  }
});
