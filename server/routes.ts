import type { Express } from "express";
import { createServer, type Server } from "http";
import { setupAuth } from "./auth";
import { db } from "@db";
import { subjects, classes, appointments, teacherSubjects, users } from "@db/schema";
import { eq, and } from "drizzle-orm";
import { createMeeting } from "./utils/google-meet";

export function registerRoutes(app: Express): Server {
  setupAuth(app);

  // Subject routes
  app.get("/api/subjects", async (req, res) => {
    const allSubjects = await db.select().from(subjects);
    res.json(allSubjects);
  });

  app.post("/api/subjects", async (req, res) => {
    if (req.user?.role !== "admin") {
      return res.status(403).send("Unauthorized");
    }
    const { name, duration, price, sessionsPerWeek } = req.body;
    const newSubject = await db
      .insert(subjects)
      .values({ name, duration, price, sessionsPerWeek })
      .returning();
    res.json(newSubject[0]);
  });

  // Class routes
  app.get("/api/classes", async (req, res) => {
    const userClasses = await db
      .select()
      .from(classes)
      .where(
        req.user?.role === "teacher"
          ? eq(classes.teacherId, req.user.id)
          : eq(classes.studentId, req.user.id)
      );
    res.json(userClasses);
  });

  app.post("/api/classes", async (req, res) => {
    if (req.user?.role !== "admin") {
      return res.status(403).send("Unauthorized");
    }

    const {
      subjectId,
      teacherId,
      studentId,
      startDate,
      endDate,
      customPrice,
      customTeacherSalary,
      adminNotes,
      teacherNotes,
    } = req.body;

    const newClass = await db
      .insert(classes)
      .values({
        subjectId,
        teacherId,
        studentId,
        startDate,
        endDate,
        customPrice,
        customTeacherSalary,
        adminNotes,
        teacherNotes,
      })
      .returning();

    res.json(newClass[0]);
  });

  // Appointment routes
  app.get("/api/appointments", async (req, res) => {
    const classIds = await db
      .select()
      .from(classes)
      .where(
        req.user?.role === "teacher"
          ? eq(classes.teacherId, req.user.id)
          : eq(classes.studentId, req.user.id)
      );

    const userAppointments = await db
      .select()
      .from(appointments)
      .where(
        eq(
          appointments.classId,
          classIds.map((c) => c.id)
        )
      );

    res.json(userAppointments);
  });

  app.post("/api/appointments/:id/attendance", async (req, res) => {
    const { id } = req.params;
    const { studentAttendance, teacherAttendance } = req.body;

    const updated = await db
      .update(appointments)
      .set({
        studentAttendance,
        teacherAttendance,
      })
      .where(eq(appointments.id, parseInt(id)))
      .returning();

    res.json(updated[0]);
  });

  // Update appointment creation to include Google Meet link
  app.post("/api/appointments", async (req, res) => {
    if (req.user?.role !== "admin") {
      return res.status(403).send("Unauthorized");
    }

    const { classId, date, duration } = req.body;

    try {
      // Get class details for the meeting title
      const [classDetails] = await db
        .select()
        .from(classes)
        .where(eq(classes.id, classId))
        .limit(1);

      // Get subject name
      const [subject] = await db
        .select()
        .from(subjects)
        .where(eq(subjects.id, classDetails.subjectId))
        .limit(1);

      // Create Google Meet
      const meetLink = await createMeeting(
        `${subject.name} Class`,
        new Date(date),
        duration
      );

      const [newAppointment] = await db
        .insert(appointments)
        .values({
          classId,
          date,
          duration,
          meetLink,
        })
        .returning();

      res.json(newAppointment);
    } catch (error) {
      console.error('Error creating appointment:', error);
      res.status(500).send("Failed to create appointment");
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}