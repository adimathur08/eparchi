const User = require('./../models/userModel');
const Seller = require('./../models/sellerModel');
const jwt = require('jsonwebtoken');
const catchAsync = require('./../utils/catchAsync');
const AppError = require('../utils/appError');
const { promisify } = require('util');

exports.setCurrentUserRole = (role) => {
  return (req, res, next) => {
    req.body['userType'] = role;
    next();
  };
};

const signToken = (req, id) => {
  const secret =
    req.body.userType === 'buyer'
      ? process.env.JWT_SECRET_BUYER
      : process.env.JWT_SECRET_SELLER;

  //const secret = process.env.JWT_SECRET;

  return jwt.sign({ id }, secret, {
    expiresIn: process.env.JWT_EXPIRES_IN,
  });
};

const createSendToken = (req, user, statusCode, res) => {
  const token = signToken(req, user._id);
  const cookieOptions = {
    expires: new Date(
      Date.now() + process.env.JWT_COOKIE_EXPIRES_IN * 24 * 60 * 60 * 1000
    ),
    httpOnly: true,
  };
  if (process.env.NODE_ENV === 'production') cookieOptions.secure = true;

  res.cookie('jwt', token, cookieOptions);

  // Remove password from output
  user.password = undefined;

  res.status(statusCode).json({
    status: 'success',
    token,
    data: {
      user,
    },
  });
};

const createNewSeller = async (req) => {
  const newUser = await Seller.create({
    shopName: req.body.shopName,
    sellerName: req.body.sellerName,
    mobileno: req.body.mobileno,
    email: req.body.email,
    typeOfItemsSold: req.body.typeOfItemsSold,
    typeOfShop: req.body.typeOfShop,
    gstin: req.body.gstin,
    city: req.body.city,
    street: req.body.street,
    landmark: req.body.landmark,
    Franchise: req.body.Franchise,
    brandName: req.body.brandName,
    password: req.body.password,
    passwordConfirm: req.body.passwordConfirm,
  });
  return newUser;
};

const createNewBuyer = async (req) => {
  const newUser = await User.create({
    name: req.body.name,
    mobileno: req.body.mobileno,
    email: req.body.email,
    password: req.body.password,
    passwordConfirm: req.body.passwordConfirm,
  });
  return newUser;
};

exports.signup = async (req, res, next) => {
  console.log(req.body.userType);

  let newUser;
  if (req.body.userType === 'buyer') {
    newUser = await createNewBuyer(req);
  }
  if (req.body.userType === 'seller') {
    newUser = await createNewSeller(req);
  }
  // const url = `${req.protocol}://${req.get('host')}/me`;
  // console.log(url);
  // await new Email(newUser, url).sendWelcome();

  // createSendToken(newUser, 201, res);

  // console.log(req.body.name);
  // console.log(req.body.email);

  createSendToken(req, newUser, 201, res);
};

exports.login = async (req, res, next) => {
  const { email, password } = req.body;

  // 1) Check if email and password exist
  if (!email || !password) {
    //return next(new AppError('Please provide email and password!', 400));
    res.send('Please provide email and password!');
  }
  // 2) Check if user exists && password is correct

  let user;
  if (req.body.userType === 'buyer') {
    user = await User.findOne({ email }).select('+password');
  }
  if (req.body.userType === 'seller') {
    user = await Seller.findOne({ email }).select('+password');
  }

  if (!user || !(await user.correctPassword(password, user.password))) {
    //return next(new AppError('Incorrect email or password', 401));
    res.send('Incorrect email or password');
  }

  // 3) If everything ok, send token to client
  createSendToken(req, user, 200, res);
};

exports.logout = (req, res) => {
  res.cookie('jwt', 'loggedout', {
    expires: new Date(Date.now() + 10 * 1000),
    httpOnly: true,
  });
  res.status(200).json({ status: 'success' });
};

// Only for rendered pages, no errors!
exports.isLoggedIn = async (req, res, next) => {
  if (req.cookies.jwt) {
    try {
      // 1) verify token
      const decoded = await promisify(jwt.verify)(
        req.cookies.jwt,
        process.env.JWT_SECRET
      );

      // 2) Check if user still exists
      const currentUser = await User.findById(decoded.id);
      if (!currentUser) {
        return next();
      }

      // 3) Check if user changed password after the token was issued
      if (currentUser.changedPasswordAfter(decoded.iat)) {
        return next();
      }

      // THERE IS A LOGGED IN USER
      res.locals.user = currentUser;
      return next();
    } catch (err) {
      return next();
    }
  }
  next();
};

exports.protect = catchAsync(async (req, res, next) => {
  // 1) Getting token and check of it's there
  let token;
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    token = req.headers.authorization.split(' ')[1];
  } else if (req.cookies.jwt) {
    token = req.cookies.jwt;
  }

  if (!token) {
    return next(
      new AppError('You are not logged in! Please log in to get access.', 401)
    );
  }

  // 2) Verification token
  const secret =
    req.body.userType === 'buyer'
      ? process.env.JWT_SECRET_BUYER
      : process.env.JWT_SECRET_SELLER;
  // const secret = process.env.JWT_SECRET;

  const decoded = await promisify(jwt.verify)(token, secret);

  // 3) Check if user still exists

  const userType = req.body.userType === 'buyer' ? Buyer : Seller;

  const currentUser = await userType.findById(decoded.id);
  if (!currentUser) {
    return next(
      new AppError(
        'The user belonging to this token does no longer exist.',
        401
      )
    );
  }

  // 4) Check if user changed password after the token was issued
  // if (currentUser.changedPasswordAfter(decoded.iat)) {
  //   return next(
  //     new AppError('User recently changed password! Please log in again.', 401)
  //   );
  // }

  // GRANT ACCESS TO PROTECTED ROUTE
  req.user = currentUser;
  res.locals.user = currentUser;
  next();
});
