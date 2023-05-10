const path = require('path');
const express = require('express');
const expressHbs = require('express-handlebars');

const adminData = require('./routes/admin');
const shopRoutes = require('./routes/shop');

const app = express();

// app.engine('hbs', expressHbs.engine({
//     defaultLayout: 'main-layout',
//     layoutsDir: 'views/layouts/',
//     extname: 'hbs'
// }));

// Set global data in express (app.set)
app.set('view engine', 'ejs');
// app.set('view engine', 'hbs')
// app.set('view engine', 'pug');
// Tell where dynamic content is
app.set('views', 'views');

app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

app.use('/admin', adminData.routes);
app.use(shopRoutes);

app.use((req, res, next) => {
    res.status(404).render('404', {
        pageTitle: 'Page not Found',

        // Needed for ejs
        path: null
    });
});

app.listen(3000);