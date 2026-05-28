// ============================================================
// TEMPORARY MOCK DATA — Replace with Prisma/API calls later
// ============================================================

export const teachersData = [
  { id: "1", teacherId: "TCH-001", name: "John Doe", email: "john@doe.com", phone: "123-456-7890", subjects: ["Math", "Geometry"], classes: ["1B", "2A", "3C"], address: "123 Main St, Anytown, USA" },
  { id: "2", teacherId: "TCH-002", name: "Jane Doe", email: "jane@doe.com", phone: "123-456-7891", subjects: ["Physics", "Chemistry"], classes: ["5A", "4B", "3C"], address: "456 Oak Ave, Anytown, USA" },
  { id: "3", teacherId: "TCH-003", name: "Mike Geller", email: "mike@geller.com", phone: "123-456-7892", subjects: ["Biology"], classes: ["5A", "4B", "3C"], address: "789 Pine Rd, Anytown, USA" },
  { id: "4", teacherId: "TCH-004", name: "Jay French", email: "jay@gmail.com", phone: "123-456-7893", subjects: ["History"], classes: ["5A", "4B", "3C"], address: "321 Elm St, Anytown, USA" },
  { id: "5", teacherId: "TCH-005", name: "Jane Smith", email: "jane@gmail.com", phone: "123-456-7894", subjects: ["Music", "History"], classes: ["5A", "4B", "3C"], address: "654 Maple Dr, Anytown, USA" },
  { id: "6", teacherId: "TCH-006", name: "Anna Santiago", email: "anna@gmail.com", phone: "123-456-7895", subjects: ["Physics"], classes: ["5A", "4B", "3C"], address: "987 Cedar Ln, Anytown, USA" },
  { id: "7", teacherId: "TCH-007", name: "Allen Black", email: "allen@black.com", phone: "123-456-7896", subjects: ["English", "Spanish"], classes: ["5A", "4B", "3C"], address: "147 Birch Ct, Anytown, USA" },
  { id: "8", teacherId: "TCH-008", name: "Ophelia Castro", email: "ophelia@castro.com", phone: "123-456-7897", subjects: ["Math", "Geometry"], classes: ["5A", "4B", "3C"], address: "258 Walnut Way, Anytown, USA" },
  { id: "9", teacherId: "TCH-009", name: "Derek Briggs", email: "derek@briggs.com", phone: "123-456-7898", subjects: ["Literature", "English"], classes: ["5A", "4B", "3C"], address: "369 Spruce Cir, Anytown, USA" },
  { id: "10", teacherId: "TCH-010", name: "John Glover", email: "john@glover.com", phone: "123-456-7899", subjects: ["Biology"], classes: ["5A", "4B", "3C"], address: "741 Ash Ter, Anytown, USA" },
];

export const studentsData = [
  { id: "1", studentId: "STU-001", name: "John Doe", email: "john@doe.com", phone: "123-456-7890", grade: 5, class: "1B", address: "123 Main St, Anytown, USA", sex: "MALE", birthday: "2012-04-15", bloodType: "A+", parentId: "1" },
  { id: "2", studentId: "STU-002", name: "Jane Doe", email: "jane@doe.com", phone: "123-456-7891", grade: 5, class: "5A", address: "456 Oak Ave, Anytown, USA", sex: "FEMALE", birthday: "2012-06-20", bloodType: "B+", parentId: "2" },
  { id: "3", studentId: "STU-003", name: "Mike Geller", email: "mike@geller.com", phone: "123-456-7892", grade: 5, class: "5A", address: "789 Pine Rd, Anytown, USA", sex: "MALE", birthday: "2012-01-10", bloodType: "O+", parentId: "3" },
  { id: "4", studentId: "STU-004", name: "Jay French", email: "jay@gmail.com", phone: "123-456-7893", grade: 5, class: "5A", address: "321 Elm St, Anytown, USA", sex: "MALE", birthday: "2012-09-05", bloodType: "A-", parentId: "4" },
  { id: "5", studentId: "STU-005", name: "Jane Smith", email: "jane@gmail.com", phone: "123-456-7894", grade: 5, class: "5A", address: "654 Maple Dr, Anytown, USA", sex: "FEMALE", birthday: "2012-03-22", bloodType: "AB+", parentId: "5" },
  { id: "6", studentId: "STU-006", name: "Anna Santiago", email: "anna@gmail.com", phone: "123-456-7895", grade: 5, class: "5A", address: "987 Cedar Ln, Anytown, USA", sex: "FEMALE", birthday: "2012-11-18", bloodType: "B-", parentId: "6" },
  { id: "7", studentId: "STU-007", name: "Allen Black", email: "allen@black.com", phone: "123-456-7896", grade: 5, class: "5A", address: "147 Birch Ct, Anytown, USA", sex: "MALE", birthday: "2012-07-30", bloodType: "O-", parentId: "7" },
  { id: "8", studentId: "STU-008", name: "Ophelia Castro", email: "ophelia@castro.com", phone: "123-456-7897", grade: 5, class: "5A", address: "258 Walnut Way, Anytown, USA", sex: "FEMALE", birthday: "2012-12-12", bloodType: "A+", parentId: "8" },
  { id: "9", studentId: "STU-009", name: "Derek Briggs", email: "derek@briggs.com", phone: "123-456-7898", grade: 5, class: "5A", address: "369 Spruce Cir, Anytown, USA", sex: "MALE", birthday: "2012-02-28", bloodType: "AB-", parentId: "9" },
  { id: "10", studentId: "STU-010", name: "John Glover", email: "john@glover.com", phone: "123-456-7899", grade: 5, class: "5A", address: "741 Ash Ter, Anytown, USA", sex: "MALE", birthday: "2012-05-14", bloodType: "B+", parentId: "10" },
];

export const parentsData = [
  { id: "1", name: "John Doe Sr.", email: "john.sr@doe.com", phone: "123-456-7800", address: "123 Main St, Anytown, USA", children: ["Sarah Brewer"] },
  { id: "2", name: "Jane Doe Sr.", email: "jane.sr@doe.com", phone: "123-456-7801", address: "456 Oak Ave, Anytown, USA", children: ["Cecilia Bradley"] },
  { id: "3", name: "Mike Geller Sr.", email: "mike.sr@geller.com", phone: "123-456-7802", address: "789 Pine Rd, Anytown, USA", children: ["Fanny Caldwell"] },
  { id: "4", name: "Jay French Sr.", email: "jay.sr@gmail.com", phone: "123-456-7803", address: "321 Elm St, Anytown, USA", children: ["Mollie Fitzgerald", "Ian Bryant"] },
  { id: "5", name: "Jane Smith Sr.", email: "jane.sr@gmail.com", phone: "123-456-7804", address: "654 Maple Dr, Anytown, USA", children: ["Mable Harvey"] },
  { id: "6", name: "Anna Santiago Sr.", email: "anna.sr@gmail.com", phone: "123-456-7805", address: "987 Cedar Ln, Anytown, USA", children: ["Joel Lambert"] },
  { id: "7", name: "Allen Black Sr.", email: "allen.sr@black.com", phone: "123-456-7806", address: "147 Birch Ct, Anytown, USA", children: ["Carrie Tucker", "Lilly Underwood"] },
  { id: "8", name: "Ophelia Castro Sr.", email: "ophelia.sr@castro.com", phone: "123-456-7807", address: "258 Walnut Way, Anytown, USA", children: ["Alexander Blair"] },
  { id: "9", name: "Derek Briggs Sr.", email: "derek.sr@briggs.com", phone: "123-456-7808", address: "369 Spruce Cir, Anytown, USA", children: ["Susan Webster", "Maude Stone"] },
  { id: "10", name: "John Glover Sr.", email: "john.sr@glover.com", phone: "123-456-7809", address: "741 Ash Ter, Anytown, USA", children: ["Stella Scott"] },
];

export const subjectsData = [
  { id: "1", name: "Mathematics", code: "MATH-101", teachers: ["John Doe", "Ophelia Castro"], classes: ["1B", "2A", "3C", "5A", "4B"], periodsPerWeek: 5 },
  { id: "2", name: "English", code: "ENG-101", teachers: ["Allen Black", "Derek Briggs"], classes: ["5A", "4B", "3C"], periodsPerWeek: 5 },
  { id: "3", name: "Physics", code: "PHY-101", teachers: ["Jane Doe", "Anna Santiago"], classes: ["5A", "4B", "3C"], periodsPerWeek: 4 },
  { id: "4", name: "Chemistry", code: "CHM-101", teachers: ["Jane Doe"], classes: ["5A", "4B"], periodsPerWeek: 4 },
  { id: "5", name: "Biology", code: "BIO-101", teachers: ["Mike Geller", "John Glover"], classes: ["5A", "4B", "3C"], periodsPerWeek: 4 },
  { id: "6", name: "History", code: "HIS-101", teachers: ["Jay French", "Jane Smith"], classes: ["5A", "4B", "3C"], periodsPerWeek: 3 },
  { id: "7", name: "Geography", code: "GEO-101", teachers: ["Jay French"], classes: ["2A", "3C"], periodsPerWeek: 3 },
  { id: "8", name: "Art", code: "ART-101", teachers: ["Jane Smith"], classes: ["1B", "2A"], periodsPerWeek: 2 },
  { id: "9", name: "Music", code: "MUS-101", teachers: ["Jane Smith"], classes: ["1B", "2A"], periodsPerWeek: 2 },
  { id: "10", name: "Literature", code: "LIT-101", teachers: ["Derek Briggs"], classes: ["5A", "4B", "3C"], periodsPerWeek: 3 },
];

export const classesData = [
  { id: "1", name: "1A", capacity: 20, grade: 1, supervisor: "Joseph Padilla", section: "A" },
  { id: "2", name: "2B", capacity: 22, grade: 2, supervisor: "Blake Joseph", section: "B" },
  { id: "3", name: "3C", capacity: 20, grade: 3, supervisor: "Tom Bennett", section: "C" },
  { id: "4", name: "4B", capacity: 18, grade: 4, supervisor: "Aaron Collins", section: "B" },
  { id: "5", name: "5A", capacity: 16, grade: 5, supervisor: "Iva Frank", section: "A" },
  { id: "6", name: "5B", capacity: 20, grade: 5, supervisor: "Leila Santos", section: "B" },
  { id: "7", name: "7A", capacity: 18, grade: 7, supervisor: "Carrie Walton", section: "A" },
  { id: "8", name: "6B", capacity: 22, grade: 6, supervisor: "Christopher Butler", section: "B" },
  { id: "9", name: "6C", capacity: 18, grade: 6, supervisor: "Marc Miller", section: "C" },
  { id: "10", name: "6D", capacity: 20, grade: 6, supervisor: "Ophelia Marsh", section: "D" },
];

export const examsData = [
  { id: "1", name: "Mid-Term Mathematics", type: "Mid-Term" as const, startDate: "2026-05-08", endDate: "2026-05-08", classes: ["1B", "2A", "3C"], subjects: 1, status: "Upcoming" as const },
  { id: "2", name: "Unit Test - English", type: "Unit Test" as const, startDate: "2026-04-20", endDate: "2026-04-20", classes: ["5A", "4B"], subjects: 1, status: "Completed" as const },
  { id: "3", name: "Final Physics Exam", type: "Final" as const, startDate: "2026-07-15", endDate: "2026-07-15", classes: ["5A", "4B", "3C"], subjects: 1, status: "Upcoming" as const },
  { id: "4", name: "Pre-Board Chemistry", type: "Pre-Board" as const, startDate: "2026-06-20", endDate: "2026-06-22", classes: ["5A", "4B"], subjects: 1, status: "Upcoming" as const },
  { id: "5", name: "Unit Test - Biology", type: "Unit Test" as const, startDate: "2026-04-25", endDate: "2026-04-25", classes: ["5A", "4B", "3C"], subjects: 1, status: "Completed" as const },
];

export const eventsData = [
  { id: "1", title: "Lake Trip", date: "2026-05-15", time: "10:00 AM - 2:00 PM", location: "Lakeview Park", audience: "Students" as const, organizer: "John Doe" },
  { id: "2", title: "Science Fair", date: "2026-05-20", time: "9:00 AM - 12:00 PM", location: "Main Hall", audience: "All" as const, organizer: "Jane Doe" },
  { id: "3", title: "Parent-Teacher Meeting", date: "2026-05-25", time: "2:00 PM - 5:00 PM", location: "Auditorium", audience: "Parents" as const, organizer: "Mike Geller" },
  { id: "4", title: "Sports Day", date: "2026-06-01", time: "8:00 AM - 3:00 PM", location: "Sports Ground", audience: "All" as const, organizer: "Jay French" },
  { id: "5", title: "Music Concert", date: "2026-06-10", time: "5:00 PM - 7:00 PM", location: "Auditorium", audience: "All" as const, organizer: "Jane Smith" },
];

export const announcementsData = [
  { id: "1", title: "Mid-Term Schedule Posted", description: "Mid-Term exam schedule is now available on the notice board.", date: "2026-05-01", audience: "All" as const, author: "Admin", pinned: true, priority: "High" as const },
  { id: "2", title: "Fee Payment Reminder", description: "Last date for fee payment is May 15.", date: "2026-05-03", audience: "Parents" as const, author: "Finance Dept", pinned: false, priority: "Medium" as const },
  { id: "3", title: "New Library Books", description: "200 new books added to the library.", date: "2026-05-05", audience: "Students" as const, author: "Librarian", pinned: false, priority: "Low" as const },
  { id: "4", title: "Staff Meeting", description: "Mandatory staff meeting on Friday at 3 PM.", date: "2026-05-07", audience: "Teachers" as const, author: "Principal", pinned: true, priority: "High" as const },
  { id: "5", title: "Holiday Notice", description: "School closed on May 29 for Memorial Day.", date: "2026-05-10", audience: "All" as const, author: "Admin", pinned: false, priority: "Medium" as const },
];

export const calendarEvents = [
  { title: "Math", allDay: false, start: new Date(2026, 4, 11, 8, 0), end: new Date(2026, 4, 11, 8, 45) },
  { title: "English", allDay: false, start: new Date(2026, 4, 11, 9, 0), end: new Date(2026, 4, 11, 9, 45) },
  { title: "Biology", allDay: false, start: new Date(2026, 4, 11, 10, 0), end: new Date(2026, 4, 11, 10, 45) },
  { title: "Physics", allDay: false, start: new Date(2026, 4, 11, 11, 0), end: new Date(2026, 4, 11, 11, 45) },
  { title: "Chemistry", allDay: false, start: new Date(2026, 4, 11, 13, 0), end: new Date(2026, 4, 11, 13, 45) },
  { title: "History", allDay: false, start: new Date(2026, 4, 12, 14, 0), end: new Date(2026, 4, 12, 14, 45) },
  { title: "Math", allDay: false, start: new Date(2026, 4, 13, 8, 0), end: new Date(2026, 4, 13, 8, 45) },
  { title: "English", allDay: false, start: new Date(2026, 4, 13, 9, 0), end: new Date(2026, 4, 13, 9, 45) },
];

