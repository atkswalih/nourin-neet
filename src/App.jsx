
import { useEffect, useMemo, useState } from "react";
import { db, seedInitialTasks, seedOfficialSyllabus } from "./db";
import { syllabus } from "./syllabus";
import "./App.css";

const subjects = [
  { name: "Physics", icon: "⚡", color: "lavender", subtitle: "Understand & solve" },
  { name: "Chemistry", icon: "🧪", color: "peach", subtitle: "Learn & remember" },
  { name: "Biology", icon: "🌿", color: "mint", subtitle: "Read & revise" },
];

const statuses = ["Not started", "Learning", "Practising", "Revised"];

const initialTasks = [
  { title: "Revise today's class notes", detail: "30 minutes", done: false },
  { title: "Practise Physics MCQs", detail: "20 questions", done: false },
  { title: "Review Biology NCERT", detail: "One focused session", done: false },
];

function getLocalDate() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function formatDate(dateString) {
  if (!dateString) return "";
  return new Date(`${dateString}T12:00:00`).toLocaleDateString("en-IN", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

function App() {
  const [view, setView] = useState("home");
  const [activeSubject, setActiveSubject] = useState("Physics");
  const [tasks, setTasks] = useState([]);
  const [chapters, setChapters] = useState([]);
  const [studySessions, setStudySessions] = useState([]);
  const [chapterTitle, setChapterTitle] = useState("");
  const [selectedDate, setSelectedDate] = useState(getLocalDate());
  const [sessionSubject, setSessionSubject] = useState("Biology");
  const [sessionTopic, setSessionTopic] = useState("");
  const [sessionStart, setSessionStart] = useState("18:00");
  const [sessionEnd, setSessionEnd] = useState("19:00");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;

    async function loadData() {
      try {
        await seedInitialTasks(initialTasks);
        await seedOfficialSyllabus(syllabus);

        const [savedTasks, savedChapters, savedSessions] =
          await Promise.all([
            db.tasks.toArray(),
            db.chapters.toArray(),
            db.timetable.toArray(),
          ]);

        if (active) {
          setTasks(savedTasks);
          setChapters(savedChapters);
          setStudySessions(savedSessions);
        }
      } catch (err) {
        console.error("Could not load local data:", err);
        if (active) {
          setError("Couldn't load saved data. Please refresh and try again.");
        }
      } finally {
        if (active) setLoading(false);
      }
    }

    loadData();

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
      console.error(err);
      setError("Couldn't save that task. Please try again.");
    }
  }

  async function addChapter(event) {
    event.preventDefault();
    const title = chapterTitle.trim();

    if (!title) {
      setError("Enter a chapter or topic name first.");
      return;
    }

    try {
      const chapter = {
        subject: activeSubject,
        title,
        status: "Not started",
        createdAt: new Date().toISOString(),
      };

      const id = await db.chapters.add(chapter);
      setChapters((current) => [...current, { ...chapter, id }]);
      setChapterTitle("");
      setError("");
    } catch (err) {
      console.error(err);
      setError("Couldn't save the chapter. Please try again.");
    }
  }

  async function changeChapterStatus(id, status) {
    try {
      await db.chapters.update(id, { status });
      setChapters((current) =>
        current.map((chapter) =>
          chapter.id === id ? { ...chapter, status } : chapter
        )
      );
      setError("");
    } catch (err) {
      console.error(err);
      setError("Couldn't update the chapter. Please try again.");
    }
  }

  async function deleteChapter(id) {
    const confirmed = window.confirm(
      "Delete this chapter and its saved progress?"
    );

    if (!confirmed) return;

    try {
      await db.chapters.delete(id);
      setChapters((current) => current.filter((chapter) => chapter.id !== id));
      setError("");
    } catch (err) {
      console.error(err);
      setError("Couldn't delete the chapter. Please try again.");
    }
  }

  async function addStudySession(event) {
    event.preventDefault();

    const topic = sessionTopic.trim();

    if (!topic) {
      setError("Enter a topic for your study session.");
      return;
    }

    if (!selectedDate) {
      setError("Choose a date for your study session.");
      return;
    }

    if (sessionEnd <= sessionStart) {
      setError("The end time must be later than the start time.");
      return;
    }

    try {
      const session = {
        date: selectedDate,
        subject: sessionSubject,
        title: topic,
        startTime: sessionStart,
        endTime: sessionEnd,
        done: false,
        createdAt: new Date().toISOString(),
      };

      const id = await db.timetable.add(session);

      setStudySessions((current) => [...current, { ...session, id }]);
      setSessionTopic("");
      setError("");
    } catch (err) {
      console.error(err);
      setError("Couldn't save the study session. Please try again.");
    }
  }

  async function toggleStudySession(id, done) {
    try {
      await db.timetable.update(id, { done });
      setStudySessions((current) =>
        current.map((session) =>
          session.id === id ? { ...session, done } : session
        )
      );
      setError("");
    } catch (err) {
      console.error(err);
      setError("Couldn't update the study session.");
    }
  }

  async function deleteStudySession(id) {
    const confirmed = window.confirm("Delete this study session?");
    if (!confirmed) return;

    try {
      await db.timetable.delete(id);
      setStudySessions((current) =>
        current.filter((session) => session.id !== id)
      );
      setError("");
    } catch (err) {
      console.error(err);
      setError("Couldn't delete the study session.");
    }
  }

  const subjectChapters = useMemo(
    () => chapters.filter((chapter) => chapter.subject === activeSubject),
    [chapters, activeSubject]
  );

  const revisedCount = subjectChapters.filter(
    (chapter) => chapter.status === "Revised"
  ).length;

  const subjectProgress = subjectChapters.length
    ? Math.round((revisedCount / subjectChapters.length) * 100)
    : 0;

  const completedTasks = tasks.filter((task) => task.done).length;
  const taskProgress = tasks.length
    ? Math.round((completedTasks / tasks.length) * 100)
    : 0;

  const totalRevised = chapters.filter(
    (chapter) => chapter.status === "Revised"
  ).length;

  const dailySessions = useMemo(
    () =>
      studySessions
        .filter((session) => session.date === selectedDate)
        .sort((a, b) => a.startTime.localeCompare(b.startTime)),
    [studySessions, selectedDate]
  );

  const completedSessions = dailySessions.filter(
    (session) => session.done
  ).length;

  return (
    <main className="app-shell">
      <header className="topbar">
        <a className="brand" href="#home" onClick={() => setView("home")}>
          <span className="brand-icon">n.</span>
          <span>
            Nourin <strong>NEET</strong>
          </span>
        </a>

        <span className="offline-pill">
          <span className="status-dot" />
          Saved on this device
        </span>
      </header>

      <nav className="app-navigation" aria-label="Main navigation">
        <button
          className={view === "home" ? "nav-button active" : "nav-button"}
          onClick={() => setView("home")}
        >
          <span>⌂</span> Dashboard
        </button>

        <button
          className={view === "syllabus" ? "nav-button active" : "nav-button"}
          onClick={() => setView("syllabus")}
        >
          <span>▤</span> My syllabus
        </button>

        <button
          className={view === "timetable" ? "nav-button active" : "nav-button"}
          onClick={() => setView("timetable")}
        >
          <span>◷</span> Study timetable
        </button>
      </nav>

      {error && (
        <div className="app-error" role="alert">
          {error}
          <button onClick={() => setError("")} aria-label="Dismiss error">
            ×
          </button>
        </div>
      )}

      {loading ? (
        <section className="loading-state">Opening your study space…</section>
      ) : view === "home" ? (
        <>
          <section className="welcome" id="home">
            <p className="eyebrow">YOUR JOURNEY, YOUR PACE ✨</p>
            <h1>
              Little steps,
              <br /> <span>big dreams.</span>
            </h1>
            <p className="welcome-copy">
              Every chapter you learn brings you closer to your dream of
              becoming a doctor.
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
              {subjects.map((subject) => {
                const list = chapters.filter(
                  (chapter) => chapter.subject === subject.name
                );
                const revised = list.filter(
                  (chapter) => chapter.status === "Revised"
                ).length;
                const progress = list.length
                  ? Math.round((revised / list.length) * 100)
                  : 0;

                return (
                  <button
                    className={`subject-card ${subject.color} subject-card-button`}
                    key={subject.name}
                    onClick={() => {
                      setActiveSubject(subject.name);
                      setView("syllabus");
                    }}
                  >
                    <span className="subject-icon">{subject.icon}</span>
                    <h3>{subject.name}</h3>
                    <p>{subject.subtitle}</p>
                    <div className="progress-track">
                      <span style={{ width: `${progress}%` }} />
                    </div>
                    <span className="subject-progress">
                      {list.length
                        ? `${revised} of ${list.length} revised`
                        : "Add your chapters"}
                    </span>
                  </button>
                );
              })}
            </div>
          </section>

          <section className="section-block today-section">
            <div className="section-heading">
              <div>
                <p className="eyebrow">A FRESH START</p>
                <h2>Today's little wins</h2>
              </div>
              <span className="progress-number">{taskProgress}%</span>
            </div>

            <div className="daily-card">
              <div className="daily-summary">
                <div>
                  <strong>
                    {completedTasks} of {tasks.length} tasks completed
                  </strong>
                  <p>Progress, not perfection.</p>
                </div>
                <span className="sparkle">✧</span>
              </div>

              <div className="daily-progress-track">
                <span style={{ width: `${taskProgress}%` }} />
              </div>

              <div className="task-list">
                {tasks.map((task) => (
                  <label
                    className={`task-row ${task.done ? "task-done" : ""}`}
                    key={task.id}
                  >
                    <input
                      type="checkbox"
                      checked={task.done}
                      onChange={(event) =>
                        toggleTask(task.id, event.target.checked)
                      }
                      aria-label={`Mark ${task.title} ${
                        task.done ? "incomplete" : "complete"
                      }`}
                    />
                    <span className="custom-check">{task.done ? "✓" : ""}</span>
                    <span className="task-text">
                      <strong>{task.title}</strong>
                      <small>{task.detail}</small>
                    </span>
                  </label>
                ))}
              </div>
            </div>
          </section>

          <section className="section-block">
            <div className="section-heading">
              <div>
                <p className="eyebrow">MAKE TIME FOR YOUR DREAM</p>
                <h2>Today's study plan</h2>
              </div>
              <button
                className="primary-button"
                onClick={() => {
                  setSelectedDate(getLocalDate());
                  setView("timetable");
                }}
              >
                Open timetable →
              </button>
            </div>

            <div className="daily-card">
              <strong>
                {studySessions.filter(
                  (session) => session.date === getLocalDate()
                ).length}{" "}
                study sessions planned today
              </strong>
              <p className="welcome-copy">
                Build a realistic plan around classes, rest, and revision.
              </p>
            </div>
          </section>

          <section className="gentle-note">
            <span>🌷</span>
            <div>
              <strong>A gentle reminder</strong>
              <p>You don't have to do everything today. Just keep going.</p>
            </div>
          </section>
        </>
      ) : view === "syllabus" ? (
        <section className="syllabus-page">
          <div className="syllabus-intro">
            <p className="eyebrow">YOUR PERSONAL STUDY MAP</p>
            <h1>
              My <span>syllabus.</span>
            </h1>
            <p className="welcome-copy">
              Add your chapters, update your progress, and take it one step at
              a time.
            </p>
          </div>

          <div className="syllabus-subject-tabs" aria-label="Choose subject">
            {subjects.map((subject) => (
              <button
                key={subject.name}
                className={`syllabus-tab ${
                  activeSubject === subject.name ? "selected" : ""
                }`}
                onClick={() => setActiveSubject(subject.name)}
              >
                <span>{subject.icon}</span> {subject.name}
              </button>
            ))}
          </div>

          <div className="syllabus-progress-card">
            <div className="syllabus-progress-top">
              <div>
                <span className="dream-label">
                  {activeSubject.toUpperCase()} PROGRESS
                </span>
                <h2>
                  {subjectProgress}% <span>revised</span>
                </h2>
              </div>
              <div className="syllabus-count">
                <strong>{subjectChapters.length}</strong>
                <small>chapters added</small>
              </div>
            </div>
            <div className="daily-progress-track">
              <span style={{ width: `${subjectProgress}%` }} />
            </div>
            <p>
              {totalRevised} {totalRevised === 1 ? "chapter" : "chapters"}{" "}
              revised across all subjects.
            </p>
          </div>

          <div className="add-chapter-card">
            <h2>Add a chapter or topic</h2>
            <p>Enter a name from your current NEET study materials.</p>
            <form className="add-chapter-form" onSubmit={addChapter}>
              <input
                type="text"
                value={chapterTitle}
                onChange={(event) => setChapterTitle(event.target.value)}
                placeholder="e.g. a chapter from your syllabus"
                maxLength={120}
                aria-label="Chapter or topic name"
              />
              <button type="submit" className="primary-button">
                + Add chapter
              </button>
            </form>
          </div>

          <div className="chapter-list-heading">
            <div>
              <p className="eyebrow">YOUR CHAPTERS</p>
              <h2>{activeSubject} topics</h2>
            </div>
            <span className="soft-label">{subjectChapters.length} total</span>
          </div>

          {subjectChapters.length === 0 ? (
            <div className="empty-chapters">
              <span>🌱</span>
              <h3>Your study list starts here</h3>
              <p>
                Add your first chapter above. Your progress will be saved on
                this device.
              </p>
            </div>
          ) : (
            <div className="chapter-list">
              {subjectChapters.map((chapter) => (
                <article className="chapter-row" key={chapter.id}>
                  <div className="chapter-symbol">
                    {chapter.status === "Revised" ? "✓" : "✦"}
                  </div>
                  <div className="chapter-details">
                    <strong>{chapter.title}</strong>
                    <small>
                      {chapter.status === "Revised"
                        ? "Lovely work — revised!"
                        : "Keep moving at your own pace"}
                    </small>
                  </div>
                  <select
                    className={`status-select status-${chapter.status
                      .toLowerCase()
                      .replace(" ", "-")}`}
                    value={chapter.status}
                    onChange={(event) =>
                      changeChapterStatus(chapter.id, event.target.value)
                    }
                    aria-label={`Progress for ${chapter.title}`}
                  >
                    {statuses.map((status) => (
                      <option key={status} value={status}>
                        {status}
                      </option>
                    ))}
                  </select>
                  <button
                    className="delete-chapter"
                    onClick={() => deleteChapter(chapter.id)}
                    aria-label={`Delete ${chapter.title}`}
                    title="Delete chapter"
                  >
                    ×
                  </button>
                </article>
              ))}
            </div>
          )}

          <p className="syllabus-footnote">
            Your list is editable. Verify chapter coverage against the official
            NEET syllabus for your exam year.
          </p>
        </section>
      ) : (
        <section className="timetable-page">
          <div className="syllabus-intro">
            <p className="eyebrow">SMALL STEPS, EVERY DAY ✨</p>
            <h1>
              Study <span>timetable.</span>
            </h1>
            <p className="welcome-copy">
              Make a plan that works around coaching, meals, rest, and revision.
            </p>
          </div>

          <div className="timetable-date-card">
            <label htmlFor="study-date">Choose your study day</label>
            <input
              id="study-date"
              type="date"
              value={selectedDate}
              onChange={(event) => setSelectedDate(event.target.value)}
            />
            <h2>{formatDate(selectedDate)}</h2>
            <p>
              {completedSessions} of {dailySessions.length} sessions completed
            </p>
            <div className="daily-progress-track">
              <span
                style={{
                  width: `${
                    dailySessions.length
                      ? (completedSessions / dailySessions.length) * 100
                      : 0
                  }%`,
                }}
              />
            </div>
          </div>

          <div className="add-chapter-card timetable-form-card">
            <h2>Plan a study session</h2>
            <p>Add one focused task at a time. You can change the plan later.</p>

            <form className="timetable-form" onSubmit={addStudySession}>
              <label htmlFor="session-subject">Subject</label>
              <select
                id="session-subject"
                value={sessionSubject}
                onChange={(event) => setSessionSubject(event.target.value)}
              >
                {subjects.map((subject) => (
                  <option key={subject.name} value={subject.name}>
                    {subject.name}
                  </option>
                ))}
              </select>

              <label htmlFor="session-topic">Topic or task</label>
              <input
                id="session-topic"
                type="text"
                value={sessionTopic}
                onChange={(event) => setSessionTopic(event.target.value)}
                placeholder="e.g. Human Physiology NCERT revision"
                maxLength={120}
                required
              />

              <label htmlFor="session-date">Date</label>
              <input
                id="session-date"
                type="date"
                value={selectedDate}
                onChange={(event) => setSelectedDate(event.target.value)}
                required
              />

              <div className="time-input-grid">
                <div>
                  <label htmlFor="session-start">Start time</label>
                  <input
                    id="session-start"
                    type="time"
                    value={sessionStart}
                    onChange={(event) => setSessionStart(event.target.value)}
                    required
                  />
                </div>
                <div>
                  <label htmlFor="session-end">End time</label>
                  <input
                    id="session-end"
                    type="time"
                    value={sessionEnd}
                    onChange={(event) => setSessionEnd(event.target.value)}
                    required
                  />
                </div>
              </div>

              <button type="submit" className="primary-button">
                + Add study session
              </button>
            </form>
          </div>

          <div className="chapter-list-heading">
            <div>
              <p className="eyebrow">YOUR PLAN</p>
              <h2>Study sessions</h2>
            </div>
            <span className="soft-label">{dailySessions.length} planned</span>
          </div>

          {dailySessions.length === 0 ? (
            <div className="empty-chapters">
              <span>🌷</span>
              <h3>A fresh page for your day</h3>
              <p>
                Add a study session above to start building your timetable.
              </p>
            </div>
          ) : (
            <div className="timetable-session-list">
              {dailySessions.map((session) => (
                <article
                  className={`timetable-session ${
                    session.done ? "session-complete" : ""
                  }`}
                  key={session.id}
                >
                  <label className="session-checkbox">
                    <input
                      type="checkbox"
                      checked={Boolean(session.done)}
                      onChange={(event) =>
                        toggleStudySession(session.id, event.target.checked)
                      }
                      aria-label={`Mark ${session.title} ${
                        session.done ? "incomplete" : "complete"
                      }`}
                    />
                    <span>{session.done ? "✓" : ""}</span>
                  </label>

                  <div className="session-time">
                    <strong>{session.startTime}</strong>
                    <span>to {session.endTime}</span>
                  </div>

                  <div className="session-details">
                    <strong>{session.title}</strong>
                    <span>{session.subject}</span>
                    <small>
                      {session.done ? "Session completed 🌷" : "One step at a time"}
                    </small>
                  </div>

                  <button
                    className="delete-chapter"
                    onClick={() => deleteStudySession(session.id)}
                    aria-label={`Delete ${session.title}`}
                    title="Delete session"
                  >
                    ×
                  </button>
                </article>
              ))}
            </div>
          )}

          <p className="syllabus-footnote">
            Your timetable is saved on this device. Make sure to leave time for
            meals, rest, and sleep.
          </p>
        </section>
      )}

      <footer>
        Made with love for Nourin <span>♥</span>
      </footer>
    </main>
  );
}

export default App;
