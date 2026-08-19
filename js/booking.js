// ═══════════════════════════════════════════════════════════════════════════
// Booking — Tabletop Teachings
//
// Your teaching week, your booked slots and your holidays all live in
// js/schedule.js now. To change any of them, open admin.html, click your
// changes, and download the new schedule.js over the old one.
//
// Nothing in this file needs editing.
//
// Two separate paths share one form:
//   Book a session   → three steps: pick a time, your details, check and send.
//   Join the waitlist → one short screen, group campaigns only.
// They never share a field and never share state. Switching between them
// clears whatever the other one was holding.
// ═══════════════════════════════════════════════════════════════════════════

(function () {
  "use strict";

  // ╔═══════════════════════════════════════════════════════════════════════╗
  // ║  Schedule                                                             ║
  // ║  Loaded from js/schedule.js. The values below are only a safety net   ║
  // ║  for the case where that file is missing or hasn't loaded — without   ║
  // ║  them a broken schedule file would leave parents staring at an empty  ║
  // ║  picker with no way to tell you about it.                             ║
  // ╚═══════════════════════════════════════════════════════════════════════╝

  var CFG = window.TT_SCHEDULE || {};

  // Start times on a 24-hour clock. An empty day isn't offered at all.
  var WEEK = CFG.week || {
    mon: [], tue: ["16:00", "17:15"], wed: ["16:00", "17:15"],
    thu: ["16:00", "17:15"], fri: [], sat: ["09:00", "10:15", "11:30"], sun: [],
  };

  // Sessions already booked, as "YYYY-MM-DD HH:MM".
  var TAKEN = CFG.taken || [];

  // Whole days off. A single date, or a range written "2026-09-28..2026-10-10".
  var AWAY = CFG.away || [];

  var WEEKS_AHEAD = CFG.weeksAhead || 6;            // how far ahead people can book
  var MIN_NOTICE_HOURS = CFG.minNoticeHours != null // don't offer anything sooner
    ? CFG.minNoticeHours : 24;
  var SESSION_MINUTES = CFG.sessionMinutes || 60;   // length of one session
  var WEEKS_SHOWN = CFG.weeksShown || 2;            // weeks visible before "Show more dates"

  // ╔═══════════════════════════════════════════════════════════════════════╗
  // ║  Below here is just the code that turns the above into buttons.       ║
  // ╚═══════════════════════════════════════════════════════════════════════╝

  var TZ = "Australia/Sydney";
  var KEYS = ["sun", "mon", "tue", "wed", "thu", "fri", "sat"];
  var DAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
  var MONTHS = ["January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"];

  var form, steps, stepDots, bookPanel, waitPanel;
  var state = { step: 0, slot: null, slots: [], byDate: {}, day: null };

  // ── Time maths ────────────────────────────────────────────────────────────
  // Sessions are worked out as real instants, so daylight saving in October
  // can't quietly shift a 4pm session to 5pm.

  function partsOf(ms) {
    var f = new Intl.DateTimeFormat("en-AU", {
      timeZone: TZ, year: "numeric", month: "2-digit", day: "2-digit",
      hour: "2-digit", minute: "2-digit", hour12: false,
    });
    var o = {};
    f.formatToParts(new Date(ms)).forEach(function (p) {
      if (p.type !== "literal") o[p.type] = p.value;
    });
    return { y: +o.year, m: +o.month, d: +o.day, hh: +(o.hour === "24" ? "0" : o.hour), mm: +o.minute };
  }

  function instantOf(y, m, d, hh, mm) {
    var target = Date.UTC(y, m - 1, d, hh, mm);
    var guess = target;
    for (var i = 0; i < 2; i++) {
      var p = partsOf(guess);
      guess += target - Date.UTC(p.y, p.m - 1, p.d, p.hh, p.mm);
    }
    return guess;
  }

  function pad(n) { return n < 10 ? "0" + n : "" + n; }

  function clock(ms) {
    var p = partsOf(ms);
    return (p.hh % 12 || 12) + (p.mm ? ":" + pad(p.mm) : "") + (p.hh < 12 ? "am" : "pm");
  }

  // Expand "2026-09-28..2026-10-10" into every date it covers.
  function awaySet() {
    var out = {};
    AWAY.forEach(function (entry) {
      var bits = String(entry).split("..");
      if (bits.length === 1) { out[bits[0].trim()] = true; return; }
      var cur = new Date(bits[0].trim() + "T00:00:00Z");
      var end = new Date(bits[1].trim() + "T00:00:00Z");
      for (var guard = 0; cur <= end && guard < 400; guard++) {
        out[cur.toISOString().slice(0, 10)] = true;
        cur.setUTCDate(cur.getUTCDate() + 1);
      }
    });
    return out;
  }

  function build() {
    var out = [];
    var earliest = Date.now() + MIN_NOTICE_HOURS * 3600000;
    var away = awaySet();
    var taken = {};
    TAKEN.forEach(function (t) { taken[String(t).trim()] = true; });

    var t = partsOf(Date.now());
    var cur = new Date(Date.UTC(t.y, t.m - 1, t.d));

    for (var i = 0; i < WEEKS_AHEAD * 7; i++) {
      var y = cur.getUTCFullYear(), m = cur.getUTCMonth() + 1, d = cur.getUTCDate();
      var date = y + "-" + pad(m) + "-" + pad(d);
      var dow = cur.getUTCDay();

      if (!away[date]) {
        (WEEK[KEYS[dow]] || []).forEach(function (time) {
          if (taken[date + " " + time]) return;
          var start = instantOf(y, m, d, +time.slice(0, 2), +time.slice(3, 5));
          var end = start + SESSION_MINUTES * 60000;
          if (start < earliest) return;
          out.push({
            start: start,
            date: date,
            dow: dow,
            shortDay: DAYS[dow].slice(0, 3) + " " + d + " " + MONTHS[m - 1].slice(0, 3),
            longDay: DAYS[dow] + " " + d + " " + MONTHS[m - 1],
            timeLabel: clock(start) + "\u2013" + clock(end),
            // What actually reaches your inbox — written out in full so there
            // is no ambiguity about which day it was.
            value: DAYS[dow] + " " + d + " " + MONTHS[m - 1] + " " + y +
                   ", " + clock(start) + "\u2013" + clock(end),
          });
        });
      }
      cur.setUTCDate(d + 1);
    }
    return out.sort(function (a, b) { return a.start - b.start; });
  }

  // Monday-based week key, used only for grouping the buttons.
  function weekKey(ms) {
    var p = partsOf(ms);
    var utc = Date.UTC(p.y, p.m - 1, p.d);
    var dow = new Date(utc).getUTCDay();
    return utc - ((dow + 6) % 7) * 86400000;
  }

  function weekLabel(key, todayKey) {
    if (key === todayKey) return "This week";
    if (key === todayKey + 604800000) return "Next week";
    var s = new Date(key);
    return "Week of " + s.getUTCDate() + " " + MONTHS[s.getUTCMonth()].slice(0, 3);
  }

  // ── The picker ────────────────────────────────────────────────────────────

  function el(tag, cls, text) {
    var n = document.createElement(tag);
    if (cls) n.className = cls;
    if (text != null) n.textContent = text;
    return n;
  }

  function renderSlots() {
    var host = document.getElementById("slots");
    var empty = document.getElementById("slots-empty");
    if (!host) return;

    state.slots = build();
    state.byDate = {};
    state.slots.forEach(function (s) {
      (state.byDate[s.date] = state.byDate[s.date] || []).push(s);
    });

    host.setAttribute("aria-busy", "false");
    host.innerHTML = "";

    var dates = Object.keys(state.byDate);
    if (!dates.length) {
      host.hidden = true;
      empty.innerHTML =
        "<strong>Nothing free in the next " + WEEKS_AHEAD + " weeks.</strong> " +
        "The group waitlist is the fastest way in \u2014 " +
        '<label for="mode-waitlist" class="mode-link">add your name</label> ' +
        "and we'll email you the moment a table opens up.";
      empty.hidden = false;
      return;
    }

    var todayKey = weekKey(Date.now());
    var weeks = [];
    var seen = {};
    dates.forEach(function (date) {
      var first = state.byDate[date][0];
      var k = weekKey(first.start);
      if (seen[k] == null) { seen[k] = weeks.length; weeks.push({ key: k, dates: [] }); }
      weeks[seen[k]].dates.push(date);
    });

    weeks.forEach(function (week, wi) {
      var group = el("div", "week-group");
      if (wi >= WEEKS_SHOWN) group.hidden = true;
      group.appendChild(el("p", "week-label", weekLabel(week.key, todayKey)));

      var row = el("div", "day-row");
      week.dates.forEach(function (date) {
        var list = state.byDate[date];
        var btn = el("button", "day-chip");
        btn.type = "button";
        btn.setAttribute("aria-pressed", "false");
        btn.setAttribute("aria-controls", "time-panel");
        btn.dataset.date = date;

        var name = el("span", null, list[0].shortDay);
        if (state.slots[0] && state.slots[0].date === date) {
          var flag = el("span", "soonest-flag", "soonest");
          name.appendChild(flag);
        }
        btn.appendChild(name);
        btn.appendChild(el("span", "day-free",
          list.length === 1 ? "1 time free" : list.length + " times free"));
        btn.addEventListener("click", function () { pickDay(date); });
        row.appendChild(btn);
      });
      group.appendChild(row);
      host.appendChild(group);
    });

    if (weeks.length > WEEKS_SHOWN) {
      var more = el("button", "more-dates", "Show more dates \u2193");
      more.type = "button";
      more.addEventListener("click", function () {
        Array.prototype.forEach.call(host.querySelectorAll(".week-group"), function (g) { g.hidden = false; });
        more.remove();
      });
      host.appendChild(more);
    }

    // The panel that holds the times for the chosen day.
    var panel = el("div", "time-panel");
    panel.id = "time-panel";
    panel.hidden = true;
    host.appendChild(panel);
  }

  function pickDay(date) {
    state.day = date;
    state.slot = null;
    setSession(null);

    Array.prototype.forEach.call(document.querySelectorAll(".day-chip"), function (b) {
      b.setAttribute("aria-pressed", String(b.dataset.date === date));
    });

    var panel = document.getElementById("time-panel");
    var list = state.byDate[date] || [];
    panel.innerHTML = "";
    panel.hidden = false;

    var head = el("h4", null, "Times on " + list[0].longDay);
    panel.appendChild(head);

    var row = el("div", "time-row");
    list.forEach(function (s, i) {
      var btn = el("button", "time-chip", s.timeLabel);
      btn.type = "button";
      btn.setAttribute("aria-pressed", "false");
      btn.dataset.value = s.value;
      btn.addEventListener("click", function () { pickTime(s, btn); });
      row.appendChild(btn);
      if (i === 0) btn.dataset.first = "1";
    });
    panel.appendChild(row);

    // Move focus to the first time so the keyboard carries on where the eye
    // does. Focus only — nothing is chosen until it is actually clicked.
    var first = panel.querySelector('[data-first="1"]');
    if (first) first.focus();
  }

  function pickTime(slot, btn) {
    state.slot = slot;
    Array.prototype.forEach.call(document.querySelectorAll(".time-chip"), function (b) {
      b.setAttribute("aria-pressed", String(b === btn));
    });
    setSession(slot);
    clearError(document.getElementById("session-field"));
  }

  function setSession(slot) {
    var input = document.getElementById("session-value");
    var summary = document.getElementById("session-summary");
    if (!input || !summary) return;
    input.value = slot ? slot.value : "";
    if (slot) {
      summary.innerHTML = "";
      summary.appendChild(el("span", null, "\u2713"));
      var text = el("span");
      text.appendChild(document.createTextNode("You're asking for "));
      var b = el("b", null, slot.value);
      text.appendChild(b);
      text.appendChild(document.createTextNode(". Nothing is charged now \u2014 we'll confirm by email first."));
      summary.appendChild(text);
      summary.hidden = false;
    } else {
      summary.hidden = true;
    }
  }

  // Put the picker back to untouched: no day, no time, nothing in the hidden
  // field. Called whenever the person leaves or re-enters the booking tab, so
  // a time can never be carried in from a previous visit or a browser that
  // restored the hidden input on reload.
  function resetPicker() {
    state.day = null;
    state.slot = null;
    setSession(null);
    Array.prototype.forEach.call(document.querySelectorAll(".day-chip"), function (b) {
      b.setAttribute("aria-pressed", "false");
    });
    var panel = document.getElementById("time-panel");
    if (panel) { panel.innerHTML = ""; panel.hidden = true; }
  }

  // ── Steps ─────────────────────────────────────────────────────────────────

  function isWaitlist() {
    var w = document.getElementById("mode-waitlist");
    return !!(w && w.checked);
  }

  // A field in the tab that isn't showing must never block anything.
  function isActive(node) {
    var panel = node.closest(".panel-book, .panel-waitlist");
    if (!panel) return true;
    return panel.classList.contains(isWaitlist() ? "panel-waitlist" : "panel-book");
  }

  function scrollToForm() {
    var top = document.getElementById("contact");
    if (!top || !top.scrollIntoView) return;
    // Scrolling is a nicety. An older browser without these must still be
    // able to finish the booking, so nothing here is allowed to throw.
    var reduce = window.matchMedia
      && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    try {
      top.scrollIntoView({ behavior: reduce ? "auto" : "smooth", block: "start" });
    } catch (e) {
      top.scrollIntoView();
    }
  }

  function showStep(index, focus) {
    if (!steps.length) return;
    state.step = index;
    steps.forEach(function (s, i) { s.hidden = i !== index; });
    stepDots.forEach(function (dot, i) {
      dot.dataset.state = i === index ? "current" : (i < index ? "done" : "todo");
      if (i === index) dot.setAttribute("aria-current", "step");
      else dot.removeAttribute("aria-current");
    });
    if (index === steps.length - 1) buildReview();

    if (focus !== false) {
      var h = steps[index].querySelector("[data-step-heading]");
      if (h) h.focus({ preventScroll: true });
      scrollToForm();
    }
    track("booking_step", { step: index + 1 });
  }

  // ── Validation ────────────────────────────────────────────────────────────
  // Messages live in data-error on the field so they can be reworded in the
  // HTML without coming back in here.
  //
  // Required fields are marked data-required, not required. Both halves of
  // this form live in one <form>, and the half that isn't showing is
  // display:none — a native required field in there would silently block the
  // submit with a validation bubble the browser can't point at.

  function fieldWrap(node) { return node.closest(".field, .radio-set, .check-field") || node.parentNode; }

  function clearError(wrap) {
    if (!wrap) return;
    wrap.classList.remove("is-invalid");
    var msg = wrap.querySelector(".field-error");
    if (msg) msg.remove();
    Array.prototype.forEach.call(wrap.querySelectorAll("input, select, textarea"), function (i) {
      i.removeAttribute("aria-invalid");
    });
  }

  function showError(wrap, message) {
    if (!wrap) return;
    clearError(wrap);
    wrap.classList.add("is-invalid");
    var id = (wrap.id || "f" + Math.random().toString(36).slice(2)) + "-err";
    wrap.id = wrap.id || id.replace("-err", "");
    var p = el("p", "field-error", message);
    p.id = id;
    wrap.appendChild(p);
    var control = wrap.querySelector("input, select, textarea, button");
    if (control) {
      control.setAttribute("aria-invalid", "true");
      var described = (control.getAttribute("aria-describedby") || "").split(" ").filter(Boolean);
      if (described.indexOf(id) === -1) described.push(id);
      control.setAttribute("aria-describedby", described.join(" "));
    }
  }

  function isRequired(node) {
    return node.required || node.dataset.required === "true";
  }

  function checkOne(node) {
    var msg = node.dataset.error || "This one's needed.";
    var value = (node.value || "").trim();

    if (node.type === "checkbox" && isRequired(node) && !node.checked) return msg;
    if (isRequired(node) && node.type !== "checkbox" && !value) return msg;
    if (node.type === "email" && value && !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(value)) {
      return node.dataset.errorFormat || "That email address looks incomplete.";
    }
    if (node.type === "tel" && value && (value.replace(/\D/g, "").length < 8)) {
      return node.dataset.errorFormat || "That number looks too short.";
    }
    // data-pattern="^[0-9]{4}$" on the field itself, so a format rule can be
    // added in the HTML without coming back in here. A malformed pattern is
    // ignored rather than allowed to break the whole check.
    if (node.dataset.pattern && value) {
      try {
        if (!new RegExp(node.dataset.pattern).test(value)) {
          return node.dataset.errorFormat || "That doesn't look quite right.";
        }
      } catch (e) { /* bad regex in the HTML — don't block the booking */ }
    }
    return null;
  }

  // Groups of chips need at least one tick.
  function checkGroups(root) {
    var problems = [];
    Array.prototype.forEach.call(root.querySelectorAll("[data-required-group]"), function (set) {
      if (!isActive(set)) return;
      var ticked = set.querySelectorAll("input:checked").length;
      if (ticked < 1) {
        problems.push({ wrap: set, message: set.dataset.error || "Pick at least one." });
      } else {
        clearError(set);
      }
    });
    return problems;
  }

  // Checks one block — a booking step, or the whole waitlist panel.
  function validateRoot(root, quiet) {
    if (!root) return [];
    var problems = [];

    // The chosen session is a hidden input, so it gets its own check. It only
    // applies on the booking side, and only when there are times to pick.
    var session = root.querySelector("#session-value");
    var emptyNote = document.getElementById("slots-empty");
    var noSlots = emptyNote && !emptyNote.hidden;
    if (session && !isWaitlist() && !noSlots && !session.value) {
      problems.push({
        wrap: document.getElementById("session-field"),
        message: state.day ? "Choose a time on that day." : "Choose a date, then a time.",
      });
    }

    Array.prototype.forEach.call(root.querySelectorAll("input, select, textarea"), function (node) {
      if (node.type === "hidden" || !isActive(node)) return;
      var problem = checkOne(node);
      var wrap = fieldWrap(node);
      if (problem) problems.push({ wrap: wrap, message: problem, node: node });
      else if (!wrap.hasAttribute("data-required-group")) clearError(wrap);
    });

    problems = problems.concat(checkGroups(root));

    // A summary that's been fixed must go, whether we're checking quietly on
    // submit or loudly on Next. Leaving it up tells the person they still have
    // a problem when they don't.
    if (!problems.length) {
      var stale = root.querySelector(".error-summary");
      if (stale) stale.remove();
      return problems;
    }
    if (quiet) return problems;

    var summary = root.querySelector(".error-summary");
    if (summary) summary.remove();

    problems.forEach(function (p) { showError(p.wrap, p.message); });

    // One list at the top of the block, each item a link to the field. This is
    // the pattern screen-reader users expect and sighted users benefit from.
    var box = el("div", "error-summary");
    box.setAttribute("role", "alert");
    box.setAttribute("tabindex", "-1");
    box.appendChild(el("h4", null,
      problems.length === 1 ? "One thing to fix" : problems.length + " things to fix"));
    var ul = el("ul");
    problems.forEach(function (p) {
      var li = el("li");
      var a = el("a", null, p.message);
      a.href = "#";
      a.addEventListener("click", function (e) {
        e.preventDefault();
        var target = p.node || p.wrap.querySelector("input, select, textarea, button");
        if (target) target.focus();
      });
      li.appendChild(a);
      ul.appendChild(li);
    });
    box.appendChild(ul);
    root.insertBefore(box, root.firstChild);
    box.focus();
    return problems;
  }

  function validateStep(index, quiet) { return validateRoot(steps[index], quiet); }

  // ── Review ────────────────────────────────────────────────────────────────
  // Booking only. The waitlist is short enough to read on the one screen it
  // lives on, so it has no review step.

  function val(id) {
    var n = document.getElementById(id);
    return n ? (n.value || "").trim() : "";
  }

  function checkedLabels(name) {
    return Array.prototype.map.call(
      document.querySelectorAll('input[name="' + name + '"]:checked'),
      function (i) { return i.value; }
    ).join(", ");
  }

  function buildReview() {
    var host = document.getElementById("review");
    if (!host) return;
    var rows = [];

    rows.push(["Session", val("session-value") || "not chosen yet"]);
    rows.push(["Adventurer", (val("student-first-name") || "\u2014") + ", " + (val("student-year") || "\u2014")]);
    if (checkedLabels("goal")) rows.push(["Working on", checkedLabels("goal")]);
    rows.push(["You", (val("parent-name") || "\u2014") + " \u00b7 " + (val("parent-email") || "\u2014") +
      (val("parent-phone") ? " \u00b7 " + val("parent-phone") : "")]);
    // Read the address back in full. It's the one answer a parent most needs
    // to see spelled out before they send it.
    var where = [val("street-address"), val("suburb"), val("postcode")]
      .filter(Boolean).join(", ");
    rows.push(["Where", where || "\u2014"]);

    var dl = el("dl");
    rows.forEach(function (r) {
      dl.appendChild(el("dt", null, r[0]));
      dl.appendChild(el("dd", null, r[1]));
    });
    host.innerHTML = "";
    host.appendChild(dl);

    var edit = el("p", "review-edit");
    edit.appendChild(document.createTextNode("Something not right? "));
    var b1 = el("button", null, "Change the time");
    b1.type = "button";
    b1.addEventListener("click", function () { showStep(0); });
    var b2 = el("button", null, "Change your details");
    b2.type = "button";
    b2.addEventListener("click", function () { showStep(1); });
    edit.appendChild(b1);
    edit.appendChild(document.createTextNode(" \u00b7 "));
    edit.appendChild(b2);
    host.appendChild(edit);
  }

  // ── Wiring ────────────────────────────────────────────────────────────────

  function track(name, data) {
    try {
      if (window.gtag) window.gtag("event", name, data || {});
      if (window.dataLayer) window.dataLayer.push(Object.assign({ event: name }, data || {}));
    } catch (e) { /* analytics must never break a booking */ }
  }

  // Anything already typed on one side is worth keeping when the person hops
  // to the other. Only ever fills a blank — never overwrites.
  var CARRY = [
    ["parent-name", "wl-parent-name"],
    ["parent-email", "wl-parent-email"],
    ["suburb", "wl-suburb"],
    ["student-first-name", "wl-student-first-name"],
    ["student-year", "wl-student-year"],
  ];

  function carryOver(toWaitlist) {
    CARRY.forEach(function (pair) {
      var from = document.getElementById(toWaitlist ? pair[0] : pair[1]);
      var to = document.getElementById(toWaitlist ? pair[1] : pair[0]);
      if (!from || !to) return;
      if ((from.value || "").trim() && !(to.value || "").trim()) to.value = from.value;
    });
  }

  // Switching tabs is a fresh start for the side you're arriving at. Errors,
  // the chosen time and the step you'd reached all belong to the side you just
  // left, and carrying any of them across is how a waitlist entry ends up
  // wearing a session time it never asked for.
  function syncMode(userInitiated) {
    var waitlist = isWaitlist();

    Array.prototype.forEach.call(document.querySelectorAll(".field-error, .error-summary"), function (n) {
      n.remove();
    });
    Array.prototype.forEach.call(document.querySelectorAll(".is-invalid"), function (n) {
      n.classList.remove("is-invalid");
    });
    Array.prototype.forEach.call(form.querySelectorAll("[aria-invalid]"), function (n) {
      n.removeAttribute("aria-invalid");
    });

    carryOver(waitlist);
    resetPicker();

    if (waitlist) {
      if (userInitiated) {
        var h = document.getElementById("waitlist-heading");
        if (h) h.focus({ preventScroll: true });
        scrollToForm();
      }
    } else {
      showStep(0, !!userInitiated);
    }
  }

  function openFromHash() {
    if (window.location.hash !== "#waitlist") return;
    var r = document.getElementById("mode-waitlist");
    if (r && !r.checked) { r.checked = true; syncMode(true); }
  }

  // Only the side being sent should reach your inbox. Disabled fields aren't
  // submitted, so a waitlist entry can't arrive carrying half a booking.
  function isolateInactivePanel() {
    var dead = isWaitlist() ? bookPanel : waitPanel;
    if (!dead) return;
    Array.prototype.forEach.call(dead.querySelectorAll("input, select, textarea"), function (n) {
      n.disabled = true;
    });
  }

  function init() {
    form = document.getElementById("booking-form");
    if (!form) return;

    // Netlify sends people back here with ?done=1 after a successful submit.
    if (window.location.search.indexOf("done=1") !== -1) {
      var done = document.getElementById("done");
      if (done) { done.hidden = false; done.focus(); }
      form.hidden = true;
      track("generate_lead", { form: "booking" });
      return;
    }

    bookPanel = form.querySelector(".panel-book");
    waitPanel = form.querySelector(".panel-waitlist");
    steps = Array.prototype.slice.call(form.querySelectorAll("[data-step]"));
    stepDots = Array.prototype.slice.call(document.querySelectorAll("[data-step-dot]"));

    renderSlots();

    // From here on the browser's own validation would fight ours, and its
    // bubbles can't be read on a step that isn't showing.
    form.noValidate = true;
    form.classList.add("js-bk-steps");
    var progress = document.getElementById("steps");
    if (progress) progress.hidden = false;
    showStep(0, false);

    Array.prototype.forEach.call(form.querySelectorAll("[data-next]"), function (btn) {
      btn.addEventListener("click", function () {
        if (validateStep(state.step).length) return;
        showStep(Math.min(state.step + 1, steps.length - 1));
      });
    });
    Array.prototype.forEach.call(form.querySelectorAll("[data-back]"), function (btn) {
      btn.addEventListener("click", function () { showStep(Math.max(state.step - 1, 0)); });
    });

    // Clear an error the moment the person fixes it, never before.
    form.addEventListener("input", function (e) {
      var wrap = fieldWrap(e.target);
      if (wrap && wrap.classList.contains("is-invalid") && !checkOne(e.target)) clearError(wrap);
    });
    form.addEventListener("change", function (e) {
      var set = e.target.closest("[data-required-group]");
      if (set && set.querySelectorAll("input:checked").length) { clearError(set); return; }
      // Checkboxes and selects are answered by a change, not by typing.
      var wrap = fieldWrap(e.target);
      if (wrap && wrap.classList.contains("is-invalid") && !checkOne(e.target)) clearError(wrap);
    });
    form.addEventListener("blur", function (e) {
      if (!e.target.matches("input, select, textarea")) return;
      if (!isActive(e.target)) return;
      var problem = checkOne(e.target);
      if (problem && (e.target.value || "").trim()) showError(fieldWrap(e.target), problem);
    }, true);

    Array.prototype.forEach.call(document.querySelectorAll(".mode-radio"), function (r) {
      r.addEventListener("change", function () {
        syncMode(true);
        track("booking_mode", { mode: r.value });
      });
    });
    window.addEventListener("hashchange", openFromHash);

    // A reload can hand back the radio a browser remembered, so settle the
    // two sides once on load before anyone touches anything.
    syncMode(false);
    openFromHash();

    form.addEventListener("submit", function (e) {
      if (isWaitlist()) {
        if (validateRoot(waitPanel, true).length) {
          e.preventDefault();
          validateRoot(waitPanel);
          return;
        }
      } else {
        // Check every step, not just the visible one, then land on the first
        // step that has a problem.
        for (var i = 0; i < steps.length; i++) {
          if (validateStep(i, true).length) {
            e.preventDefault();
            if (i !== state.step) showStep(i, false);
            validateStep(i);
            return;
          }
        }
      }

      isolateInactivePanel();

      var btn = e.submitter || form.querySelector('button[type="submit"]:not([disabled])');
      if (btn) {
        btn.classList.add("is-sending");
        btn.textContent = "Sending\u2026";
      }
      track("generate_lead", { form: "booking", mode: isWaitlist() ? "waitlist" : "session" });
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
