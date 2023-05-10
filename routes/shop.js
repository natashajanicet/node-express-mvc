const path = require('path');

const rootDir = require('../util/path');
const express = require('express');

const router = express.Router();

// GET making sure of exact path (not match)
router.get('/', (req, res, next) => {
    // console.log('In another middleware');
    // res.send('<h1>Hello from express</h1>'); // auto set header Content-Type: text/html
    res.sendFile(path.join(rootDir, 'views', 'shop.html'));
});

module.exports = router;