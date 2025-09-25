import { Router, type Request, type Response } from "express";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";
dotenv.config();

import type { User, CustomRequest } from "../libs/types.js";

// import database
import { users, reset_users, students } from "../db/db.js";
import { success } from "zod";

const router = Router();

// GET /api/v2/users
router.get("/", (req: Request, res: Response) => {
  try {
    //exract token
    const authHeader = req.headers["authorization"];

    if (!authHeader || authHeader?.startsWith("Bearer ")) {
      return res.status(401).json({
        success: false,
        message: "authorization not found",
      });
    }
    const token = authHeader?.split(" ")[1];
    if (!token) {
      return res.status(401).json({
        success: false,
        message: "Token is required",
      });
    }
    try {
        const jwt_secret = process.env.JWT_SECRET || "forgot_secret";
        jwt.verify(token,jwt_secret,(err,payload)=>{

if (err) {
    return res.status(403).json({
        success: false,
        message: "Invalid or expired token",
      });
}
            
        });
    } catch (err ) {
        
    }
    // return all users
    return res.json({
      success: true,
      data: users,
    });
  } catch (err) {
    return res.status(200).json({
      success: false,
      message: "Something is wrong, please try again",
      error: err,
    });
  }
});

// POST /api/v2/users/login
router.post("/login", (req: Request, res: Response) => {
  try {
    // 1. get username and password from body
    const { username, password } = req.body;
    const user = users.find(
      (u: User) => u.username === username && u.password === password
    );

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "invalid user or password",
      });
    }

    const jwt_secret = process.env.JWT_SECRET || "forgot_secret";
    const token = jwt.sign(
      {
        //add pay load
        username: user.username,
        studentId: user.studentId,
        role: user.role,
      },
      jwt_secret,
      { expiresIn: "5m" }
    );
    // 2. check if user exists (search with username & password in DB)

    // 3. create JWT token (with user info object as payload) using JWT_SECRET_KEY
    //    (optional: save the token as part of User data)

    // 4. send HTTP response with JWT token
    return res.status(200).json({
      success: true,
      message: "login successful",
      token,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Something went wrong idiot",
    });
  }

  return res.status(500).json({
    success: false,
    message: "POST /api/v2/users/login has not been implemented yet",
  });
});

// POST /api/v2/users/logout
router.post("/logout", (req: Request, res: Response) => {
  // 1. check Request if "authorization" header exists
  //    and container "Bearer ...JWT-Token..."

  // 2. extract the "...JWT-Token..." if available

  // 3. verify token using JWT_SECRET_KEY and get payload (username, studentId and role)

  // 4. check if user exists (search with username)

  // 5. proceed with logout process and return HTTP response
  //    (optional: remove the token from User data)

  return res.status(500).json({
    success: false,
    message: "POST /api/v2/users/logout has not been implemented yet",
  });
});

// POST /api/v2/users/reset
router.post("/reset", (req: Request, res: Response) => {
  try {
    reset_users();
    return res.status(200).json({
      success: true,
      message: "User database has been reset",
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: "Something is wrong, please try again",
      error: err,
    });
  }
});

export default router;
