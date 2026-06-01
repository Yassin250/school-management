import { PrismaClient, Role, Sex, Day } from "../src/generated/prisma/client";
import bcrypt from "bcryptjs";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
    console.log("🌱 Seeding database...");

    // Clean existing data (order matters for FK constraints)
    await prisma.attendance.deleteMany();
    await prisma.result.deleteMany();
    await prisma.exam.deleteMany();
    await prisma.assignment.deleteMany();
    await prisma.lessonTopic.deleteMany();
    await prisma.lesson.deleteMany();
    await prisma.term.deleteMany();
    await prisma.announcement.deleteMany();
    await prisma.event.deleteMany();
    await prisma.student.deleteMany();
    await prisma.parent.deleteMany();
    await prisma.teacher.deleteMany();
    await prisma.admin.deleteMany();
    await prisma.subject.deleteMany();
    await prisma.class.deleteMany();
    await prisma.grade.deleteMany();
    await prisma.user.deleteMany();

    const hashedPassword = await bcrypt.hash("password123", 10);

    // ========== TERMS ==========
    console.log("📅 Creating academic terms...");
    const terms = await Promise.all([
        prisma.term.create({
            data: {
                name: "Term 1 - 2026",
                startDate: new Date("2026-01-05"),
                endDate: new Date("2026-04-10"),
                current: true,
            },
        }),
        prisma.term.create({
            data: {
                name: "Term 2 - 2026",
                startDate: new Date("2026-05-04"),
                endDate: new Date("2026-08-07"),
                current: false,
            },
        }),
        prisma.term.create({
            data: {
                name: "Term 3 - 2026",
                startDate: new Date("2026-09-07"),
                endDate: new Date("2026-12-11"),
                current: false,
            },
        }),
    ]);
    console.log(`✅ ${terms.length} terms created`);
    const currentTerm = terms[0]; // Term 1 is current

    // ========== GRADES ==========
    const grades = await Promise.all(
        [1, 2, 3, 4, 5, 6, 7].map((level) =>
            prisma.grade.create({ data: { level } })
        )
    );
    console.log(`✅ ${grades.length} grades created`);

    // ========== CLASSES ==========
    const classData = [
        { name: "1A", capacity: 25, gradeLevel: 1 },
        { name: "1B", capacity: 25, gradeLevel: 1 },
        { name: "2A", capacity: 28, gradeLevel: 2 },
        { name: "2B", capacity: 28, gradeLevel: 2 },
        { name: "3A", capacity: 30, gradeLevel: 3 },
        { name: "3B", capacity: 30, gradeLevel: 3 },
        { name: "4A", capacity: 30, gradeLevel: 4 },
        { name: "4B", capacity: 30, gradeLevel: 4 },
        { name: "5A", capacity: 28, gradeLevel: 5 },
        { name: "5B", capacity: 28, gradeLevel: 5 },
        { name: "6A", capacity: 25, gradeLevel: 6 },
        { name: "7A", capacity: 25, gradeLevel: 7 },
    ];

    const classes = await Promise.all(
        classData.map((c) =>
            prisma.class.create({
                data: {
                    name: c.name,
                    capacity: c.capacity,
                    gradeId: grades.find((g: any) => g.level === c.gradeLevel)!.id,
                },
            })
        )
    );
    console.log(`✅ ${classes.length} classes created`);

    // ========== SUBJECTS ==========
    const subjectData = [
        "Mathematics",
        "English Literature",
        "Physics",
        "Chemistry",
        "Biology",
        "History & Geography",
        "Computer Science",
        "Physical Education",
    ];

    const subjects = await Promise.all(
        subjectData.map((name) => prisma.subject.create({ data: { name } }))
    );
    console.log(`✅ ${subjects.length} subjects created`);

    // ========== USERS + TEACHERS ==========
    const teacherData = [
        { username: "sarah.wilson", name: "Sarah", surname: "Wilson", email: "sarah.wilson@school.com", phone: "+25078001001", address: "12 KG 1 Ave, Kigali", sex: Sex.FEMALE, birthday: new Date("1985-03-15"), subjects: [0, 1] },
        { username: "james.brown", name: "James", surname: "Brown", email: "james.brown@school.com", phone: "+25078001002", address: "45 KG 2 St, Kigali", sex: Sex.MALE, birthday: new Date("1982-07-22"), subjects: [1, 5] },
        { username: "emily.davis", name: "Emily", surname: "Davis", email: "emily.davis@school.com", phone: "+25078001003", address: "78 KG 3 Rd, Kigali", sex: Sex.FEMALE, birthday: new Date("1988-11-08"), subjects: [2, 3] },
        { username: "michael.lee", name: "Michael", surname: "Lee", email: "michael.lee@school.com", phone: "+25078001004", address: "90 KG 4 Ave, Kigali", sex: Sex.MALE, birthday: new Date("1980-01-30"), subjects: [6] },
        { username: "anna.martinez", name: "Anna", surname: "Martinez", email: "anna.martinez@school.com", phone: "+25078001005", address: "15 KG 5 St, Kigali", sex: Sex.FEMALE, birthday: new Date("1987-05-18"), subjects: [4, 5] },
        { username: "robert.taylor", name: "Robert", surname: "Taylor", email: "robert.taylor@school.com", phone: "+25078001006", address: "22 KG 6 Rd, Kigali", sex: Sex.MALE, birthday: new Date("1983-09-12"), subjects: [7] },
        { username: "lisa.anderson", name: "Lisa", surname: "Anderson", email: "lisa.anderson@school.com", phone: "+25078001007", address: "33 KG 7 Ave, Kigali", sex: Sex.FEMALE, birthday: new Date("1990-02-25"), subjects: [1, 6] },
        { username: "david.thomas", name: "David", surname: "Thomas", email: "david.thomas@school.com", phone: "+25078001008", address: "44 KG 8 St, Kigali", sex: Sex.MALE, birthday: new Date("1986-06-14"), subjects: [0, 2] },
        { username: "jennifer.white", name: "Jennifer", surname: "White", email: "jennifer.white@school.com", phone: "+25078001009", address: "55 KG 9 Rd, Kigali", sex: Sex.FEMALE, birthday: new Date("1984-12-01"), subjects: [3, 4] },
        { username: "kevin.harris", name: "Kevin", surname: "Harris", email: "kevin.harris@school.com", phone: "+25078001010", address: "66 KG 10 Ave, Kigali", sex: Sex.MALE, birthday: new Date("1981-04-20"), subjects: [0, 2] },
        { username: "rachel.clark", name: "Rachel", surname: "Clark", email: "rachel.clark@school.com", phone: "+25078001011", address: "77 KG 11 St, Kigali", sex: Sex.FEMALE, birthday: new Date("1989-08-05"), subjects: [1, 5] },
        { username: "daniel.lewis", name: "Daniel", surname: "Lewis", email: "daniel.lewis@school.com", phone: "+25078001012", address: "88 KG 12 Rd, Kigali", sex: Sex.MALE, birthday: new Date("1985-10-28"), subjects: [4, 7] },
    ];

    const teachers: any[] = [];
    for (const t of teacherData) {
        const user = await prisma.user.create({
            data: {
                username: t.username,
                email: t.email,
                password: hashedPassword,
                role: Role.teacher,
            },
        });
        const teacher = await prisma.teacher.create({
            data: {
                id: user.id,
                username: t.username,
                name: t.name,
                surname: t.surname,
                email: t.email,
                phone: t.phone,
                address: t.address,
                sex: t.sex,
                birthday: t.birthday,
                subjects: { connect: t.subjects.map((i: number) => ({ id: subjects[i].id })) },
            },
        });
        teachers.push(teacher);
    }
    console.log(`✅ ${teachers.length} teachers created`);

    // Assign supervisors to classes
    for (let i = 0; i < classes.length; i++) {
        await prisma.class.update({
            where: { id: classes[i].id },
            data: { supervisorId: teachers[i % teachers.length].id },
        });
    }

    // ========== USERS + PARENTS ==========
    const parentNames = [
        { name: "John", surname: "Doe" }, { name: "Jane", surname: "Smith" }, { name: "Peter", surname: "Mugisha" },
        { name: "Alice", surname: "Uwimana" }, { name: "Robert", surname: "Habarurema" }, { name: "Grace", surname: "Iradukunda" },
        { name: "David", surname: "Nshuti" }, { name: "Emma", surname: "Mukamana" }, { name: "Charles", surname: "Bizimana" },
        { name: "Olivia", surname: "Uwase" }, { name: "Frank", surname: "Twagirayezu" }, { name: "Sophie", surname: "Nyirahabimana" },
        { name: "Henry", surname: "Rukundo" }, { name: "Maria", surname: "Murekatete" }, { name: "George", surname: "Ndahiro" },
        { name: "Clara", surname: "Mukandayisenga" }, { name: "Samuel", surname: "Hakizimana" }, { name: "Diana", surname: "Umutoni" },
        { name: "Joseph", surname: "Niyonzima" }, { name: "Rose", surname: "Ingabire" },
    ];

    const parents: any[] = [];
    for (let i = 0; i < 20; i++) {
        const p = parentNames[i];
        const user = await prisma.user.create({
            data: {
                username: `${p.name.toLowerCase()}.${p.surname.toLowerCase()}`,
                email: `${p.name.toLowerCase()}.${p.surname.toLowerCase()}@email.com`,
                password: hashedPassword,
                role: Role.parent,
            },
        });
        const parent = await prisma.parent.create({
            data: {
                id: user.id,
                username: user.username,
                name: p.name,
                surname: p.surname,
                email: user.email,
                phone: `+250780020${String(i + 1).padStart(2, "0")}`,
                address: `${i + 1} Parent Street, Kigali`,
            },
        });
        parents.push(parent);
    }
    console.log(`✅ ${parents.length} parents created`);

    // ========== USERS + STUDENTS (60+) ==========
    const firstNames = ["Liam", "Noah", "Oliver", "Elijah", "James", "William", "Benjamin", "Lucas", "Henry", "Alexander",
        "Emma", "Olivia", "Ava", "Isabella", "Sophia", "Mia", "Charlotte", "Amelia", "Harper", "Evelyn",
        "Abigail", "Emily", "Elizabeth", "Mila", "Ella", "Avery", "Sofia", "Camila", "Aria", "Scarlett",
        "Mason", "Logan", "Ethan", "Jacob", "Michael", "Daniel", "Matthew", "Jackson", "Sebastian", "Jack",
        "Grace", "Chloe", "Victoria", "Riley", "Luna", "Penelope", "Layla", "Zoey", "Nora", "Hannah",
        "Owen", "Gabriel", "Carter", "Jayden", "Luke", "Ryan", "Nathan", "Caleb", "Christian", "Dylan"];
    const lastNames = ["Smith", "Johnson", "Williams", "Brown", "Jones", "Garcia", "Miller", "Davis", "Rodriguez", "Martinez",
        "Hernandez", "Lopez", "Gonzalez", "Wilson", "Anderson", "Thomas", "Taylor", "Moore", "Jackson", "Martin"];

    const students: any[] = [];
    for (let i = 0; i < firstNames.length; i++) {
        const fn = firstNames[i];
        const ln = lastNames[i % lastNames.length];
        const classIndex = Math.floor(i / 6) % classes.length;
        const gradeId = grades[Math.floor(classIndex / 2)].id;
        const sex = i % 3 === 0 ? Sex.FEMALE : Sex.MALE;
        const user = await prisma.user.create({
            data: {
                username: `${fn.toLowerCase()}.${ln.toLowerCase()}${i}`,
                email: `${fn.toLowerCase()}.${ln.toLowerCase()}${i}@student.school.com`,
                password: hashedPassword,
                role: Role.student,
            },
        });
        const student = await prisma.student.create({
            data: {
                id: user.id,
                username: user.username,
                name: fn,
                surname: ln,
                email: user.email,
                phone: `+25078003${String(i + 1).padStart(3, "0")}`,
                address: `${i + 1} Student Road, Kigali`,
                sex,
                birthday: new Date(2010 + Math.floor(Math.random() * 7), Math.floor(Math.random() * 12), Math.floor(Math.random() * 28) + 1),
                classId: classes[classIndex].id,
                gradeId,
                parentId: parents[Math.floor(Math.random() * 20)].id,
            },
        });
        students.push(student);
    }
    console.log(`✅ ${students.length} students created`);

    // ========== ADMINS ==========
    const adminUser = await prisma.user.create({
        data: { username: "admin", email: "admin@school.com", password: hashedPassword, role: Role.admin },
    });
    await prisma.admin.create({ data: { id: adminUser.id, username: "admin" } });
    console.log("✅ Admin created (admin@school.com / password123)");

    // ========== LESSONS (Timetable) with Term ==========
    console.log("📚 Creating lessons for current term...");
    const lessonNames = [
        "Morning Math", "English Core", "Physics Lab", "Chemistry Theory",
        "Biology Practical", "History Class", "CS Workshop", "PE Session"
    ];
    const lessons: any[] = [];
    const startTimes = [8, 9, 10, 11, 13, 14, 15];
    const days = [Day.MONDAY, Day.TUESDAY, Day.WEDNESDAY, Day.THURSDAY, Day.FRIDAY];

    // Weekly topics per subject
    const weeklyTopics: Record<string, string[]> = {
        "Mathematics": ["Algebra Basics", "Linear Equations", "Quadratic Functions", "Geometry Intro", "Trigonometry", "Statistics", "Probability", "Calculus Preview"],
        "English Literature": ["Grammar Review", "Essay Writing", "Poetry Analysis", "Shakespeare", "Modern Prose", "Creative Writing", "Comprehension", "Debate Prep"],
        "Physics": ["Kinematics", "Newton's Laws", "Energy & Work", "Waves & Sound", "Light & Optics", "Electricity", "Magnetism", "Nuclear Physics"],
        "Chemistry": ["Atomic Structure", "Periodic Table", "Chemical Bonds", "Stoichiometry", "Acids & Bases", "Organic Chemistry", "Thermodynamics", "Lab Safety"],
        "Biology": ["Cell Structure", "Genetics", "Evolution", "Ecology", "Human Anatomy", "Plant Biology", "Microbiology", "Biotechnology"],
        "History & Geography": ["Ancient Civilizations", "World Wars", "Cold War Era", "African History", "Physical Geography", "Climate & Weather", "Population Studies", "Economic Geography"],
        "Computer Science": ["Programming Basics", "Data Structures", "Algorithms", "Web Development", "Databases", "Networking", "Cybersecurity", "AI Fundamentals"],
        "Physical Education": ["Fitness Basics", "Team Sports", "Athletics", "Gymnastics", "Swimming", "Health & Nutrition", "First Aid", "Sports Leadership"],
    };

    for (const cls of classes) {
        for (let slot = 0; slot < 7; slot++) {
            const subjectIndex = (cls.id + slot) % subjects.length;
            const teacherIndex = (cls.id + slot) % teachers.length;
            const day = days[slot % 5];
            const hour = startTimes[slot];
            const hourString = String(hour).padStart(2, "0");
            const subjectName = subjects[subjectIndex].name;

            const lesson = await prisma.lesson.create({
                data: {
                    name: `${subjectName}`,
                    day,
                    startTime: new Date(`2026-01-01T${hourString}:00:00`),
                    endTime: new Date(`2026-01-01T${hourString}:45:00`),
                    subjectId: subjects[subjectIndex].id,
                    classId: cls.id,
                    teacherId: teachers[teacherIndex].id,
                    termId: currentTerm.id,
                },
            });
            lessons.push(lesson);

            // Create weekly topics for this lesson (8 weeks per term)
            const topics = weeklyTopics[subjectName] || ["Introduction", "Core Concepts", "Advanced Topics", "Review", "Practice", "Assessment", "Project Work", "Revision"];
            for (let week = 1; week <= 8; week++) {
                await prisma.lessonTopic.create({
                    data: {
                        lessonId: lesson.id,
                        weekNumber: week,
                        topic: topics[week - 1] || `Week ${week} Topic`,
                    },
                });
            }
        }
    }
    console.log(`✅ ${lessons.length} lessons created with weekly topics`);

    // ========== EXAMS ==========
    const exams: any[] = [];
    for (const cls of classes) {
        for (let s = 0; s < 3; s++) {
            const exam = await prisma.exam.create({
                data: {
                    title: `Mid-Term ${subjects[s].name}`,
                    startTime: new Date(`2026-03-${10 + s}T09:00:00`),
                    endTime: new Date(`2026-03-${10 + s}T11:00:00`),
                    lessonId: lessons[cls.id * 2 + s]?.id || lessons[0].id,
                },
            });
            exams.push(exam);
        }
    }
    console.log(`✅ ${exams.length} exams created`);

    // ========== ASSIGNMENTS ==========
    const assignments: any[] = [];
    for (const cls of classes) {
        for (let a = 0; a < 2; a++) {
            const assignment = await prisma.assignment.create({
                data: {
                    title: `${subjects[a].name} Assignment`,
                    startDate: new Date(`2026-02-${15 + a}`),
                    dueDate: new Date(`2026-02-${25 + a}`),
                    lessonId: lessons[cls.id * 2 + a]?.id || lessons[0].id,
                },
            });
            assignments.push(assignment);
        }
    }
    console.log(`✅ ${assignments.length} assignments created`);

    // ========== RESULTS (Grades) ==========
    let resultCount = 0;
    for (const student of students) {
        for (const exam of exams.slice(0, 3)) {
            await prisma.result.create({
                data: {
                    score: Math.floor(Math.random() * 41) + 60,
                    studentId: student.id,
                    examId: exam.id,
                },
            });
            resultCount++;
        }
        for (const assignment of assignments.slice(0, 2)) {
            await prisma.result.create({
                data: {
                    score: Math.floor(Math.random() * 31) + 70,
                    studentId: student.id,
                    assignmentId: assignment.id,
                },
            });
            resultCount++;
        }
    }
    console.log(`✅ ${resultCount} results created`);

    // ========== ATTENDANCE ==========
    let attendanceCount = 0;
    for (const student of students.slice(0, 30)) {
        for (const lesson of lessons.slice(0, 5)) {
            await prisma.attendance.create({
                data: {
                    date: new Date("2026-02-11"),
                    present: Math.random() > 0.15,
                    studentId: student.id,
                    lessonId: lesson.id,
                },
            });
            attendanceCount++;
        }
    }
    console.log(`✅ ${attendanceCount} attendance records created`);

    // ========== EVENTS ==========
    const eventData = [
        { title: "Science Fair", description: "Annual science exhibition", startTime: new Date("2026-02-20T09:00:00"), endTime: new Date("2026-02-20T15:00:00") },
        { title: "Sports Day", description: "Inter-class competitions", startTime: new Date("2026-03-01T08:00:00"), endTime: new Date("2026-03-01T16:00:00") },
        { title: "Parent-Teacher Meeting", description: "Termly progress discussion", startTime: new Date("2026-03-15T14:00:00"), endTime: new Date("2026-03-15T17:00:00") },
        { title: "Graduation Ceremony", description: "Grade 7 graduation", startTime: new Date("2026-04-10T10:00:00"), endTime: new Date("2026-04-10T13:00:00") },
        { title: "Staff Training", description: "Teacher development workshop", startTime: new Date("2026-01-25T08:00:00"), endTime: new Date("2026-01-25T12:00:00") },
    ];
    for (const e of eventData) {
        await prisma.event.create({ data: e });
    }
    console.log(`✅ ${eventData.length} events created`);

    // ========== ANNOUNCEMENTS ==========
    const announcementData = [
        { title: "Welcome Back to School!", description: "Welcome to Term 1 2026. Classes begin January 5th.", date: new Date("2026-01-03") },
        { title: "Mid-Term Exams Schedule", description: "Mid-term exams start March 10. Check notice board for timetable.", date: new Date("2026-02-25") },
        { title: "Fee Payment Reminder", description: "First installment due by January 25. Late fees apply after deadline.", date: new Date("2026-01-15") },
        { title: "New Library Books", description: "200 new books available in the library. Visit during break times.", date: new Date("2026-01-10") },
        { title: "PTA Meeting", description: "Parent-Teacher Association meeting on March 15. All parents welcome.", date: new Date("2026-03-01") },
    ];
    for (const a of announcementData) {
        await prisma.announcement.create({ data: a });
    }
    console.log(`✅ ${announcementData.length} announcements created`);

    console.log("\n🎉 Database seeded successfully!");
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    console.log("📅 Terms:   Term 1 (current), Term 2, Term 3 - 2026");
    console.log("📚 Lessons: 84 lessons with 8 weekly topics each");
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    console.log("📧 Admin:    admin@school.com / password123");
    console.log("📧 Teacher:  sarah.wilson@school.com / password123");
    console.log("📧 Student:  liam.smith0@student.school.com / password123");
    console.log("📧 Parent:   john.doe@email.com / password123");
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
}


// ========== FEES & PAYMENTS ==========
console.log("💰 Creating fee records...");
let feeCount = 0;
let paymentCount = 0;

const feeTypes = [
  { type: "tuition", label: "Tuition Fee", baseAmount: 500 },
  { type: "library", label: "Library Fee", baseAmount: 50 },
  { type: "lab", label: "Lab Fee", baseAmount: 100 },
  { type: "activity", label: "Activity Fee", baseAmount: 75 },
  { type: "transport", label: "Transport Fee", baseAmount: 150 },
];

for (const student of students.slice(0, 30)) {
  for (const ft of feeTypes) {
    const fee = await prisma.fee.create({
      data: {
        studentId: student.id,
        type: ft.type,
        amount: ft.baseAmount,
        dueDate: new Date("2026-03-30"),
        paidAmount: Math.random() > 0.3 ? ft.baseAmount : 0,
        status: Math.random() > 0.3 ? "paid" : "pending",
      },
    });
    feeCount++;

    // Create payment if paid
    if (fee.status === "paid") {
      await prisma.payment.create({
        data: {
          feeId: fee.id,
          amount: fee.amount,
          method: ["cash", "bank_transfer", "credit_card"][Math.floor(Math.random() * 3)],
          reference: `TXN-${Date.now()}-${fee.id}`,
          status: "completed",
          date: new Date("2026-02-15"),
        },
      });
      paymentCount++;
    }
  }
}
console.log(`✅ ${feeCount} fees and ${paymentCount} payments created`);

main()
    .catch((e) => {
        console.error("❌ Seed failed:", e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
        await pool.end();
    });