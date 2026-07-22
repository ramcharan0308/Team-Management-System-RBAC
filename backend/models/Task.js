const mongoose = require('mongoose');

const taskSchema = new mongoose.Schema({
  team: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Team',
    required: true,
  },
  title: {
    type: String,
    required: true,
    trim: true,
  },
  description: {
    type: String,
    trim: true,
    default: '',
  },
  dueDate: {
    type: String, // Store YYYY-MM-DD format for consistency with frontend
    default: null,
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high'],
    default: 'medium',
  },
  status: {
    type: String,
    enum: ['todo', 'inprogress', 'done'],
    default: 'todo',
  },
  assignedTo: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null,
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
}, {
  timestamps: true,
});

taskSchema.set('toJSON', {
  transform: (doc, ret) => {
    ret.id = ret._id.toString();
    ret.project_id = ret.team ? (ret.team._id ? ret.team._id.toString() : ret.team.toString()) : null;
    ret.team_id = ret.project_id;
    ret.due_date = ret.dueDate;

    let assigneeId = null;
    if (ret.assignedTo) {
      if (typeof ret.assignedTo === 'string') {
        assigneeId = ret.assignedTo;
      } else if (ret.assignedTo._id) {
        assigneeId = ret.assignedTo._id.toString();
      } else if (ret.assignedTo.id) {
        assigneeId = ret.assignedTo.id.toString();
      } else if (typeof ret.assignedTo.toString === 'function' && ret.assignedTo.toString() !== '[object Object]') {
        assigneeId = ret.assignedTo.toString();
      }
    }

    let creatorId = null;
    if (ret.createdBy) {
      if (typeof ret.createdBy === 'string') {
        creatorId = ret.createdBy;
      } else if (ret.createdBy._id) {
        creatorId = ret.createdBy._id.toString();
      } else if (ret.createdBy.id) {
        creatorId = ret.createdBy.id.toString();
      } else if (typeof ret.createdBy.toString === 'function' && ret.createdBy.toString() !== '[object Object]') {
        creatorId = ret.createdBy.toString();
      }
    }

    ret.assigned_to = assigneeId;
    ret.assignedTo = assigneeId;
    ret.created_by = creatorId;
    ret.createdBy = creatorId;

    delete ret._id;
    delete ret.__v;
    return ret;
  }
});

module.exports = mongoose.model('Task', taskSchema);
