const jwt = require("jsonwebtoken");
const admin = require("../config/firebaseConfig");
const User = require("../models/user.model");
const responseHandler = require("../utils/response");
const errorHandler = require("../utils/error");
const https = require("https");
const nodemailer = require("nodemailer")
const bcrypt = require("bcryptjs")


const googleLogin = async (req, res) => {
  try {
    const { idToken } = req.body;

    if (!idToken) {
      return errorHandler(res, 400, "ID Token is required.");
    }

    // Verify Firebase ID Token
    const decodedToken = await admin.auth().verifyIdToken(idToken);
    const { uid, email, name, picture } = decodedToken;

    if (!email) {
      return errorHandler(res, 400, "Google account must have an email.");
    }

    // Check if user already exists
    let user = await User.findOne({ email });

    if (!user) {
      // Create new user and save it to generate _id
      user = await new User({
        name: name || "Unnamed User",
        email,
        profilePic: picture || "",
        isVerified: true,
        role: "user",
        accountMethod: "google",
        providerId: uid,
        lastLogin: new Date(),
      }).save();
    } else {
      // Update last login time
      user.lastLogin = new Date();
      await user.save();
    }

    // Create a JWT token with all user data EXCEPT password
    const tokenPayload = {
      _id: user._id.toString(),
      name: user.name,
      email: user.email,
      profilePic: user.profilePic,
      isVerified: user.isVerified,
      role: user.role,
      accountMethod: user.accountMethod,
      providerId: user.providerId,
      lastLogin: user.lastLogin,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };

    const token = jwt.sign(tokenPayload, process.env.JWT_SECRET, { expiresIn: "7d" });

    responseHandler(res, 200, "Google login successful", { user, token });
  } catch (error) {
    errorHandler(res, 500, "Google Login Failed", error);
  }
};

const facebookLogin = async (req, res) => {
  try {
    const { accessToken } = req.body;
    if (!accessToken) {
      return errorHandler(res, 400, "Access Token is required.");
    }

    const facebookGraphUrl = `https://graph.facebook.com/me?fields=id,name,email,picture&access_token=${accessToken}`;

    https.get(facebookGraphUrl, (fbRes) => {
      let data = "";

      fbRes.on("data", (chunk) => {
        data += chunk;
      });

      fbRes.on("end", async () => {
        const fbUser = JSON.parse(data);
        if (!fbUser || fbUser.error) {
          return errorHandler(res, 400, "Invalid Facebook Token");
        }

        let user = await User.findOne({ email: fbUser.email });
        if (!user) {
          user = new User({
            name: fbUser.name,
            email: fbUser.email,
            profilePic: fbUser.picture.data.url,
            isVerified: true,
            role: "user",
            accountMethod: "facebook", // ✅ Ensure accountMethod is always provided
            providerId: fbUser.id,
            lastLogin: new Date(),
          });

          await user.save();
        }

        responseHandler(res, 200, "Facebook login successful", { user });
      });
    }).on("error", (err) => {
      errorHandler(res, 500, "Facebook Login Failed", err.message);
    });
  } catch (err) {
    errorHandler(res, 500, "Facebook Login Failed", err.message);
  }
};

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

const manualSignup = async (req, res) => {
  try {
    const { name, email, password, role } = req.body; // Extract role from req.body

    if (!name || !email || !password) {
      return errorHandler(res, 400, "All fields are required.");
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return errorHandler(res, 400, "Email already in use.");
    }

    if (!req.file) {
      return errorHandler(res, 400, "Profile image is required.");
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = new User({
      name,
      email,
      password: hashedPassword,
      profilePic: req.file.path, // Cloudinary image URL
      isVerified: false,
      role: role || "user", // Use provided role, otherwise default to "user"
      accountMethod: "manual",
    });

    await newUser.save();

    // Generate a verification token (valid for 10 minutes)
    const verificationToken = jwt.sign(
      { userId: newUser._id },
      process.env.JWT_SECRET,
      { expiresIn: "10m" }
    );

    const verificationLink = `http://localhost:8080/api/v1/auth/verify-email/${verificationToken}`;

    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: newUser.email,
      subject: "Verify Your Email",
      html: `<p>Hello ${newUser.name},</p>
        <p>Click the link below to verify your email:</p>
        <a href="${verificationLink}">${verificationLink}</a>
        <p>This link will expire in 10 minutes.</p>`,
    });

    responseHandler(res, 201, "User registered successfully. Please verify your email.");
  } catch (error) {
    errorHandler(res, 500, "Manual Signup Failed", error);
  }
};

const verifyEmail = async (req, res) => {
  try {
    const { token } = req.params;

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const userId = decoded.userId;

    const user = await User.findById(userId);
    if (!user) {
      return errorHandler(res, 400, "Invalid or expired verification link.");
    }

    if (user.isVerified) {
      return responseHandler(res, 200, "Email already verified.");
    }

    user.isVerified = true;
    await user.save();

    responseHandler(res, 200, "Email verified successfully.");
  } catch (error) {
    return errorHandler(res, 400, "Invalid or expired token.");
  }
};

const manualLogin = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return errorHandler(res, 400, "Email and password are required.");
    }

    const user = await User.findOne({ email });
    if (!user) {
      return errorHandler(res, 400, "Invalid email or password.");
    }

    if (!user.isVerified) {
      return errorHandler(res, 403, "Please verify your email before logging in.");
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return errorHandler(res, 400, "Invalid email or password.");
    }

    const tokenPayload = {
      _id: user._id.toString(),
      name: user.name,
      email: user.email,
      profilePic: user.profilePic,
      isVerified: user.isVerified,
      role: user.role,
      accountMethod: user.accountMethod,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };

    const token = jwt.sign(tokenPayload, process.env.JWT_SECRET, { expiresIn: "7d" });

    responseHandler(res, 200, "Login successful", { user, token });
  } catch (error) {
    errorHandler(res, 500, "Login failed", error);
  }
};

const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return errorHandler(res, 400, "Email is required.");
    }

    const user = await User.findOne({ email });
    if (!user) {
      return errorHandler(res, 400, "User with this email does not exist.");
    }

    // Generate a unique reset token (valid for 15 minutes)
    const resetToken = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, {
      expiresIn: "15m",
    });

    const resetLink = `http://localhost:8080/api/v1/auth/reset-password/${resetToken}`;

    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: user.email,
      subject: "Password Reset Request",
      html: `<p>Hello ${user.name},</p>
        <p>You requested to reset your password. Click the link below to set a new password:</p>
        <a href="${resetLink}">${resetLink}</a>
        <p>This link will expire in 15 minutes.</p>`,
    });

    responseHandler(res, 200, "Password reset link sent successfully.");
  } catch (error) {
    errorHandler(res, 500, "Forgot Password Failed", error);
  }
};

// Reset Password - Update Password
const resetPassword = async (req, res) => {
  try {
    const { token } = req.params;
    const { newPassword } = req.body;

    if (!newPassword || newPassword.length < 6) {
      return errorHandler(res, 400, "Password must be at least 6 characters long.");
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.userId);

    if (!user) {
      return errorHandler(res, 400, "Invalid or expired reset token.");
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    user.password = hashedPassword;
    await user.save();

    responseHandler(res, 200, "Password reset successfully.");
  } catch (error) {
    errorHandler(res, 400, "Invalid or expired token.");
  }
};

module.exports = {googleLogin,facebookLogin,manualSignup,verifyEmail,manualLogin,forgotPassword, resetPassword};