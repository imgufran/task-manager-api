// Task router
const express = require("express");
const mongoose = require("mongoose");

const Task = require("../models/task");
const auth = require("../middleware/auth");

const router = express.Router();

// Route for creating a new Task
router.post("/tasks", auth, async (req, res) => {
  const task = new Task({
    ...req.body,
    owner: req.user._id,
  });

  try {
    //* .save() -> modifies the task object
    await task.save();
    res.status(201).send(task);
  } catch (e) {
    res.status(400).send(e);
  }
});

// GET /tasks?completed=false
// GET /tasks?limit=10&skip=20 (For pagination)
// GET /tasks?sortBy=createdAt-desc or [createdAt_asc] -> (Sorting) 
// Route for fetching all tasks
router.get("/tasks", auth, async (req, res) => {
  const match = {};

  if (req.query.completed) {
    match.completed = req.query.completed === "true";
  }

  const sort = {};

  if (req.query.sortBy) {
    // Split the query param between "-"
    const parts = req.query.sortBy.split("-");
    sort[parts[0]] = parts[1] === "asc" ? 1 : -1;
  }

  try {
    // const tasks = await Task.find({owner: req.user._id});
    // await req.user.populate("tasks");
    await req.user.populate({
      path: "tasks",
      match, // shorthand
      options: {
        limit: parseInt(req.query.limit),
        skip: parseInt(req.query.skip),
        sort: sort
      }
    });
    res.status(200).send(req.user.tasks);
  } catch (error) {
    res.status(500).send();
  }
});

// Route for fetching single task by id
router.get("/tasks/:id", auth, async (req, res) => {
  const _id = req.params.id;
  if (!mongoose.Types.ObjectId.isValid(_id)) {
    return res.status(404).send();
  }

  try {
    const task = await Task.findOne({ _id: _id, owner: req.user._id });

    if (!task) {
      return res.status(404).send();
    }
    res.status(200).send(task);
  } catch (e) {
    res.status(500).send();
  }
});

// Route for updating single task by id
router.patch("/tasks/:id", auth, async (req, res) => {
  // updates => array of properties
  const updates = Object.keys(req.body);
  const allowedUpdates = ["description", "completed"];

  const isValidOperation = updates.every((property) =>
    allowedUpdates.includes(property)
  );

  if (!isValidOperation) {
    return res.status(400).send({ error: "Invalid Update!" });
  }

  const _id = req.params.id;
  // Guard Clause
  if (!mongoose.Types.ObjectId.isValid(_id)) {
    return res.status(404).send();
  }

  try {
    const task = await Task.findOne({ _id: _id, owner: req.user._id });

    if (!task) {
      return res.status(404).send();
    }

    updates.forEach((update) => (task[update] = req.body[update]));
    await task.save();

    res.status(200).send(task);
  } catch (e) {
    res.status(400).send(e);
  }
});

// Route for deleting a task by id
router.delete("/tasks/:id", auth, async (req, res) => {
  const _id = req.params.id;
  // Guard Clause
  if (!mongoose.Types.ObjectId.isValid(_id)) {
    return res.status(404).send();
  }

  try {
    const task = await Task.findOneAndDelete({_id, owner: req.user._id});

    if (!task) {
      return res.status(404).send();
    }
    res.status(200).send(task);
  } catch (e) {
    res.status(400).send(e);
  }
});

// Exporting Router
module.exports = router;
