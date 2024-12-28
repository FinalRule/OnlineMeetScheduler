import { pgTable, text, serial, integer, boolean, timestamp, decimal, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { relations } from "drizzle-orm";
import { z } from "zod";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").unique().notNull(),
  password: text("password").notNull(),
  role: text("role", { enum: ["admin", "teacher", "student"] }).notNull().default("student"),
  name: text("name").notNull(),
  dateOfBirth: timestamp("date_of_birth"),
  nationality: text("nationality"),
  location: text("location"),
  baseSalaryPerHour: decimal("base_salary_per_hour", { precision: 10, scale: 2 }),
  basePaymentPerHour: decimal("base_payment_per_hour", { precision: 10, scale: 2 }),
  balance: decimal("balance", { precision: 10, scale: 2 }).default('0'),
  paymentHistory: jsonb("payment_history").default('[]'),
  isActive: boolean("is_active").default(true),
});

// Create schema for user input validation
export const insertUserSchema = createInsertSchema(users, {
  dateOfBirth: z.string().optional().transform(val => val ? new Date(val) : undefined),
  role: z.enum(["admin", "teacher", "student"]),
  baseSalaryPerHour: z.number().optional(),
  basePaymentPerHour: z.number().optional(),
});

export const selectUserSchema = createSelectSchema(users);

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

export const subjects = pgTable("subjects", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  sessionsPerWeek: integer("sessions_per_week").notNull(),
  description: text("description"),
  durations: jsonb("durations").default('[]'),
  pricePerDuration: jsonb("price_per_duration").default('{}'),
  isActive: boolean("is_active").default(true),
});

export const teacherSubjects = pgTable("teacher_subjects", {
  id: serial("id").primaryKey(),
  teacherId: integer("teacher_id").references(() => users.id),
  subjectId: integer("subject_id").references(() => subjects.id),
});

export const classes = pgTable("classes", {
  id: serial("id").primaryKey(),
  classId: text("class_id").unique().notNull(),
  subjectId: integer("subject_id").references(() => subjects.id),
  teacherId: integer("teacher_id").references(() => users.id),
  startDate: timestamp("start_date").notNull(),
  endDate: timestamp("end_date").notNull(),
  weekDays: jsonb("week_days").default('[]'),
  timePerDay: jsonb("time_per_day").default('{}'),
  durationPerDay: jsonb("duration_per_day").default('{}'),
  files: jsonb("files").default('[]'),
  adminNotes: text("admin_notes"),
  teacherNotes: text("teacher_notes"),
  customHourPrice: decimal("custom_hour_price", { precision: 10, scale: 2 }),
  customTeacherSalary: decimal("custom_teacher_salary", { precision: 10, scale: 2 }),
  isActive: boolean("is_active").default(true),
});

export const classStudents = pgTable("class_students", {
  id: serial("id").primaryKey(),
  classId: integer("class_id").references(() => classes.id),
  studentId: integer("student_id").references(() => users.id),
});

export const appointments = pgTable("appointments", {
  id: serial("id").primaryKey(),
  appointmentId: text("appointment_id").unique().notNull(),
  classId: integer("class_id").references(() => classes.id),
  date: timestamp("date").notNull(),
  time: text("time").notNull(),
  duration: integer("duration").notNull(),
  teacherNote: text("teacher_note"),
  studentNote: text("student_note"),
  studentAttendance: boolean("student_attendance"),
  teacherAttendance: boolean("teacher_attendance"),
  files: jsonb("files").default('[]'),
  assignment: text("assignment"),
  studentRating: integer("student_rating"),
  teacherRating: integer("teacher_rating"),
  meetLink: text("meet_link"),
  status: text("status", { enum: ["scheduled", "completed", "cancelled"] }).default('scheduled'),
});

// Relations
export const usersRelations = relations(users, ({ many }) => ({
  teacherSubjects: many(teacherSubjects),
  teacherClasses: many(classes, { relationName: "teacher" }),
  studentClasses: many(classStudents),
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
  students: many(classStudents),
  appointments: many(appointments),
}));

export const classStudentsRelations = relations(classStudents, ({ one }) => ({
  class: one(classes, {
    fields: [classStudents.classId],
    references: [classes.id],
  }),
  student: one(users, {
    fields: [classStudents.studentId],
    references: [users.id],
  }),
}));

// Types
export type Subject = typeof subjects.$inferSelect;
export type InsertSubject = typeof subjects.$inferInsert;
export type Class = typeof classes.$inferSelect;
export type InsertClass = typeof classes.$inferInsert;
export type Appointment = typeof appointments.$inferSelect;
export type InsertAppointment = typeof appointments.$inferInsert;
export type ClassStudent = typeof classStudents.$inferSelect;
export type InsertClassStudent = typeof classStudents.$inferInsert;

// Schemas