/* =========================================================
   SkillBridge — Prototype Logic (Vanilla JS)
   Flow: Login → Dashboard → Assessment → Result
         → Skill Gap → Recommended Working Areas
   Everything runs in the browser. No backend, no APIs.
   ========================================================= */

/* ---------- Global app state ---------- */
const state = {
  studentName: "",
  careerGoal: "Data Analyst",
  // Initial (pre-assessment) demo skill levels shown on the dashboard.
  // These get replaced by real assessment scores after the quiz.
  skills: {
    Python: 65,
    Excel: 85,
    Statistics: 80,
    SQL: 35,
  },
  assessmentDone: false,
};

/* ---------- Assessment questions ----------
   Each question stores its skill, the options, and the
   index (0-3) of the correct answer.                     */
const QUESTIONS = [
  {
    skill: "Python",
    q: "What is Python mainly used for?",
    options: [
      "Data analysis and programming",
      "Only designing websites",
      "Only creating presentations",
      "Only editing images",
    ],
    answer: 0,
  },
  {
    skill: "Python",
    q: "Which symbol is used to write a comment in Python?",
    options: ["//", "#", "<!-- -->", "/* */"],
    answer: 1,
  },
  {
    skill: "Excel",
    q: "Which Excel function adds a range of numbers?",
    options: ["COUNT()", "AVERAGE()", "SUM()", "MAX()"],
    answer: 2,
  },
  {
    skill: "Excel",
    q: "A single box in an Excel sheet is called a?",
    options: ["Cell", "Node", "Field", "Bucket"],
    answer: 0,
  },
  {
    skill: "SQL",
    q: "Which SQL keyword is used to fetch data from a table?",
    options: ["GET", "FETCH", "SELECT", "OPEN"],
    answer: 2,
  },
  {
    skill: "SQL",
    q: "Which clause filters rows in a SQL query?",
    options: ["WHERE", "ORDER", "GROUP", "LIMIT"],
    answer: 0,
  },
  {
    skill: "Statistics",
    q: "The average of a set of numbers is called the?",
    options: ["Mode", "Median", "Mean", "Range"],
    answer: 2,
  },
  {
    skill: "Statistics",
    q: "Which value appears most frequently in a dataset?",
    options: ["Mean", "Mode", "Median", "Variance"],
    answer: 1,
  },
];

/* ---------- Career areas ----------
   weights = how much each skill matters for that career.
   Weights per career sum to 1 so the match % is a simple
   weighted average of the student's skill scores.         */
const CAREERS = [
  {
    name: "Data Analyst",
    weights: { Excel: 0.3, Statistics: 0.3, Python: 0.2, SQL: 0.2 },
  },
  {
    name: "Python Developer",
    weights: { Python: 0.6, SQL: 0.2, Statistics: 0.1, Excel: 0.1 },
  },
  {
    name: "Business Analyst",
    weights: { Excel: 0.35, Statistics: 0.35, SQL: 0.2, Python: 0.1 },
  },
];

/* ---------- Recommendation content (rule-based, no AI) ---------- */
const RECOMMENDATIONS = {
  SQL: ["SQL Basics", "SELECT and WHERE", "JOIN", "GROUP BY", "Practice with datasets"],
  Python: ["Python Syntax", "Variables & Loops", "Functions", "Data structures", "Pandas basics"],
  Excel: ["Formulas (SUM, AVERAGE)", "Cell referencing", "Charts", "Pivot Tables", "VLOOKUP"],
  Statistics: ["Mean, Median, Mode", "Probability basics", "Distributions", "Correlation", "Hypothesis testing"],
};

/* =========================================================
   HELPERS
   ========================================================= */

// Convert a numeric score (0-100) into a simple skill level label.
function scoreToLevel(score) {
  if (score >= 80) return "Strong";
  if (score >= 60) return "Moderate";
  if (score >= 40) return "Basic";
  return "Beginner";
}

// Build a labelled progress bar for a single skill.
function skillBarHTML(skill, score) {
  const level = scoreToLevel(score);
  return `
    <div class="skill-row">
      <div class="skill-row-top">
        <span>${skill}</span>
        <span>
          <span class="level-tag level-${level}">${level}</span>
          ${score}%
        </span>
      </div>
      <div class="bar"><div class="bar-fill" style="width:${score}%"></div></div>
    </div>`;
}

// Career Readiness = weighted match for the student's chosen goal.
function calcReadiness() {
  const goal = CAREERS.find((c) => c.name === state.careerGoal) || CAREERS[0];
  return Math.round(matchForCareer(goal));
}

// Weighted average of skill scores for a given career.
function matchForCareer(career) {
  let total = 0;
  for (const skill in career.weights) {
    total += (state.skills[skill] || 0) * career.weights[skill];
  }
  return total;
}

/* =========================================================
   NAVIGATION (single-page, no reload)
   ========================================================= */
function showPage(pageId) {
  // Hide all pages, then show the requested one.
  document.querySelectorAll(".page").forEach((p) => p.classList.add("hidden"));
  const page = document.getElementById(pageId);
  if (page) page.classList.remove("hidden");

  // Sync the active state on sidebar buttons.
  document.querySelectorAll(".nav-item").forEach((btn) => {
    btn.classList.toggle("active", btn.dataset.page === pageId);
  });
}

/* =========================================================
   LOGIN
   ========================================================= */
const loginForm = document.getElementById("login-form");
loginForm.addEventListener("submit", function (e) {
  e.preventDefault();
  const name = document.getElementById("student-name").value.trim();
  const email = document.getElementById("student-email").value.trim();
  const errorEl = document.getElementById("login-error");

  // Accept any non-empty name + email (demo only, no real auth).
  if (!name || !email) {
    errorEl.textContent = "Please enter both your name and email.";
    return;
  }

  errorEl.textContent = "";
  state.studentName = name;

  // Switch from the login screen to the main app.
  document.getElementById("login-page").classList.add("hidden");
  document.getElementById("app").classList.remove("hidden");

  renderDashboard();
  showPage("dashboard");
});

/* =========================================================
   DASHBOARD RENDERING
   ========================================================= */
function renderDashboard() {
  // Personalised greeting using the entered name.
  document.getElementById("welcome-heading").textContent = `Welcome, ${state.studentName}`;

  // Career readiness percentage.
  document.getElementById("readiness-value").textContent = `${calcReadiness()}%`;

  // Skills available chips.
  document.getElementById("skills-available").innerHTML = Object.keys(state.skills)
    .map((s) => `<span class="chip">${s}</span>`)
    .join("");

  // Current skill level bars.
  document.getElementById("dashboard-skill-bars").innerHTML = Object.entries(state.skills)
    .map(([skill, score]) => skillBarHTML(skill, score))
    .join("");

  // Improvement snapshot (weakest skill).
  const weakest = getWeakestSkill();
  const improvementEl = document.getElementById("dashboard-improvement");
  if (state.assessmentDone) {
    improvementEl.innerHTML =
      `Your weakest skill is <strong>${weakest.skill}</strong> ` +
      `(${weakest.score}% — ${scoreToLevel(weakest.score)}). ` +
      `Open the Improvement tab for a study plan.`;
  } else {
    improvementEl.textContent =
      "Take the assessment to discover your weakest skill and get tips.";
  }

  // Recommended working areas snapshot (top 3 matches).
  document.getElementById("dashboard-areas").innerHTML = getRankedCareers()
    .map((c) => `<li>${c.name} <span class="match">${c.match}%</span></li>`)
    .join("");
}

// Return the skill with the lowest score.
function getWeakestSkill() {
  let weakest = { skill: "SQL", score: 100 };
  for (const skill in state.skills) {
    if (state.skills[skill] < weakest.score) {
      weakest = { skill, score: state.skills[skill] };
    }
  }
  return weakest;
}

// Rank careers by match percentage (highest first).
function getRankedCareers() {
  return CAREERS.map((c) => ({ name: c.name, match: Math.round(matchForCareer(c)) }))
    .sort((a, b) => b.match - a.match);
}

/* =========================================================
   ASSESSMENT (QUIZ) RENDERING
   ========================================================= */
function renderQuiz() {
  const container = document.getElementById("quiz-questions");
  container.innerHTML = QUESTIONS.map((item, i) => {
    const options = item.options
      .map(
        (opt, j) => `
        <label class="option">
          <input type="radio" name="q${i}" value="${j}" />
          <span>${String.fromCharCode(65 + j)}. ${opt}</span>
        </label>`
      )
      .join("");
    return `
      <div class="question-card">
        <span class="q-tag">${item.skill}</span>
        <p class="q-text">${i + 1}. ${item.q}</p>
        ${options}
      </div>`;
  }).join("");
}

/* ---------- Quiz submission ---------- */
document.getElementById("quiz-form").addEventListener("submit", function (e) {
  e.preventDefault();
  const errorEl = document.getElementById("quiz-error");

  // Track correct/total answers per skill.
  const perSkill = {};
  Object.keys(state.skills).forEach((s) => (perSkill[s] = { correct: 0, total: 0 }));

  let answeredAll = true;

  QUESTIONS.forEach((item, i) => {
    perSkill[item.skill].total += 1;
    const chosen = document.querySelector(`input[name="q${i}"]:checked`);
    if (!chosen) {
      answeredAll = false;
      return;
    }
    if (Number(chosen.value) === item.answer) {
      perSkill[item.skill].correct += 1;
    }
  });

  // Require every question to be answered.
  if (!answeredAll) {
    errorEl.textContent = "Please answer all questions before submitting.";
    return;
  }
  errorEl.textContent = "";

  // Convert per-skill correctness into a 0-100 score.
  for (const skill in perSkill) {
    const { correct, total } = perSkill[skill];
    state.skills[skill] = Math.round((correct / total) * 100);
  }

  state.assessmentDone = true;

  // Update every dependent view, then jump to the results.
  renderDashboard();
  renderResults();
  renderImprovement();
  renderWorkingAreas();
  showPage("skills");
});

/* =========================================================
   RESULTS RENDERING
   ========================================================= */
function renderResults() {
  document.getElementById("result-status").textContent =
    "Here is how you performed.";
  document.getElementById("result-block").classList.remove("hidden");

  // Overall score = average of all skill scores.
  const scores = Object.values(state.skills);
  const overall = Math.round(scores.reduce((a, b) => a + b, 0) / scores.length);
  document.getElementById("overall-score").textContent = `${overall}%`;

  // Skill-wise result cards.
  document.getElementById("result-skill-bars").innerHTML = Object.entries(state.skills)
    .map(
      ([skill, score]) => `
      <div class="card">
        ${skillBarHTML(skill, score)}
      </div>`
    )
    .join("");
}

/* =========================================================
   IMPROVEMENT / SKILL GAP RENDERING
   ========================================================= */
function renderImprovement() {
  const block = document.getElementById("improvement-block");

  if (!state.assessmentDone) {
    block.innerHTML =
      '<p class="muted">Take the assessment first to identify your skill gaps.</p>';
    return;
  }

  const weakest = getWeakestSkill();
  const recs = RECOMMENDATIONS[weakest.skill] || [];

  // Primary gap card for the weakest skill.
  let html = `
    <div class="gap-card">
      <h3 class="card-title">${weakest.skill}</h3>
      <div class="gap-levels">
        <span>Current Level: <strong>${scoreToLevel(weakest.score)}</strong></span>
        <span>Target Level: <strong>Strong</strong></span>
      </div>
      <p class="muted">You need improvement in ${weakest.skill} fundamentals.</p>
      <h4 class="section-title">Recommended Improvement</h4>
      <ul class="rec-list">
        ${recs.map((r) => `<li>${r}</li>`).join("")}
      </ul>
    </div>`;

  // Also show tips for any other skill below "Strong".
  const others = Object.entries(state.skills)
    .filter(([skill, score]) => skill !== weakest.skill && score < 80)
    .sort((a, b) => a[1] - b[1]);

  if (others.length) {
    html += others
      .map(
        ([skill, score]) => `
        <div class="gap-card" style="border-left-color: var(--basic);">
          <h3 class="card-title">${skill}</h3>
          <p class="muted">Current Level: ${scoreToLevel(score)} (${score}%)</p>
          <ul class="rec-list">
            ${(RECOMMENDATIONS[skill] || []).slice(0, 3).map((r) => `<li>${r}</li>`).join("")}
          </ul>
        </div>`
      )
      .join("");
  }

  block.innerHTML = html;
}

/* =========================================================
   WORKING AREAS RENDERING
   ========================================================= */
function renderWorkingAreas() {
  const block = document.getElementById("areas-block");

  block.innerHTML = getRankedCareers()
    .map((ranked) => {
      const career = CAREERS.find((c) => c.name === ranked.name);
      // For each required skill: ✓ if strong-ish (>=60), ⚠ if it needs work.
      const reqs = Object.keys(career.weights)
        .map((skill) => {
          const score = state.skills[skill] || 0;
          if (score >= 60) return `<li>✓ ${skill}</li>`;
          return `<li>⚠ Improve ${skill}</li>`;
        })
        .join("");

      return `
        <div class="area-card">
          <div class="area-head">
            <h3>${ranked.name}</h3>
            <span class="area-match">${ranked.match}%</span>
          </div>
          <div class="bar"><div class="bar-fill" style="width:${ranked.match}%"></div></div>
          <h4 class="section-title">Required</h4>
          <ul class="req-list">${reqs}</ul>
        </div>`;
    })
    .join("");
}

/* =========================================================
   SIDEBAR NAVIGATION + LOGOUT WIRING
   ========================================================= */
// Any element with data-page navigates to that page.
document.querySelectorAll("[data-page]").forEach((btn) => {
  btn.addEventListener("click", () => showPage(btn.dataset.page));
});

// Logout returns to the login screen and resets the demo.
document.getElementById("logout-btn").addEventListener("click", function () {
  document.getElementById("app").classList.add("hidden");
  document.getElementById("login-page").classList.remove("hidden");

  // Reset state so the next demo starts fresh.
  state.studentName = "";
  state.assessmentDone = false;
  state.skills = { Python: 65, Excel: 85, Statistics: 80, SQL: 35 };
  loginForm.reset();
});

/* =========================================================
   INITIALISE
   ========================================================= */
renderQuiz(); // Build the quiz once at startup.
