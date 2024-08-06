const express = require("express");
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');
const path = require('path');
const authController = require('./controllers/authcontroller');
const { authenticateJWT, authorizeRoles } = require('./middleware/authMiddleware');
const Article = require('./models/Article');

const app = express();

app.use(bodyParser.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(express.static('public'));
app.set('view engine', 'ejs');

mongoose.connect('mongodb://localhost:27017/blogDB');

const db = mongoose.connection;
db.on('error', console.error.bind(console, 'connection error:'));
db.once('open', () => {
  console.log('Connected to MongoDB');
});

app.get('/', authenticateJWT, async (req, res) => {
  const articles = await Article.find({});
  res.render('articleList', { articles });
});

app.get('/my-articles', authenticateJWT, async (req, res) => {
  const articles = await Article.find({ author: req.user._id });
  res.render('myArticles', { articles });
});

app.get('/article/new', authenticateJWT, authorizeRoles('admin'), (req, res) => {
  res.render('articleForm');
});

app.post('/article/new', authenticateJWT, authorizeRoles('admin'), async (req, res) => {
  const { title, content } = req.body;

  const newArticle = new Article({
    title,
    content,
    author: req.user._id // Assuming req.user._id is available
  });

  try {
    await newArticle.save();
    res.redirect('/'); // Redirect to the article list or any other page
  } catch (err) {
    console.error(err);
    res.status(500).send('Error saving article');
  }
});

app.get('/register', (req, res) => {
  res.render('register');
});

app.post('/register', authController.registerUser);

app.get('/login', (req, res) => {
  res.render('login');
});

app.post('/login', authController.loginUser);

app.get('/logout', authController.logoutUser);

app.listen(3336, (err) => {
    if (err) {
        console.log(err);
    } else {
        console.log("Server connected on http://localhost:3336");
    }
});
