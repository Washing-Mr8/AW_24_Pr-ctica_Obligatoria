var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
const { checkBannedIP } = require('./middleware/banned');

const db = require('./database');

const app = express();
const port = 3000;

//sesiones
const session = require('express-session');
const MySQLStore = require('express-mysql-session')(session);

const sessionStore = new MySQLStore({  
  createDatabaseTable: true
},db);

// console.log('Conexión a la base de datos:', pool);

app.use(session({
  key:'demo_session',
  saveUninitialized: false,
  secret: "1234",
  resave: false,
  store: sessionStore
}));

var indexRouter = require('./routes/index');
var usersRouter = require('./routes/users');
var eventsRouter = require('./routes/events');

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));
app.use(checkBannedIP);


app.use('/', indexRouter);
app.use('/user', usersRouter);
app.use('/viewEvents', eventsRouter);


// catch 404 and forward to error handler
app.use(function (req, res, next) {
  next(createError(404));
});

// error handler
app.use(function (err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

app.listen(port, () => {
  console.log('El servidor se ha iniciado correctamente en el puerto :' + port);
});

module.exports = app;
