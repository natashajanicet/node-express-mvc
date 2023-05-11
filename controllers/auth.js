const User = require('../models/user');

exports.getLogin = (req, res, next) => {
    res.render('auth/login', {
        path: '/login',
        pageTitle: 'Login',
        isAuthenticated: req.session.isLoggedIn
    })
}

exports.postLogin = (req, res, next) => {
   User.findById('64211acd9a99214f22588580').then((user) => {
        if (user) {
            req.session.isLoggedIn = true;
            req.session.user = user;
            // do not need to call but in case to make sure we redirect after session are set
            req.session.save((err) => {
                console.log(err);
                res.redirect('/');
            })
        }
    })
    .catch((err) => console.log(err));
}

exports.postLogout = (req, res, next) => {
    req.session.destroy(() => {
        res.redirect('/');
    });
}