const pool = require('../config/db');
const calculateStreak = require('../utils/streak');

exports.getProfile = async (req, res) => {
  const userId = req.user.id;

  try {
    const [users] = await pool.query('SELECT name, email, created_at FROM users WHERE id = ?', [userId]);
    if (users.length === 0) {
      return res.status(404).json({ message: 'User not found' });
    }
    const user = users[0];

    const [tasks] = await pool.query(
      'SELECT COUNT(*) as total, SUM(CASE WHEN status="completed" THEN 1 ELSE 0 END) as completed FROM tasks WHERE user_id = ?',
      [userId]
    );
    const totalTasks = tasks[0].total || 0;
    const completedTasks = tasks[0].completed || 0;

    const [attendance] = await pool.query(
      'SELECT COUNT(*) as count, AVG(present_count / (present_count + absent_count)) as average FROM attendance WHERE user_id = ? AND (present_count + absent_count) > 0',
      [userId]
    );
    const totalSubjects = attendance[0].count || 0;
    const rawAverage = attendance[0].average;
    const avgAttendance = rawAverage !== null ? Math.round(rawAverage * 100) : 100;

    const [sessions] = await pool.query(
      'SELECT COUNT(*) as total, SUM(duration_seconds) as total_time, SUM(violations) as total_violations FROM sessions WHERE user_id = ?',
      [userId]
    );
    const totalSessions = sessions[0].total || 0;
    const totalFocusSeconds = sessions[0].total_time || 0;
    const totalViolations = sessions[0].total_violations || 0;

    const [pomodoros] = await pool.query(
      'SELECT COUNT(*) as total, SUM(duration_minutes) as total_minutes FROM pomodoros WHERE user_id = ?',
      [userId]
    );
    const totalPomodoros = pomodoros[0].total || 0;
    const totalPomodoroMinutes = pomodoros[0].total_minutes || 0;

    const [rawSessions] = await pool.query('SELECT created_at FROM sessions WHERE user_id = ?', [userId]);
    const [rawPomodoros] = await pool.query('SELECT completed_at FROM pomodoros WHERE user_id = ?', [userId]);
    const streak = calculateStreak(rawSessions, rawPomodoros);

    const pendingTasks = totalTasks - completedTasks;
    let score = 85;
    score -= pendingTasks * 2;
    score -= totalViolations * 3;
    score += totalPomodoros * 2.5;
    score += streak.streakCount * 2;
    const productivityScore = Math.min(100, Math.max(10, Math.round(score)));

    res.json({
      profile: {
        name: user.name,
        email: user.email,
        memberSince: user.created_at
      },
      stats: {
        productivityScore,
        streak,
        tasks: {
          total: totalTasks,
          completed: completedTasks,
          pending: pendingTasks,
          percentage: totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0
        },
        attendance: {
          subjectsCount: totalSubjects,
          averagePercentage: avgAttendance
        },
        focus: {
          sessionsCount: totalSessions,
          totalHours: (totalFocusSeconds / 3600).toFixed(1),
          totalMinutes: Math.round(totalFocusSeconds / 60),
          violationsCount: totalViolations,
          avgViolations: totalSessions > 0 ? (totalViolations / totalSessions).toFixed(1) : '0.0'
        },
        pomodoro: {
          count: totalPomodoros,
          totalMinutes: totalPomodoroMinutes
        }
      }
    });
  } catch (err) {
    console.error('getProfile error:', err);
    res.status(500).json({ message: 'Error retrieving profile statistics' });
  }
};

