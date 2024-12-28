import { pgTable, text, serial, integer, boolean, timestamp, decimal } from "drizzle-orm/pg-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { relations } from "drizzle-orm";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").unique().notNull(),
  password: text("password").notNull(),
  role: text("role", { enum: ["admin", "teacher", "student"] }).notNull(),
  name: text("name").notNull(),
  dateOfBirth: timestamp("date_of_birth"),
  nationality: text("nationality"),
  location: text("location"),
  basePayment: decimal("base_payment", { precision: 10, scale: 2 }),
});

export const subjects = pgTable("subjects", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  duration: integer("duration").notNull(), // in minutes
  price: decimal("price", { precision: 10, scale: 2 }).notNull(),
  sessionsPerWeek: integer("sessions_per_week").notNull(),
});

export const teacherSubjects = pgTable("teacher_subjects", {
  id: serial("id").primaryKey(),
  teacherId: integer("teacher_id").references(() => users.id),
  subjectId: integer("subject_id").references(() => subjects.id),
});

export const classes = pgTable("classes", {
  id: serial("id").primaryKey(),
  subjectId: integer("subject_id").references(() => subjects.id),
  teacherId: integer("teacher_id").references(() => users.id),
  studentId: integer("student_id").references(() => users.id),
  startDate: timestamp("start_date").notNull(),
  endDate: timestamp("end_date").notNull(),
  customPrice: decimal("custom_price", { precision: 10, scale: 2 }),
  customTeacherSalary: decimal("custom_teacher_salary", { precision: 10, scale: 2 }),
  adminNotes: text("admin_notes"),
  teacherNotes: text("teacher_notes"),
});

export const appointments = pgTable("appointments", {
  id: serial("id").primaryKey(),
  classId: integer("class_id").references(() => classes.id),
  date: timestamp("date").notNull(),
  duration: integer("duration").notNull(),
  teacherNote: text("teacher_note"),
  studentNote: text("student_note"),
  studentAttendance: boolean("student_attendance"),
  teacherAttendance: boolean("teacher_attendance"),
  meetLink: text("meet_link"),
  studentRating: integer("student_rating"),
  teacherRating: integer("teacher_rating"),
});

export const notifications = pgTable("notifications", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id),
  type: text("type", { enum: ["upcoming_class", "assignment_due", "class_reminder"] }).notNull(),
  title: text("title").notNull(),
  message: text("message").notNull(),
  read: boolean("read").default(false),
  createdAt: timestamp("created_at").defaultNow(),
  scheduledFor: timestamp("scheduled_for"),
  relatedAppointmentId: integer("related_appointment_id").references(() => appointments.id),
});

export const usersRelations = relations(users, ({ many }) => ({
  teacherSubjects: many(teacherSubjects),
  teacherClasses: many(classes, { relationName: "teacher" }),
  studentClasses: many(classes, { relationName: "student" }),
  notifications: many(notifications),
}));

export const subjectsRelations = relations(subjects, ({ many }) => ({
  teacherSubjects: many(teacherSubjects),
  classes: many(classes),
}));

export const classesRelations = relations(classes, ({ one, many }) => ({
  subject: one(subjects, {
    fields: [classes.subjectId],
    references: [subjects.id],
  }),
  teacher: one(users, {
    fields: [classes.teacherId],
    references: [users.id],
  }),
  student: one(users, {
    fields: [classes.studentId],
    references: [users.id],
  }),
  appointments: many(appointments),
}));

export const appointmentsRelations = relations(appointments, ({ many }) => ({
  notifications: many(notifications),
}));

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;
export type Subject = typeof subjects.$inferSelect;
export type InsertSubject = typeof subjects.$inferInsert;
export type Class = typeof classes.$inferSelect;
export type InsertClass = typeof classes.$inferInsert;
export type Appointment = typeof appointments.$inferSelect;
export type InsertAppointment = typeof appointments.$inferInsert;
export type Notification = typeof notifications.$inferSelect;
export type InsertNotification = typeof notifications.$inferInsert;

export const insertUserSchema = createInsertSchema(users);
export const selectUserSchema = createSelectSchema(users);
export const insertNotificationSchema = createInsertSchema(notifications);
export const selectNotificationSchema = createSelectSchema(notifications);