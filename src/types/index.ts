// Document category enum
export enum DocumentCategory {
  PERSONAL_IDS = 'personal-ids',
  EDUCATIONAL_DOCS = 'educational-docs',
  WORK_EXPERIENCE = 'work-experience',
  RESUMES = 'resumes',
  INVOICES = 'invoices',
  INSURANCE = 'insurance',
  BANK_STATEMENTS = 'bank-statements',
  OTHERS = 'others'
}

// Category display names mapping
export const CATEGORY_NAMES: Record<DocumentCategory, string> = {
  [DocumentCategory.PERSONAL_IDS]: 'Personal IDs',
  [DocumentCategory.EDUCATIONAL_DOCS]: 'Educational Docs',
  [DocumentCategory.WORK_EXPERIENCE]: 'Work Experience Letters',
  [DocumentCategory.RESUMES]: 'Resumes',
  [DocumentCategory.INVOICES]: 'Online Purchase Invoices',
  [DocumentCategory.INSURANCE]: 'Insurance Docs',
  [DocumentCategory.BANK_STATEMENTS]: 'Bank Statements',
  [DocumentCategory.OTHERS]: 'Others'
};

// File type enum
export enum FileType {
  PDF = 'pdf',
  JPG = 'jpg',
  JPEG = 'jpeg',
  PNG = 'png'
}

// Document interface
export interface Document {
  id: number;
  filename: string;
  original_filename: string;
  category: DocumentCategory;
  file_type: FileType;
  file_size: number;
  file_path: string;
  description?: string;
  document_number?: string;
  upload_date: string;
  created_at: string;
  updated_at: string;
}

// Document creation input
export interface CreateDocumentInput {
  filename: string;
  original_filename: string;
  category: DocumentCategory;
  file_type: FileType;
  file_size: number;
  file_path: string;
  description?: string;
  document_number?: string;
}

// Document update input
export interface UpdateDocumentInput {
  description?: string;
  document_number?: string;
  category?: DocumentCategory;
}

// Search query interface
export interface SearchQuery {
  category?: DocumentCategory;
  search?: string;
  limit?: number;
  offset?: number;
}

// Category statistics
export interface CategoryStats {
  category: DocumentCategory;
  count: number;
}

// API response types
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  total: number;
  limit: number;
  offset: number;
}

// Statistics response
export interface StatsResponse {
  total_documents: number;
  by_category: CategoryStats[];
  total_size_bytes: number;
}
