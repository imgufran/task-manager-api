const express = require("express");

require("./db/mongoose.js");
const userRouter = require("./routers/user.js");
const taskRouter = require("./routers/task.js");

const app = express();
const port = process.env.PORT;

app.use(express.json());

// Register our router with existing express app
app.use(userRouter);
app.use(taskRouter);

//* app.listen() => Starts the server
app.listen(port, () => {
  console.log(`Server is up on port: ${port}`);
});

