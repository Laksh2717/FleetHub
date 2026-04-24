import mongoose from "mongoose";

let isConnected = false;

const connectDB = async () => {
  if (isConnected) return; // reuse existing connection if Lambda is warm

  await mongoose.connect(process.env.MONGODB_URL);
  isConnected = true;
};

export default connectDB;