
import { useEffect, useState } from "react";
import { db, seedInitialTasks } from "./db";
import "./App.css";

const subjects = [
  { name: "Physics", subtitle: "Understand & solve", icon: "⚡", color: "lavender" },
  { name: "Chemistry", subtitle: "Learn & remember", icon: "🧪", color: "peach" },
  { name: "Biology", subtitle: "Read & revise", icon: "🌿", color: "mint" },
];

const initialTasks = [
  { title: "Revise today's class notes", detail: "30 minutes", done: false },
  { title: "Practise Physics MCQs", detail: "20 questions", done: false },
  { title: "Review Biology NCERT", detail: "One focused session", done: false },
];

function App() {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;

    async function loadTasks() {
      try {
        await seedInitialTasks(initialTasks);
        const savedTasks = await db.tasks.toArray();

        if (active) setTasks(savedTasks);
      } catch (err) {
        console.error("Could not load study tasks:", err);
        if (active) setError("Couldn't load saved tasks. Please refresh the app.");
      } finally {
        if (active) setLoading(false);
      }
    }

    loadTasks();

    return () => {
      active = false;
    };
  }, []);

  async function toggleTask(id, done) {
    try {
      await db.tasks.update(id, { done });
      setTasks((current) =>
        current.map((task) => (task.id === id ? { ...task, done } : task))
      );
      setError("");
    } catch (err) {
      console.error("Could not save study task:", err);
      setError("Your change couldn't be saved. Please try again.");
    }
  }

  const completed = tasks.filter((task) => task.done).length;
  const progress = tasks.length
    ? Math.round((completed / tasks.length) * 100)
    : 0;

  return (
    <main className="app-shell">
      <header className="topbar">
        <a className="brand" href="#home">
          <span className="brand-icon">n.</span>
          <span>Nourin <strong>NEET</strong></span>
        </a>
        <span className="offline-pill">
          <span className="status-dot" />
          Saved on this device
        </span>
      </header>

      <section className="welcome" id="home">
        <p className="eyebrow">YOUR JOURNEY, YOUR PACE ✨</p>
        <h1>Little steps,<br /> <span>big dreams.</span></h1>
        <p className="welcome-copy">
          Every chapter you learn brings you closer to your dream of becoming a doctor.
        </p>
        <div className="dream-card">
          <div>
            <span className="dream-label">YOUR BIG DREAM</span>
            <h2>Future doctor 🩺</h2>
            <p>One day at a time, Nourin.</p>
          </div>
          <span className="dream-flower">✿</span>
        </div>
      </section>

      <section className="section-block">
        <div className="section-heading">
          <div>
            <p className="eyebrow">YOUR LEARNING</p>
            <h2>Subject corner</h2>
          </div>
          <span className="soft-label">3 subjects</span>
        </div>

        <div className="subject-grid">
          {subjects.map((subject) => (
            <article className={`subject-card ${subject.color}`} key={subject.name}>
              <span className="subject-icon">{subject.icon}</span>
              <h3>{subject.name}</h3>
              <p>{subject.subtitle}</p>
              <div className="progress-track">
                <span style={{ width: "0%" }} />
              </div>
              <span className="subject-progress">Ready when you are</span>
            </article>
          ))}
        </div>
      </section>

      <section className="section-block today-section">
        <div className="section-heading">
          <div>
            <p className="eyebrow">A FRESH START</p>
            <h2>Today's little wins</h2>
          </div>
          <span className="progress-number">{progress}%</span>
        </div>

        <div className="daily-card">
          <div className="daily-summary">
            <div>
              <strong>{completed} of {tasks.length} tasks completed</strong>
              <p>Progress, not perfection.</p>
            </div>
            <span className="sparkle">✧</span>
          </div>

          <div className="daily-progress-track">
            <span style={{ width: `${progress}%` }} />
          </div>

          <div className="task-list">
            {loading ? (
              <p>Loading your saved tasks…</p>
            ) : tasks.length === 0 ? (
              <p>No tasks yet. We'll add your study plan soon.</p>
            ) : (
              tasks.map((task) => (
                <label className={`task-row ${task.done ? "task-done" : ""}`} key={task.id}>
                  <input
                    type="checkbox"
                    checked={task.done}
                    onChange={(event) => toggleTask(task.id, event.target.checked)}
                    aria-label={`Mark ${task.title} ${task.done ? "incomplete" : "complete"}`}
                  />
                  <span className="custom-check">{task.done ? "✓" : ""}</span>
                  <span className="task-text">
                    <strong>{task.title}</strong>
                    <small>{task.detail}</small>
                  </span>
                </label>
              ))
            )}
          </div>
        </div>

        {error && <p role="alert">{error}</p>}
      </section>

      <section className="gentle-note">
        <span>🌷</span>
        <div>
          <strong>A gentle reminder</strong>
          <p>You don't have to do everything today. Just keep going.</p>
        </div>
      </section>

      <footer>
        Made with love for Nourin <span>♥</span>
      </footer>
    </main>
  );
}

export default App;
