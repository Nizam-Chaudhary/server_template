require("dotenv").config({ path: `${process.cwd()}/.env` });

const user = require("../db/models/user");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");

const signUp = async (req, res, next) => {
  const body = req.body;

  if (!["1", "2"].includes(body.userType)) {
    return res.status(400).json({
      status: "fail",
      message: "Invalid User Type",
    });
  }

  try {
    const newUser = await user.create({
      userType: body.userType,
      firstName: body.firstName,
      lastName: body.lastName,
      email: body.email.toLowerCase(),
      password: body.password,
      confirmPassword: body.confirmPassword,
    });

    const result = newUser.toJSON();
    delete result.password;
    delete result.deletedAt;

    result.token = generateToken({
      id: result.id,
    });

    if (!result) {
      return res.status(400).json({
        status: "fail",
        message: "Failed to create user",
      });
    }

    return res.status(201).json({
      status: "success",
      data: result,
    });
  } catch (error) {
    return res.status(400).json({
      status: "fail",
      message: error.message,
    });
  }
};

const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        status: "fail",
        message: "please provide email and password",
      });
    }

    const result = await user.findOne({
      where: { email: email.toLowerCase() },
    });
    if (!result || !(await bcrypt.compare(password, result.password))) {
      return res.status(401).json({
        status: "fail",
        message: "incorrect email or password",
      });
    }

    const token = generateToken({
      id: result.id,
    });

    return res.status(201).json({
      status: "success",
      data: token,
    });
  } catch (error) {
    console.error(error);

    return res.status(400).json({
      status: "fail",
      message: error.message,
    });
  }
};

const generateToken = (payload) => {
  return jwt.sign(payload, process.env.JWT_SECRET_KEY, {
    expiresIn: process.env.JWT_EXPIRES_IN,
  });
};

module.exports = { signUp, login };
