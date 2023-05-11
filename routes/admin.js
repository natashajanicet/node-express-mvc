const path = require('path');

const express = require('express');
const { body } = require('express-validator');

const adminController = require('../controllers/admin');
const isAuth = require('../middleware/is-auth');

const router = express.Router();

// GET /admin/add-product
router.get('/add-product', isAuth, adminController.getAddProductPage);

// POST /admin/add-product
router.post(
  '/add-product',
  isAuth,
  [
    body('title').trim().isString().isLength({ min: 3 }),
    body('price').isFloat(),
    body('description').trim().isLength({ min: 5, max: 400 }),
  ],
  adminController.postAddProduct
);

router.get('/products', isAuth, adminController.getProducts);

router.get('/edit-product/:productId', isAuth, adminController.getEditProduct);

router.post(
  '/edit-product',
  isAuth,
  [
    body('title').trim().isString().isLength({ min: 3 }),
    body('imageUrl').trim().isURL(),
    body('price').isFloat(),
    body('description').trim().isLength({ min: 5, max: 400 }),
  ],
  adminController.postEditProduct
);

router.delete('/product/:productId', isAuth, adminController.deleteProduct);

module.exports = router;
