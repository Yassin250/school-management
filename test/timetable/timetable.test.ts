// ============================================================
// Timetable Service Tests
// ============================================================

import { describe, it, expect, beforeAll, beforeEach } from "vitest";
import { testPrisma, resetDatabase, resetUserData } from "../setup";
import {
  createUser,
  createTeacher,
  createEducationLevel,
  createAcademicYear,
  createTerm,
  createClass,
  createSubject,
  createStudent,
} from "../factories";
import { ROLES } from "../../src/lib/permissions/constants";
import type { CurrentUser } from "../../src/lib/auth/session";
import {
  createLesson,
  updateLesson,
  deleteLesson,
  getClassTimetable,
  timeToMinutes,
  rangesOverlap,
} from "../../src/lib/services/timetable/timetable";
import { ForbiddenError } from "../../src/lib/errors";

async function buildCurrentUser(userId: string): Promise<CurrentUser> {
  const user = await testPrisma.user.findUnique({
    where: { id: userId },
    include: {
      roles: {
        include: {
          role: {
            include: {
              permissions: { include: { permission: true } },
            },
          },
        },
      },
      studentProfile: { select: { id: true } },
      parentProfile: { select: { id: true } },
      teacherProfile: { select: { id: true } },
      staffProfile: { select: { id: true } },
    },
  });
  if (!user) throw new Error(`User ${userId} not found`);

  const roles = user.roles.map((ur) => ur.role.key);
  const permissions = new Set<string>();
  for (const ur of user.roles) {
    for (const rp of ur.role.permissions) {
      permissions.add(rp.permission.key);
    }
  }

  return {
    id: user.id,
    email: user.email,
    username: user.username,
    status: user.status,
    mustChangePassword: user.mustChangePassword,
    roles,
    permissions,
    studentId: user.studentProfile?.id ?? null,
    parentId: user.parentProfile?.id ?? null,
    teacherId: user.teacherProfile?.id ?? null,
    staffProfileId: user.staffProfile?.id ?? null,
  };
}

describe("Timetable Service", () => {
  beforeAll(async () => {
    await resetDatabase();
    const { seedRbac } = await import("../../prisma/seed/rbac");
    await seedRbac(testPrisma);
  });

  beforeEach(async () => {
    await resetUserData();
  });

  describe("Time utilities", () => {
    it("converts time to minutes correctly", () => {
      expect(timeToMinutes("08:00")).toBe(480);
      expect(timeToMinutes("08:45")).toBe(525);
      expect(timeToMinutes("13:30")).toBe(810);
    });

    it("detects range overlaps correctly", () => {
      expect(rangesOverlap("08:00", "08:45", "08:30", "09:15")).toBe(true);
      expect(rangesOverlap("08:00", "08:45", "08:45", "09:30")).toBe(false);
      expect(rangesOverlap("08:00", "09:30", "08:15", "08:45")).toBe(true);
      expect(rangesOverlap("08:00", "08:45", "10:00", "10:45")).toBe(false);
    });
  });

  describe("createLesson", () => {
    it("TEST-TT01: School admin can create a lesson period", async () => {
      const { user: adminUser } = await createUser(ROLES.SCHOOL_ADMIN);
      const admin = await buildCurrentUser(adminUser.id);

      const { user: teacherUser } = await createUser(ROLES.TEACHER);
      const teacher = await createTeacher(teacherUser.id);

      const year = await createAcademicYear(`AY-TT01-${Date.now()}`);
      const term = await createTerm(year.id, `Term-TT01-${Date.now()}`);
      const level = await createEducationLevel(`P1-TT01-${Date.now()}`);
      const cls = await createClass(year.id, level.id);
      const subject = await createSubject();

      const lesson = await createLesson(admin, {
        classId: cls.id,
        termId: term.id,
        teacherId: teacher.id,
        subjectId: subject.id,
        dayOfWeek: 1, // Monday
        startTime: "08:00",
        endTime: "08:45",
        room: "Room 101",
      });

      expect(lesson).toBeDefined();
      expect(lesson.classId).toBe(cls.id);
      expect(lesson.teacherId).toBe(teacher.id);
      expect(lesson.room).toBe("Room 101");
      expect(lesson.startTime).toBe("08:00");
    });

    it("TEST-TT02: Teacher without admin permissions cannot create a lesson period", async () => {
      const { user: teacherUser } = await createUser(ROLES.TEACHER);
      const teacher = await createTeacher(teacherUser.id);
      const teacherActor = await buildCurrentUser(teacherUser.id);

      const year = await createAcademicYear(`AY-TT02-${Date.now()}`);
      const term = await createTerm(year.id, `Term-TT02-${Date.now()}`);
      const level = await createEducationLevel(`P2-TT02-${Date.now()}`);
      const cls = await createClass(year.id, level.id);

      await expect(
        createLesson(teacherActor, {
          classId: cls.id,
          termId: term.id,
          teacherId: teacher.id,
          dayOfWeek: 1,
          startTime: "08:00",
          endTime: "08:45",
        }),
      ).rejects.toThrow(ForbiddenError);
    });

    it("TEST-TT03: Rejects Teacher Clash when teacher is already booked at overlapping time", async () => {
      const { user: adminUser } = await createUser(ROLES.SCHOOL_ADMIN);
      const admin = await buildCurrentUser(adminUser.id);

      const { user: teacherUser } = await createUser(ROLES.TEACHER);
      const teacher = await createTeacher(teacherUser.id);

      const year = await createAcademicYear(`AY-TT03-${Date.now()}`);
      const term = await createTerm(year.id, `Term-TT03-${Date.now()}`);
      const level = await createEducationLevel(`P3-TT03-${Date.now()}`);
      const classA = await createClass(year.id, level.id, { name: "Class 3A" });
      const classB = await createClass(year.id, level.id, { name: "Class 3B" });

      // First lesson in Class A
      await createLesson(admin, {
        classId: classA.id,
        termId: term.id,
        teacherId: teacher.id,
        dayOfWeek: 2, // Tuesday
        startTime: "08:00",
        endTime: "08:45",
      });

      // Try scheduling same teacher in Class B overlapping 08:30 - 09:15
      await expect(
        createLesson(admin, {
          classId: classB.id,
          termId: term.id,
          teacherId: teacher.id,
          dayOfWeek: 2,
          startTime: "08:30",
          endTime: "09:15",
        }),
      ).rejects.toThrow(/conflict detected/i);
    });

    it("TEST-TT04: Rejects Room Clash when room is already reserved at overlapping time", async () => {
      const { user: adminUser } = await createUser(ROLES.SCHOOL_ADMIN);
      const admin = await buildCurrentUser(adminUser.id);

      const { user: teacherUser1 } = await createUser(ROLES.TEACHER);
      const teacher1 = await createTeacher(teacherUser1.id);
      const { user: teacherUser2 } = await createUser(ROLES.TEACHER);
      const teacher2 = await createTeacher(teacherUser2.id);

      const year = await createAcademicYear(`AY-TT04-${Date.now()}`);
      const term = await createTerm(year.id, `Term-TT04-${Date.now()}`);
      const level = await createEducationLevel(`S1-TT04-${Date.now()}`);
      const classA = await createClass(year.id, level.id, { name: "Class S1A" });
      const classB = await createClass(year.id, level.id, { name: "Class S1B" });

      // Reserve Science Lab for Class A
      await createLesson(admin, {
        classId: classA.id,
        termId: term.id,
        teacherId: teacher1.id,
        dayOfWeek: 3, // Wednesday
        startTime: "10:45",
        endTime: "11:30",
        room: "Science Lab",
      });

      // Try reserving same Science Lab for Class B at overlapping time
      await expect(
        createLesson(admin, {
          classId: classB.id,
          termId: term.id,
          teacherId: teacher2.id,
          dayOfWeek: 3,
          startTime: "10:45",
          endTime: "11:30",
          room: "Science Lab",
        }),
      ).rejects.toThrow(/conflict detected/i);
    });

    it("TEST-TT05: Rejects Class Clash when same class already has a lesson at that time", async () => {
      const { user: adminUser } = await createUser(ROLES.SCHOOL_ADMIN);
      const admin = await buildCurrentUser(adminUser.id);

      const { user: teacherUser1 } = await createUser(ROLES.TEACHER);
      const teacher1 = await createTeacher(teacherUser1.id);
      const { user: teacherUser2 } = await createUser(ROLES.TEACHER);
      const teacher2 = await createTeacher(teacherUser2.id);

      const year = await createAcademicYear(`AY-TT05-${Date.now()}`);
      const term = await createTerm(year.id, `Term-TT05-${Date.now()}`);
      const level = await createEducationLevel(`P4-TT05-${Date.now()}`);
      const cls = await createClass(year.id, level.id);

      await createLesson(admin, {
        classId: cls.id,
        termId: term.id,
        teacherId: teacher1.id,
        dayOfWeek: 4, // Thursday
        startTime: "08:00",
        endTime: "08:45",
      });

      await expect(
        createLesson(admin, {
          classId: cls.id,
          termId: term.id,
          teacherId: teacher2.id,
          dayOfWeek: 4,
          startTime: "08:00",
          endTime: "08:45",
        }),
      ).rejects.toThrow(/conflict detected/i);
    });
  });

  describe("updateLesson and deleteLesson", () => {
    it("TEST-TT06: School admin can update a lesson period", async () => {
      const { user: adminUser } = await createUser(ROLES.SCHOOL_ADMIN);
      const admin = await buildCurrentUser(adminUser.id);

      const { user: teacherUser } = await createUser(ROLES.TEACHER);
      const teacher = await createTeacher(teacherUser.id);

      const year = await createAcademicYear(`AY-TT06-${Date.now()}`);
      const term = await createTerm(year.id, `Term-TT06-${Date.now()}`);
      const level = await createEducationLevel(`P5-TT06-${Date.now()}`);
      const cls = await createClass(year.id, level.id);

      const lesson = await createLesson(admin, {
        classId: cls.id,
        termId: term.id,
        teacherId: teacher.id,
        dayOfWeek: 1,
        startTime: "08:00",
        endTime: "08:45",
        room: "Old Room",
      });

      const updated = await updateLesson(admin, lesson.id, {
        room: "New Room 205",
        startTime: "08:45",
        endTime: "09:30",
      });

      expect(updated.room).toBe("New Room 205");
      expect(updated.startTime).toBe("08:45");
      expect(updated.endTime).toBe("09:30");
    });

    it("TEST-TT07: School admin can delete a lesson period when no attendance records exist", async () => {
      const { user: adminUser } = await createUser(ROLES.SCHOOL_ADMIN);
      const admin = await buildCurrentUser(adminUser.id);

      const { user: teacherUser } = await createUser(ROLES.TEACHER);
      const teacher = await createTeacher(teacherUser.id);

      const year = await createAcademicYear(`AY-TT07-${Date.now()}`);
      const term = await createTerm(year.id, `Term-TT07-${Date.now()}`);
      const level = await createEducationLevel(`P6-TT07-${Date.now()}`);
      const cls = await createClass(year.id, level.id);

      const lesson = await createLesson(admin, {
        classId: cls.id,
        termId: term.id,
        teacherId: teacher.id,
        dayOfWeek: 5, // Friday
        startTime: "13:30",
        endTime: "14:15",
      });

      const result = await deleteLesson(admin, lesson.id);
      expect(result.success).toBe(true);

      const inDb = await testPrisma.lesson.findUnique({ where: { id: lesson.id } });
      expect(inDb).toBeNull();
    });

    it("TEST-TT08: Prevents deleting a lesson period if attendance records already exist", async () => {
      const { user: adminUser } = await createUser(ROLES.SCHOOL_ADMIN);
      const admin = await buildCurrentUser(adminUser.id);

      const { user: teacherUser } = await createUser(ROLES.TEACHER);
      const teacher = await createTeacher(teacherUser.id);

      const year = await createAcademicYear(`AY-TT08-${Date.now()}`);
      const term = await createTerm(year.id, `Term-TT08-${Date.now()}`);
      const level = await createEducationLevel(`S2-TT08-${Date.now()}`);
      const cls = await createClass(year.id, level.id);
      const student = await createStudent();

      const lesson = await createLesson(admin, {
        classId: cls.id,
        termId: term.id,
        teacherId: teacher.id,
        dayOfWeek: 1,
        startTime: "08:00",
        endTime: "08:45",
      });

      // Insert an attendance record
      await testPrisma.attendance.create({
        data: {
          studentId: student.id,
          lessonId: lesson.id,
          status: "PRESENT",
          markedById: teacher.id,
        },
      });

      await expect(deleteLesson(admin, lesson.id)).rejects.toThrow(
        /Cannot delete this lesson period because .* attendance records/i,
      );
    });
  });

  describe("getClassTimetable and getTimetableEditorData", () => {
    it("TEST-TT09: Returns formatted timetable schedule with lessons", async () => {
      const { user: adminUser } = await createUser(ROLES.SCHOOL_ADMIN);
      const admin = await buildCurrentUser(adminUser.id);

      const { user: teacherUser } = await createUser(ROLES.TEACHER);
      const teacher = await createTeacher(teacherUser.id, { firstName: "Eric", lastName: "Mugisha" });

      const year = await createAcademicYear(`AY-TT09-${Date.now()}`);
      const term = await createTerm(year.id, `Term-TT09-${Date.now()}`);
      const level = await createEducationLevel(`S3-TT09-${Date.now()}`);
      const cls = await createClass(year.id, level.id, { name: "Senior 3 Science" });
      const subject = await createSubject("PHY-01", "Physics");

      await createLesson(admin, {
        classId: cls.id,
        termId: term.id,
        teacherId: teacher.id,
        subjectId: subject.id,
        dayOfWeek: 1,
        startTime: "08:00",
        endTime: "08:45",
        room: "Physics Lab",
      });

      const timetable = await getClassTimetable(admin, cls.id);
      expect(timetable.class?.name).toBe("Senior 3 Science");
      expect(timetable.lessons.length).toBe(1);
      expect(timetable.lessons[0].subjectName).toBe("Physics");
      expect(timetable.lessons[0].teacherName).toBe("Eric Mugisha");
      expect(timetable.lessons[0].room).toBe("Physics Lab");
    });
  });
});
