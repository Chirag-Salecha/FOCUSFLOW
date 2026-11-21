const express = require('express');
const router = express.Router();
const multer = require('multer');

const verifyToken = require('../middleware/verifyToken');

const auth = require('../controllers/auth');
const tasks = require('../controllers/tasks');
const attendance = require('../controllers/attendance');
const sessions = require('../controllers/sessions');
const insights = require('../controllers/insights');
const user = require('../controllers/user');
const chat = require('../controllers/chat');

const upload = multer({ limits: { fileSize: 10 * 1024 * 1024 } });

// 1. Auth routes (Public)
router.post('/auth/register', auth.register);
router.post('/auth/login', auth.login);

// 2. Tasks routes (Protected)
router.get('/tasks', verifyToken, tasks.getTasks);
router.post('/tasks', verifyToken, tasks.createTask);
router.put('/tasks/:id', verifyToken, tasks.updateTask);
router.delete('/tasks/:id', verifyToken, tasks.deleteTask);
router.post('/tasks/parse-file', verifyToken, upload.single('file'), tasks.parseFile);

// 3. Attendance routes (Protected)
router.get('/attendance', verifyToken, attendance.getAttendance);
router.post('/attendance', verifyToken, attendance.createSubject);
router.put('/attendance/:id', verifyToken, attendance.updateAttendance);
router.delete('/attendance/:id', verifyToken, attendance.deleteSubject);

// 4. Session & Pomodoro routes (Protected)
router.post('/sessions', verifyToken, sessions.createSession);
router.post('/pomodoros', verifyToken, sessions.createPomodoro);
router.get('/sessions/history', verifyToken, sessions.getSessionHistory);

// 5. AI Insights routes (Protected)
router.get('/insights', verifyToken, insights.getAIInsights);

// 6. Profile / User statistics routes (Protected)
router.get('/user/profile', verifyToken, user.getProfile);

// 7. AI Chat Companion (Protected)
router.post('/chat', verifyToken, chat.handleChat);

module.exports = router;

