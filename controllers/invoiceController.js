const Invoice = require('./../models/invoiceModel');
const User = require('./../models/userModel');
const factory = require('./handlerFactory');
const catchAsync = require('./../utils/catchAsync');

exports.setSellerAndBuyerId = catchAsync(async (req, res, next) => {
  req.body['seller'] = req.user._id;
  const buyer = await User.find({ mobileno: req.body.mobileno });
  req.body['buyer'] = buyer[0]._id;
  next();
});

exports.getAllInvoices = catchAsync(async (req, res, next) => {
  const userType = req.body['userType'];
  const invoices = await Invoice.find({ [userType]: req.user._id });

  res.status(200).json({
    status: 'success',
    results: invoices.length,
    data: {
      data: invoices,
    },
  });
});

exports.createInvoice = factory.createOne(Invoice);
