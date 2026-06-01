import mongoose from "mongoose";

const { Schema, model, models } = mongoose;

const listSchema = new Schema(
  {
    board: {
      type: Schema.Types.ObjectId,
      ref: "Board",
      required: true,
      index: true
    },
    title: {
      type: String,
      required: true,
      trim: true,
      minlength: 1,
      maxlength: 80
    },
    position: {
      type: Number,
      required: true,
      min: 0
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

listSchema.index({ board: 1, position: 1 });

export const List = models.List || model("List", listSchema);
