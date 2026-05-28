// ============================================================
// APP SETTINGS — Centralized constants for the entire app
// ============================================================

// Pagination
export const ITEM_PER_PAGE = 8;

// School Info
export const SCHOOL_NAME = "SchoolSMS";
export const SCHOOL_ACRONYM = "SMS";
export const SCHOOL_ADDRESS = "123 Education Lane, Learning City, LC 10001";
export const SCHOOL_PHONE = "+1 (555) 123-4567";
export const SCHOOL_EMAIL = "info@schoolsms.com";
export const SCHOOL_WEBSITE = "www.schoolsms.com";

// Academic Year
export const CURRENT_ACADEMIC_YEAR = "2025/26";
export const CURRENT_TERM = "Second Term";

// Time
export const SCHOOL_START_TIME = "08:00";
export const SCHOOL_END_TIME = "17:00";
export const PERIOD_DURATION_MINUTES = 45;

// Roles
export const ROLES = ["admin", "teacher", "student", "parent"] as const;
export type Role = (typeof ROLES)[number];

// Blood Types
export const BLOOD_TYPES = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"] as const;

// Gender
export const GENDER_OPTIONS = ["MALE", "FEMALE"] as const;

// Exam Types
export const EXAM_TYPES = ["Mid-Term", "Final", "Unit Test", "Pre-Board"] as const;

// Priority Levels
export const PRIORITY_LEVELS = ["High", "Medium", "Low"] as const;

// Audience Types
export const AUDIENCE_TYPES = ["All", "Teachers", "Students", "Parents", "Staff"] as const;

// Announcement Audience (subset)
export const ANNOUNCEMENT_AUDIENCE = ["All", "Teachers", "Students", "Parents"] as const;

// Status Types
export const STATUS_TYPES = ["Upcoming", "Ongoing", "Completed"] as const;

// Grade Levels
export const GRADE_LEVELS = [
  { id: "1", level: 1, label: "Grade 1" },
  { id: "2", level: 2, label: "Grade 2" },
  { id: "3", level: 3, label: "Grade 3" },
  { id: "4", level: 4, label: "Grade 4" },
  { id: "5", level: 5, label: "Grade 5" },
  { id: "6", level: 6, label: "Grade 6" },
  { id: "7", level: 7, label: "Grade 7" },
] as const;

// Available Subjects List
export const SUBJECTS = [
  "Mathematics",
  "English",
  "Physics",
  "Chemistry",
  "Biology",
  "History",
  "Geography",
  "Computer Science",
  "French",
  "Spanish",
  "Art",
  "Music",
  "Physical Education",
  "Economics",
  "Literature",
] as const;

// Available Classes/Sections
export const CLASS_SECTIONS = [
  "1A", "1B",
  "2A", "2B",
  "3A", "3B", "3C",
  "4A", "4B",
  "5A", "5B",
  "6A", "6B", "6C", "6D",
  "7A",
] as const;

// Date Formats
export const DATE_FORMAT = "yyyy-MM-dd";
export const DISPLAY_DATE_FORMAT = "MMM dd, yyyy";
export const DISPLAY_DATE_TIME_FORMAT = "MMM dd, yyyy HH:mm";

// Theme Colors (for charts, badges, etc.)
export const CHART_COLORS = {
  primary: "#3B82F6",    // blue-500
  success: "#10B981",    // emerald-500
  warning: "#F59E0B",    // amber-500
  danger: "#EF4444",     // red-500
  purple: "#8B5CF6",     // violet-500
  pink: "#EC4899",       // pink-500
  teal: "#14B8A6",       // teal-500
  orange: "#F97316",     // orange-500
};

// File Upload
export const MAX_FILE_SIZE_MB = 5;
export const ALLOWED_FILE_TYPES = ["image/jpeg", "image/png", "image/webp", "application/pdf"];

// Toast Duration
export const TOAST_DURATION_MS = 4000;

// Debounce Delay
export const SEARCH_DEBOUNCE_MS = 300;