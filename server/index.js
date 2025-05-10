import express from 'express';
import cors from 'cors';
import { createClient } from '@clickhouse/client';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { parse } from 'csv-parse';
import { stringify } from 'csv-stringify';
import multer from 'multer';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3001;

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, 'uploads');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}-${file.originalname}`);
  }
});

const upload = multer({ storage });

// Middleware
app.use(cors());
app.use(express.json());

// Create uploads directory if it doesn't exist
const uploadDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// API Routes
app.post('/api/connect', async (req, res) => {
  try {
    const { source, config } = req.body;
    
    if (source === 'clickhouse') {
      // Validate required fields
      if (!config.keyId || !config.keySecret || !config.endpoint) {
        return res.status(400).json({ 
          success: false,
          message: 'Missing required connection parameters' 
        });
      }
      
      // Create ClickHouse client with the API endpoint configuration
      const client = createClient({
        host: config.endpoint,
        username: config.keyId,
        password: config.keySecret,
        tls: {
          rejectUnauthorized: false // Only for development
        }
      });
      
      // Test connection by getting list of tables
      const result = await client.query({
        query: 'SHOW TABLES',
        format: 'JSONEachRow'
      });
      
      const tables = await result.json();
      const tableNames = tables.map(table => Object.values(table)[0]);
      
      return res.json({ 
        success: true, 
        tables: tableNames 
      });
    } else if (source === 'flatfile') {
      // For flat file, we'll handle the upload separately
      return res.json({ success: true });
    }
    
    return res.status(400).json({ 
      success: false,
      message: 'Invalid source type' 
    });
  } catch (error) {
    console.error('Connection error:', error);
    return res.status(500).json({ 
      success: false,
      message: `Connection error: ${error.message}` 
    });
  }
});

app.post('/api/upload', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ 
        success: false,
        message: 'No file uploaded' 
      });
    }
    
    const filePath = req.file.path;
    const delimiter = req.body.delimiter || ',';
    
    // Create a Promise to handle the parsing
    const parseFile = new Promise((resolve, reject) => {
      const records = [];
      fs.createReadStream(filePath)
        .pipe(parse({
          delimiter,
          columns: true,
          skip_empty_lines: true,
          trim: true,
          from_line: 1,
          to_line: 2 // Just read the header and one data row
        }))
        .on('data', (record) => {
          records.push(record);
        })
        .on('end', () => {
          resolve(records);
        })
        .on('error', (error) => {
          reject(error);
        });
    });
    
    const records = await parseFile;
    
    if (records.length === 0) {
      return res.status(400).json({ 
        success: false,
        message: 'File is empty or has no valid data',
        columns: [] 
      });
    }
    
    // Extract column names from the first record
    const columnNames = Object.keys(records[0]);
    
    return res.json({
      success: true,
      columns: columnNames,
      filePath: filePath
    });
  } catch (error) {
    console.error('File upload error:', error);
    // Clean up the uploaded file if there was an error
    if (req.file && req.file.path) {
      try {
        fs.unlinkSync(req.file.path);
      } catch (cleanupError) {
        console.error('Error cleaning up file:', cleanupError);
      }
    }
    return res.status(500).json({ 
      success: false,
      message: `File upload error: ${error.message}`,
      columns: [] 
    });
  }
});

app.post('/api/schema', async (req, res) => {
  try {
    const { source, config, table } = req.body;
    
    if (source === 'clickhouse') {
      if (!table) {
        return res.status(400).json({ 
          success: false,
          message: 'Table name is required' 
        });
      }
      
      // Create ClickHouse client with the API endpoint configuration
      const client = createClient({
        host: config.endpoint,
        username: config.keyId,
        password: config.keySecret,
        tls: {
          rejectUnauthorized: false // Only for development
        }
      });
      
      // Get column information
      const result = await client.query({
        query: `DESCRIBE TABLE ${table}`,
        format: 'JSONEachRow'
      });
      
      const columns = await result.json();
      
      return res.json({
        success: true,
        columns: columns.map(col => ({
          name: col.name,
          type: col.type
        }))
      });
    } else {
      return res.status(400).json({ 
        success: false,
        message: 'Invalid source type or missing configuration' 
      });
    }
  } catch (error) {
    console.error('Schema fetch error:', error);
    return res.status(500).json({ 
      success: false,
      message: `Schema fetch error: ${error.message}` 
    });
  }
});

app.post('/api/preview', async (req, res) => {
  try {
    const { source, config, table, columns } = req.body;
    
    if (!columns || columns.length === 0) {
      return res.status(400).json({ 
        success: false,
        message: 'No columns selected for preview' 
      });
    }
    
    if (source === 'clickhouse') {
      // Create ClickHouse client with the API endpoint configuration
      const client = createClient({
        host: config.endpoint,
        username: config.keyId,
        password: config.keySecret,
        tls: {
          rejectUnauthorized: false // Only for development
        }
      });
      
      // Query to get preview data
      const columnsList = columns.join(', ');
      const result = await client.query({
        query: `SELECT ${columnsList} FROM ${table} LIMIT 100`,
        format: 'JSONEachRow'
      });
      
      const rows = await result.json();
      
      return res.json({
        success: true,
        rows
      });
    } else if (source === 'flatfile' && config.filePath) {
      // Create a Promise to handle the parsing
      const parseFile = new Promise((resolve, reject) => {
        const rows = [];
        fs.createReadStream(config.filePath)
          .pipe(parse({
            delimiter: config.delimiter || ',',
            columns: true,
            skip_empty_lines: true,
            trim: true,
            from_line: 1,
            to_line: 101 // Header + 100 rows
          }))
          .on('data', (record) => {
            // Filter to only include selected columns
            const filteredRecord = {};
            columns.forEach(col => {
              filteredRecord[col] = record[col];
            });
            rows.push(filteredRecord);
          })
          .on('end', () => {
            resolve(rows);
          })
          .on('error', (error) => {
            reject(error);
          });
      });
      
      const rows = await parseFile;
      
      return res.json({
        success: true,
        rows
      });
    }
    
    return res.status(400).json({ 
      success: false,
      message: 'Invalid source type or configuration' 
    });
  } catch (error) {
    console.error('Preview error:', error);
    return res.status(500).json({ 
      success: false,
      message: `Preview error: ${error.message}` 
    });
  }
});

app.post('/api/ingest', async (req, res) => {
  try {
    const { source, target, sourceConfig, targetConfig, table, columns } = req.body;
    
    if (!columns || columns.length === 0) {
      return res.status(400).json({ 
        success: false,
        message: 'No columns selected for ingestion' 
      });
    }
    
    // ClickHouse to Flat File
    if (source === 'clickhouse' && target === 'flatfile') {
      // Create ClickHouse client with the API endpoint configuration
      const client = createClient({
        host: sourceConfig.endpoint,
        username: sourceConfig.keyId,
        password: sourceConfig.keySecret,
        tls: {
          rejectUnauthorized: false // Only for development
        }
      });
      
      // Output file path
      const outputFileName = targetConfig.fileName || `${table}_export_${Date.now()}.csv`;
      const outputPath = path.join(uploadDir, outputFileName);
      
      // Create write stream
      const writeStream = fs.createWriteStream(outputPath);
      
      // Create CSV stringifier
      const stringifier = stringify({ 
        header: true, 
        columns,
        delimiter: targetConfig.delimiter || ',' 
      });
      
      stringifier.pipe(writeStream);
      
      // Query data from ClickHouse
      const columnsList = columns.join(', ');
      const result = await client.query({
        query: `SELECT ${columnsList} FROM ${table}`,
        format: 'JSONEachRow'
      });
      
      const rows = await result.json();
      
      // Write rows to CSV
      for (const row of rows) {
        stringifier.write(row);
      }
      
      // End the stringifier
      stringifier.end();
      
      // Wait for the write stream to finish
      await new Promise((resolve, reject) => {
        writeStream.on('finish', resolve);
        writeStream.on('error', reject);
      });
      
      return res.json({
        success: true,
        recordsProcessed: rows.length,
        outputFile: outputFileName
      });
    }
    
    // Flat File to ClickHouse
    else if (source === 'flatfile' && target === 'clickhouse') {
      if (!sourceConfig.filePath) {
        return res.status(400).json({ 
          success: false,
          message: 'Source file path is missing' 
        });
      }
      
      // Create ClickHouse client with the API endpoint configuration
      const client = createClient({
        host: targetConfig.endpoint,
        username: targetConfig.keyId,
        password: targetConfig.keySecret,
        tls: {
          rejectUnauthorized: false // Only for development
        }
      });
      
      // Read data from CSV using a Promise
      const parseFile = new Promise((resolve, reject) => {
        const records = [];
        fs.createReadStream(sourceConfig.filePath)
          .pipe(parse({
            delimiter: sourceConfig.delimiter || ',',
            columns: true,
            skip_empty_lines: true,
            trim: true
          }))
          .on('data', (record) => {
            // Filter to only include selected columns
            const filteredRecord = {};
            columns.forEach(col => {
              filteredRecord[col] = record[col];
            });
            records.push(filteredRecord);
          })
          .on('end', () => {
            resolve(records);
          })
          .on('error', (error) => {
            reject(error);
          });
      });
      
      const records = await parseFile;
      
      // Prepare for insertion
      const tableName = targetConfig.tableName || `imported_${Date.now()}`;
      
      // Create table if it doesn't exist
      const createTableQuery = `
        CREATE TABLE IF NOT EXISTS ${tableName} (
          ${columns.map(col => `${col} String`).join(', ')}
        ) ENGINE = MergeTree() ORDER BY tuple()
      `;
      
      await client.query({
        query: createTableQuery
      });
      
      // Insert data in batches
      const batchSize = 1000;
      let processedCount = 0;
      
      for (let i = 0; i < records.length; i += batchSize) {
        const batch = records.slice(i, i + batchSize);
        
        // Insert the batch
        await client.insert({
          table: tableName,
          values: batch,
          format: 'JSONEachRow'
        });
        
        processedCount += batch.length;
      }
      
      return res.json({
        success: true,
        recordsProcessed: processedCount,
        tableName
      });
    }
    
    return res.status(400).json({ 
      success: false,
      message: 'Invalid source or target configuration' 
    });
  } catch (error) {
    console.error('Ingestion error:', error);
    return res.status(500).json({ 
      success: false,
      message: `Ingestion error: ${error.message}` 
    });
  }
});

// Start the server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});