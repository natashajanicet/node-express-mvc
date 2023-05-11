const path = require('path');
const fs = require('fs');
const https = require('https');

const express = require('express');
const mongoose = require('mongoose');
const session = require('express-session');
const MongoDBStore = require('connect-mongodb-session')(session);
const csrf = require('csurf');
const flash = require('connect-flash');
const multer = require('multer');
const helmet = require('helmet');
const compression = require('compression');

const adminRoutes = require('./routes/admin');
const shopRoutes = require('./routes/shop');
const authRoutes = require('./routes/auth');
const errorController = require('./controllers/error');
const User = require('./models/user');
const { mongoPort, mongoConnStr, mongoSessionStore } = require('./config');
const morgan = require('morgan');

const app = express();
const store = new MongoDBStore({
  uri: mongoSessionStore,
  collection: 'session',
});
const csrfProtection = csrf();

const privateKey = fs.readFileSync('server.key');
const certificate = fs.readFileSync('server.cert');

const fileStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'images');
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + '-' + file.originalname);
  },
});

const fileFilter = (req, file, cb) => {
  if (
    file.mimetype === 'image/png' ||
    file.mimetype === 'image/jpg' ||
    file.mimetype === 'image/jpeg'
  ) {
    cb(null, true);
  } else {
    cb(null, false);
  }
};

app.set('view engine', 'ejs');
app.set('views', 'views');

const accessLogStream = fs.createWriteStream(
  path.join(__dirname, 'access.log'),
  { flags: 'a' }
);

app.use(
  helmet.contentSecurityPolicy({
    directives: {
      'default-src': ["'self'"],
      'script-src': ["'self'", "'unsafe-inline'", 'js.stripe.com'],
      'style-src': ["'self'", "'unsafe-inline'", 'fonts.googleapis.com'],
      'frame-src': ["'self'", 'js.stripe.com'],
      'font-src': ["'self'", 'fonts.googleapis.com', 'fonts.gstatic.com'],
    },
  })
);
// to compress assets on the fly
app.use(compression());
// for logging
app.use(morgan('combined', { stream: accessLogStream }));

app.use(express.urlencoded({ extended: true }));
app.use(
  multer({ storage: fileStorage, fileFilter: fileFilter }).single('image')
);
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));
app.use('/images', express.static(path.join(__dirname, 'images')));
app.use(
  session({
    secret: 'secretkey',
    resave: false,
    saveUninitialized: false,
    store: store,
  })
);
app.use(csrfProtection);
app.use(flash());

app.use((req, res, next) => {
  // To include this params in every render method
  res.locals.isAuthenticated = req.session.isLoggedIn;
  res.locals.csrfToken = req.csrfToken();
  next();
});

app.use((req, res, next) => {
  if (!req.session.user) {
    return next();
  }

  User.findById(req.session.user._id)
    .then((user) => {
      if (!user) {
        return next();
      }
      req.user = user;
      next();
    })
    .catch((err) => {
      const error = new Error(err);
      error.httpStatus = 500;
      return next(error);
    });
});

app.use('/admin', adminRoutes);
app.use(shopRoutes);
app.use(authRoutes);

app.get('/500', errorController.get500Page);
app.use(errorController.get404Page);

app.use((error, req, res, next) => {
  console.log(error);
  return res.redirect('/500');
});

mongoose
  .connect(mongoConnStr)
  .then((result) => {
    // for manually using ssl
    // https
    //   .createServer({ key: privateKey, cert: certificate }, app)
    //   .listen(mongoPort || 3000);
    app.listen(mongoPort || 3000);
  })
  .catch((err) => {
    console.log(err);
  });
