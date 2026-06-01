-- CreateTable
CREATE TABLE "terms" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3) NOT NULL,
    "current" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "terms_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "lesson_topics" (
    "id" SERIAL NOT NULL,
    "lessonId" INTEGER NOT NULL,
    "weekNumber" INTEGER NOT NULL,
    "topic" TEXT NOT NULL,

    CONSTRAINT "lesson_topics_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "terms_name_key" ON "terms"("name");

-- CreateIndex
CREATE UNIQUE INDEX "lesson_topics_lessonId_weekNumber_key" ON "lesson_topics"("lessonId", "weekNumber");

-- AlterTable
ALTER TABLE "lessons" ADD COLUMN "termId" INTEGER;

-- AddForeignKey
ALTER TABLE "lessons" ADD CONSTRAINT "lessons_termId_fkey" FOREIGN KEY ("termId") REFERENCES "terms"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lesson_topics" ADD CONSTRAINT "lesson_topics_lessonId_fkey" FOREIGN KEY ("lessonId") REFERENCES "lessons"("id") ON DELETE CASCADE ON UPDATE CASCADE;
