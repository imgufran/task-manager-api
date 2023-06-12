const jwt = require("jsonwebtoken");
const User = require("./../models/user");

const auth = async (req, res, next) => {
  try {
    const token = req.header("Authorization").replace("Bearer ", "");
    // Validate the token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // If valid, find the user by id and token property. Remember, `decoded has _id property`
    const user = await User.findOne({_id: decoded._id, "tokens.token": token});

    if (!user) {
      // throw will trigger catch down below
      throw new Error()
    }

    // Send the token -> This'll help to logout from the same device that was used when signing in. We'll delete this exact token to logout the user from this device.
    req.token = token;

    // Finally give next route handler access to the user we just fetched from the database.
    req.user = user;
    next();
  } catch (e) {
    res.status(401).send({error: "You are not authenticated"});
  }
}

module.exports = auth;