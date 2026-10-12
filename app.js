/* Attendance Tracker — client-only. State lives in localStorage. */

const STORAGE_KEY = "attendance-tracker-v1";

/* ---- Seed data (used only on first run) ---- */
function seedData() {
  const students = [
    { id: 1, roll: "R001", name: "Aarav Sharma",   class: "10-A", email: "aarav.sharma@school.edu",   guardian: "Meena Sharma",  phone: "+91 98765 43210" },
    { id: 2, roll: "R002", name: "Diya Patel",      class: "10-A", email: "diya.patel@school.edu",     guardian: "Raj Patel",     phone: "+91 98765 43211" },
    { id: 3, roll: "R003", name: "Kabir Singh",     class: "10-A", email: "kabir.singh@school.edu",    guardian: "Harpreet Kaur", phone: "+91 98765 43212" },
    { id: 4, roll: "R004", name: "Ananya Reddy",    class: "10-A", email: "ananya.reddy@school.edu",   guardian: "Suresh Reddy",  phone: "+91 98765 43213" },
    { id: 5, roll: "R005", name: "Vihaan Gupta",    class: "10-A", email: "vihaan.gupta@school.edu",   guardian: "Pooja Gupta",   phone: "+91 98765 43214" },
    { id: 6, roll: "R006", name: "Ishita Nair",     class: "10-A", email: "ishita.nair@school.edu",    guardian: "Latha Nair",    phone: "+91 98765 43215" },
    { id: 7, roll: "R007", name: "Arjun Mehta",     class: "10-A", email: "arjun.mehta@school.edu",    guardian: "Vikram Mehta",  phone: "+91 98765 43216" },
    { id: 8, roll: "R008", name: "Saanvi Joshi",    class: "10-A", email: "saanvi.joshi@school.edu",   guardian: "Neha Joshi",    phone: "+91 98765 43217" },
  ];

  // Build a little history for the past 5 school days so stats look real.
  const records = {}; // records[date][studentId] = "present" | "absent"
  const today = new Date();
  for (let d = 1; d <= 5; d++) {
    const dt = new Date(today);
    dt.setDate(today.getDate() - d);
    const key = toKey(dt);
    records[key] = {};
    students.forEach((s) => {
      // ~85% present
      records[key][s.id] = Math.random() < 0.85 ? "present" : "absent";
    });
  }
  return { students, records };
}

/* ---- Storage helpers ---- */
function load() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch (e) { /* ignore */ }
  const fresh = seedData();
  save(fresh);
  return fresh;
}
function save(state) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch (e) { /* storage may be unavailable; app still works in-memory */ }
}

/* ---- Date helpers ---- */
function toKey(date) {
  // local YYYY-MM-DD
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}
function prettyDate(key) {
  const [y, m, d] = key.split("-").map(Number);
  return new Date(y, m - 1, d).toLocaleDateString(undefined, {
    weekday: "short", day: "numeric", month: "short", year: "numeric",
  });
}

/* ---- App state ---- */
let state = load();
let selectedDate = toKey(new Date());
let searchTerm = "";

const $ = (sel) => document.querySelector(sel);

/* ---- Rendering ---- */
function overallPct(studentId) {
  const days = Object.keys(state.records);
  let marked = 0, present = 0;
  days.forEach((day) => {
    const status = state.records[day][studentId];
    if (status) {
      marked++;
      if (status === "present") present++;
    }
  });
  if (marked === 0) return null;
  return Math.round((present / marked) * 100);
}

function statusFor(studentId) {
  const day = state.records[selectedDate];
  return day ? day[studentId] : undefined;
}

function setStatus(studentId, status) {
  if (!state.records[selectedDate]) state.records[selectedDate] = {};
  const current = state.records[selectedDate][studentId];
  // clicking the active status again clears it
  if (current === status) delete state.records[selectedDate][studentId];
  else state.records[selectedDate][studentId] = status;
  save(state);
  render();
}

function renderStats() {
  const total = state.students.length;
  let present = 0, absent = 0;
  state.students.forEach((s) => {
    const st = statusFor(s.id);
    if (st === "present") present++;
    else if (st === "absent") absent++;
  });
  const marked = present + absent;
  const rate = marked ? Math.round((present / marked) * 100) : 0;
  $("#stat-total").textContent = total;
  $("#stat-present").textContent = present;
  $("#stat-absent").textContent = absent;
  $("#stat-rate").textContent = rate + "%";
}

function renderTable() {
  const body = $("#student-body");
  body.innerHTML = "";
  const term = searchTerm.trim().toLowerCase();

  const rows = state.students.filter((s) =>
    !term || s.name.toLowerCase().includes(term) || s.roll.toLowerCase().includes(term)
  );

  $("#empty-msg").hidden = rows.length > 0;

  rows.forEach((s) => {
    const st = statusFor(s.id);
    const pct = overallPct(s.id);
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${s.roll}</td>
      <td class="name-cell">${escapeHtml(s.name)}</td>
      <td>${escapeHtml(s.class)}</td>
      <td class="col-email">${escapeHtml(s.email)}</td>
      <td><span class="pct-bar">${pct === null ? "—" : pct + "%"}</span></td>
      <td class="col-status">
        <span class="status-group">
          <button class="pill ${st === "present" ? "active-present" : ""}" data-act="present" data-id="${s.id}">Present</button>
          <button class="pill ${st === "absent" ? "active-absent" : ""}" data-act="absent" data-id="${s.id}">Absent</button>
        </span>
      </td>
      <td><button class="view-btn" data-view="${s.id}">Details</button></td>
    `;
    body.appendChild(tr);
  });
}

function render() {
  renderStats();
  renderTable();
}

/* ---- Student detail drawer ---- */
function openDrawer(studentId) {
  const s = state.students.find((x) => x.id === studentId);
  if (!s) return;
  const pct = overallPct(s.id);

  // history, newest first
  const history = Object.keys(state.records)
    .filter((day) => state.records[day][s.id])
    .sort((a, b) => b.localeCompare(a))
    .map((day) => ({ day, status: state.records[day][s.id] }));

  const historyHtml = history.length
    ? history.map((h) => `
        <div class="hist-row">
          <span>${prettyDate(h.day)}</span>
          <span class="tag ${h.status}">${h.status === "present" ? "Present" : "Absent"}</span>
        </div>`).join("")
    : `<p class="muted">No attendance recorded yet.</p>`;

  $("#drawer-content").innerHTML = `
    <h2>${escapeHtml(s.name)}</h2>
    <p class="muted">Roll ${s.roll} · Class ${escapeHtml(s.class)}</p>
    <div class="detail-grid">
      <div class="field"><span>Email</span><strong>${escapeHtml(s.email)}</strong></div>
      <div class="field"><span>Guardian</span><strong>${escapeHtml(s.guardian)}</strong></div>
      <div class="field"><span>Phone</span><strong>${escapeHtml(s.phone)}</strong></div>
      <div class="field"><span>Overall attendance</span><strong>${pct === null ? "—" : pct + "%"}</strong></div>
    </div>
    <div class="hist-title">Attendance history</div>
    ${historyHtml}
  `;
  $("#drawer").hidden = false;
  $("#drawer-overlay").hidden = false;
}
function closeDrawer() {
  $("#drawer").hidden = true;
  $("#drawer-overlay").hidden = true;
}

/* ---- Utils ---- */
function escapeHtml(str) {
  return String(str).replace(/[&<>"']/g, (c) => (
    { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]
  ));
}

/* ---- Events ---- */
function markAll(status) {
  if (!state.records[selectedDate]) state.records[selectedDate] = {};
  state.students.forEach((s) => { state.records[selectedDate][s.id] = status; });
  save(state);
  render();
}

function init() {
  const dateInput = $("#attendance-date");
  dateInput.value = selectedDate;
  dateInput.max = toKey(new Date());
  dateInput.addEventListener("change", (e) => {
    selectedDate = e.target.value || toKey(new Date());
    render();
  });

  $("#search").addEventListener("input", (e) => {
    searchTerm = e.target.value;
    renderTable();
  });

  $("#mark-all-present").addEventListener("click", () => markAll("present"));
  $("#mark-all-absent").addEventListener("click", () => markAll("absent"));

  // Delegated clicks for status pills + details buttons
  $("#student-body").addEventListener("click", (e) => {
    const pill = e.target.closest("[data-act]");
    if (pill) { setStatus(Number(pill.dataset.id), pill.dataset.act); return; }
    const view = e.target.closest("[data-view]");
    if (view) { openDrawer(Number(view.dataset.view)); }
  });

  $("#drawer-close").addEventListener("click", closeDrawer);
  $("#drawer-overlay").addEventListener("click", closeDrawer);
  document.addEventListener("keydown", (e) => { if (e.key === "Escape") closeDrawer(); });

  $("#reset-data").addEventListener("click", () => {
    if (confirm("Reset to fresh sample data? This clears all changes.")) {
      state = seedData();
      save(state);
      render();
    }
  });

  render();
}

init();
