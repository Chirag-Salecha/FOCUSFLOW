const pool = require('../config/db');

exports.createSession = async (req, res) => {
  const userId = req.user.id;
  const { name, duration_seconds, violations, status } = req.body;

  if (!name || duration_seconds === undefined) {
    return res.status(400).json({ message: 'Session name and duration are required' });
  }

  try {
    const [result] = await pool.query(
      'INSERT INTO sessions (user_id, name, duration_seconds, violations, status) VALUES (?, ?, ?, ?, ?)',
      [userId, name, duration_seconds, violations || 0, status || 'completed']
    );

    const [newSession] = await pool.query('SELECT * FROM sessions WHERE id = ?', [result.insertId]);
    res.status(201).json(newSession[0]);
  } catch (err) {
    console.error('createSession error:', err);
    res.status(500).json({ message: 'Error saving study session' });
  }
};

exports.createPomodoro = async (req, res) => {
  const userId = req.user.id;
  const { duration_minutes } = req.body;

  if (!duration_minutes) {
    return res.status(400).json({ message: 'Duration in minutes is required' });
  }

  try {
    const [result] = await pool.query(
      'INSERT INTO pomodoros (user_id, duration_minutes) VALUES (?, ?)',
      [userId, duration_minutes]
    );

    const [newPomo] = await pool.query('SELECT * FROM pomodoros WHERE id = ?', [result.insertId]);
    res.status(201).json(newPomo[0]);
  } catch (err) {
    console.error('createPomodoro error:', err);
    res.status(500).json({ message: 'Error saving pomodoro session' });
  }
};

exports.getSessionHistory = async (req, res) => {
  const userId = req.user.id;
  try {
    // Fetch focus camera sessions
    const [focusSessions] = await pool.query(
      'SELECT id, name, duration_seconds, violations, status, created_at, "focus_session" as type FROM sessions WHERE user_id = ? ORDER BY created_at DESC LIMIT 50',
      [userId]
    );

    // Fetch pomodoro sessions
    const [pomodoros] = await pool.query(
      'SELECT id, "Pomodoro Timer" as name, (duration_minutes * 60) as duration_seconds, 0 as violations, "completed" as status, completed_at as created_at, "pomodoro" as type FROM pomodoros WHERE user_id = ? ORDER BY completed_at DESC LIMIT 50',
      [userId]
    );

    // Combine and sort chronologically (most recent first)
    const combined = [...focusSessions, ...pomodoros].sort((a, b) => {
      return new Date(b.created_at) - new Date(a.created_at);
    });

    res.json(combined);
  } catch (err) {
    console.error('getSessionHistory error:', err);
    res.status(500).json({ message: 'Error retrieving session history' });
  }
};
