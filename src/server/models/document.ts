import { db } from '../config/database';
import {
  Document,
  CreateDocumentInput,
  UpdateDocumentInput,
  SearchQuery,
  CategoryStats,
  StatsResponse
} from '../../types';

export class DocumentModel {
  // Create a new document
  static create(input: CreateDocumentInput): Document {
    const stmt = db.prepare(`
      INSERT INTO documents (
        filename, original_filename, category, file_type,
        file_size, file_path, description, document_number
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const info = stmt.run(
      input.filename,
      input.original_filename,
      input.category,
      input.file_type,
      input.file_size,
      input.file_path,
      input.description || null,
      input.document_number || null
    );

    const document = this.findById(info.lastInsertRowid as number);
    if (!document) {
      throw new Error('Failed to create document');
    }

    return document;
  }

  // Find document by ID
  static findById(id: number): Document | null {
    const stmt = db.prepare('SELECT * FROM documents WHERE id = ?');
    const document = stmt.get(id) as Document | undefined;
    return document || null;
  }

  // Find all documents with optional filters
  static findAll(query?: SearchQuery): Document[] {
    let sql = 'SELECT * FROM documents WHERE 1=1';
    const params: any[] = [];

    // Filter by category
    if (query?.category) {
      sql += ' AND category = ?';
      params.push(query.category);
    }

    // Search in filename and description
    if (query?.search) {
      sql += ' AND (original_filename LIKE ? OR description LIKE ? OR document_number LIKE ?)';
      const searchTerm = `%${query.search}%`;
      params.push(searchTerm, searchTerm, searchTerm);
    }

    // Order by most recent first
    sql += ' ORDER BY upload_date DESC';

    // Pagination
    if (query?.limit) {
      sql += ' LIMIT ? OFFSET ?';
      params.push(query.limit, query.offset || 0);
    }

    const stmt = db.prepare(sql);
    return stmt.all(...params) as Document[];
  }

  // Count total documents with filters
  static count(query?: SearchQuery): number {
    let sql = 'SELECT COUNT(*) as count FROM documents WHERE 1=1';
    const params: any[] = [];

    if (query?.category) {
      sql += ' AND category = ?';
      params.push(query.category);
    }

    if (query?.search) {
      sql += ' AND (original_filename LIKE ? OR description LIKE ? OR document_number LIKE ?)';
      const searchTerm = `%${query.search}%`;
      params.push(searchTerm, searchTerm, searchTerm);
    }

    const stmt = db.prepare(sql);
    const result = stmt.get(...params) as { count: number };
    return result.count;
  }

  // Update document metadata
  static update(id: number, input: UpdateDocumentInput): Document | null {
    const fields: string[] = [];
    const params: any[] = [];

    if (input.description !== undefined) {
      fields.push('description = ?');
      params.push(input.description || null);
    }

    if (input.document_number !== undefined) {
      fields.push('document_number = ?');
      params.push(input.document_number || null);
    }

    if (input.category !== undefined) {
      fields.push('category = ?');
      params.push(input.category);
    }

    if (fields.length === 0) {
      return this.findById(id);
    }

    fields.push('updated_at = CURRENT_TIMESTAMP');
    params.push(id);

    const sql = `UPDATE documents SET ${fields.join(', ')} WHERE id = ?`;
    const stmt = db.prepare(sql);
    stmt.run(...params);

    return this.findById(id);
  }

  // Delete document
  static delete(id: number): boolean {
    const stmt = db.prepare('DELETE FROM documents WHERE id = ?');
    const info = stmt.run(id);
    return info.changes > 0;
  }

  // Get category statistics
  static getCategoryStats(): CategoryStats[] {
    const stmt = db.prepare(`
      SELECT category, COUNT(*) as count
      FROM documents
      GROUP BY category
      ORDER BY count DESC
    `);

    return stmt.all() as CategoryStats[];
  }

  // Get overall statistics
  static getStats(): StatsResponse {
    const totalStmt = db.prepare('SELECT COUNT(*) as total FROM documents');
    const sizeStmt = db.prepare('SELECT SUM(file_size) as total_size FROM documents');

    const totalResult = totalStmt.get() as { total: number };
    const sizeResult = sizeStmt.get() as { total_size: number | null };

    return {
      total_documents: totalResult.total,
      by_category: this.getCategoryStats(),
      total_size_bytes: sizeResult.total_size || 0
    };
  }

  // Search documents
  static search(searchTerm: string, category?: string): Document[] {
    return this.findAll({
      search: searchTerm,
      category: category as any
    });
  }

  // Get recent documents
  static getRecent(limit: number = 10): Document[] {
    const stmt = db.prepare(`
      SELECT * FROM documents
      ORDER BY upload_date DESC
      LIMIT ?
    `);

    return stmt.all(limit) as Document[];
  }
}
