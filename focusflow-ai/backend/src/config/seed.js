const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });

const host = process.env.DB_HOST || '127.0.0.1';
const user = process.env.DB_USER || 'root';
const password = process.env.DB_PASSWORD !== undefined ? process.env.DB_PASSWORD : '';
const database = process.env.DB_NAME || 'focusflow_ai';

async function seed() {
  console.log('Connecting to MySQL at ' + host + '...');
  let connection;
  try {
    // Connect without database first to ensure it exists
    connection = await mysql.createConnection({ host, user, password });
    
    // Create DB
    await connection.query(`CREATE DATABASE IF NOT EXISTS \`${database}\`;`);
    console.log(`Database '${database}' verified/created.`);
    await connection.changeUser({ database });

    // Create Tables if not exist
    console.log('Creating tables...');
    
    await connection.query(`
      CREATE TABLE IF NOT EXISTS users (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        email VARCHAR(100) NOT NULL UNIQUE,
        password VARCHAR(255) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      ) ENGINE=InnoDB;
    `);

    await connection.query(`
      CREATE TABLE IF NOT EXISTS tasks (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        title VARCHAR(255) NOT NULL,
        description TEXT,
        status ENUM('pending', 'completed') DEFAULT 'pending',
        due_date DATE,
        completed_at TIMESTAMP NULL DEFAULT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      ) ENGINE=InnoDB;
    `);

    await connection.query(`
      CREATE TABLE IF NOT EXISTS attendance (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        subject VARCHAR(100) NOT NULL,
        present_count INT DEFAULT 0,
        absent_count INT DEFAULT 0,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        UNIQUE KEY unique_user_subject (user_id, subject)
      ) ENGINE=InnoDB;
    `);

    await connection.query(`
      CREATE TABLE IF NOT EXISTS sessions (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        name VARCHAR(150) NOT NULL,
        duration_seconds INT NOT NULL,
        violations INT DEFAULT 0,
        status ENUM('completed', 'interrupted') DEFAULT 'completed',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      ) ENGINE=InnoDB;
    `);

    await connection.query(`
      CREATE TABLE IF NOT EXISTS pomodoros (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        duration_minutes INT NOT NULL,
        completed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      ) ENGINE=InnoDB;
    `);

    console.log('Tables verified/created successfully.');

    // Seed test user
    const testEmail = 'student@focusflow.ai';
    const [users] = await connection.query('SELECT * FROM users WHERE email = ?', [testEmail]);
    
    let userId;
    if (users.length === 0) {
      console.log('Seeding test user...');
      const hashedPassword = await bcrypt.hash('password123', 10);
      const [result] = await connection.query(
        'INSERT INTO users (name, email, password) VALUES (?, ?, ?)',
        ['Rohan Sharma', testEmail, hashedPassword]
      );
      userId = result.insertId;
      console.log(`Test user created with ID: ${userId}`);
    } else {
      userId = users[0].id;
      console.log(`Test user already exists with ID: ${userId}`);
      // Force overwrite name from Alex Mercer to Rohan Sharma
      await connection.query('UPDATE users SET name = ? WHERE id = ?', ['Rohan Sharma', userId]);
    }

    // Clean existing user data to start fresh for test user
    console.log('Cleaning existing user data for seeding...');
    await connection.query('DELETE FROM tasks WHERE user_id = ?', [userId]);
    await connection.query('DELETE FROM attendance WHERE user_id = ?', [userId]);
    await connection.query('DELETE FROM sessions WHERE user_id = ?', [userId]);
    await connection.query('DELETE FROM pomodoros WHERE user_id = ?', [userId]);

    // Seed Tasks
    console.log('Seeding tasks...');
    const tasks = [
      ['DBMS Lab assignment 4', 'Write SQL queries for join operations and submit PDF.', 'completed', '2026-05-24', '2026-05-24 16:30:00'],
      ['Revise CPU scheduling for OS exam', 'Revise Round Robin, SRTF, and Priority Scheduling algorithms.', 'completed', '2026-05-25', '2026-05-25 11:20:00'],
      ['CN presentation prep - TCP handshake', 'Create slides on TCP 3-way handshake and congestion control.', 'pending', '2026-05-30', null],
      ['SE Chapter 8 notes write-up', 'Focus on design principles and microservice architectures.', 'pending', '2026-05-31', null],
      ['Math tutorial sheets 3 and 4', 'Solve probability exercises in textbook.', 'completed', '2026-05-26', '2026-05-26 19:15:00'],
      ['Assemble FocusFlow AI code for project submission', 'Integrate frontend and backend with database validation.', 'pending', '2026-06-02', null]
    ];
    for (const t of tasks) {
      await connection.query(
        'INSERT INTO tasks (user_id, title, description, status, due_date, completed_at) VALUES (?, ?, ?, ?, ?, ?)',
        [userId, t[0], t[1], t[2], t[3], t[4]]
      );
    }

    // Seed Attendance
    console.log('Seeding attendance...');
    const attendance = [
      ['Database Management Systems', 10, 4], // 10/14 = 71% (Low attendance warning!)
      ['Operating Systems', 12, 1],          // 12/13 = 92%
      ['Computer Networks', 14, 2],          // 14/16 = 87.5%
      ['Software Engineering', 9, 3],        // 9/12 = 75%
      ['Engineering Mathematics', 15, 0]     // 15/15 = 100%
    ];
    for (const a of attendance) {
      await connection.query(
        'INSERT INTO attendance (user_id, subject, present_count, absent_count) VALUES (?, ?, ?, ?)',
        [userId, a[0], a[1], a[2]]
      );
    }

    // Seed Focus Sessions (over last 7 days)
    console.log('Seeding focus sessions...');
    const sessions = [
      ['DBMS Lab Work', 1800, 0, 'completed', '2026-05-21 14:00:00'],
      ['OS Revision Block', 2700, 1, 'completed', '2026-05-22 09:30:00'],
      ['CN Slide Designing', 3600, 4, 'completed', '2026-05-23 18:00:00'], // More violations
      ['Algebra Practice', 2400, 0, 'completed', '2026-05-24 15:00:00'],
      ['Vite React Integration', 4500, 6, 'interrupted', '2026-05-25 21:00:00'], // High violations, interrupted
      ['Late Night Coding', 3000, 1, 'completed', '2026-05-26 23:30:00']
    ];
    for (const s of sessions) {
      await connection.query(
        'INSERT INTO sessions (user_id, name, duration_seconds, violations, status, created_at) VALUES (?, ?, ?, ?, ?, ?)',
        [userId, s[0], s[1], s[2], s[3], s[4]]
      );
    }

    // Seed Pomodoros
    console.log('Seeding Pomodoros...');
    const pomodoros = [
      [25, '2026-05-22 10:30:00'],
      [25, '2026-05-22 11:00:00'],
      [50, '2026-05-23 19:15:00'],
      [25, '2026-05-24 15:45:00'],
      [25, '2026-05-26 14:00:00'],
      [25, '2026-05-26 14:30:00']
    ];
    for (const p of pomodoros) {
      await connection.query(
        'INSERT INTO pomodoros (user_id, duration_minutes, completed_at) VALUES (?, ?, ?)',
        [userId, p[0], p[1]]
      );
    }

    console.log('Seeding completed successfully!');
  } catch (err) {
    console.error('Error during seeding:', err);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

seed();
