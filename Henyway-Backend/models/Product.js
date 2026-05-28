import mongoose from "mongoose";

const productSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  price: {
    type: Number,
    required: true
  },
  currency: {
    type: String,
    default: "INR"
  },
  pieces: {
    type: String,
    default: ""
  },
  includes: {
    type: String,
    default: ""
  },
  idealFor: {
    type: String,
    default: ""
  },
  description: {
    type: String,
    required: true
  },
  image: {
    type: String,
    required: true
  },
  category: {
    type: String,
    enum: ["chicken", "eggs", "combo","premium"],
    default: "chicken"
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

export default mongoose.model("Product", productSchema);
