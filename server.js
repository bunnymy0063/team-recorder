const express = require('express');
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const sgMail = require('@sendgrid/mail');
const cors = require('cors');
const json2csv = require('json2csv').Parser;
require('dotenv').config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Config
const MONGO_URI = process.env.MONGO_URI;
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';
const SENDGRID_API_KEY = process.env.SENDGRID_API_KEY;
const FROM_EMAIL = process.env.FROM_EMAIL || 'noreply@teamrecorder.app';

if (SENDGRID_API_KEY) sgMail.setApiKey(SENDGRID_API_KEY);

// DB Connection
mongoose.connect(MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
}).then(() => console.log('MongoDB connected')).catch(err => console.error('MongoDB error:', err));

// Schemas
const userSchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true },
  email: { type: String, required: true, unique: true },
  createdAt: { type: Date, default: Date.now }
});

const commentSchema = new mongoose.Schema({
  author: String,
  text: String,
  time: { type: Date, default: Date.now }
});

const recordSchema = new mongoose.Schema({
  type: { type: String, enum: ['case', 'task', 'discussion', 'decision'], required: true },
  title: { type: String, required: true },
  desc: String,
  respondent: String,
  status: { type: String, enum: ['open', 'in-progress', 'closed'], default: 'open' },
  creator: String,
  creatorEmail: String,
  date: String,
  time: String,
  comments: [commentSchema],
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
  notifiedUsers: [String]
});

const User = mongoose.model('User', userSchema);
const Record = mongoose.model('Record', recordSchema);

// Auth
const generateToken = (userId) => {
  return jwt.sign({ userId }, JWT_SECRET, { expiresIn: '30d' });
};

const verifyToken = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'No token' });
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.userId = decoded.userId;
    next();
  } catch {
    res.status(401).json({ error: 'Invalid token' });
  }
};

// Email notification
const sendNotification = async (record, action = 'created') => {
  if (!SENDGRID_API_KEY) {
    console.log('SendGrid not configured. Skipping email.');
    return;
  }

  const users = await User.find();
  const creatorEmail = record.creatorEmail;
  
  for (const user of users) {
    if (user.email === creatorEmail || record.notifiedUsers.includes(user.email)) continue;

    const msg = {
      to: user.email,
      from: FROM_EMAIL,
      subject: `New record: ${record.title} (${record.type})`,
      html: `
        <h2>${record.title}</h2>
        <p><strong>Type:</strong> ${record.type}</p>
        <p><strong>Status:</strong> ${record.status}</p>
        <p><strong>Respondent:</strong> ${record.respondent}</p>
        <p><strong>Created by:</strong> ${record.creator}</p>
        <p><strong>Description:</strong></p>
        <p>${record.desc || '(No description)'}</p>
        <p style="margin-top: 20px; color: #666;">New record added to Team Record Tracker</p>
      `
    };

    try {
      await sgMail.send(msg);
      record.notifiedUsers.push(user.email);
    } catch (err) {
      console.error('Email send error:', err);
    }
  }

  await record.save();
};

// Routes

// Register/Login
app.post('/api/auth/login', async (req, res) => {
  try {
    const { name, email } = req.body;
    if (!name || !email) return res.status(400).json({ error: 'Name and email required' });

    let user = await User.findOne({ name });
    if (!user) {
      user = new User({ name, email });
      await user.save();
    }

    const token = generateToken(user._id);
    res.json({ token, user: { id: user._id, name: user.name, email: user.email } });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Create record
app.post('/api/records', verifyToken, async (req, res) => {
  try {
    const { type, title, desc, respondent, status, creator, creatorEmail } = req.body;
    
    const now = new Date();
    const record = new Record({
      type,
      title,
      desc,
      respondent,
      status,
      creator,
      creatorEmail,
      date: now.toLocaleDateString(),
      time: now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      comments: [],
      notifiedUsers: [creatorEmail]
    });

    await record.save();
    
    // Send email notifications
    await sendNotification(record, 'created');

    res.json(record);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get all records
app.get('/api/records', verifyToken, async (req, res) => {
  try {
    const records = await Record.find().sort({ createdAt: -1 });
    res.json(records);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get single record
app.get('/api/records/:id', verifyToken, async (req, res) => {
  try {
    const record = await Record.findById(req.params.id);
    if (!record) return res.status(404).json({ error: 'Record not found' });
    res.json(record);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Add comment
app.post('/api/records/:id/comments', verifyToken, async (req, res) => {
  try {
    const { author, text } = req.body;
    const record = await Record.findById(req.params.id);
    if (!record) return res.status(404).json({ error: 'Record not found' });

    record.comments.push({
      author,
      text,
      time: new Date()
    });

    record.updatedAt = new Date();
    await record.save();

    // Notify others about update
    if (SENDGRID_API_KEY) {
      const users = await User.findOne();
      const msg = {
        to: users?.email,
        from: FROM_EMAIL,
        subject: `Update on: ${record.title}`,
        html: `
          <p><strong>${author}</strong> added an update:</p>
          <p>${text}</p>
          <p style="margin-top: 20px; color: #666;">Record: ${record.title}</p>
        `
      };
      try {
        await sgMail.send(msg);
      } catch (err) {
        console.error('Email send error:', err);
      }
    }

    res.json(record);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Export records (CSV)
app.get('/api/records/export/csv', verifyToken, async (req, res) => {
  try {
    const records = await Record.find();
    const data = records.map(r => ({
      Type: r.type,
      Title: r.title,
      Description: r.desc || '',
      Respondent: r.respondent,
      Status: r.status,
      'Created By': r.creator,
      'Date': r.date,
      'Time': r.time,
      'Comments': r.comments.map(c => `${c.author}: ${c.text}`).join('; '),
      'Last Updated': r.updatedAt
    }));

    const parser = new json2csv({ fields: Object.keys(data[0] || {}) });
    const csv = parser.parse(data);

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename=records.csv');
    res.send(csv);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Export single record (JSON)
app.get('/api/records/:id/export/json', verifyToken, async (req, res) => {
  try {
    const record = await Record.findById(req.params.id);
    if (!record) return res.status(404).json({ error: 'Record not found' });

    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', `attachment; filename=${record.title}.json`);
    res.json(record);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'OK' });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
