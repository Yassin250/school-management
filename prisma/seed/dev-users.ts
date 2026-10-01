// ============================================================
// Development Accounts Seed (DEVELOPMENT/TEST ONLY)
// ============================================================
// Creates a connected scenario matching the Rwandan education system:
//
//   Academic Year 2026/2027 → Term 1
//   Class S1 A (lower secondary, common core subjects)
//   S1 A has ALL S1 subjects from the curriculum
//   Demo teacher assigned to teach Mathematics AND Physics in S1 A
//   3 students enrolled in S1 A
//   Demo parent linked to student 1
//
// Lower secondary (S1–S3) = common core, no student choice.
// Upper secondary (S4–S6) = pathway assigned by NESA (not modelled here).
//
// Password for all accounts: Password123
// NEVER run this in production.
// ============================================================

import type { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import { ROLES, type RoleKey } from "../../src/lib/permissions/constants";

const DEV_PASSWORD = "Password123";
const BCRYPT_COST = 12;

interface DemoUser {
  email: string;
  username: string;
  role: RoleKey;
  firstName: string;
  lastName: string;
}

const DEMO_USERS: DemoUser[] = [
  { email: "admin@yourschool.rw", username: "admin", role: ROLES.SYSTEM_ADMIN, firstName: "System", lastName: "Administrator" },
  { email: "schooladmin@yourschool.rw", username: "schooladmin", role: ROLES.SCHOOL_ADMIN, firstName: "School", lastName: "Administrator" },
  { email: "principal@yourschool.rw", username: "principal", role: ROLES.PRINCIPAL, firstName: "Jane", lastName: "Principal" },
  { email: "teacher@yourschool.rw", username: "teacher", role: ROLES.TEACHER, firstName: "John", lastName: "Teacher" },
  { email: "accountant@yourschool.rw", username: "accountant", role: ROLES.ACCOUNTANT, firstName: "Anne", lastName: "Accountant" },
  { email: "registrar@yourschool.rw", username: "registrar", role: ROLES.REGISTRAR, firstName: "Rita", lastName: "Registrar" },
  { email: "parent@yourschool.rw", username: "parent", role: ROLES.PARENT, firstName: "Paul", lastName: "Parent" },
  { email: "student@yourschool.rw", username: "student", role: ROLES.STUDENT, firstName: "Alice", lastName: "Student" },
];

export async function seedDevUsers(prisma: PrismaClient): Promise<void> {
  console.log("🌱 Seeding development accounts...");

  // ----------------------------------------------------------
  // 1. Academic year + term
  // ----------------------------------------------------------
  const academicYear = await prisma.academicYear.upsert({
    where: { name: "2026/2027" },
    update: { isCurrent: true },
    create: {
      name: "2026/2027",
      startDate: new Date("2026-09-01"),
      endDate: new Date("2027-07-15"),
      isCurrent: true,
    },
  });

  await prisma.term.upsert({
    where: {
      academicYearId_name: {
        academicYearId: academicYear.id,
        name: "Term 1",
      },
    },
    update: { isCurrent: true },
    create: {
      academicYearId: academicYear.id,
      name: "Term 1",
      startDate: new Date("2026-09-07"),
      endDate: new Date("2026-12-17"),
      isCurrent: true,
    },
  });

  // ----------------------------------------------------------
  // 2. Education level S1 + class S1 A
  // ----------------------------------------------------------
  const level = await prisma.educationLevel.upsert({
    where: { code: "S1" },
    update: {},
    create: {
      code: "S1",
      name: "Secondary 1",
      area: "GENERAL",
      order: 7,
    },
  });

  const cls = await prisma.class.upsert({
    where: {
      academicYearId_name: {
        academicYearId: academicYear.id,
        name: "S1 A",
      },
    },
    update: {},
    create: {
      name: "S1 A",
      academicYearId: academicYear.id,
      educationLevelId: level.id,
      stream: "A",
      capacity: 40,
    },
  });

  // ----------------------------------------------------------
  // 3. All S1 subjects → classSubject for S1 A
  //    Lower secondary has NO student choice.
  //    Every S1 student takes every S1 subject.
  // ----------------------------------------------------------
  const s1Subjects = await prisma.subject.findMany({
    where: {
      levelLinks: { some: { educationLevelId: level.id } },
    },
  });

  for (const subject of s1Subjects) {
    await prisma.classSubject.upsert({
      where: {
        classId_subjectId: { classId: cls.id, subjectId: subject.id },
      },
      update: {},
      create: { classId: cls.id, subjectId: subject.id },
    });
  }

  console.log(`  ✓ S1 A has ${s1Subjects.length} subjects (common core)`);

  // ----------------------------------------------------------
  // 4. Create the 8 demo users with roles
  // ----------------------------------------------------------
  const passwordHash = await bcrypt.hash(DEV_PASSWORD, BCRYPT_COST);
  const userByUsername = new Map<string, { id: string }>();

  for (const demo of DEMO_USERS) {
    const user = await prisma.user.upsert({
      where: { email: demo.email },
      update: {
        username: demo.username,
        status: "ACTIVE",
        deletedAt: null,
      },
      create: {
        email: demo.email,
        username: demo.username,
        passwordHash,
        status: "ACTIVE",
      },
    });

    userByUsername.set(demo.username, { id: user.id });

    const role = await prisma.role.findUnique({
      where: { key: demo.role },
    });

    if (role) {
      await prisma.userRole.upsert({
        where: {
          userId_roleId: { userId: user.id, roleId: role.id },
        },
        update: {},
        create: {
          userId: user.id,
          roleId: role.id,
          assignedBy: "dev-seed",
        },
      });
    }
  }

  // ----------------------------------------------------------
  // 5. Teacher profile + assignments (Math + Physics)
  // ----------------------------------------------------------
  const teacherUserId = userByUsername.get("teacher")!.id;

  const teacher = await prisma.teacher.upsert({
    where: { userId: teacherUserId },
    update: {},
    create: {
      userId: teacherUserId,
      staffCode: "TCH-001",
      firstName: "John",
      lastName: "Teacher",
      sex: "MALE",
      phone: "+250780000001",
    },
  });

  // Assign this teacher to Mathematics and Physics in S1 A
  const mathSubject = s1Subjects.find((s) => s.code === "MATH");
  const physicsSubject = s1Subjects.find((s) => s.code === "PHY");

  for (const subject of [mathSubject, physicsSubject].filter(Boolean)) {
    const existing = await prisma.teacherAssignment.findFirst({
      where: {
        teacherId: teacher.id,
        classId: cls.id,
        subjectId: subject!.id,
        moduleId: null,
        academicYearId: academicYear.id,
      },
    });

    if (!existing) {
      await prisma.teacherAssignment.create({
        data: {
          teacherId: teacher.id,
          classId: cls.id,
          subjectId: subject!.id,
          academicYearId: academicYear.id,
        },
      });
    }
  }

  console.log(`  ✓ Teacher assigned to Mathematics + Physics in S1 A`);

  // ----------------------------------------------------------
  // 6. Student profiles + enrollments (in the class, not in subjects)
  // ----------------------------------------------------------
  const studentDefs = [
    { username: "student", code: "STU-001", firstName: "Alice", lastName: "Student", sex: "FEMALE" as const },
    { username: "student2", code: "STU-002", firstName: "Bob", lastName: "Student2", sex: "MALE" as const },
    { username: "student3", code: "STU-003", firstName: "Carol", lastName: "Student3", sex: "FEMALE" as const },
  ];

  const studentIdByUsername = new Map<string, string>();

  for (const def of studentDefs) {
    let userId: string;
    if (def.username === "student") {
      userId = userByUsername.get("student")!.id;
    } else {
      const email = `${def.username}@yourschool.rw`;
      const u = await prisma.user.upsert({
        where: { email },
        update: {},
        create: {
          email,
          username: def.username,
          passwordHash,
          status: "ACTIVE",
        },
      });
      userId = u.id;
    }

    const student = await prisma.student.upsert({
      where: { studentCode: def.code },
      update: {},
      create: {
        userId,
        studentCode: def.code,
        firstName: def.firstName,
        lastName: def.lastName,
        sex: def.sex,
        dateOfBirth: new Date("2010-05-15"),
      },
    });

    studentIdByUsername.set(def.username, student.id);

    await prisma.enrollment.upsert({
      where: {
        studentId_academicYearId: {
          studentId: student.id,
          academicYearId: academicYear.id,
        },
      },
      update: {},
      create: {
        studentId: student.id,
        academicYearId: academicYear.id,
        educationLevelId: level.id,
        classId: cls.id,
        startDate: new Date("2026-09-07"),
        status: "ACTIVE",
      },
    });
  }

  // ----------------------------------------------------------
  // 7. Parent profile + link to student 1
  // ----------------------------------------------------------
  const parentUserId = userByUsername.get("parent")!.id;
  const aliceId = studentIdByUsername.get("student")!;

  const parent = await prisma.parent.upsert({
    where: { userId: parentUserId },
    update: {},
    create: {
      userId: parentUserId,
      firstName: "Paul",
      lastName: "Parent",
      sex: "MALE",
      phone: "+250780000002",
    },
  });

  await prisma.parentStudent.upsert({
    where: {
      parentId_studentId: {
        parentId: parent.id,
        studentId: aliceId,
      },
    },
    update: {},
    create: {
      parentId: parent.id,
      studentId: aliceId,
      isPrimary: true,
      relationship: "Father",
    },
  });

  console.log(`  ✓ Development accounts ready (password: ${DEV_PASSWORD})`);
  console.log(`  ✓ Academic year: ${academicYear.name}`);
  console.log(`  ✓ Class: ${cls.name}`);
  console.log(`  ✓ 3 students enrolled\n`);
}