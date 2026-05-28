import BigCalendar from "@/component/BigCalendar";
import { prisma } from "@/lib/prisma";
import { Day } from "@/generated/prisma/client";

const BigCalendarContainer = async ({
  type,
  id,
}: {
  type: "classId" | "teacherId";
  id: string;
}) => {
  const res = await prisma.lesson.findMany({
    where: {
      ...(type === "teacherId"
        ? { teacherId: id as string }
        : { classId: Number(id) }),
    },
    include: {
      subject: true,
    },
  });

  const getLocalDateForDay = (day: Day, originalDate: Date): Date => {
    const dayMap: Record<Day, number> = {
      MONDAY: 1,
      TUESDAY: 2,
      WEDNESDAY: 3,
      THURSDAY: 4,
      FRIDAY: 5,
    };
    const targetDayOfWeek = dayMap[day] || 1;
    const now = new Date();
    const currentDayOfWeek = now.getDay(); // 0 is Sunday, 1 is Monday, etc.
    const distance = targetDayOfWeek - currentDayOfWeek;
    const date = new Date();
    date.setDate(now.getDate() + distance);
    
    // Set hours and minutes based on the database time
    date.setHours(originalDate.getHours(), originalDate.getMinutes(), 0, 0);
    return date;
  };

  const events = res.map((lesson) => {
    const start = getLocalDateForDay(lesson.day, lesson.startTime);
    const end = getLocalDateForDay(lesson.day, lesson.endTime);
    return {
      id: lesson.id,
      title: lesson.subject.name,
      start: start.toISOString(),
      end: end.toISOString(),
    };
  });

  return <BigCalendar events={events} />;
};

export default BigCalendarContainer;