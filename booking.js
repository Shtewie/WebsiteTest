// ═══════════════════════════════════════════════════════════════════════════
// Booking — Tabletop Teachings
//
// Everything you'll ever need to change is in the EDIT THIS block below.
// Nothing under it needs touching.
//
// The form works without this file: the two tabs switch in CSS, and the
// browser validates the fields on its own. What this file adds is the list of
// real times, the three-step flow, and error messages that say what to do.
// ═══════════════════════════════════════════════════════════════════════════

(function () {
  "use strict";

  // ╔═══════════════════════════════════════════════════════════════════════╗
  // ║  EDIT THIS                                                            ║
  // ╚═══════════════════════════════════════════════════════════════════════╝

  // Your normal teaching week. These are START times on a 24-hour clock:
  //   "16:00" = 4pm      "17:15" = 5:15pm      "09:00" = 9am
  // An empty day isn't offered at all.
  //
  // Use this for permanent changes only — "I no longer teach Tuesdays".
  // To block one week's session, use TAKEN below instead.
  var WEEK = {
    mon: [],
    tue: ["16:00", "17:15"],
    wed: ["16:00", "17:15"],
    thu: ["16:00", "17:15"],
    fri: [],
    sat: ["09:00", "10:15", "11:30"],
    sun: [],
  };

  // Single sessions that are already booked. One line each, "YYYY-MM-DD HH:MM".
  // This is the one you'll edit most: when a family books Thursday the 21st at
  // 4pm, add it here and that button disappears for everyone else.
  // Old lines do no harm — clear them out whenever you like.
  var TAKEN = [
    // "2026-08-20 16:00",
    // "2026-08-22 09:00",
  ];

  // Whole days you're away. A single date, or a range with two dots:
  //   "2026-09-28"                  one day
  //   "2026-09-28..2026-10-10"      school holidays, a trip, anything
  var AWAY = [
    // "2026-09-28..2026-10-10",
  ];

  // A weekly student who holds the same slot every week: add it to TAKEN each
  // time, or simply delete that time from WEEK until they finish.

  var WEEKS_AHEAD = 6;        // how far ahead people can book
  var MIN_NOTICE_HOURS = 24;  // don't offer anything sooner than this
  var SESSION_MINUTES = 60;   // length of one session
  var WEEKS_SHOWN = 2;        // weeks visible before "Show more dates"

  // ╔═══════════════════════════════════════════════════════════════════════╗
  // ║  Below here is just the code that turns the above into buttons.       ║
  // ╚═══════════════════════════════════════════════════════════════════════╝

  var TZ = "Australia/Sydney";
  var KEYS = ["sun", "mon", "tue", "wed", "thu", "fri", "sat"];
  var DAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
  var MONTHS = ["January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"];

  var form, steps, stepDots, state = { step: 0, slot: null, slots: [], byDate: {}, day: null };

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
        "The waitlist is the fastest way in \u2014 " +
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

  // ── Steps ─────────────────────────────────────────────────────────────────

  function isWaitlist() {
    var w = document.getElementById("mode-waitlist");
    return !!(w && w.checked);
  }

  // A field inside the tab that isn't showing must never block anything.
  function isActive(node) {
    var panel = node.closest(".panel-book, .panel-waitlist");
    if (!panel) return true;
    return panel.classList.contains(isWaitlist() ? "panel-waitlist" : "panel-book");
  }

  function showStep(index, focus) {
    state.step = index;
    steps.forEach(function (s, i) { s.hidden = i !== index; });
    stepDots.forEach(function (dot, i) {
      dot.dataset.state = i === index ? "current" : (i < index ? "done" : "todo");
      if (i === index) dot.setAttribute("aria-current", "step");
      else dot.removeAttribute("aria-current");
    });
    if (index === steps.length - 1) buildReview();

    if (focus !== false) {
      // A step can hold two headings, one per tab. Focus the one on screen.
      var heads = steps[index].querySelectorAll("[data-step-heading]");
      var h = null;
      Array.prototype.forEach.call(heads, function (n) {
        if (!h && n.offsetParent !== null) h = n;
      });
      h = h || heads[0];
      if (h) h.focus({ preventScroll: true });
      // Scrolling is a nicety. An older browser without these must still be
      // able to finish the booking, so nothing here is allowed to throw.
      var top = document.getElementById("contact");
      if (top && top.scrollIntoView) {
        var reduce = window.matchMedia
          && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
        try {
          top.scrollIntoView({ behavior: reduce ? "auto" : "smooth", block: "start" });
        } catch (e) {
          top.scrollIntoView();
        }
      }
    }
    track("booking_step", { step: index + 1 });
  }

  // ── Validation ────────────────────────────────────────────────────────────
  // Messages live in data-error on the field so they can be reworded in the
  // HTML without coming back in here.

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

  function checkOne(node) {
    var msg = node.dataset.error || "This one's needed.";
    var value = (node.value || "").trim();

    if (node.type === "checkbox" && node.required && !node.checked) return msg;
    if (node.required && node.type !== "checkbox" && !value) return msg;
    if (node.type === "email" && value && !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(value)) {
      return node.dataset.errorFormat || "That email address looks incomplete.";
    }
    if (node.type === "tel" && value && (value.replace(/\D/g, "").length < 8)) {
      return node.dataset.errorFormat || "That number looks too short.";
    }
    return null;
  }

  // Groups of chips (goals, waitlist type) need at least one tick.
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

  function validateStep(index, quiet) {
    var root = steps[index];
    var problems = [];

    // The chosen session is a hidden input, so it gets its own check. It's
    // only required when the booking tab is open AND there are times to pick.
    var session = root.querySelector("#session-value");
    var noSlots = !document.getElementById("slots-empty").hidden;
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

    // One list at the top of the step, each item a link to the field. This is
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

  // ── Review ────────────────────────────────────────────────────────────────

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

    if (isWaitlist()) {
      rows.push(["Request", "Waitlist \u2014 " + (checkedLabels("wait-type") || "not chosen yet")]);
      if (val("availability")) rows.push(["Suits us", val("availability")]);
    } else {
      rows.push(["Session", val("session-value") || "not chosen yet"]);
    }
    rows.push(["Adventurer", (val("student-first-name") || "\u2014") + ", " + (val("student-year") || "\u2014")]);
    if (checkedLabels("goal")) rows.push(["Working on", checkedLabels("goal")]);
    rows.push(["You", (val("parent-name") || "\u2014") + " \u00b7 " + (val("parent-email") || "\u2014") +
      (val("parent-phone") ? " \u00b7 " + val("parent-phone") : "")]);
    rows.push(["Where", val("suburb") || "\u2014"]);

    var dl = el("dl");
    rows.forEach(function (r) {
      dl.appendChild(el("dt", null, r[0]));
      dl.appendChild(el("dd", null, r[1]));
    });
    host.innerHTML = "";
    host.appendChild(dl);

    var edit = el("p", "review-edit");
    edit.appendChild(document.createTextNode("Something not right? "));
    var b1 = el("button", null, isWaitlist() ? "Change what you're after" : "Change the time");
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

  function syncMode() {
    // Switching tabs changes what's required, so any error still on screen is
    // about a question that's no longer being asked. Clear it.
    if (steps && state.step === steps.length - 1) buildReview();
    Array.prototype.forEach.call(document.querySelectorAll(".field-error, .error-summary"), function (n) {
      n.remove();
    });
    Array.prototype.forEach.call(document.querySelectorAll(".is-invalid"), function (n) {
      n.classList.remove("is-invalid");
    });
  }

  function openFromHash() {
    if (window.location.hash !== "#waitlist") return;
    var r = document.getElementById("mode-waitlist");
    if (r && !r.checked) { r.checked = true; syncMode(); }
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

    steps = Array.prototype.slice.call(form.querySelectorAll("[data-step]"));
    stepDots = Array.prototype.slice.call(document.querySelectorAll("[data-step-dot]"));

    renderSlots();

    // From here on the browser's own validation would fight ours, and its
    // bubbles can't be read on a step that isn't showing.
    form.noValidate = true;
    form.classList.add("js-steps");
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
        syncMode();
        track("booking_mode", { mode: r.value });
      });
    });
    window.addEventListener("hashchange", openFromHash);
    openFromHash();

    form.addEventListener("submit", function (e) {
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
      var btn = form.querySelector('button[type="submit"]');
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
