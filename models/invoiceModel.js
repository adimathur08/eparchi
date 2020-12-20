const mongoose = require('mongoose');
const validator = require('validator');

const invoiceSchema = new mongoose.Schema(
  {
    createdAt: {
      type: Date,
      default: Date.now,
    },
    seller: {
      type: mongoose.Schema.ObjectId,
      ref: 'Seller',
    },
    buyer: {
      type: mongoose.Schema.ObjectId,
      ref: 'Buyer',
    },
    products: [
      {
        type: {
          type: String,
        },
        productId: String,
        productName: String,
        productDescription: String,
        productMRP: Number,
        producteDiscount: {
          type: Number,
          validate: {
            validator: function (val) {
              // this only points to current doc on NEW document creation
              return val < this.productMRP;
            },
            message: 'Discount price ({VALUE}) should be below regular price',
          },
        },
        quantity: Number,
      },
    ],
    paymentStatus: {
      type: String,
      enum: {
        values: ['paid', 'unpaid'],
        message: 'Payment status is either: paid or unpaid',
      },
    },
  },
  {
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

invoiceSchema.pre('save', async function (req, res, next) {
  //this.seller = req.user._id;
  //this.buyer =
  next();
});

const Invoice = mongoose.model('Invoice', invoiceSchema);

module.exports = Invoice;
