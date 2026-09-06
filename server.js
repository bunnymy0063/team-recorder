const express = require('express');
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const cors = require('cors');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());

const MONGO_URI = process.env.MONGO_URI;
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

mongoose.connect(MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
}).then(() => console.log('MongoDB connected')).catch(err => console.error('MongoDB error:', err));

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
  updatedAt: { type: Date, default: Date.now }
});

const User = mongoose.model('User', userSchema);
const Record = mongoose.model('Record', recordSchema);

const generateToken = (userId) => jwt.sign({ userId }, JWT_SECRET, { expiresIn: '30d' });

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

app.get('/health', (req, res) => {
  res.json({ status: 'OK' });
});

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

app.post('/api/records', verifyToken, async (req, res) => {
  try {
    const { type, title, desc, respondent, status, creator, creatorEmail } = req.body;
    
    const now = new Date();
    const record = new Record({
      type, title, desc, respondent, status, creator, creatorEmail,
      date: now.toLocaleDateString(),
      time: now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      comments: []
    });

    await record.save();
    res.json(record);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/records', verifyToken, async (req, res) => {
  try {
    const records = await Record.find().sort({ createdAt: -1 });
    res.json(records);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/records/:id', verifyToken, async (req, res) => {
  try {
    const record = await Record.findById(req.params.id);
    if (!record) return res.status(404).json({ error: 'Record not found' });
    res.json(record);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/records/:id/comments', verifyToken, async (req, res) => {
  try {
    const { author, text } = req.body;
    const record = await Record.findById(req.params.id);
    if (!record) return res.status(404).json({ error: 'Record not found' });

    record.comments.push({ author, text, time: new Date() });
    record.updatedAt = new Date();
    await record.save();
    res.json(record);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/records/export/csv', verifyToken, async (req, res) => {
  try {
    const records = await Record.find();
    const csv = 'Type,Title,Description,Respondent,Status,Creator,Date,Time\n' +
      records.map(r => `"${r.type}","${r.title}","${r.desc || ''}","${r.respondent}","${r.status}","${r.creator}","${r.date}","${r.time}"`).join('\n');
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename=records.csv');
    res.send(csv);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

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

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
