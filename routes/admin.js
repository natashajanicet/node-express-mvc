const path = require('path');

const express = require('express');
const rootDir = require('../util/path');

const router = express.Router();

// sequence matter
// GET /admin/add-product
router.get('/add-product', (req, res, next) => {
    // res.send('<form action="/admin/add-product" method="POST"><input type="text" name="title"><button type="submit">Add Product</button></form>'); // auto set header Content-Type: text/html
    res.sendFile(path.join(rootDir, 'views', 'add-product.html'))
});

// POST method
// POST /admin/add-product
router.post('/add-product', (req, res, next) => {
    console.log(req.body);
    res.redirect('/');
});

module.exports = router;