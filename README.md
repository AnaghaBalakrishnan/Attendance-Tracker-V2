# Attendance Tracker

A simple, teacher-facing student attendance web app. Pure static files — **no server and no database**. All data is stored in the browser via `localStorage`.

## Features

- View all students with roll number, class, email, and overall attendance %
- Pick a date and mark each student **Present / Absent** (click again to clear)
- **Mark all present / absent** in one click
- **Search** by student name or roll number
- Live summary cards: total students, present, absent, attendance rate
- **Details** panel per student with guardian/phone info and full attendance history
- **Reset** link to restore the seeded sample data

## Usage

Just open `index.html` in any modern browser — no build step or install required.

## Files

- `index.html` — markup / layout
- `styles.css` — styling
- `app.js` — app logic and seeded sample data

## Notes

Data persists only in the browser it was entered in (via `localStorage`). It ships pre-seeded with 8 sample students and 5 days of history so the dashboard looks populated on first run.
