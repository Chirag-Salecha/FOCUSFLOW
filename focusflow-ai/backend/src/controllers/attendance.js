const pool = require('../config/db');

exports.getAttendance = async (req, res) => {
  const userId = req.user.id;
  try {
    const [records] = await pool.query('SELECT * FROM attendance WHERE user_id = ? ORDER BY subject ASC', [userId]);
    
    // Process records to calculate percentage
    const processed = records.map(r => {
      const total = r.present_count + r.absent_count;
      const percentage = total > 0 ? Math.round((r.present_count / total) * 100) : 100;
      return {
        ...r,
        total_classes: total,
        percentage,
        is_low: percentage < 75 // Warning flag for low attendance
      };
    });

    res.json(processed);
  } catch (err) {
    console.error('getAttendance error:', err);
    res.status(500).json({ message: 'Error retrieving attendance records' });
  }
};

exports.createSubject = async (req, res) => {
  const userId = req.user.id;
  const { subject } = req.body;

  if (!subject) {
    return res.status(400).json({ message: 'Subject name is required' });
  }

  try {
    // Check duplicate
    const [duplicate] = await pool.query(
      'SELECT * FROM attendance WHERE user_id = ? AND subject = ?',
      [userId, subject]
    );

    if (duplicate.length > 0) {
      return res.status(400).json({ message: 'Subject already exists' });
    }

    const [result] = await pool.query(
      'INSERT INTO attendance (user_id, subject, present_count, absent_count) VALUES (?, ?, 0, 0)',
      [userId, subject]
    );

    const [newRecord] = await pool.query('SELECT * FROM attendance WHERE id = ?', [result.insertId]);
    res.status(201).json({
      ...newRecord[0],
      total_classes: 0,
      percentage: 100,
      is_low: false
    });
  } catch (err) {
    console.error('createSubject error:', err);
    res.status(500).json({ message: 'Error creating subject' });
  }
};

exports.updateAttendance = async (req, res) => {
  const userId = req.user.id;
  const { id } = req.params;
  const { present_count, absent_count } = req.body;

  try {
    const [existing] = await pool.query('SELECT * FROM attendance WHERE id = ? AND user_id = ?', [id, userId]);
    if (existing.length === 0) {
      return res.status(404).json({ message: 'Subject not found or access denied' });
    }

    const current = existing[0];
    const newPresent = present_count !== undefined ? Math.max(0, present_count) : current.present_count;
    const newAbsent = absent_count !== undefined ? Math.max(0, absent_count) : current.absent_count;

    await pool.query(
      'UPDATE attendance SET present_count = ?, absent_count = ? WHERE id = ?',
      [newPresent, newAbsent, id]
    );

    const total = newPresent + newAbsent;
    const percentage = total > 0 ? Math.round((newPresent / total) * 100) : 100;

    res.json({
      id: current.id,
      subject: current.subject,
      present_count: newPresent,
      absent_count: newAbsent,
      total_classes: total,
      percentage,
      is_low: percentage < 75
    });
  } catch (err) {
    console.error('updateAttendance error:', err);
    res.status(500).json({ message: 'Error updating attendance' });
  }
};

exports.deleteSubject = async (req, res) => {
  const userId = req.user.id;
  const { id } = req.params;

  try {
    const [existing] = await pool.query('SELECT * FROM attendance WHERE id = ? AND user_id = ?', [id, userId]);
    if (existing.length === 0) {
      return res.status(404).json({ message: 'Subject not found or access denied' });
    }

    await pool.query('DELETE FROM attendance WHERE id = ?', [id]);
    res.json({ message: 'Subject deleted successfully', id });
  } catch (err) {
    console.error('deleteSubject error:', err);
    res.status(500).json({ message: 'Error deleting subject' });
  }
};
