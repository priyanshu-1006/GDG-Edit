import mongoose from "mongoose";

const certificateSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: false, // Changed to allow external recipients
    },
    recipientName: {
      type: String,
      required: false, // Populated from User if empty, or manual input
    },
    recipientEmail: {
      type: String,
      required: false,
    },
    event: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Event",
      required: false, // Changed to false to allow custom events
    },
    customEventName: {
      type: String,
      required: false, // Used if event is not selected
    },
    certificateUrl: {
      type: String,
      required: true, // Points to final cert OR template if dynamic
    },
    isDynamic: {
      type: Boolean,
      default: false,
    },
    positioning: {
      type: mongoose.Schema.Types.Mixed,
      default: { x: 0, y: 0, fontSize: 16, color: "#000000" },
    },
    extraData: {
      type: Map,
      of: mongoose.Schema.Types.Mixed,
      default: {},
    },
    certificateCode: {
      type: String,
      required: true,
      unique: true,
    },
    issuedAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  },
);

// Compound unique index - UPDATED for External Users
// 1. For registered users: user + event must be unique
certificateSchema.index(
  { user: 1, event: 1 },
  {
    unique: true,
    partialFilterExpression: { user: { $exists: true, $ne: null } },
  },
);

// 2. For external users: recipientEmail + event must be unique
certificateSchema.index(
  { recipientEmail: 1, event: 1 },
  {
    unique: true,
    partialFilterExpression: { recipientEmail: { $exists: true, $ne: null } },
  },
);

const Certificate = mongoose.model("Certificate", certificateSchema);

// --- MIGRATION: Fix for "duplicate key error collection" ---
// The old index `user_1_event_1` prevented multiple certificates with `user: null`.
// We attempt to drop it so the new partial indexes can take over.
(async () => {
  try {
    await Certificate.collection.dropIndex("user_1_event_1");
    console.log('✅ Legacy index "user_1_event_1" dropped successfully.');
  } catch (err) {
    // Ignore "index not found" errors, log others
    if (err.codeName !== "IndexNotFound") {
      console.log("ℹ️ Index cleanup:", err.message);
    }
  }
})();

export default Certificate;
