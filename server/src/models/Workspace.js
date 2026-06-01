import mongoose from "mongoose";

const { Schema, model, models } = mongoose;

const workspaceMemberSchema = new Schema(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true
    },
    role: {
      type: String,
      enum: ["owner", "admin", "member", "viewer"],
      default: "member"
    },
    joinedAt: {
      type: Date,
      default: Date.now
    }
  },
  {
    _id: false
  }
);

const workspaceSchema = new Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      minlength: 2,
      maxlength: 100
    },
    description: {
      type: String,
      trim: true,
      maxlength: 500,
      default: ""
    },
    owner: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true
    },
    members: {
      type: [workspaceMemberSchema],
      default: []
    }
  },
  {
    timestamps: true
  }
);

workspaceSchema.index({ owner: 1, name: 1 });
workspaceSchema.index({ "members.user": 1 });

export const Workspace = models.Workspace || model("Workspace", workspaceSchema);
