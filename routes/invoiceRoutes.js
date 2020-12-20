const express = require('express');
const invoiceController = require('./../controllers/invoiceController');
const authController = require('../controllers/authController');

const router = express.Router();

router
  .route('/seller')
  .get(
    authController.setCurrentUserRole('seller'),
    authController.protect,
    invoiceController.getAllInvoices
  )
  .post(
    authController.setCurrentUserRole('seller'),
    authController.protect,
    invoiceController.setSellerAndBuyerId,
    invoiceController.createInvoice
  );

router
  .route('/buyer')
  .get(
    authController.setCurrentUserRole('buyer'),
    authController.protect,
    invoiceController.getAllInvoices
  );

module.exports = router;
