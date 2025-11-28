const mongoose = require("mongoose");

const EmotionBreakdownSchema = new mongoose.Schema(
  {
    Angry: Number,
    Disgust: Number,
    Fear: Number,
    Happy: Number,
    Neutral: Number,
    Sad: Number,
    Surprise: Number,
  },
  { _id: false }
);

const BoundingBoxSchema = new mongoose.Schema(
  {
    x: Number,
    y: Number,
    width: Number,
    height: Number,
  },
  { _id: false }
);

const FaceExpressionHistorySchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Userinfo",
      required: true,
    },
    facesDetected: { type: Number, default: 0 },
    predictedEmotion: { type: String },
    confidence: { type: Number },
    allEmotions: { type: EmotionBreakdownSchema, default: undefined },
    boundingBox: { type: BoundingBoxSchema, default: undefined },
    rawResult: { type: mongoose.Schema.Types.Mixed },
    capturedAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

module.exports = mongoose.model(
  "FaceExpressionHistory",
  FaceExpressionHistorySchema
);

