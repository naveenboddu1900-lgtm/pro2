import dotenv from "dotenv";

dotenv.config();

export const config = {
  port: Number(process.env.PORT || 4000),
  mongoUri: process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/pro2",
  jwtSecret: process.env.JWT_SECRET || "development-only-secret-change-me"
};
