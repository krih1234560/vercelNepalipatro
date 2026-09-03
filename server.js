const express = require('express');
const path = require('path');

const pagesRouter = require('./routes/pages');
const apiRouter = require('./routes/api');

const app = express();

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

app.use(express.static(path.join(__dirname, 'public')));
app.use(express.json());

app.use('/api', apiRouter);
app.use('/', pagesRouter);

app.use((req, res) => {
  res.status(404).send('Page not found');
});

module.exports = app;
