import { Router, Request, Response } from 'express';
import { validationResult } from 'express-validator';
import { DocumentModel } from '../models/document';
import { upload, handleMulterError } from '../middleware/upload';
import { FileHandler } from '../utils/fileHandler';
import {
  categoryValidator,
  descriptionValidator,
  documentNumberValidator,
  documentIdValidator,
  searchQueryValidator,
  categoryQueryValidator,
  limitValidator,
  offsetValidator,
  validateFileUpload
} from '../utils/validators';
import { DocumentCategory, FileType } from '../../types';
import path from 'path';

const router = Router();

// Upload document
router.post(
  '/upload',
  upload.single('file'),
  [categoryValidator(), descriptionValidator(), documentNumberValidator()],
  async (req: Request, res: Response) => {
    try {
      // Validate request
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        // Clean up uploaded file if validation fails (file is still in temp folder)
        if (req.file) {
          const fs = require('fs');
          try {
            if (fs.existsSync(req.file.path)) {
              fs.unlinkSync(req.file.path);
            }
          } catch (err) {
            console.error('Error cleaning up temp file:', err);
          }
        }
        return res.status(400).json({
          success: false,
          error: 'Validation error',
          details: errors.array()
        });
      }

      // Validate file upload
      const fileError = validateFileUpload(req.file);
      if (fileError) {
        // Clean up uploaded file (still in temp folder)
        if (req.file) {
          const fs = require('fs');
          try {
            if (fs.existsSync(req.file.path)) {
              fs.unlinkSync(req.file.path);
            }
          } catch (err) {
            console.error('Error cleaning up temp file:', err);
          }
        }
        return res.status(400).json({
          success: false,
          error: fileError
        });
      }

      const file = req.file!;
      const category = req.body.category as DocumentCategory;
      const description = req.body.description;
      const documentNumber = req.body.document_number;

      // Debug: Log upload details
      console.log('\n=== FILE UPLOAD DEBUG ===');
      console.log('Original filename:', file.originalname);
      console.log('Saved filename:', file.filename);
      console.log('Category from form:', category);
      console.log('File path (from multer temp):', file.path);
      console.log('File destination (temp):', file.destination);

      // IMPORTANT: Move file from temp to correct category folder
      // This is necessary because req.body is not available in multer's destination()
      const fs = require('fs');
      const categoryDir = FileHandler.ensureCategoryDir(category);
      const finalPath = path.join(categoryDir, file.filename);

      console.log('Moving file to category folder...');
      console.log('  From (temp):', file.path);
      console.log('  To (category):', finalPath);

      try {
        fs.renameSync(file.path, finalPath);
        console.log('✓ File moved successfully');
      } catch (moveError) {
        console.error('✗ Error moving file:', moveError);
        throw new Error('Failed to move uploaded file to category folder');
      }

      // Get file extension
      const fileExtension = FileHandler.getFileExtension(file.originalname);
      const relativePath = FileHandler.getRelativePath(category, file.filename);

      console.log('Relative path for DB:', relativePath);
      console.log('Full path check:', path.join(__dirname, '../../../public', relativePath));

      // Verify file exists at final location
      console.log('File exists at final path?', fs.existsSync(finalPath));
      console.log('File exists via FileHandler?', FileHandler.fileExists(relativePath));

      // Create document record
      const document = DocumentModel.create({
        filename: file.filename,
        original_filename: file.originalname,
        category: category,
        file_type: fileExtension as FileType,
        file_size: file.size,
        file_path: relativePath,
        description: description,
        document_number: documentNumber
      });

      console.log('Document created with ID:', document.id);
      console.log('=== END UPLOAD DEBUG ===\n');

      res.status(201).json({
        success: true,
        data: document,
        message: 'Document uploaded successfully'
      });
    } catch (error: any) {
      console.error('Upload error:', error);

      // Clean up file if database operation fails
      if (req.file) {
        FileHandler.deleteFile(FileHandler.getRelativePath(
          req.body.category,
          req.file.filename
        ));
      }

      const errorMessage = handleMulterError(error);
      res.status(500).json({
        success: false,
        error: errorMessage
      });
    }
  }
);

// Get all documents with filters
router.get(
  '/',
  [searchQueryValidator(), categoryQueryValidator(), limitValidator(), offsetValidator()],
  async (req: Request, res: Response) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          error: 'Validation error',
          details: errors.array()
        });
      }

      const query = {
        category: req.query.category as DocumentCategory | undefined,
        search: req.query.search as string | undefined,
        limit: req.query.limit ? parseInt(req.query.limit as string) : undefined,
        offset: req.query.offset ? parseInt(req.query.offset as string) : undefined
      };

      const documents = DocumentModel.findAll(query);
      const total = DocumentModel.count(query);

      res.json({
        success: true,
        data: documents,
        total: total,
        limit: query.limit,
        offset: query.offset
      });
    } catch (error) {
      console.error('Error fetching documents:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch documents'
      });
    }
  }
);

// Get single document by ID
router.get(
  '/:id',
  [documentIdValidator()],
  async (req: Request, res: Response) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          error: 'Invalid document ID'
        });
      }

      const id = parseInt(Array.isArray(req.params.id) ? req.params.id[0] : req.params.id);
      const document = DocumentModel.findById(id);

      if (!document) {
        return res.status(404).json({
          success: false,
          error: 'Document not found'
        });
      }

      res.json({
        success: true,
        data: document
      });
    } catch (error) {
      console.error('Error fetching document:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch document'
      });
    }
  }
);

// Download/view document file
router.get(
  '/:id/download',
  [documentIdValidator()],
  async (req: Request, res: Response) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          error: 'Invalid document ID'
        });
      }

      const id = parseInt(Array.isArray(req.params.id) ? req.params.id[0] : req.params.id);
      const document = DocumentModel.findById(id);

      if (!document) {
        return res.status(404).json({
          success: false,
          error: 'Document not found'
        });
      }

      const filePath = path.join(__dirname, '../../../public', document.file_path);

      // Debug logging
      console.log('\n=== FILE DOWNLOAD DEBUG ===');
      console.log('Document ID:', document.id);
      console.log('Original filename:', document.original_filename);
      console.log('Document file_path from DB:', document.file_path);
      console.log('Document category:', document.category);
      console.log('Document filename:', document.filename);
      console.log('__dirname:', __dirname);
      console.log('Resolved filePath:', filePath);

      // Check file existence with multiple methods
      const fs = require('fs');
      const absolutePath = path.resolve(filePath);
      console.log('Absolute path:', absolutePath);
      console.log('File exists (fs.existsSync on filePath)?', fs.existsSync(filePath));
      console.log('File exists (fs.existsSync on absolute)?', fs.existsSync(absolutePath));
      console.log('File exists (FileHandler)?', FileHandler.fileExists(document.file_path));

      // List files in the category directory
      try {
        const categoryDir = path.join(__dirname, '../../../public/uploads', document.category);
        console.log('Category directory:', categoryDir);
        if (fs.existsSync(categoryDir)) {
          const files = fs.readdirSync(categoryDir);
          console.log('Files in category directory:', files);
        } else {
          console.log('Category directory does not exist!');
        }
      } catch (err) {
        console.log('Error reading category directory:', err);
      }

      // Check if file exists
      if (!FileHandler.fileExists(document.file_path)) {
        console.log('ERROR: File NOT found!');
        console.log('=== END DOWNLOAD DEBUG ===\n');
        return res.status(404).json({
          success: false,
          error: 'File not found on server'
        });
      }

      console.log('SUCCESS: File found, serving...');
      console.log('=== END DOWNLOAD DEBUG ===\n');

      // Set appropriate content type
      const mimeType = FileHandler.getMimeType(document.file_type);
      res.setHeader('Content-Type', mimeType);
      res.setHeader('Content-Disposition', `inline; filename="${document.original_filename}"`);

      res.sendFile(filePath);
    } catch (error) {
      console.error('Error downloading document:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to download document'
      });
    }
  }
);

// Update document metadata
router.put(
  '/:id',
  [
    documentIdValidator(),
    descriptionValidator(),
    documentNumberValidator(),
    categoryValidator().optional()
  ],
  async (req: Request, res: Response) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          error: 'Validation error',
          details: errors.array()
        });
      }

      const id = parseInt(Array.isArray(req.params.id) ? req.params.id[0] : req.params.id);
      const document = DocumentModel.findById(id);

      if (!document) {
        return res.status(404).json({
          success: false,
          error: 'Document not found'
        });
      }

      // If category is being changed, move the file
      if (req.body.category && req.body.category !== document.category) {
        const oldCategory = document.category;
        const newCategory = req.body.category as DocumentCategory;

        const moved = FileHandler.moveFile(oldCategory, newCategory, document.filename);

        if (!moved) {
          return res.status(500).json({
            success: false,
            error: 'Failed to move file to new category'
          });
        }
      }

      // Update document
      const updatedDocument = DocumentModel.update(id, {
        description: req.body.description,
        document_number: req.body.document_number,
        category: req.body.category
      });

      res.json({
        success: true,
        data: updatedDocument,
        message: 'Document updated successfully'
      });
    } catch (error) {
      console.error('Error updating document:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to update document'
      });
    }
  }
);

// Delete document
router.delete(
  '/:id',
  [documentIdValidator()],
  async (req: Request, res: Response) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          error: 'Invalid document ID'
        });
      }

      const id = parseInt(Array.isArray(req.params.id) ? req.params.id[0] : req.params.id);
      const document = DocumentModel.findById(id);

      if (!document) {
        return res.status(404).json({
          success: false,
          error: 'Document not found'
        });
      }

      // Delete file from filesystem
      FileHandler.deleteFile(document.file_path);

      // Delete from database
      const deleted = DocumentModel.delete(id);

      if (!deleted) {
        return res.status(500).json({
          success: false,
          error: 'Failed to delete document'
        });
      }

      res.json({
        success: true,
        message: 'Document deleted successfully'
      });
    } catch (error) {
      console.error('Error deleting document:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to delete document'
      });
    }
  }
);

// Get category statistics
router.get('/stats/categories', async (req: Request, res: Response) => {
  try {
    const stats = DocumentModel.getCategoryStats();

    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    console.error('Error fetching category stats:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch category statistics'
    });
  }
});

// Debug endpoint to list all files in uploads directory
router.get('/debug/files', async (req: Request, res: Response) => {
  try {
    const fs = require('fs');
    const uploadsDir = path.join(__dirname, '../../../public/uploads');

    console.log('\n=== LISTING ALL UPLOADED FILES ===');
    console.log('Uploads directory:', uploadsDir);
    console.log('Directory exists?', fs.existsSync(uploadsDir));

    const result: any = {
      uploadsDir,
      exists: fs.existsSync(uploadsDir),
      categories: {}
    };

    if (fs.existsSync(uploadsDir)) {
      const categories = fs.readdirSync(uploadsDir);
      console.log('Categories found:', categories);

      categories.forEach((category: string) => {
        const categoryPath = path.join(uploadsDir, category);
        if (fs.statSync(categoryPath).isDirectory()) {
          const files = fs.readdirSync(categoryPath);
          result.categories[category] = files;
          console.log(`  ${category}:`, files);
        }
      });
    }

    console.log('=== END FILE LISTING ===\n');

    res.json({
      success: true,
      data: result
    });
  } catch (error: any) {
    console.error('Error listing files:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Debug endpoint to check database and file existence
router.get('/debug/validate', async (req: Request, res: Response) => {
  try {
    const fs = require('fs');
    const documents = DocumentModel.findAll();

    console.log('\n=== VALIDATING ALL DOCUMENTS ===');

    const validation = documents.map(doc => {
      const fullPath = path.join(__dirname, '../../../public', doc.file_path);
      const exists = fs.existsSync(fullPath);

      console.log(`Doc ${doc.id}: ${doc.original_filename}`);
      console.log(`  Category: ${doc.category}`);
      console.log(`  File path in DB: ${doc.file_path}`);
      console.log(`  Full resolved path: ${fullPath}`);
      console.log(`  File exists: ${exists}`);

      return {
        id: doc.id,
        original_filename: doc.original_filename,
        category: doc.category,
        file_path_in_db: doc.file_path,
        full_resolved_path: fullPath,
        file_exists: exists
      };
    });

    console.log('=== END VALIDATION ===\n');

    res.json({
      success: true,
      data: validation
    });
  } catch (error: any) {
    console.error('Error validating documents:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Get overall statistics
router.get('/stats/overview', async (req: Request, res: Response) => {
  try {
    const stats = DocumentModel.getStats();

    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    console.error('Error fetching statistics:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch statistics'
    });
  }
});

export default router;
