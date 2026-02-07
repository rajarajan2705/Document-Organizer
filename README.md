# Document Organizer

A personal web-based document management system to organize and access important documents like IDs, certificates, invoices, and more. Built with Node.js, TypeScript, and Express.

## Features

- **Document Upload**: Upload PDF and image files (JPG, PNG) up to 10MB
- **Smart Organization**: 8 predefined categories for different document types
- **Rich Metadata**: Add descriptions and document numbers for easy reference
- **Powerful Search**: Search by filename, description, or document number
- **Category Filtering**: Quick filter by document category
- **Document Viewer**: View PDFs and images directly in the browser
- **Edit & Delete**: Update document metadata or remove documents
- **Mobile-Friendly**: Responsive design works on phones, tablets, and desktops
- **Statistics Dashboard**: Track total documents and storage usage

## Document Categories

1. Personal IDs
2. Educational Docs
3. Work Experience Letters
4. Resumes
5. Online Purchase Invoices
6. Insurance Docs
7. Bank Statements
8. Others

## Technology Stack

**Backend:**
- Node.js with TypeScript
- Express.js web framework
- SQLite database (better-sqlite3)
- Multer for file uploads
- Helmet for security headers
- Express-validator for input validation

**Frontend:**
- Vanilla JavaScript (no frameworks)
- Responsive CSS with Grid and Flexbox
- Mobile-first design

## Installation

### Prerequisites

- Node.js 18+ and npm

### Setup Steps

1. **Clone or navigate to the project directory**
   ```bash
   cd document-organizer
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Build the TypeScript code**
   ```bash
   npm run build
   ```

4. **Start the server**
   ```bash
   npm start
   ```

   For development with auto-reload:
   ```bash
   npm run dev
   ```

5. **Access the application**
   Open your browser and go to: `http://localhost:3000`

## Project Structure

```
document-organizer/
├── src/
│   ├── server/
│   │   ├── config/
│   │   │   └── database.ts          # Database configuration
│   │   ├── middleware/
│   │   │   └── upload.ts            # Multer file upload config
│   │   ├── models/
│   │   │   └── document.ts          # Document data operations
│   │   ├── routes/
│   │   │   └── documents.ts         # API endpoints
│   │   ├── utils/
│   │   │   ├── fileHandler.ts       # File system operations
│   │   │   └── validators.ts        # Input validation
│   │   └── server.ts                # Express app entry point
│   └── types/
│       └── index.ts                 # TypeScript type definitions
├── public/
│   ├── index.html                   # Main HTML page
│   ├── css/
│   │   └── styles.css               # Responsive styling
│   ├── js/
│   │   ├── app.js                   # Main application logic
│   │   ├── upload.js                # Upload functionality
│   │   ├── search.js                # Search functionality
│   │   └── viewer.js                # Document viewer
│   └── uploads/                     # Uploaded files (by category)
├── database/
│   └── documents.db                 # SQLite database
├── package.json
├── tsconfig.json
└── README.md
```

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/documents/upload` | Upload a new document |
| GET | `/api/documents` | Get all documents (with optional filters) |
| GET | `/api/documents/:id` | Get single document metadata |
| GET | `/api/documents/:id/download` | Download/view document file |
| PUT | `/api/documents/:id` | Update document metadata |
| DELETE | `/api/documents/:id` | Delete document |
| GET | `/api/documents/stats/categories` | Get category statistics |
| GET | `/api/documents/stats/overview` | Get overall statistics |
| GET | `/api/health` | Health check endpoint |

### Query Parameters

**GET /api/documents**
- `category`: Filter by category (e.g., `personal-ids`)
- `search`: Search term for filename/description
- `limit`: Maximum number of results
- `offset`: Number of results to skip (pagination)

## Usage Guide

### Uploading Documents

1. Click the "Upload Document" button in the header
2. Select a file (PDF, JPG, or PNG, max 10MB)
3. Choose a category from the dropdown
4. Optionally add a description and document number
5. Click "Upload"

### Searching Documents

- Use the search bar to search by filename, description, or document number
- Results update automatically as you type (debounced)
- Click the × button to clear search

### Filtering by Category

- Click any category pill to filter documents
- Click "All" to show all documents
- Active category is highlighted in blue

### Viewing Documents

- Click any document card to open the viewer
- PDFs are displayed in an embedded viewer
- Images are shown full-size
- Use the Download button to save the file

### Editing Documents

1. Open a document in the viewer
2. Click the "Edit" button
3. Update the category, description, or document number
4. Click "Save Changes"

### Deleting Documents

1. Open a document in the viewer
2. Click the "Delete" button
3. Confirm the deletion
4. The document and file will be permanently removed

## Configuration

### Environment Variables

Create a `.env` file in the project root:

```env
PORT=3000
NODE_ENV=development
```

### File Upload Limits

- Maximum file size: 10MB (configurable in `src/server/middleware/upload.ts`)
- Allowed file types: PDF, JPG, JPEG, PNG
- Files per upload: 1

## Security Features

- Helmet middleware for security headers
- Input validation on all endpoints
- SQL injection prevention (parameterized queries)
- File type validation (client and server)
- Filename sanitization
- XSS protection
- CORS configuration
- File size limits

## Database Schema

```sql
CREATE TABLE documents (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    filename VARCHAR(255) NOT NULL,
    original_filename VARCHAR(255) NOT NULL,
    category VARCHAR(50) NOT NULL,
    file_type VARCHAR(10) NOT NULL,
    file_size INTEGER NOT NULL,
    file_path VARCHAR(500) NOT NULL,
    description TEXT,
    document_number VARCHAR(100),
    upload_date DATETIME DEFAULT CURRENT_TIMESTAMP,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

## Mobile Support

The application is fully responsive and optimized for mobile devices:
- Touch-friendly buttons (minimum 44px tap targets)
- Mobile-first CSS design
- Responsive grid layout (1 column on mobile, up to 4 on desktop)
- Bottom-aligned modals for better mobile UX
- Viewport-optimized images

## Troubleshooting

### Server won't start

- Ensure port 3000 is not in use
- Check that all dependencies are installed: `npm install`
- Verify TypeScript compiled successfully: `npm run build`

### Upload fails

- Check file size is under 10MB
- Verify file type is PDF, JPG, JPEG, or PNG
- Ensure uploads directory has write permissions

### Documents not displaying

- Check that the database file exists in `database/documents.db`
- Verify files exist in `public/uploads/{category}/`
- Check browser console for JavaScript errors

## Future Enhancements

Potential features for future versions:
- Bulk upload functionality
- Document thumbnails
- OCR for text extraction from PDFs
- Expiry date tracking with reminders
- Export/backup functionality
- Dark mode theme
- Document sharing via unique links
- Tags/labels system
- Advanced filtering (date ranges, file size)
- User authentication (multi-user support)
- Cloud storage integration

## Development

### Scripts

- `npm run build` - Compile TypeScript to JavaScript
- `npm start` - Start production server
- `npm run dev` - Start development server with auto-reload
- `npm run watch` - Watch TypeScript files for changes

### Code Style

- TypeScript strict mode enabled
- ES2020 target
- CommonJS modules
- Consistent naming conventions

## License

ISC

## Support

For issues or questions, please open an issue on the project repository.

---

Built with Node.js, TypeScript, and Express
