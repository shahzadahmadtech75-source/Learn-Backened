import mongoose from "mongoose";
import { DB_NAME } from "./constants.js";

const connectDB = async () => {
  try {
    const connectionResponse = await mongoose.connect(process.env.MONGODB_URI, {
      dbName: DB_NAME, // This is much cleaner and safer
    });

    console.log(
      `MongoDB Connected! Host: ${connectionResponse.connection.host}`
    );
  } catch (error) {
    // Detailed error logging helps you fix things faster
    console.error("MongoDB Connection Error:", error.message);
    process.exit(1);
  }
};
export default connectDB;
