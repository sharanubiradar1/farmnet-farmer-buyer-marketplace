const multer = require('multer');
const path = require('path');
const fs = require('fs');

const createUploadDir = (dir) => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
};

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    let uploadPath = process.env.UPLOAD_PATH || './uploads';
    
    if (file.fieldname === 'productImages') {
      uploadPath = path.join(uploadPath, 'products');
    } else if (file.fieldname === 'profileImage') {
      uploadPath = path.join(uploadPath, 'profiles');
    } else if (file.fieldname === 'documents') {
      uploadPath = path.join(uploadPath, 'documents');
    } else {
      uploadPath = path.join(uploadPath, 'misc');
    }
    
    createUploadDir(uploadPath);
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    const name = path.basename(file.originalname, ext).replace(/\s+/g, '-');
    cb(null, `${name}-${uniqueSuffix}${ext}`);
  }
});

const fileFilter = (req, file, cb) => {
  const allowedImageTypes = /jpeg|jpg|png|gif|webp/;
  const allowedDocTypes = /pdf|doc|docx/;
  
  const extname = allowedImageTypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = allowedImageTypes.test(file.mimetype);
  
  if (file.fieldname === 'documents') {
    const docExt = allowedDocTypes.test(path.extname(file.originalname).toLowerCase());
    const docMime = /pdf|msword|vnd.openxmlformats/.test(file.mimetype);
    
    if (docExt && docMime) {
      return cb(null, true);
    } else {
      return cb(new Error('Only PDF and DOC files are allowed for documents!'), false);
    }
  }
  
  if (mimetype && extname) {
    return cb(null, true);
  } else {
    cb(new Error('Only image files (JPEG, JPG, PNG, GIF, WebP) are allowed!'), false);
  }
};

const upload = multer({
  storage: storage,
  limits: {
    fileSize: parseInt(process.env.MAX_FILE_SIZE) || 5 * 1024 * 1024
  },
  fileFilter: fileFilter
});

const deleteFile = (filePath) => {
  try {
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
      return true;
    }
    return false;
  } catch (error) {
    console.error('Error deleting file:', error);
    return false;
  }
};

const deleteFiles = (filePaths) => {
  const results = [];
  filePaths.forEach(filePath => {
    results.push(deleteFile(filePath));
  });
  return results;
};

const getFileUrl = (req, filename) => {
  if (!filename) return null;
  const protocol = req.protocol;
  const host = req.get('host');
  return `${protocol}://${host}/${filename}`;
};

const getFilesUrls = (req, filenames) => {
  if (!filenames || !Array.isArray(filenames)) return [];
  return filenames.map(filename => getFileUrl(req, filename));
};

const handleUploadError = (error, req, res, next) => {
  if (error instanceof multer.MulterError) {
    if (error.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        success: false,
        message: `File too large. Maximum size is ${(parseInt(process.env.MAX_FILE_SIZE) / (1024 * 1024)).toFixed(2)}MB`
      });
    }
    
    if (error.code === 'LIMIT_FILE_COUNT') {
      return res.status(400).json({
        success: false,
        message: 'Too many files uploaded'
      });
    }
    
    return res.status(400).json({
      success: false,
      message: `Upload error: ${error.message}`
    });
  }
  
  if (error) {
    return res.status(400).json({
      success: false,
      message: error.message || 'File upload failed'
    });
  }
  
  next();
};

const cleanupFiles = (files) => {
  if (!files) return;
  
  if (Array.isArray(files)) {
    files.forEach(file => {
      if (file.path) {
        deleteFile(file.path);
      }
    });
  } else if (typeof files === 'object') {
    Object.values(files).forEach(fileArray => {
      if (Array.isArray(fileArray)) {
        fileArray.forEach(file => {
          if (file.path) {
            deleteFile(file.path);
          }
        });
      }
    });
  }
};

module.exports = {
  upload,
  deleteFile,
  deleteFiles,
  getFileUrl,
  getFilesUrls,
  handleUploadError,
  cleanupFiles
};