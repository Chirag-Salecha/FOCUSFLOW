const pool = require('../config/db');

exports.getTasks = async (req, res) => {
  const userId = req.user.id;
  try {
    const [tasks] = await pool.query('SELECT * FROM tasks WHERE user_id = ? ORDER BY due_date ASC, id DESC', [userId]);
    res.json(tasks);
  } catch (err) {
    console.error('getTasks error:', err);
    res.status(500).json({ message: 'Error retrieving tasks' });
  }
};

exports.createTask = async (req, res) => {
  const userId = req.user.id;
  const { title, description, due_date } = req.body;

  if (!title) {
    return res.status(400).json({ message: 'Task title is required' });
  }

  try {
    const [result] = await pool.query(
      'INSERT INTO tasks (user_id, title, description, due_date, status) VALUES (?, ?, ?, ?, ?)',
      [userId, title, description || '', due_date || null, 'pending']
    );

    const [newTask] = await pool.query('SELECT * FROM tasks WHERE id = ?', [result.insertId]);
    res.status(201).json(newTask[0]);
  } catch (err) {
    console.error('createTask error:', err);
    res.status(500).json({ message: 'Error creating task' });
  }
};

exports.updateTask = async (req, res) => {
  const userId = req.user.id;
  const { id } = req.params;
  const { title, description, status, due_date } = req.body;

  try {
    const [existing] = await pool.query('SELECT * FROM tasks WHERE id = ? AND user_id = ?', [id, userId]);
    if (existing.length === 0) {
      return res.status(404).json({ message: 'Task not found or access denied' });
    }

    const currentTask = existing[0];
    const newStatus = status || currentTask.status;
    const completedAt = (newStatus === 'completed' && currentTask.status !== 'completed') 
      ? new Date() 
      : (newStatus === 'pending' ? null : currentTask.completed_at);

    await pool.query(
      'UPDATE tasks SET title = ?, description = ?, status = ?, due_date = ?, completed_at = ? WHERE id = ?',
      [
        title || currentTask.title,
        description !== undefined ? description : currentTask.description,
        newStatus,
        due_date !== undefined ? due_date : currentTask.due_date,
        completedAt,
        id
      ]
    );

    const [updated] = await pool.query('SELECT * FROM tasks WHERE id = ?', [id]);
    res.json(updated[0]);
  } catch (err) {
    console.error('updateTask error:', err);
    res.status(500).json({ message: 'Error updating task' });
  }
};

exports.deleteTask = async (req, res) => {
  const userId = req.user.id;
  const { id } = req.params;

  try {
    const [existing] = await pool.query('SELECT * FROM tasks WHERE id = ? AND user_id = ?', [id, userId]);
    if (existing.length === 0) {
      return res.status(404).json({ message: 'Task not found or access denied' });
    }

    await pool.query('DELETE FROM tasks WHERE id = ?', [id]);
    res.json({ message: 'Task deleted successfully', id });
  } catch (err) {
    console.error('deleteTask error:', err);
    res.status(500).json({ message: 'Error deleting task' });
  }
};

const pdfParse = require('pdf-parse');
const mammoth = require('mammoth');

exports.parseFile = async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ message: 'No file uploaded' });
  }

  const fileBuffer = req.file.buffer;
  const fileName = req.file.originalname;
  const extension = fileName.split('.').pop().toLowerCase();

  try {
    let parsedText = '';

    if (extension === 'txt') {
      parsedText = fileBuffer.toString('utf8');
    } else if (extension === 'pdf') {
      const data = await pdfParse(fileBuffer);
      parsedText = data.text;
    } else if (extension === 'docx') {
      const result = await mammoth.extractRawText({ buffer: fileBuffer });
      parsedText = result.value;
    } else {
      // Extractor fallback for PPTX, image, or xlsx: filter printable characters and group words
      const rawString = fileBuffer.toString('ascii');
      const cleanString = rawString.replace(/[^\x20-\x7E\n\r\t]/g, ' '); 
      const words = cleanString.match(/[a-zA-Z]{4,20}/g) || [];
      const extractedText = words.slice(0, 1000).join(' ');
      
      parsedText = `UNSUPPORTED FILE AUTOMATIC TEXT EXTRACTION REPORT\n`;
      parsedText += `=====================================================\n`;
      parsedText += `Document Name: ${fileName}\n`;
      parsedText += `Format: ${extension.toUpperCase()}\n`;
      parsedText += `Size: ${(req.file.size / 1024).toFixed(2)} KB\n\n`;
      parsedText += `Note: FocusFlow extracted readable ASCII word streams from this file for scrolling completion compatibility:\n\n`;
      parsedText += extractedText;
    }

    if (!parsedText || parsedText.trim().length === 0) {
      parsedText = `Empty document content or failed to parse text from ${fileName}. Please verify file contents.`;
    }

    res.json({ text: parsedText });
  } catch (err) {
    console.error('File parsing error:', err);
    res.status(500).json({ message: 'Error parsing file: ' + err.message });
  }
};
