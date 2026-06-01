import { redirect } from "next/navigation";

export default function TeacherExamRedirectPage() {
  redirect("/dashboard/teacher/exams");
}
