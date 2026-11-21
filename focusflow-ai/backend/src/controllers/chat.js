const pool = require('../config/db');

exports.handleChat = async (req, res) => {
  const userId = req.user.id;
  const { message } = req.body;

  if (!message) {
    return res.status(400).json({ message: 'Input message is required' });
  }

  const query = message.toLowerCase().trim();

  try {
    // 1. Retrieve current student state from DB
    const [userRows] = await pool.query('SELECT name FROM users WHERE id = ?', [userId]);
    const name = userRows[0]?.name || 'Student';

    const [tasks] = await pool.query('SELECT * FROM tasks WHERE user_id = ?', [userId]);
    const [attendance] = await pool.query('SELECT * FROM attendance WHERE user_id = ?', [userId]);
    const [sessions] = await pool.query('SELECT * FROM sessions WHERE user_id = ?', [userId]);
    const [pomodoros] = await pool.query('SELECT * FROM pomodoros WHERE user_id = ?', [userId]);

    // Compute basic metrics
    const totalTasks = tasks.length;
    const completedTasks = tasks.filter(t => t.status === 'completed').length;
    const pendingTasks = totalTasks - completedTasks;

    let totalAttendancePercent = 0;
    let lowAttendanceCourses = [];
    attendance.forEach(a => {
      const total = a.present_count + a.absent_count;
      const rate = total > 0 ? (a.present_count / total) : 1.0;
      totalAttendancePercent += rate;
      if (rate < 0.75) {
        lowAttendanceCourses.push({ subject: a.subject, percentage: Math.round(rate * 100) });
      }
    });
    const avgAttendance = attendance.length > 0 ? Math.round((totalAttendancePercent / attendance.length) * 100) : 85;

    let totalFocusTime = 0;
    let totalViolations = 0;
    sessions.forEach(s => {
      totalFocusTime += s.duration_seconds;
      totalViolations += s.violations;
    });

    // Calculate dynamic focus score
    let score = 85;
    score -= pendingTasks * 2;
    score -= totalViolations * 3;
    score -= lowAttendanceCourses.length * 8;
    score += pomodoros.length * 2.5;
    const focusScore = Math.min(100, Math.max(10, Math.round(score)));

    // 2. Rules-based Response Compiler (NLP heuristics)
    let reply = '';

    // A. Greeting Queries
    if (query.match(/\b(hi|hello|hey|greetings|yo)\b/)) {
      reply = `Hey ${name}! 👋 I'm your study companion. Just scanned your database stats, and here is how you are doing:

- **Focus Score**: \`${focusScore}%\`
- **Pending Tasks**: \`${pendingTasks}\`
- **Avg Attendance**: \`${avgAttendance}%\`

Need anything? You can ask me stuff like:
- *"Am I safe in attendance?"*
- *"What should I work on next?"*
- *"How do I boost my score?"*`;
    }

    // B. Attendance Queries
    else if (query.includes('attendance') || query.includes('subject') || query.includes('course') || query.includes('class') || query.includes('absent') || query.includes('present')) {
      if (attendance.length === 0) {
        reply = `I don't see any subjects in your list yet! Head over to the **Attendance** tab to add the classes you are taking.`;
      } else {
        reply = `Your average attendance is at **${avgAttendance}%**. 

Here is the breakdown:
${attendance.map(a => {
  const total = a.present_count + a.absent_count;
  const pct = total > 0 ? Math.round((a.present_count / total) * 100) : 100;
  return `- **${a.subject}**: \`${pct}%\` (${a.present_count}/${total} classes)`;
}).join('\n')}

`;
        if (lowAttendanceCourses.length > 0) {
          reply += `\n⚠️ **Heads up**: You are falling below the **75%** mark in these courses:
${lowAttendanceCourses.map(c => `- **${c.subject}** (currently **${c.percentage}%**)`).join('\n')}
*Better attend the next few lectures to avoid any issues with HOD or exam registration.*`;
        } else {
          reply += `\nNice! You are safely above the 75% requirement in all your subjects. Keep it up!`;
        }
      }
    }

    // C. Task Checklist Queries
    else if (query.includes('task') || query.includes('todo') || query.includes('sprint') || query.includes('pending') || query.includes('backlog')) {
      const pendingList = tasks.filter(t => t.status === 'pending');
      if (totalTasks === 0) {
        reply = `Your task checklist is empty. Add your upcoming homeworks, lab records, or exam preps in the **Tasks** tab.`;
      } else if (pendingList.length === 0) {
        reply = `Awesome, ${name}! You've cleared all your tasks. No pending backlogs right now. Enjoy the break or plan what to study next!`;
      } else {
        reply = `You have **${pendingList.length} pending tasks** (out of ${totalTasks} total). You've finished **${Math.round((completedTasks/totalTasks)*100)}%** of your work so far.

Here is what you still need to do:
${pendingList.slice(0, 5).map((t) => `- [ ] **${t.title}** ${t.due_date ? `*(Due: ${new Date(t.due_date).toLocaleDateString()})*` : ''}`).join('\n')}

*I'd suggest picking one (maybe the one due soonest) and running a quick 25-minute Pomodoro to get it done!*`;
      }
    }

    // D. Focus / Violations Queries
    else if (query.includes('focus') || query.includes('violation') || query.includes('tab') || query.includes('score') || query.includes('proctor')) {
      reply = `Your current **Focus Flow Score** is **${focusScore}%**.

Here's the breakdown of your study session logs:
- **Total Sessions**: \`${sessions.length}\`
- **Total Focused Time**: \`${(totalFocusTime / 3600).toFixed(1)} hours\`
- **Tab-switching Violations**: \`${totalViolations} times\`
- **Pomodoros Completed**: \`${pomodoros.length}\`

`;
      if (totalViolations > 5) {
        reply += `⚠️ **Tip**: You've switched tabs a bit too much during proctored study sessions. Try opening your IDE/notes in full screen and closing extra browser tabs to keep your focus score high.`;
      } else {
        reply += `Great job! Your tab switching is really low, which shows you are staying locked in during your sessions.`;
      }
    }

    // E. Advice / Improvement Tips
    else if (query.includes('tips') || query.includes('improve') || query.includes('boost') || query.includes('help') || query.includes('how')) {
      reply = `Here is a quick checklist to improve your **Focus Score** and stay on track:

1. **Finish a Pending Task**: Completing tasks gives your score a big boost. Try checking off **"${tasks.filter(t => t.status === 'pending')[0]?.title || 'your backlog'}"** next.
2. **Minimize Tab Toggling**: Keep the proctor camera active and avoid opening other tabs while studying.
3. **Attend Lectures**: Go to class for subjects where your attendance is slipping below 75% (like DBMS).
4. **Log Pomodoro Sprints**: Running a few completed Pomodoros adds extra points to your consistency score.`;
    }

    // F. Generic Fallback Response
    else {
      reply = `I got you, ${name}, but I'm not sure how to answer that. 

Ask me about your stats:
- **Tasks**: *"What tasks do I have pending?"*
- **Attendance**: *"Show my attendance details"*
- **Score & Violations**: *"Why is my Focus Score low?"*
- **Advice**: *"Give me tips to improve"*`;
    }

    // Send formatted reply
    res.json({ reply });
  } catch (err) {
    console.error('Chat error:', err);
    res.status(500).json({ message: 'Error processing companion chat.' });
  }
};
