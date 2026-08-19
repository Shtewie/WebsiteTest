// ═══════════════════════════════════════════════════════════════════════════
// AVAILABILITY — the only file you edit to change when you can teach.
//
// This is the whole booking calendar. The time picker on the homepage is
// built from these values every time the page loads, so a change here is
// live the moment you push it. Nothing else needs touching.
//
// Rules that matter:
//   • Times are 24-hour, always "HH:MM" with the leading zero: "09:00",
//     not "9:00". Anything that isn't in that exact shape is ignored, so a
//     typo quietly removes one time rather than breaking the picker.
//   • Dates are always "YYYY-MM-DD".
//   • All times are Newcastle time. Daylight saving is handled for you —
//     a 4pm session stays 4pm across the October changeover.
//   • A day with an empty list [] simply isn't offered.
// ═══════════════════════════════════════════════════════════════════════════

window.TT_SCHEDULE = {

  // ── 1. Your teaching week ────────────────────────────────────────────────
  // ⚠️ THESE ARE PLACEHOLDER HOURS — replace them with the times you
  // actually teach before you send anyone to the site. They are a sensible
  // guess (after school on weekdays, Saturday mornings), not your diary.
  //
  // The START time of each session you're willing to run on that weekday.
  // These repeat every week until you change them.
  week: {
    mon: ["", ""],
    tue: ["16:00", "17:30"],
    wed: ["16:00", "17:30"],
    thu: ["16:00", "17:30"],
    fri: ["16:00"],
    sat: ["09:00", "10:30", "13:00"],
    sun: [],
  },

  // ── 2. Sessions already booked ───────────────────────────────────────────
  // Written "YYYY-MM-DD HH:MM" — the date, a single space, then the start
  // time exactly as it appears in `week` above. These disappear from the
  // picker so nobody can book on top of an existing student.
  //
  // Example:
  //   "2026-08-24 16:00",
  taken: [],

  // ── 3. Days you're away ──────────────────────────────────────────────────
  // Whole days off — holidays, school terms, anything. One date on its own,
  // or a range written with two dots between the start and end date. Both
  // ends of a range are included.
  //
  // Example:
  //   "2026-09-28..2026-10-10",   // school holidays
  //   "2026-12-25",               // Christmas
  away: [],

  // ── 4. Settings you'll rarely change ─────────────────────────────────────
  weeksAhead: 6,        // how far into the future people can book
  minNoticeHours: 24,   // nothing is offered sooner than this from now
  sessionMinutes: 60,   // how long one session runs
  weeksShown: 2,        // weeks visible before the "Show more dates" button
};
