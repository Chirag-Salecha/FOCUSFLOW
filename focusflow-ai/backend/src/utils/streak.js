// calculates daily study streaks from focus sessions & pomodoro tables
function calculateStreak(sessions, pomodoros) {
  // collect all unique dates
  const datesSet = new Set();

  sessions.forEach(s => {
    const d = new Date(s.created_at);
    datesSet.add(d.toDateString());
  });

  pomodoros.forEach(p => {
    const d = new Date(p.completed_at);
    datesSet.add(d.toDateString());
  });

  // sort dates descending (latest first)
  const sortedDates = Array.from(datesSet)
    .map(dStr => new Date(dStr))
    .sort((a, b) => b - a);

  if (sortedDates.length === 0) {
    return { streakCount: 0, studiedToday: false, warningActive: false };
  }

  const today = new Date();
  const todayStr = today.toDateString();
  
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayStr = yesterday.toDateString();

  const mostRecentStr = sortedDates[0].toDateString();

  const studiedToday = mostRecentStr === todayStr;
  const studiedYesterday = mostRecentStr === yesterdayStr;

  // if didn't study yesterday or today, streak is 0
  if (!studiedToday && !studiedYesterday) {
    return { streakCount: 0, studiedToday: false, warningActive: false };
  }

  // count consecutive days backwards
  let streakCount = 1;
  let currentRefDate = sortedDates[0];

  for (let i = 1; i < sortedDates.length; i++) {
    const prevDate = sortedDates[i];
    const diffTime = Math.abs(currentRefDate - prevDate);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 1) {
      streakCount++;
      currentRefDate = prevDate;
    } else if (diffDays === 0) {
      continue;
    } else {
      break;
    }
  }

  // warn if streak is in danger of breaking tonight
  const warningActive = studiedYesterday && !studiedToday;

  return {
    streakCount,
    studiedToday,
    warningActive
  };
}

module.exports = calculateStreak;

