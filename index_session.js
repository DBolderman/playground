import express from 'express';
import session from 'express-session';
import cookieParser from 'cookie-parser';
import FileStore from 'session-file-store';
import sessionChecker from './sessionChecker.js';

const app = express();
const fileStore = FileStore(session);

app.use(cookieParser());

app.use(session({
  store: new fileStore(),
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
    res.send(`Welcome to the page, ${req.session.username}! <br /><br /> <a href="/testpage">Visit the test page</a> | <a href="/logout">Logout</a>`);
  } else {
    res.send('Welcome, Please <a href="/login">login</a>.');
  }
  console.log(req.session)
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

app.get('/testpage', sessionChecker, (req, res) => {
  if (req.session.username) {
    const sessionCookie = req.cookies['connect.sid'];
    res.send(`
      Welcome to the test page, ${req.session.username}!
      <br /><br />
      <pre>
      sessionData: ${JSON.stringify(req.session)}
      </pre>
      <pre>
      sessionCookie: ${sessionCookie}
      </pre>
    `);
  } else {
    res.redirect('/logout');
  }
})

app.get('/logout', (req, res) => {
  req.session.destroy();
  res.redirect('/');
});

app.listen(3001, () => {
  console.log('Server is running on port 3001');
});
