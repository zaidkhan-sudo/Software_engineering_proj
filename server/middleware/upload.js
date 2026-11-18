const multer = require('multer');
const AppError = require('../utils/AppError');
const { ERROR_CODES } = require('../utils/constants');

const storage = multer.memoryStorage();

const fileFilter = (req, file, cb) => {
  if (file.mimetype === 'image/jpeg' || file.mimetype === 'image/png') {
    cb(null, true);
  } else {
    cb(
      new AppError(
        400,
        ERROR_CODES.UPLOAD_ERROR,
        'Only JPG and PNG files are allowed'
      ),
      false
    );
  }
};

const upload = multer({
  storage,
  limits: {
    fileSize: 1024 * 1024, // 1 MB limit per file
    files: 2 // Max 2 files
  },
  fileFilter
}).array('attachments', 2);

/**
 * Middleware wrapper for multer handling upload errors with standardized messages
 */
const uploadAttachments = (req, res, next) => {
  upload(req, res, (err) => {
    if (err) {
      if (err instanceof multer.MulterError) {
        if (err.code === 'LIMIT_FILE_SIZE') {
          return next(
            new AppError(
              400,
              ERROR_CODES.UPLOAD_ERROR,
              'File size exceeds 1 MB limit'
            )
          );
        }
        if (err.code === 'LIMIT_FILE_COUNT' || err.code === 'LIMIT_UNEXPECTED_FILE') {
          return next(
            new AppError(
              400,
              ERROR_CODES.UPLOAD_ERROR,
              'Maximum 2 attachments allowed'
            )
          );
        }
      }
      return next(err);
    }
    next();
  });
};

module.exports = {
  uploadAttachments
};
