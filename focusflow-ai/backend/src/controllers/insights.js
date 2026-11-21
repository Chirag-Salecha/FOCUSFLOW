const pool = require('../config/db');
const calculateStreak = require('../utils/streak');

exports.getAIInsights = async (req, res) => {
  const userId = req.user.id;

  try {
    const [tasks] = await pool.query('SELECT * FROM tasks WHERE user_id = ?', [userId]);
    const [attendance] = await pool.query('SELECT * FROM attendance WHERE user_id = ?', [userId]);
    const [sessions] = await pool.query('SELECT * FROM sessions WHERE user_id = ?', [userId]);
    const [pomodoros] = await pool.query('SELECT * FROM pomodoros WHERE user_id = ?', [userId]);

    const streak = calculateStreak(sessions, pomodoros);

    const totalTasks = tasks.length;
    const completedTasks = tasks.filter(t => t.status === 'completed').length;
    const pendingTasks = totalTasks - completedTasks;
    const taskCompletionRate = totalTasks > 0 ? (completedTasks / totalTasks) : 0;

    let totalAttendancePercent = 0;
    let lowAttendanceSubjects = [];
    attendance.forEach(subject => {
      const total = subject.present_count + subject.absent_count;
      const percent = total > 0 ? (subject.present_count / total) : 1.0;
      totalAttendancePercent += percent;
      if (percent < 0.75) {
        lowAttendanceSubjects.push({
          name: subject.subject,
          percent: Math.round(percent * 100)
        });
      }
    });
    const avgAttendance = attendance.length > 0 ? (totalAttendancePercent / attendance.length) : 0.85;

    let totalFocusTime = 0;
    let totalViolations = 0;
    let completedSessions = 0;
    sessions.forEach(s => {
      totalFocusTime += s.duration_seconds;
      totalViolations += s.violations;
      if (s.status === 'completed') completedSessions++;
    });
    const avgViolations = sessions.length > 0 ? (totalViolations / sessions.length) : 0;

    // find peak focus hours
    const hours = [];
    sessions.forEach(s => hours.push(new Date(s.created_at).getHours()));
    pomodoros.forEach(p => hours.push(new Date(p.completed_at).getHours()));

    let peakPeriod = 'evening';
    if (hours.length > 0) {
      const distribution = { morning: 0, afternoon: 0, evening: 0, night: 0 };
      hours.forEach(h => {
        if (h >= 5 && h < 12) distribution.morning++;
        else if (h >= 12 && h < 17) distribution.afternoon++;
        else if (h >= 17 && h < 22) distribution.evening++;
        else distribution.night++;
      });

      const maxEntry = Object.entries(distribution).reduce((max, curr) => curr[1] > max[1] ? curr : max, ['evening', 0]);
      peakPeriod = maxEntry[0];
    }

    // calculate dynamic score
    let focusScore = 85;
    if (totalTasks > 0 || sessions.length > 0 || attendance.length > 0) {
      let score = 85;
      score -= pendingTasks * 2;
      score -= totalViolations * 3;
      score -= lowAttendanceSubjects.length * 8;
      score += pomodoros.length * 2.5;
      score += streak.streakCount * 2;
      
      focusScore = Math.min(100, Math.max(10, Math.round(score)));
    }

    const insights = [];

    // Rule 0: Daily Streak Insights
    if (streak.streakCount > 0) {
      if (streak.warningActive) {
        insights.push({
          category: 'streak',
          type: 'warning',
          title: 'Daily Study Streak in Danger! ⏳',
          message: `Your 🔥 ${streak.streakCount}-day study streak will reset at midnight. Launch a Pomodoro or study session now to keep it active!`
        });
      } else {
        insights.push({
          category: 'streak',
          type: 'success',
          title: 'Study Streak Active! 🔥',
          message: `Incredible work! You have maintained a 🔥 ${streak.streakCount}-day daily study streak. Stay consistent.`
        });
      }
    }

    // Rule 1: Peak productivity hours
    const peakMap = {
      morning: 'morning hours (5 AM - 12 PM). You are highly efficient early in the day.',
      afternoon: 'afternoon hours (12 PM - 5 PM). Focus on complex subjects right after lunch.',
      evening: 'evening hours (5 PM - 10 PM). Great time to review coursework and submit assignments.',
      night: 'night hours (10 PM - 5 AM). Watch out for sleep deprivation; night focus is high but recovery is key.'
    };
    insights.push({
      category: 'productivity',
      type: 'success',
      title: 'Peak Study Hours 🕰️',
      message: `You study best during ${peakMap[peakPeriod]}`
    });

    // Rule 2: Focus camera tab violations
    if (avgViolations > 2.5) {
      insights.push({
        category: 'focus',
        type: 'danger',
        title: 'Alert: High Tab Switching! ⚠️',
        message: `Your focus score took a hit because you've been switching tabs quite a bit (around ${avgViolations.toFixed(1)} times per session). Try keeping only your study materials open!`
      });
    } else if (sessions.length > 0 && avgViolations < 1.0) {
      insights.push({
        category: 'focus',
        type: 'success',
        title: 'Locked In! 🔒',
        message: 'Superb focus! You rarely switch tabs when the timer is running (less than once per session on average). Keep it up!'
      });
    }

    // Rule 3: Attendance Warnings
    if (lowAttendanceSubjects.length > 0) {
      lowAttendanceSubjects.forEach(sub => {
        insights.push({
          category: 'attendance',
          type: 'warning',
          title: `Attendance Warning: ${sub.name} ⚠️`,
          message: `Your attendance in ${sub.name} is currently ${sub.percent}%, which is below the 75% requirement. Time to attend the next few lectures before the HOD notices!`
        });
      });
    }

    // Rule 4: Task Progress
    if (pendingTasks > 3) {
      insights.push({
        category: 'tasks',
        type: 'warning',
        title: 'Pending Tasks Piling Up! 📚',
        message: `You've got ${pendingTasks} tasks waiting. Split them into smaller chunks and tackle them one by one using the Pomodoro timer!`
      });
    } else if (completedTasks > 0 && pendingTasks === 0) {
      insights.push({
        category: 'tasks',
        type: 'success',
        title: 'Zero Pending Tasks! 🎉',
        message: "Awesome! You've cleared every single task on your list. Take a well-deserved break!"
      });
    }

    // Rule 5: Pomodoro habit
    if (pomodoros.length > 4) {
      insights.push({
        category: 'habit',
        type: 'success',
        title: 'Pomodoro Champ! 🍅',
        message: `You've finished ${pomodoros.length} Pomodoros! Working in short bursts keeps you sharp and prevents you from burning out.`
      });
    }

    res.json({
      focusScore,
      insights,
      streak,
      metrics: {
        totalTasks,
        completedTasks,
        pendingTasks,
        taskCompletionRate: Math.round(taskCompletionRate * 100),
        avgAttendance: Math.round(avgAttendance * 100),
        totalFocusTimeMinutes: Math.round(totalFocusTime / 60),
        totalViolations,
        pomodoroCount: pomodoros.length,
        lowAttendanceCount: lowAttendanceSubjects.length
      }
    });
  } catch (err) {
    console.error('getAIInsights error:', err);
    res.status(500).json({ message: 'Error compiling productivity insights' });
  }
};

