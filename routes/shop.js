const path = require('path');

const rootDir = require('../util/path');
const express = require('express');

const router = express.Router();
const adminData = require('./admin');

// GET making sure of exact path (not match)
router.get('/', (req, res, next) => {
    const products = adminData.products;
    // using templating engine
    res.render('shop', { 
        prods: products, 
        pageTitle: 'Shop', 
        path: '/',

        // needed by handlebars
        hasProducts: !!products.length,
        activeShop: true,
        productCSS: true, 
    });
});

module.exports = router;