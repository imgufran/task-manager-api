const mongoose = require("mongoose");

// Defining a Schema
const taskSchema = new mongoose.Schema({
  description: {
    type: String,
    trim: true,
    required: true
  },
  completed: {
    type: Boolean,
    default: false
  },
  owner: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    // ref: "User" -> allows to create a reference from this field to a given Model ("User" in this case)
    ref: "User"
  }
}, {timestamps: true});

// Defining a Task Model
const Task = new mongoose.model("Task", taskSchema);

// Exporting Task Model
module.exports = Task;