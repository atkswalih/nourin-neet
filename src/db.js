
import Dexie from "dexie";

export const db = new Dexie("NourinNEET");

db.version(1).stores({
  tasks: "++id, title, done, createdAt",
  subjects: "name",
  chapters: "++id, subject, title, status",
  timetable: "++id, date, startTime",
  testScores: "++id, date, subject, score",
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
