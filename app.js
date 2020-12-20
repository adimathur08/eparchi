const express = require('express');
const cookieParser = require('cookie-parser');

const app = express();

const userRouter = require('./routes/userRoutes');
const invoiceRouter = require('./routes/invoiceRoutes');

app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: true, limit: '10kb' }));
app.use(cookieParser());

// app.use('/', (req, res) => {
//     console.log("Hello World!");
//     res.send('Hello!');
// });
app.use('/api/v1/users', (req, res, next) => {
  req.body['userType'] = 'buyer';
  next();
});

app.use('/api/v1/seller', (req, res, next) => {
  //console.log('Seller here');
  req.body['userType'] = 'seller';
  next();
});

app.use('/api/v1/users', userRouter);
app.use('/api/v1/seller', userRouter);
app.use('/api/v1/invoice', invoiceRouter);

module.exports = app;
