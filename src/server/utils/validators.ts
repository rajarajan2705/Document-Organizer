import { body, param, query, ValidationChain } from 'express-validator';
import { DocumentCategory } from '../../types';

// Validate document category
export const categoryValidator = (field: string = 'category'): ValidationChain => {
  const validCategories = Object.values(DocumentCategory);

  return body(field)
    .trim()
    .notEmpty()
    .withMessage('Category is required')
    .isIn(validCategories)
    .withMessage(`Category must be one of: ${validCategories.join(', ')}`);
};

// Validate optional description
export const descriptionValidator = (): ValidationChain => {
  return body('description')
    .optional()
    .trim()
    .isLength({ max: 1000 })
    .withMessage('Description must not exceed 1000 characters');
};

// Validate optional document number
export const documentNumberValidator = (): ValidationChain => {
  return body('document_number')
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage('Document number must not exceed 100 characters');
};

// Validate document ID parameter
export const documentIdValidator = (): ValidationChain => {
  return param('id')
    .isInt({ min: 1 })
    .withMessage('Document ID must be a positive integer');
};

// Validate search query
export const searchQueryValidator = (): ValidationChain => {
  return query('search')
    .optional()
    .trim()
    .isLength({ min: 1, max: 200 })
    .withMessage('Search term must be between 1 and 200 characters');
};

// Validate category query
export const categoryQueryValidator = (): ValidationChain => {
  const validCategories = Object.values(DocumentCategory);

  return query('category')
    .optional()
    .trim()
    .isIn(validCategories)
    .withMessage(`Category must be one of: ${validCategories.join(', ')}`);
};

// Validate pagination limit
export const limitValidator = (): ValidationChain => {
  return query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100')
    .toInt();
};

// Validate pagination offset
export const offsetValidator = (): ValidationChain => {
  return query('offset')
    .optional()
    .isInt({ min: 0 })
    .withMessage('Offset must be a non-negative integer')
    .toInt();
};

// Validate file upload
export function validateFileUpload(file: Express.Multer.File | undefined): string | null {
  if (!file) {
    return 'No file uploaded';
  }

  const allowedMimeTypes = [
    'application/pdf',
    'image/jpeg',
    'image/jpg',
    'image/png'
  ];

  if (!allowedMimeTypes.includes(file.mimetype)) {
    return 'Invalid file type. Only PDF, JPG, and PNG files are allowed';
  }

  const maxSize = 10 * 1024 * 1024; // 10MB
  if (file.size > maxSize) {
    return 'File size exceeds 10MB limit';
  }

  return null;
}

// Sanitize string input
export function sanitizeInput(input: string): string {
  return input
    .trim()
    .replace(/[<>]/g, '') // Remove potential HTML tags
    .slice(0, 1000); // Limit length
}

// Validate and sanitize category
export function isValidCategory(category: string): boolean {
  const validCategories = Object.values(DocumentCategory) as string[];
  return validCategories.includes(category);
}
