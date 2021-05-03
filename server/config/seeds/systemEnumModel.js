const mongoose = require("mongoose");

const SystemEnumSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      trim: true,
      required: true,
    },
    displayName: {
      type: String,
      trim: true,
      required: true,
    },
    verified: {
      type: Boolean,
      default: true,
    },
    isDeletable: {
      type: Boolean,
      default: false,
    },
    isUpdatable: {
      type: Boolean,
      default: true,
    },
    metaData: {
      type: String,
      trim: true,
    },
    metaDataInt: {
      type: Number,
      trim: true,
    },
    description: {
      type: String,
      trim: true,
    },
    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
  },
  {
    timestamps: { createdAt: "created_at", updatedAt: "updated_at" },
  }
);

const SystemEnum = mongoose.model("SystemEnum", SystemEnumSchema);
module.exports = SystemEnum;
