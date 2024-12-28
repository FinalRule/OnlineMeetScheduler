import type { Express } from "express";
import { createServer, type Server } from "http";
import { setupAuth } from "./auth";
import { db } from "@db";
import { subjects, classes, appointments, teacherSubjects, users, classStudents } from "@db/schema";
import { eq, and, inArray, or } from "drizzle-orm";
import { createMeeting } from "./utils/google-meet";
import { desc } from "drizzle-orm";
import { z } from "zod";
import { insertSubjectSchema } from "@db/schema";

const updateProfileSchema = z.object({
  name: z.string().min(1, "Name is required"),
  dateOfBirth: z.string().optional(),
  nationality: z.string().optional(),
  location: z.string().optional(),
});

const insertSubjectSchema = z.object({
  name: z.string().min(1, "Name is required"),
  sessionsPerWeek: z.number().int().min(0, "Sessions per week must be non-negative"),
  durations: z.array(z.string()).default([]), //assuming durations are strings
  pricePerDuration: z.object({}).default({}), //assuming pricePerDuration is an object
  isActive: z.boolean().default(true),
});


export function registerRoutes(app: Express): Server {
  setupAuth(app);

  // Auth middleware to ensure user is logged in
  const requireAuth = (req: any, res: any, next: any) => {
    if (!req.user) {
      return res.status(401).send("Not authenticated");
    }
    next();
  };

  // Add profile update route
  app.put("/api/user/profile", requireAuth, async (req, res) => {
    try {
      const result = updateProfileSchema.safeParse(req.body);
      if (!result.success) {
        return res.status(400).send(result.error.issues.map(i => i.message).join(", "));
      }

      const { name, dateOfBirth, nationality, location } = result.data;

      const [updatedUser] = await db
        .update(users)
        .set({
          name,
          dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : undefined,
          nationality,
          location,
        })
        .where(eq(users.id, req.user.id))
        .returning();

      res.json(updatedUser);
    } catch (error) {
      console.error('Error updating profile:', error);
      res.status(500).send("Failed to update profile");
    }
  });

  // User routes
  app.get("/api/users", requireAuth, async (req, res) => {
    if (req.user?.role !== "admin") {
      return res.status(403).send("Unauthorized");
    }

    try {
      const allUsers = await db
        .select({
          id: users.id,
          username: users.username,
          name: users.name,
          role: users.role,
          dateOfBirth: users.dateOfBirth,
          nationality: users.nationality,
          location: users.location,
          baseSalaryPerHour: users.baseSalaryPerHour,
          basePaymentPerHour: users.basePaymentPerHour,
        })
        .from(users)
        .where(or(eq(users.role, "teacher"), eq(users.role, "student")));

      res.json(allUsers);
    } catch (error) {
      console.error('Error fetching users:', error);
      res.status(500).send("Failed to fetch users");
    }
  });

  // Subject routes
  app.get("/api/subjects", requireAuth, async (req, res) => {
    try {
      const allSubjects = await db
        .select({
          id: subjects.id,
          name: subjects.name,
          sessionsPerWeek: subjects.sessionsPerWeek,
          durations: subjects.durations,
          pricePerDuration: subjects.pricePerDuration,
          isActive: subjects.isActive,
        })
        .from(subjects);
      res.json(allSubjects);
    } catch (error) {
      console.error('Error fetching subjects:', error);
      res.status(500).send("Failed to fetch subjects");
    }
  });

  app.post("/api/subjects", requireAuth, async (req, res) => {
    if (req.user?.role !== "admin") {
      return res.status(403).send("Unauthorized");
    }

    try {
      const result = insertSubjectSchema.safeParse(req.body);
      if (!result.success) {
        return res.status(400).send(result.error.issues.map(i => i.message).join(", "));
      }

      const [newSubject] = await db
        .insert(subjects)
        .values(result.data)
        .returning();

      res.json(newSubject);
    } catch (error) {
      console.error('Error creating subject:', error);
      res.status(500).send("Failed to create subject");
    }
  });

  app.put("/api/subjects/:id", requireAuth, async (req, res) => {
    if (req.user?.role !== "admin") {
      return res.status(403).send("Unauthorized");
    }

    try {
      const subjectId = parseInt(req.params.id);
      const { name, sessionsPerWeek, durations, pricePerDuration, isActive } = req.body;

      // Validate and transform the data
      const durationsArray = Array.isArray(durations) ? durations : [];
      const priceObject = typeof pricePerDuration === 'object' ? pricePerDuration : {};

      const [updatedSubject] = await db
        .update(subjects)
        .set({
          name,
          sessionsPerWeek,
          durations: durationsArray,
          pricePerDuration: priceObject,
          isActive,
        })
        .where(eq(subjects.id, subjectId))
        .returning();

      if (!updatedSubject) {
        return res.status(404).send("Subject not found");
      }

      res.json(updatedSubject);
    } catch (error) {
      console.error('Error updating subject:', error);
      res.status(500).send("Failed to update subject");
    }
  });

  // Class routes
  app.get("/api/classes", requireAuth, async (req, res) => {
    try {
      const userClassesQuery = db
        .select({
          id: classes.id,
          classId: classes.classId,
          subjectId: classes.subjectId,
          teacherId: classes.teacherId,
          startDate: classes.startDate,
          endDate: classes.endDate,
          weekDays: classes.weekDays,
          timePerDay: classes.timePerDay,
          durationPerDay: classes.durationPerDay,
          isActive: classes.isActive,
        })
        .from(classes);

      if (req.user.role === "teacher") {
        userClassesQuery.where(eq(classes.teacherId, req.user.id));
      } else if (req.user.role === "student") {
        const studentClasses = await db
          .select({
            classId: classStudents.classId
          })
          .from(classStudents)
          .where(eq(classStudents.studentId, req.user.id));

        const classIds = studentClasses.map(c => c.classId);
        if (classIds.length) {
          userClassesQuery.where(inArray(classes.id, classIds));
        } else {
          return res.json([]);
        }
      }

      const userClasses = await userClassesQuery;
      res.json(userClasses);
    } catch (error) {
      console.error('Error fetching classes:', error);
      res.status(500).send("Failed to fetch classes");
    }
  });

  // Appointments routes
  app.get("/api/appointments", requireAuth, async (req, res) => {
    // First get the class IDs for the user
    const userClasses = await db
      .select()
      .from(classes)
      .where(
        req.user.role === "teacher"
          ? eq(classes.teacherId, req.user.id)
          : inArray(classes.id, (await db
            .select({classId: classStudents.classId})
            .from(classStudents)
            .where(eq(classStudents.studentId, req.user.id))
            .map(c => c.classId)))
      );

    const classIds = userClasses.map(c => c.id);

    // Then get appointments for those classes
    if (classIds.length === 0) {
      return res.json([]);
    }

    const userAppointments = await db
      .select()
      .from(appointments)
      .where(inArray(appointments.classId, classIds));

    res.json(userAppointments);
  });


  // Create appointment with Google Meet integration
  app.post("/api/appointments", requireAuth, async (req, res) => {
    if (req.user?.role !== "admin") {
      return res.status(403).send("Unauthorized");
    }

    const { classId, date, time, duration } = req.body;

    try {
      // Get class and subject details
      const [classDetails] = await db
        .select({
          id: classes.id,
          teacherId: classes.teacherId,
          subjectId: classes.subjectId,
        })
        .from(classes)
        .where(eq(classes.id, classId))
        .limit(1);

      if (!classDetails) {
        return res.status(404).send("Class not found");
      }

      const [subject] = await db
        .select({
          id: subjects.id,
          name: subjects.name,
        })
        .from(subjects)
        .where(eq(subjects.id, classDetails.subjectId))
        .limit(1);

      if (!subject) {
        return res.status(404).send("Subject not found");
      }

      // Create Google Meet
      const meetLink = await createMeeting(
        `${subject.name} Class`,
        new Date(date),
        duration
      );

      // Create appointment
      const appointmentId = `APT${Date.now()}`;
      const [newAppointment] = await db
        .insert(appointments)
        .values({
          appointmentId,
          classId,
          date: new Date(date),
          time,
          duration,
          meetLink,
        })
        .returning();

      // Get students in the class
      const students = await db
        .select({
          studentId: classStudents.studentId
        })
        .from(classStudents)
        .where(eq(classStudents.classId, classId));

      res.json(newAppointment);
    } catch (error) {
      console.error('Error creating appointment:', error);
      res.status(500).send("Failed to create appointment");
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}