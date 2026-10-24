
import Dexie from "dexie";

export const db = new Dexie("NourinNEET");

db.version(2).stores({
  tasks: "++id, title, done, createdAt",
  subjects: "name",
  chapters: "++id, subject, title, status",
  timetable: "++id, date, startTime",
  testScores: "++id, date, totalScore",
});

export async function seedInitialTasks(tasks) {
  const count = await db.tasks.count();

  if (count === 0) {
    await db.tasks.bulkAdd(
      tasks.map((task) => ({
        title: task.title,
        detail: task.detail,
        done: task.done,
        createdAt: new Date().toISOString(),
      }))
    );
  }
}

export async function seedOfficialSyllabus(syllabus) {
  const existingChapters = await db.chapters.toArray();
  const newChapters = [];

  for (const [subject, titles] of Object.entries(syllabus)) {
    for (const title of titles) {
      const alreadyExists = existingChapters.some(
        (chapter) =>
          chapter.subject === subject &&
          chapter.title.trim().toLowerCase() === title.trim().toLowerCase()
      );

      if (!alreadyExists) {
        newChapters.push({
          subject,
          title,
          status: "Not started",
          isOfficial: true,
          createdAt: new Date().toISOString(),
        });
      }
    }
  }

  if (newChapters.length > 0) {
    await db.chapters.bulkAdd(newChapters);
  }
}