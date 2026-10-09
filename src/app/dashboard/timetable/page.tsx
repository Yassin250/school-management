import { requireCurrentUser } from "@/lib/auth/session";
import { getTimetableEditorData } from "@/lib/services/timetable/timetable";
import { TimetableClient } from "./timetable-client";

export const metadata = {
  title: "School Timetable & Schedule Management",
};

interface TimetablePageProps {
  searchParams: Promise<{
    classId?: string;
    teacherId?: string;
  }>;
}

export default async function TimetablePage({ searchParams }: TimetablePageProps) {
  const user = await requireCurrentUser();
  const params = await searchParams;

  const data = await getTimetableEditorData(
    user,
    params.classId,
    params.teacherId,
  );

  return (
    <TimetableClient
      canManage={data.canManage}
      activeYear={data.activeYear ? { id: data.activeYear.id, name: data.activeYear.name } : null}
      activeTerm={data.activeTerm ? { id: data.activeTerm.id, name: data.activeTerm.name } : null}
      classes={data.classes}
      teachers={data.teachers}
      subjects={data.subjects}
      modules={data.modules}
      selectedClassId={data.selectedClassId}
      selectedTeacherId={data.selectedTeacherId}
      schedule={data.schedule}
      teacherSchedule={data.teacherSchedule}
    />
  );
}
