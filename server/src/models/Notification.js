import mongoose from "mongoose";

const { Schema, model, models } = mongoose;

const notificationSchema = new Schema(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true
    },
    workspace: {
      type: Schema.Types.ObjectId,
      ref: "Workspace",
      default: null
    },
    board: {
      type: Schema.Types.ObjectId,
      ref: "Board",
      default: null
    },
    card: {
      type: Schema.Types.ObjectId,
      ref: "Card",
      default: null
    },
    type: {
      type: String,
      enum: ["card_assigned", "card_updated", "comment_created", "mention", "system"],
      required: true
    },
    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: 160
    },
    message: {
      type: String,
      required: true,
      trim: true,
      maxlength: 500
    },
    readAt: {
      type: Date,
      default: null
    }
  },
  {
    timestamps: true
  }
);

notificationSchema.index({ user: 1, readAt: 1, createdAt: -1 });

export const Notification = models.Notification || model("Notification", notificationSchema);
