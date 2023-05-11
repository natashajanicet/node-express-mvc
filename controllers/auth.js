const crypto = require('crypto');

const bycrypt = require('bcryptjs');
const nodemailer = require('nodemailer');
const { google } = require('googleapis');

const User = require('../models/user');
const { validationResult } = require('express-validator');

const CLIENT_ID = '<clientid>';
const CLIENT_SECRET = '<clientsecret>';
const REDIRECT_URI = 'https://developers.google.com/oauthplayground';
const REFRESH_TOKEN = '<refreshtoken>';

const oAuth2Client = new google.auth.OAuth2(
  CLIENT_ID,
  CLIENT_SECRET,
  REDIRECT_URI
);
oAuth2Client.setCredentials({ refresh_token: REFRESH_TOKEN });

async function sendEmail(recipient, subject, html) {
  const accessToken = await oAuth2Client.getAccessToken();
  const transporter = nodemailer.createTransport({
    service: 'Gmail',
    auth: {
      type: 'OAuth2',
      user: 'yourmail@gmail.com',
      clientId: CLIENT_ID,
      clientSecret: CLIENT_SECRET,
      refreshToken: REFRESH_TOKEN,
      accessToken: accessToken,
    },
  });

  const mailOptions = {
    from: 'yourmail@gmail.com',
    to: recipient,
    html: html,
    subject: subject,
  };

  return await transporter.sendMail(mailOptions);
}

function renderLoginWithValidation(
  res,
  errorMessage = '',
  inputValue = { email: '', password: '' },
  validationErrors = [],
  status = 200
) {
  res.status(status).render('auth/login', {
    path: '/login',
    pageTitle: 'Login',
    errorMessage: errorMessage,
    isAuthenticated: false,
    inputValue,
    validationErrors: validationErrors,
  });
}

exports.getLogin = (req, res, next) => {
  let message = req.flash('error');
  if (message.length) {
    message = message[0];
  } else {
    message = null;
  }
  renderLoginWithValidation(res, message);
};

exports.getSignup = (req, res, next) => {
  let message = req.flash('error');
  if (message.length) {
    message = message[0];
  } else {
    message = null;
  }
  res.render('auth/signup', {
    path: '/signup',
    pageTitle: 'Signup',
    isAuthenticated: false,
    errorMessage: message,
    inputValue: { email: '', password: '', confirmPassword: '' },
    validationErrors: [],
  });
};

exports.postSignup = (req, res, next) => {
  const email = req.body.email;
  const password = req.body.password;
  const confirmPassword = req.body.confirmPassword;
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    return res.status(422).render('auth/signup', {
      path: '/signup',
      pageTitle: 'Signup',
      isAuthenticated: false,
      errorMessage: errors.array()[0].msg,
      inputValue: { email, password, confirmPassword },
      validationErrors: errors.array(),
    });
  }

  bycrypt
    .hash(password, 12)
    .then((hashPassword) => {
      const user = new User({
        email: email,
        password: hashPassword,
        cart: { items: [] },
      });

      return user.save();
    })
    .then(() => {
      res.redirect('/login');
      return sendEmail(
        email,
        'Sigup Success',
        '<h1>You have successfully signed up!</h1>'
      ).catch((err) => console.log(err));
    })
    .catch((err) => console.log(err));
};

exports.postLogin = (req, res, next) => {
  const email = req.body.email;
  const password = req.body.password;

  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return renderLoginWithValidation(
      res,
      errors.array()[0].msg,
      { email, password },
      errors.array(),
      422
    );
  }

  User.findOne({ email: email }).then((user) => {
    if (!user) {
      return renderLoginWithValidation(
        res,
        'Invalid email or password',
        { email, password },
        [],
        422
      );
    }

    bycrypt
      .compare(password, user.password)
      .then((doMatch) => {
        if (doMatch) {
          req.session.isLoggedIn = true;
          req.session.user = user;
          // do not need to call but in case to make sure we redirect after session are set
          return req.session.save((err) => {
            console.log(err);
            res.redirect('/');
          });
        }
        renderLoginWithValidation(
          res,
          'Invalid email or password',
          { email, password },
          [],
          422
        );
      })
      .catch((err) => {
        console.log(err);
        res.redirect('/login');
      });
  });
};

exports.postLogout = (req, res, next) => {
  req.session.destroy(() => {
    res.redirect('/');
  });
};

exports.getReset = (req, res, next) => {
  let message = req.flash('error');
  if (message.length) {
    message = message[0];
  } else {
    message = null;
  }
  res.render('auth/reset', {
    path: '/reset',
    pageTitle: 'Reset Password',
    errorMessage: message,
  });
};

exports.postReset = (req, res, next) => {
  crypto.randomBytes(32, (err, buffer) => {
    if (err) {
      console.log(err);
      return redirect('/reset');
    }

    const token = buffer.toString('hex');
    User.findOne({ email: req.body.email })
      .then((user) => {
        if (!user) {
          req.flash('error', 'No account with that email found');
          return res.redirect('/reset');
        }

        user.resetToken = token;
        user.resetTokenExpiration = Date.now() + 3600000;
        return user.save();
      })
      .then((result) => {
        res.redirect('/');
        return sendEmail(
          req.body.email,
          'Password Reset',
          `<p>You requested new password</p>
        <p>Click this <a href="http://localhost:3000/reset/${token}">link</a> to set a new password</p>`
        );
      })
      .catch((err) => console.log(err));
  });
};

exports.getNewPassword = (req, res, next) => {
  const token = req.params.token;

  User.findOne({ resetToken: token, resetTokenExpiraton: { $gt: Date.now() } })
    .then((user) => {
      let message = req.flash('error');
      if (message.length) {
        message = message[0];
      } else {
        message = null;
      }
      res.render('auth/new-password', {
        path: '/new-password',
        pageTitle: 'New Password',
        errorMessage: message,
        userId: user._id.toString(),
        resetToken: token,
      });
    })
    .catch((err) => console.log(err));
};

exports.postNewPassword = (req, res, next) => {
  const userId = req.body.userId;
  const resetToken = req.body.resetToken;
  const newPassword = req.body.password;
  let resetUser;

  User.findOne({
    resetToken: resetToken,
    resetTokenExpiraton: { $gt: Date.now() },
    _id: userId,
  })
    .then((user) => {
      if (!user) {
      }

      resetUser = user;

      return bycrypt.hash(newPassword, 12);
    })
    .then((hashedPassword) => {
      resetUser.password = hashedPassword;
      resetUser.resetToken = undefined;
      resetUser.resetTokenExpiration = undefined;

      resetUser.save();
    })
    .then(() => {
      res.redirect('/login');
    })
    .catch((err) => console.log(err));
};
