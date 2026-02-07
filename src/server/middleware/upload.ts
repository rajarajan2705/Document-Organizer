import multer from 'multer';
import path from 'path';
import { Request } from 'express';
import { FileHandler } from '../utils/fileHandler';
import { DocumentCategory } from '../../types';

// Configure storage - save to temp folder first
// NOTE: req.body is not available in destination() when processing multipart data
// Files will be moved to correct category folder in the route handler
const storage = multer.diskStorage({
  destination: (req: Request, file: Express.Multer.File, cb) => {
    // Save to temp uploads folder first
    // We'll move to the correct category folder after we can read req.body.category
    const tempDir = path.join(__dirname, '../../../public/uploads/_temp');
    const fs = require('fs');

    try {
      if (!fs.existsSync(tempDir)) {
        fs.mkdirSync(tempDir, { recursive: true });
      }
      cb(null, tempDir);
    } catch (error) {
      cb(error as Error, '');
    }
  },

  filename: (req: Request, file: Express.Multer.File, cb) => {
    try {
      const uniqueFilename = FileHandler.generateFilename(file.originalname);
      cb(null, uniqueFilename);
    } catch (error) {
      cb(error as Error, '');
    }
  }
});

// File filter to validate file types
const fileFilter = (
  req: Request,
  file: Express.Multer.File,
  cb: multer.FileFilterCallback
) => {
  const isValid = FileHandler.isValidFileType(file.mimetype);

  if (isValid) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type. Only PDF, JPG, JPEG, and PNG files are allowed.'));
  }
};

// Configure multer
export const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB
    files: 1
  }
});

// Error handler for multer errors
export function handleMulterError(error: any): string {
  if (error instanceof multer.MulterError) {
    switch (error.code) {
      case 'LIMIT_FILE_SIZE':
        return 'File size exceeds the 10MB limit';
      case 'LIMIT_FILE_COUNT':
        return 'Only one file can be uploaded at a time';
      case 'LIMIT_UNEXPECTED_FILE':
        return 'Unexpected field name for file upload';
      default:
        return `Upload error: ${error.message}`;
    }
  }

  return error.message || 'Unknown upload error';
}
