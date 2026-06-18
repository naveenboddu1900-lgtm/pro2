import mongoose from "mongoose";

const { Schema, model, models } = mongoose;

const checklistItemSchema = new Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: 160
    },
    completed: {
      type: Boolean,
      default: false
    }
  },
  {
    timestamps: true
  }
);

const commentSchema = new Schema(
  {
    author: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true
    },
    body: {
      type: String,
      required: true,
      trim: true,
      maxlength: 2000
    },
    editedAt: {
      type: Date,
      default: null
    },
    deletedAt: {
      type: Date,
      default: null
    }
  },
  {
    timestamps: true
  }
);

const cardSchema = new Schema(
  {
    board: {
      type: Schema.Types.ObjectId,
      ref: "Board",
      required: true,
      index: true
    },
    list: {
      type: Schema.Types.ObjectId,
      ref: "List",
      required: true,
      index: true
    },
    title: {
      type: String,
      required: true,
      trim: true,
      minlength: 1,
      maxlength: 160
    },
    description: {
      type: String,
      trim: true,
      maxlength: 4000,
      default: ""
    },
    position: {
      type: Number,
      required: true,
      min: 0
    },
    labels: {
      type: [String],
      default: []
    },
    assignees: {
      type: [
        {
          type: Schema.Types.ObjectId,
          ref: "User"
        }
      ],
      default: []
    },
    dueDate: {
      type: Date,
      default: null
    },
    checklist: {
      type: [checklistItemSchema],
      default: []
    },
    comments: {
      type: [commentSchema],
      default: []
    },
    archivedAt: {
      type: Date,
      default: null
    }
  },
  {
    timestamps: true
  }
);

cardSchema.index({ list: 1, position: 1 });
cardSchema.index({ board: 1, title: "text", description: "text" });
cardSchema.index({ board: 1, "comments.createdAt": -1 });

export const Card = models.Card || model("Card", cardSchema);
