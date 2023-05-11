const bycrypt = require('bcryptjs');
const nodemailer = require('nodemailer');
const { google } = require('googleapis');

const User = require('../models/user');

const CLIENT_ID =
  '669484067505-akmicmkinb7tkjsni4mp6bkl87ft9c0f.apps.googleusercontent.com';
const CLIENT_SECRET = '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';
const REDIRECT_URI = 'https://developers.google.com/oauthplayground';
const REFRESH_TOKEN =
  '1//04N2ZBG3AIe7tCgYIARAAGAQSNwF-L9IriicEwKnw9CZwrIxQPAkzjTenTLb4x5KvfD2jUssmZR9KmZrkj8SfDQ09IsJ8iCmng-c';

const oAuth2Client = new google.auth.OAuth2(
  CLIENT_ID,
  CLIENT_SECRET,
  REDIRECT_URI
);
oAuth2Client.setCredentials({ refresh_token: REFRESH_TOKEN });

async function sendEmail(recipient, subject, html) {
  const accessToken = await oAuth2Client.getAccessToken();
  const transporter = nodemailer.createTransport(
    {
      service: 'Gmail',
      auth: {
        type: 'OAuth2',
        user: 'natashajlearn@gmail.com',
        clientId: CLIENT_ID,
        clientSecret: CLIENT_SECRET,
        refreshToken: REFRESH_TOKEN,
        accessToken: accessToken
      }
    }
  );

  const mailOptions = {
    from: 'natashajlearn@gmail.com',
    to: recipient,
    html: html,
    subject: subject
  }

  return (await transporter.sendMail(mailOptions));
}


exports.getLogin = (req, res, next) => {
  let message = req.flash('error');
  if (message.length) {
    message = message[0];
  } else {
    message = null;
  }
  res.render('auth/login', {
    path: '/login',
    pageTitle: 'Login',
    errorMessage: message,
  });
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
  });
};

exports.postSignup = (req, res, next) => {
  const email = req.body.email;
  const password = req.body.password;
  const confirmPassword = req.body.confirmPassword;
  User.findOne({ email: email })
    .then((userDoc) => {
      if (userDoc) {
        req.flash('error', 'Email exist already, please pick a different one');
        return res.redirect('/signup');
      }

      return bycrypt.hash(password, 12).then((hashPassword) => {
        const user = new User({
          email: email,
          password: hashPassword,
          cart: { items: [] },
        });

        return user.save();
      });
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

  User.findOne({ email: email }).then((user) => {
    if (!user) {
      req.flash('error', 'Invalid email or password');
      return res.redirect('/login');
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
        res.redirect('/login');
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
