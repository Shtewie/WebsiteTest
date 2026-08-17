// ═══════════════════════════════════════════════════════════════════════════
// Booking times
//
// Everything you'll ever want to change is in the EDIT THIS block below.
// Nothing under it needs touching.
// ═══════════════════════════════════════════════════════════════════════════

(function () {
  "use strict";

  // ╔═══════════════════════════════════════════════════════════════════════╗
  // ║  EDIT THIS                                                            ║
  // ╚═══════════════════════════════════════════════════════════════════════╝

  // Your normal teaching week. These are START times, in 24-hour clock:
  //   "16:00" = 4pm     "17:15" = 5:15pm     "09:00" = 9am
  // Every session is one hour. An empty day isn't offered at all.
  //
  // When a student takes a regular slot, delete that time from the day.
  // When they finish, put it back. That's how you hold a weekly booking.
  var WEEK = {
    mon: [],
    tue: ["16:00", "17:15"],
    wed: ["16:00", "17:15"],
    thu: ["16:00", "17:15"],
    fri: [],
    sat: ["09:00", "10:15", "11:30"],
    sun: [],
  };

  // One-off dates you're away. School holidays, a wedding, anything.
  // Format is "YYYY-MM-DD". Leaving old ones in does no harm.
  var AWAY = [
    // "2026-09-28",
    // "2026-09-29",
  ];

  var WEEKS_AHEAD = 6;      // how far ahead people can book
  var MIN_NOTICE_HOURS = 24; // don't offer anything sooner than this

  // ╔═══════════════════════════════════════════════════════════════════════╗
  // ║  Below here is just the code that turns the above into buttons.       ║
  // ╚═══════════════════════════════════════════════════════════════════════╝

  var TZ = "Australia/Sydney";
  var KEYS = ["sun", "mon", "tue", "wed", "thu", "fri", "sat"];
  var DAY_NAMES = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
  var MONTHS = ["January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"];

  // Sessions are worked out as real instants so daylight saving in October
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

  function build() {
    var out = [];
    var earliest = Date.now() + MIN_NOTICE_HOURS * 3600000;
    var away = {};
    AWAY.forEach(function (d) { away[d] = true; });

    var t = partsOf(Date.now());
    var cur = new Date(Date.UTC(t.y, t.m - 1, t.d));

    for (var i = 0; i < WEEKS_AHEAD * 7; i++) {
      var y = cur.getUTCFullYear(), m = cur.getUTCMonth() + 1, d = cur.getUTCDate();
      var date = y + "-" + pad(m) + "-" + pad(d);
      var dow = cur.getUTCDay();

      if (!away[date]) {
        (WEEK[KEYS[dow]] || []).forEach(function (time) {
          var start = instantOf(y, m, d, +time.slice(0, 2), +time.slice(3, 5));
          if (start >= earliest) {
            out.push({
              start: start,
              date: date,
              dayLabel: DAY_NAMES[dow] + " " + d + " " + MONTHS[m - 1],
              timeLabel: clock(start),
              value: DAY_NAMES[dow] + " " + d + " " + MONTHS[m - 1] + " " + y +
                     ", " + clock(start) + "–" + clock(start + 3600000),
            });
          }
        });
      }
      cur.setUTCDate(d + 1);
    }
    return out.sort(function (a, b) { return a.start - b.start; });
  }

  function render() {
    var box = document.getElementById("slot-list");
    var times = build();
    box.innerHTML = "";

    if (!times.length) {
      box.innerHTML = '<p class="slots-empty">No times free in the next few weeks &mdash; ' +
        '<label for="mode-waitlist" class="mode-link">join the waitlist</label> ' +
        'and we\'ll let you know as soon as something opens up.</p>';
      return;
    }

    var current = null, row = null;
    times.forEach(function (s) {
      if (s.date !== current) {
        current = s.date;
        var group = document.createElement("fieldset");
        group.className = "day-group";
        var legend = document.createElement("legend");
        legend.textContent = s.dayLabel;
        group.appendChild(legend);
        row = document.createElement("div");
        row.className = "time-row";
        group.appendChild(row);
        box.appendChild(group);
      }

      var label = document.createElement("label");
      label.className = "time-chip";

      var input = document.createElement("input");
      input.type = "radio";
      input.name = "session";
      input.value = s.value;
      input.required = true;

      var span = document.createElement("span");
      span.textContent = s.timeLabel;

      label.appendChild(input);
      label.appendChild(span);
      row.appendChild(label);
    });
  }

  // Only the fields on the visible tab are required. Without this the browser
  // refuses to submit because of a required field it can't scroll to.
  function syncMode() {
    var waiting = document.getElementById("mode-waitlist");
    var isWait = waiting && waiting.checked;
    var each = function (sel, fn) {
      Array.prototype.forEach.call(document.querySelectorAll(sel), fn);
    };
    each('#slot-list input[name="session"]', function (i) { i.required = !isWait; });
    each('.panel-waitlist input[name="wait-type"]', function (i) { i.required = isWait; });
  }

  // The Group Waitlist button links to #waitlist, which should open that tab.
  function openFromHash() {
    if (window.location.hash !== "#waitlist") return;
    var r = document.getElementById("mode-waitlist");
    if (r) { r.checked = true; syncMode(); }
  }

  function init() {
    // Netlify sends people back here with ?done=1 after a successful submit.
    if (window.location.search.indexOf("done=1") !== -1) {
      var done = document.getElementById("done");
      var form = document.getElementById("booking-form");
      if (done) { done.hidden = false; done.focus(); }
      if (form) form.hidden = true;
      return;
    }

    render();
    syncMode();
    openFromHash();

    Array.prototype.forEach.call(document.querySelectorAll(".mode-radio"), function (r) {
      r.addEventListener("change", syncMode);
    });
    window.addEventListener("hashchange", openFromHash);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
