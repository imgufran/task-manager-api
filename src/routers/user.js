const express = require("express");
const mongoose = require("mongoose");
const multer = require("multer");
const sharp = require("sharp");

const User = require("./../models/user");
const auth = require("./../middleware/auth");
const { sendWelcomeEmail, sendCancellationEmail } = require("./../emails/account");

const router = express.Router();

// Route for creating a new user
router.post("/users", async (req, res) => {
  const user = new User(req.body);

  try {
    await user.save();
    sendWelcomeEmail(user.email, user.name);
    const token = await user.generateAuthToken();
    res.status(201).send({ user, token });
  } catch (e) {
    res.status(400).send(e);
  }
});

// Route for signing in user
router.post("/users/login", async (req, res) => {
  try {
    const user = await User.findByCredentials(
      req.body.email,
      req.body.password
    );
    const token = await user.generateAuthToken();

    res.send({ user, token });
  } catch (e) {
    res.status(400).send();
  }
});

// Route for logging users out.
router.post("/users/logout", auth, async (req, res) => {
  try {
    req.user.tokens = req.user.tokens.filter((currObj) => {
      // All true will be filtered out
      return currObj.token !== req.token;
    });
    await req.user.save();
    console.log(req.user.tokens);

    res.status(200).send();
  } catch (e) {
    res.status(500).send();
  }
});

// Route for logging users out from all devices.
router.post("/users/logoutAll", auth, async (req, res) => {
  try {
    req.user.tokens = [];
    await req.user.save();

    res.status(200).send();
  } catch (e) {
    res.status(500).send();
  }
});

// Route for fetching your profile
//? no `id` is needed as `auth` middleware will provide `user` to the route handler.
router.get("/users/me", auth, async (req, res) => {
  res.send(req.user);
});

// Route for updating your profile
router.patch("/users/me", auth, async (req, res) => {
  const updates = Object.keys(req.body);
  const allowedUpdates = ["name", "email", "password", "age"];

  // Check if update is allowed
  const isValidOperation = updates.every((property) =>
    allowedUpdates.includes(property)
  );

  if (!isValidOperation) {
    return res.status(400).send({ error: "Invalid Update!" });
  }

  try {
    const user = req.user;
    updates.forEach((update) => (user[update] = req.body[update]));
    await user.save();

    res.status(200).send(user);
  } catch (e) {
    console.log("Hi");
    res.status(400).send(e);
  }
});

// Route for deleting your profile
router.delete("/users/me", auth, async (req, res) => {
  console.log(req.user);
  try {
    // Call .deleteOne method on mongoose document.
    await req.user.deleteOne();

    // Email deleted user
    sendCancellationEmail(req.user.name, req.user.email);

    // send deleted user as a response body
    res.status(200).send(req.user);
  } catch (error) {
    res.status(400).send();
  }
});

const upload = multer({
  limits: {
    fileSize: 1000000,
  },
  fileFilter: function (req, file, cb) {
    if (!file.originalname.match(/\.(jpg|jpeg|png)$/)) {
      return cb(new Error("Please upload an image file."));
    }

    cb(undefined, true);
  },
});

// Route for uploading user profile picture
router.post(
  "/users/me/avatar",
  auth,
  upload.single("avatar"),
  async (req, res) => {
    // Buffer of modified image file
    const buffer = await sharp(req.file.buffer)
      .resize({ width: 250, height: 250 })
      .png()
      .toBuffer();

    req.user.avatar = buffer;
    await req.user.save();
    res.send();
  },
  (error, req, res, next) => {
    res.status(400).send({ error: error.message });
  }
);

// Route for deleting user profile picture
router.delete("/users/me/avatar", auth, async (req, res) => {
  req.user.avatar = undefined;
  await req.user.save();

  res.send();
});

// Router for fetching avatar
router.get("/users/:id/avatar", async (req, res) => {
  try {
    const user = await User.findById(req.params.id);

    if (!user || !user.avatar) {
      throw new Error();
    }

    //* res.set() -> used to set the response header fields for the HTTP response.
    res.set("Content-Type", "image/png");
    res.send(user.avatar);
  } catch (e) {
    res.status(404).send();
  }
});

module.exports = router;
