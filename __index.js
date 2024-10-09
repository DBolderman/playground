const express = require('express');
const session = require('express-session');
const cookieParser = require('cookie-parser');

const app = express();
const port = 3001;

// Enable cookie parsing
app.use(cookieParser());

// Set up session middleware
app.use(session({
  secret: '38sisjsk92',
  resave: false,
  saveUninitialized: true,
  cookie: {
    maxAge: 1000 * 60 * 60, // 1 hour
    httpOnly: true,
    secure: true, // Sent only over HTTPS if true
  },
}));

// URL-encoded middleware
app.use(express.urlencoded({ extended: true }));

app.listen(port, () => {
  console.log(`Server listening on port ${port}`);
});


// Routes
app.get('/', (req, res) => {
  if (req.session.username) {
    res.send(`Welcome to the page, ${req.session.username}! <a href="/logout">Logout</a>`);
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

app.get('/logout', (req, res) => {
  req.session.destroy();
  res.redirect('/');
});
