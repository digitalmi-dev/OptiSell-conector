import express from 'express';
import cors from 'cors';
import shopifyRoutes from './routes/shopify.js';
import shopifySyncRoutes from './routes/shopifySync.js';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health check - trebuie să fie înainte de alte rute
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'OptiSell Integrator API is running', timestamp: new Date().toISOString() });
});

// Logging endpoint pentru debugging
app.get('/api/debug/logs', (req, res) => {
  try {
    const fs = require('fs');
    const logFile = '/tmp/backend.log';
    if (fs.existsSync(logFile)) {
      const logs = fs.readFileSync(logFile, 'utf8');
      res.json({ 
        success: true, 
        logs: logs.split('\n').slice(-100), // Ultimele 100 linii
        timestamp: new Date().toISOString()
      });
    } else {
      res.json({ 
        success: false, 
        message: 'Log file not found',
        timestamp: new Date().toISOString()
      });
    }
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// Routes
app.use('/api/shopify', shopifyRoutes);
app.use('/api/shopify', shopifySyncRoutes); // Rute dedicate pentru sync

// Error handling middleware - trebuie să fie înainte de 404 handler
app.use((err, req, res, next) => {
  console.error('Error:', err);
  
  // Asigură-te că răspunsul este JSON
  if (!res.headersSent) {
    res.status(err.status || 500).json({
      success: false,
      message: err.message || 'Internal server error',
      details: process.env.NODE_ENV === 'development' ? err.stack : undefined
    });
  }
});

// 404 handler - trebuie să fie ultimul, după toate rutele
app.use('/api/*', (req, res) => {
  res.status(404).json({
    success: false,
    message: `Route not found: ${req.method} ${req.originalUrl}`,
    availableRoutes: [
      'GET /api/health',
      'POST /api/shopify/integrations',
      'GET /api/shopify/integrations',
      'GET /api/shopify/integrations/:id',
      'PUT /api/shopify/integrations/:id',
      'DELETE /api/shopify/integrations/:id',
      'POST /api/shopify/integrations/:id/test',
      'GET /api/shopify/integrations/:id/products',
      'POST /api/shopify/integrations/:id/products',
      'POST /api/shopify/sync/:id',
      'POST /api/shopify/sync/:id/intelligent'
    ]
  });
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
  console.log(`API endpoints available at http://localhost:${PORT}/api`);
});

export default app;
