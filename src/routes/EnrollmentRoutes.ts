import { Router, type Request, type Response } from "express";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";
dotenv.config();

import type {
  User,
  CustomRequest,
  UserPayload,
  Enrollment,
  Student,
} from "../libs/types.js";

// import database
import {
  users,
  reset_users,
  students,
  enrollments,
  reset_enrollments,
  courses,
} from "../db/db.js";
import { success } from "zod";
import { authenticateToken } from "../middlewares/authenMiddleware.js";
import { checkRoleAdmin } from "../middlewares/checkRoleAdminMiddleware.js";
import { zEnrollmentBody, zStudentId } from "../libs/zodValidators.js";
import { checkRoleStudent } from "../middlewares/checkRoleStudentMiddleware.js";
const router = Router();

router.get(
  "/",
  authenticateToken,
  checkRoleAdmin,
  (req: CustomRequest, res: Response) => {
    try {
      const data = students.map((student) => {
        const enroll = enrollments
          .filter((enroll) => enroll.studentId == student.studentId)
          .map((course) => ({ courseId: course.courseId }));

        return { studentId: student.studentId, courses: enroll };
      });

      return res.status(200).json({
        success: true,
        message: "Enrollments Information",
        data: data,
      });
      // });
    } catch (err) {
      return res.status(500).json({
        success: false,
        message: "Something is wrong, please try again",
        error: err,
      });
    }
  }
);
router.post(
  "/reset",
  authenticateToken,
  checkRoleAdmin,
  (req: CustomRequest, res: Response) => {
    try {
      reset_enrollments();

      return res.status(200).json({
        success: true,
        message: "enrollments database has been reset",
      });
    } catch (err) {
      return res.status(500).json({
        success: false,
        message: "Something is wrong, please try again",
        error: err,
      });
    }
  }
);

router.get(
  "/:studentId",
  authenticateToken,
  (req: CustomRequest, res: Response) => {
    try {
      const studentId = req.params.studentId;
      const result = zStudentId.safeParse(studentId);
      console.log(studentId);
      if (!result.success) {
        return res.status(400).json({
          message: "Validation failed",
          errors: result.error.issues[0]?.message,
        });
      }

      const studentIndex = students.findIndex(
        (student: Student) => student.studentId === studentId
      );
      console.log(studentIndex);
      if (studentIndex === -1) {
        return res.status(404).json({
          success: false,
          message: "StudentId does not exists",
        });
      }

      const payload = req.user;
      const token = req.token;

      // 2. check if user exists (search with username) and role is ADMIN
      const user = users.find((u: User) => u.username === payload?.username);
      if (!user) {
        return res.status(401).json({
          success: false,
          message: "Unauthorized user",
        });
      }

      if (
        user.role === "ADMIN" ||
        (user.role === "STUDENT" && user.studentId === studentId)
      ) {
        return res.status(200).json({
          success: true,
          message: "Student information",
          data: students[studentIndex],
        });
      } else {
        return res.status(403).json({
          success: false,
          message: "Forbidden access",
        });
      }
    } catch (err) {
      return res.status(500).json({
        success: false,
        message: "Something is wrong, please try again",
        error: err,
      });
    }
  }
);

router.post(
  "/:studentId",
  authenticateToken,
  checkRoleStudent,
  (req: CustomRequest, res: Response) => {
    try {
      const studentId = req.params.studentId;
      const body = req.body as Enrollment;

      const result1 = zStudentId.safeParse(studentId);
      const result2 = zEnrollmentBody.safeParse(body);

      if (!result1.success) {
        return res.status(400).json({
          message: "Validation failed",
          errors: result1.error.issues[0]?.message,
        });
      }
      if (!result2.success) {
        return res.status(400).json({
          message: "Validation failed",
          errors: result2.error.issues[0]?.message,
        });
      }
      const studentIndex = students.findIndex(
        (student) => studentId === student.studentId
      );

      if (studentIndex === -1) {
        return res.status(404).json({
          success: false,
          message: "StudentId does not exists",
        });
      }
      const payload = req.user;
      const token = req.token;

      // 2. check if user exists (search with username) and role is ADMIN
      const user = users.find((u: User) => u.username === payload?.username);
      console.log(studentId);
      console.log(body.studentId);
      console.log(user?.studentId);

      if (
        studentId != body.studentId ||
        user?.studentId != studentId ||
        user?.studentId != body.studentId
      ) {
        return res.status(403).json({
          success: false,
          message: "Forbidden access",
        });
      }
      console.log(body);

      const findenrollment = enrollments.find(
        (enroll: Enrollment) =>
          body.studentId === enroll.studentId &&
          body.courseId === enroll.courseId
      );

      if (findenrollment) {
        return res.status(409).json({
          success: false,
          message: "Enrollment is already exists",
        });
      }

      

      enrollments.push(body);
      const newcourse = enrollments
        .filter((enroll) => enroll.studentId === studentId)
        .map((enroll) => enroll.courseId);

      if (students[studentIndex]?.courses !== undefined) {
        students[studentIndex].courses = { ...students[studentIndex].courses  ,...{courses:newcourse}};
      }

      return res.status(200).json({
        success: true,
        message: `Student ${studentId} && Course ${body.courseId} has been added successfully`,
        data: body,
      });
    } catch (err) {
      return res.status(500).json({
        success: false,
        message: "Something is wrong, please try again",
        error: err,
      });
    }
  }
);

router.delete(
  "/:studentId",
  authenticateToken,
  checkRoleStudent,
  (req: CustomRequest, res: Response) => {
    try {
      const studentId = req.params.studentId;
      const body = req.body;

      const result1 = zStudentId.safeParse(studentId);
      const result2 = zEnrollmentBody.safeParse(body);

      if (!result1.success) {
        return res.status(400).json({
          message: "Validation failed",
          errors: result1.error.issues[0]?.message,
        });
      }
      if (!result2.success) {
        return res.status(400).json({
          message: "Validation failed",
          errors: result2.error.issues[0]?.message,
        });
      }

      const payload = req.user;
      const token = req.token;
      // 2. check if user exists (search with username) and role is ADMIN
      const user = users.find((u: User) => u.username === payload?.username);

      if (
        studentId != body.studentId ||
        user?.studentId != studentId ||
        user?.studentId != body.studentId
      ) {
        return res.status(403).json({
          success: false,
          message: "Forbidden access",
        });
      }

      const studentIndex = students.findIndex(
        (student) => student.studentId === studentId
      );

      if (studentIndex === -1) {
        return res.status(404).json({
          success: false,
          message: "StudentId does not exists",
        });
      }

      const enrollIndex = enrollments.findIndex(
        (enroll) =>
          enroll.studentId === studentId && enroll.courseId === body.courseId
      );
      if (enrollIndex === -1) {
        return res.status(404).json({
          success: false,
          message: "Enrollment does not exists",
        });
      }

      enrollments.splice(enrollIndex, 1);

      const newcourse = enrollments
        .filter((enroll) => enroll.studentId === studentId)
        .map((enroll) => enroll.courseId);

      if (students[studentIndex]?.courses !== undefined) {
        students[studentIndex].courses = { ...students[studentIndex].courses  ,...{courses:newcourse}};
      }
      return res.status(200).json({
        success: true,
        message: `Student ${studentId} && Course ${body.courseId} has been deleted successfully`,
        data: enrollments,
      });
    } catch (err) {
      return res.status(500).json({
        success: false,
        message: "Something is wrong, please try again",
        error: err,
      });
    }
  }
);

export default router;
