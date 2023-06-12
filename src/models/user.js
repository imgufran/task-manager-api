const mongoose = require("mongoose");
const validator = require("validator");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const Task = require("./task");

// Separate schema
const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      unique: true,
      require: true,
      trim: true,
      lowercase: true,
      validate: {
        validator: function (v) {
          return validator.isEmail(v);
        },
        message: (props) => `${props.value} is not a valid email`,
      },
    },
    password: {
      type: String,
      minLength: [6, "Password must be greater than 6 characters"],
      trim: true,
      required: true,
      validate: function (v) {
        if (v.toLowerCase().includes("password")) {
          throw new Error("Password cannot contain the term password itself");
        }
      },
    },
    age: {
      type: Number,
      default: 0,
      validate: {
        validator: function (v) {
          return v >= 0;
        },
        message: "Age cannot be less than 0",
      },
    },
    tokens: [
      {
        token: {
          type: String,
          required: true,
        },
      },
    ],
    avatar: {
      type: Buffer
    },
  },
  { timestamps: true }
);

// Virtual property
userSchema.virtual("tasks", {
  ref: "Task",
  localField: "_id",
  foreignField: "owner",
});

// Define an instance method on the schema. These methods are accessible on the instances.
userSchema.methods.generateAuthToken = async function () {
  // Here, `this` keyword refers to the user instance on which this method is invoked
  const user = this;
  const token = jwt.sign({ _id: user._id.toString() }, process.env.JWT_SECRET);
  user.tokens = user.tokens.concat({ token: token });
  await user.save();

  return token;
};

userSchema.methods.toJSON = function () {
  const user = this;
  //* toObject() -> used to convert a Mongoose document (an instance of a Mongoose model) to a plain JavaScript object.
  const userObject = user.toObject();

  // Delete password and tokens property from this user object
  delete userObject.password;
  delete userObject.tokens;
  delete userObject.avatar;

  return userObject;
};

// Define a static method on the schema. These methods are accessible on the Model
userSchema.statics.findByCredentials = async (email, password) => {
  const user = await User.findOne({ email: email });

  if (!user) {
    throw new Error("Sorry, you’ve entered an invalid username or password.");
  }

  const isMatch = await bcrypt.compare(password, user.password);

  if (!isMatch) {
    throw new Error("Sorry, you’ve entered an invalid username or password.");
  }

  return user;
};

// Middleware -> Hash the plain text password before saving
userSchema.pre("save", async function (next) {
  // `this` -> points to the document being saved
  const user = this;
  if (user.isModified("password")) {
    user.password = await bcrypt.hash(user.password, 8);
  }
  next();
});

// Delete user tasks when user is removed
userSchema.pre("remove", async function (next) {
  const user = this;
  await Task.deleteMany({ owner: user._id });
  next();
});

// Defining a User model
const User = mongoose.model("User", userSchema);

// Exporting User Model so that other files can use it to create new users, etc
module.exports = User;
