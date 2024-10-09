import express from 'express';
import session from 'express-session';
import cookieParser from 'cookie-parser';
import Redis from 'iovalkey';
import RedisStore from 'connect-redis';
import sessionChecker from './sessionChecker.js';

const app = express();

const redisClient = new Redis();

redisClient.on('error', (err) => {
  console.error('Redis error:', err);
});

const redisStore = new RedisStore({
  client: redisClient
});

app.use(cookieParser());

app.use(session({
  store: redisStore,
  secret: 'your-secret-key', // Replace with a strong secret key
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: false, // Set to true if using HTTPS
    httpOnly: true,
    maxAge: 1000 * 60 // 1 minute
  }
}));

app.use(express.urlencoded({ extended: true }));

// Routes
app.get('/', sessionChecker, (req, res) => {
  if (req.session.username) {
    res.send(`Welcome to the page, ${req.session.username}! <br /><br /> <a href="/check-session">Check session data</a> | <a href="/logout">Logout</a>`);
  } else {
    res.send('Welcome, Please <a href="/login">login</a>.');
  }
});

app.get('/login', (req, res) => {
  if (req.session.username) {
    res.redirect('/');
  } else {
    res.send(`
<form method="post" action="/login">
  <input type="text" name="username" placeholder="Username" required />
  <input type="password" name="password" placeholder="Password" required />
  <button type="submit">Login</button>
</form>
    `);
  }
});

// validate your username and password here
app.post('/login', (req, res) => {
  const { username, password } = req.body;
  req.session.username = username;
  req.password = password;
  res.redirect('/');
});

app.get('/check-session', sessionChecker, (req, res) => {
  const sessionId = req.cookies['connect.sid'];

  if (!sessionId) {
    return res.status(400).send('No session ID found in cookies');
  }

  // Remove the "s:" prefix and the ".<signature>" suffix from the session ID
  const cleanedSessionId = sessionId.split('.')[0].substring(2);

  redisClient.get(`sess:${cleanedSessionId}`, (err, sessionData) => {
    if (err) {
      console.log('Error checking session:', err);
      return res.status(500).send('Error checking session');
    }

    if (sessionData) {
      res.send(`Session with id ${cleanedSessionId} exists: <pre>${sessionData}</pre>`);
    } else {
      res.send('Session does not exist');
    }
  });
});

app.get('/logout', (req, res) => {
  const sessionId = req.cookies['connect.sid'];

  if (!sessionId) {
    return res.status(400).send('No session ID found in cookies');
  }

  // Remove the "s:" prefix and the ".<signature>" suffix from the session ID
  const cleanedSessionId = sessionId.split('.')[0].substring(2);

  req.session.destroy((err) => {
    if (err) {
      console.log('Error destroying session:', err);
      return res.status(500).send('Error destroying session');
    }

    // Destroy the session in the Redis store
    redisClient.del(`sess:${cleanedSessionId}`, (err) => {
      if (err) {
        console.log('Error deleting session from Redis:', err);
        return res.status(500).send('Error deleting session from Redis');
      }

      console.log(`Session sess:${cleanedSessionId} succesfully destroyed`);

      res.clearCookie('connect.sid');
      res.redirect('/');
    });
  });
});

app.listen(3001, () => {
  console.log('Server is running on port 3001');
});
