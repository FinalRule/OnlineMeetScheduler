import type { Express } from "express";
import { createServer, type Server } from "http";
import { setupAuth } from "./auth";
import { db } from "@db";
import { subjects, classes, appointments, teacherSubjects, users, notifications } from "@db/schema";
import { eq, and, inArray, or } from "drizzle-orm";
import { createMeeting } from "./utils/google-meet";
import { desc } from "drizzle-orm";

export function registerRoutes(app: Express): Server {
  setupAuth(app);

  // Auth middleware to ensure user is logged in
  const requireAuth = (req: Express.Request, res: Express.Response, next: Express.NextFunction) => {
    if (!req.user) {
      return res.status(401).send("Not authenticated");
    }
    next();
  };

  // User routes
  app.get("/api/users", requireAuth, async (req, res) => {
    if (req.user?.role !== "admin") {
      return res.status(403).send("Unauthorized");
    }

    const allUsers = await db
      .select({
        id: users.id,
        username: users.username,
        name: users.name,
        role: users.role,
        dateOfBirth: users.dateOfBirth,
        nationality: users.nationality,
        location: users.location,
        basePayment: users.basePayment,
      })
      .from(users)
      .where(or(eq(users.role, "teacher"), eq(users.role, "student")));

    res.json(allUsers);
  });

  // Subject routes
  app.get("/api/subjects", requireAuth, async (req, res) => {
    const allSubjects = await db.select().from(subjects);
    res.json(allSubjects);
  });

  app.post("/api/subjects", requireAuth, async (req, res) => {
    if (req.user?.role !== "admin") {
      return res.status(403).send("Unauthorized");
    }
    const { name, duration, price, sessionsPerWeek } = req.body;
    const [newSubject] = await db
      .insert(subjects)
      .values({ name, duration, price, sessionsPerWeek })
      .returning();
    res.json(newSubject);
  });

  // Class routes
  app.get("/api/classes", requireAuth, async (req, res) => {
    const userClasses = await db
      .select()
      .from(classes)
      .where(
        req.user.role === "teacher"
          ? eq(classes.teacherId, req.user.id)
          : eq(classes.studentId, req.user.id)
      );
    res.json(userClasses);
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
          : eq(classes.studentId, req.user.id)
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

  // Notification routes
  app.get("/api/notifications", requireAuth, async (req, res) => {
    const userNotifications = await db
      .select()
      .from(notifications)
      .where(eq(notifications.userId, req.user.id))
      .orderBy(desc(notifications.createdAt));

    res.json(userNotifications);
  });

  app.post("/api/notifications/:id/read", requireAuth, async (req, res) => {
    const { id } = req.params;

    const [updated] = await db
      .update(notifications)
      .set({ read: true })
      .where(
        and(
          eq(notifications.id, parseInt(id)),
          eq(notifications.userId, req.user.id)
        )
      )
      .returning();

    res.json(updated);
  });

  // Create appointment with Google Meet integration
  app.post("/api/appointments", requireAuth, async (req, res) => {
    if (req.user.role !== "admin") {
      return res.status(403).send("Unauthorized");
    }

    const { classId, date, duration } = req.body;

    try {
      // Get class and subject details
      const [classDetails] = await db
        .select({
          id: classes.id,
          teacherId: classes.teacherId,
          studentId: classes.studentId,
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
      const [newAppointment] = await db
        .insert(appointments)
        .values({
          classId,
          date,
          duration,
          meetLink,
        })
        .returning();

      // Create notifications
      await db.insert(notifications).values([
        {
          userId: classDetails.teacherId,
          type: "upcoming_class",
          title: "New Class Scheduled",
          message: `You have a new class scheduled for ${new Date(date).toLocaleString()}`,
          scheduledFor: new Date(date),
          relatedAppointmentId: newAppointment.id,
        },
        {
          userId: classDetails.studentId,
          type: "upcoming_class",
          title: "New Class Scheduled",
          message: `You have a new class scheduled for ${new Date(date).toLocaleString()}`,
          scheduledFor: new Date(date),
          relatedAppointmentId: newAppointment.id,
        },
      ]);

      res.json(newAppointment);
    } catch (error) {
      console.error('Error creating appointment:', error);
      res.status(500).send("Failed to create appointment");
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}