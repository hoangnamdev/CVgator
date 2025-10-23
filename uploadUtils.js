const cloudinary = require('cloudinary').v2;
const multer = require('multer');
const path = require('path');

// Configure multer for memory storage (since we'll upload to Cloudinary)
const storage = multer.memoryStorage();

// File filter for CV uploads
const fileFilter = (req, file, cb) => {
  if (file.mimetype === 'application/pdf') {
    cb(null, true);
  } else {
    cb(new Error('Only PDF files are allowed for CV uploads'), false);
  }
};

// File filter for profile pictures
const profileFileFilter = (req, file, cb) => {
  const allowedTypes = /jpeg|jpg|png|gif|webp/;
  const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = allowedTypes.test(file.mimetype);
  
  if (mimetype && extname) {
    cb(null, true);
  } else {
    cb(new Error('Only image files are allowed for profile pictures'), false);
  }
};

// Multer upload configurations
const upload = multer({ 
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB limit for CVs
  }
});

const profileUpload = multer({ 
  storage: storage,
  fileFilter: profileFileFilter,
  limits: {
    fileSize: 3 * 1024 * 1024 // 3MB limit for profile pictures
  }
});

// Upload file to Cloudinary
const uploadToCloudinary = (file, folder = 'cvgator') => {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder: folder,
        resource_type: 'auto',
        use_filename: true,
        unique_filename: true
      },
      (error, result) => {
        if (error) {
          reject(error);
        } else {
          resolve(result);
        }
      }
    );
    
    uploadStream.end(file.buffer);
  });
};

// Delete file from Cloudinary
const deleteFromCloudinary = (publicId) => {
  return new Promise((resolve, reject) => {
    cloudinary.uploader.destroy(publicId, (error, result) => {
      if (error) {
        reject(error);
      } else {
        resolve(result);
      }
    });
  });
};

// Extract public ID from Cloudinary URL
const extractPublicId = (url) => {
  const parts = url.split('/');
  const filename = parts[parts.length - 1];
  const publicId = filename.split('.')[0];
  return `cvgator/${publicId}`;
};

module.exports = {
  upload,
  profileUpload,
  uploadToCloudinary,
  deleteFromCloudinary,
  extractPublicId
};
