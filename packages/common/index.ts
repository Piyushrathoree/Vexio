import jwt from "jsonwebtoken";
import { ApiError } from "./utils/ApiError.ts";
import { ApiResponse } from "./utils/ApiResponse.ts";
import { config } from "dotenv";
config();
const JWT_SECRET = process.env.JWT_SECRET! || "1234567890";
export { jwt, ApiError, ApiResponse, JWT_SECRET };
