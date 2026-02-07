import fs from 'fs';
import path from 'path';
import { DocumentCategory } from '../../types';

const UPLOADS_DIR = path.join(__dirname, '../../../public/uploads');

export class FileHandler {
  // Ensure upload directory exists for a category
  static ensureCategoryDir(category: DocumentCategory): string {
    const categoryDir = path.join(UPLOADS_DIR, category);

    if (!fs.existsSync(categoryDir)) {
      fs.mkdirSync(categoryDir, { recursive: true });
    }

    return categoryDir;
  }

  // Generate unique filename
  static generateFilename(originalName: string): string {
    const timestamp = Date.now();
    const sanitized = originalName
      .toLowerCase()
      .replace(/[^a-z0-9.]/g, '_')
      .replace(/_+/g, '_');

    return `${timestamp}_${sanitized}`;
  }

  // Get file path for a category
  static getFilePath(category: DocumentCategory, filename: string): string {
    return path.join(UPLOADS_DIR, category, filename);
  }

  // Get relative file path (for storing in database)
  static getRelativePath(category: DocumentCategory, filename: string): string {
    return `uploads/${category}/${filename}`;
  }

  // Delete file
  static deleteFile(filePath: string): boolean {
    try {
      const fullPath = path.join(__dirname, '../../../public', filePath);

      if (fs.existsSync(fullPath)) {
        fs.unlinkSync(fullPath);
        return true;
      }

      return false;
    } catch (error) {
      console.error('Error deleting file:', error);
      return false;
    }
  }

  // Move file between categories
  static moveFile(
    oldCategory: DocumentCategory,
    newCategory: DocumentCategory,
    filename: string
  ): boolean {
    try {
      const oldPath = this.getFilePath(oldCategory, filename);
      const newDir = this.ensureCategoryDir(newCategory);
      const newPath = path.join(newDir, filename);

      if (fs.existsSync(oldPath)) {
        fs.renameSync(oldPath, newPath);
        return true;
      }

      return false;
    } catch (error) {
      console.error('Error moving file:', error);
      return false;
    }
  }

  // Check if file exists
  static fileExists(filePath: string): boolean {
    const fullPath = path.join(__dirname, '../../../public', filePath);
    return fs.existsSync(fullPath);
  }

  // Get file size
  static getFileSize(filePath: string): number {
    try {
      const fullPath = path.join(__dirname, '../../../public', filePath);
      const stats = fs.statSync(fullPath);
      return stats.size;
    } catch (error) {
      return 0;
    }
  }

  // Sanitize filename for safe storage
  static sanitizeFilename(filename: string): string {
    return filename
      .replace(/[^a-zA-Z0-9._-]/g, '_')
      .replace(/_+/g, '_')
      .toLowerCase();
  }

  // Get file extension
  static getFileExtension(filename: string): string {
    return path.extname(filename).toLowerCase().slice(1);
  }

  // Validate file type
  static isValidFileType(mimetype: string): boolean {
    const allowedTypes = [
      'application/pdf',
      'image/jpeg',
      'image/jpg',
      'image/png'
    ];

    return allowedTypes.includes(mimetype);
  }

  // Get MIME type from extension
  static getMimeType(extension: string): string {
    const mimeTypes: Record<string, string> = {
      'pdf': 'application/pdf',
      'jpg': 'image/jpeg',
      'jpeg': 'image/jpeg',
      'png': 'image/png'
    };

    return mimeTypes[extension.toLowerCase()] || 'application/octet-stream';
  }
}
