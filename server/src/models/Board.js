import mongoose from "mongoose";

const { Schema, model, models } = mongoose;

const boardSchema = new Schema(
  {
    workspace: {
      type: Schema.Types.ObjectId,
      ref: "Workspace",
      required: true,
      index: true
    },
    name: {
      type: String,
      required: true,
      trim: true,
      minlength: 2,
      maxlength: 120
    },
    description: {
      type: String,
      trim: true,
      maxlength: 500,
      default: ""
    },
    visibility: {
      type: String,
      enum: ["workspace", "private"],
      default: "workspace"
    },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true
    }
  },
  {
    timestamps: true
  }
);

boardSchema.index({ workspace: 1, name: 1 });

export const Board = models.Board || model("Board", boardSchema);
