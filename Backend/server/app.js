const express = require('express');
const cors = require('cors');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const sttLogic = require('./sttlogic'); // Import STT logic module

const app = express();
const PORT = 5000;

// Middleware
app.use(cors({
  origin: 'http://localhost:5173', // Vite's default port
  methods: ['GET', 'POST'],
  allowedHeaders: ['Content-Type']
}));
app.use(express.json());

// Directory Setup
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir);
}
app.use('/uploads', express.static(uploadsDir));

// Multer setup
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadsDir);
  },
  filename: function (req, file, cb) {
    const originalName = path.parse(file.originalname).name;
    const ext = path.extname(file.originalname);
    const timestamp = Date.now();
    cb(null, `${originalName}-${timestamp}${ext}`);
  }
});
const upload = multer({ storage });

// Routes
app.get('/', (req, res) => {
  res.send('API is running...');
});

app.post('/api/audio', upload.single('audio'), sttLogic.handleAudioUpload);
app.get('/api/transcriptions', sttLogic.getTranscriptions);

// Export the app
module.exports = app;
