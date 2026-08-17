// ═══════════════════════════════════════════════════════════════════════════
// Renders the campaign cards from ADVENTURES (see adventures-data.js) into
// #home-quests-grid, and expands a full detail panel inline when a card is
// clicked. This replaces the old js/home-quests.js + js/adventures.js pair —
// there is no separate /adventures/ page any more.
//
// The panel is inserted into the same CSS grid as the cards and spans every
// column, so on desktop it opens as a full-width row beneath the cards and on
// mobile it opens directly under the card you tapped.
// ═══════════════════════════════════════════════════════════════════════════

(function () {
  "use strict";

  const gridEl = document.getElementById("home-quests-grid");
  if (!gridEl || typeof ADVENTURES === "undefined") return;

  const TABS = ["World Log", "Characters", "Learning"];

  // Each quest tone always draws the same icon shape.
  const TONE_SHAPE = {
    "quest-1": "diamond",
    "quest-2": "circle",
    "quest-3": "bar",
    "quest-4": "corner",
    "quest-5": "spark",
    "quest-6": "pill",
  };

  // Tab marks are independent of campaign tone, so "World Log" always looks
  // the same no matter which quest is open.
  const TAB_SHAPE = {
    "World Log": "bar",
    Characters: "circle",
    Learning: "spark",
  };

  const joinUrl = typeof JOIN_URL === "string" ? JOIN_URL : "#contact";

  let openSlug = null; // null = every card collapsed
  let activeTab = TABS[0];

  function esc(str) {
    const div = document.createElement("div");
    div.textContent = str;
    return div.innerHTML;
  }

  function isRecruiting(adv) {
    return adv.status === "recruiting";
  }

  function shapeMark(tone) {
    return `<span class="shape-${TONE_SHAPE[tone] || "circle"}" aria-hidden="true"></span>`;
  }

  // "Session 6 of 10" -> 60. Returns null when the text doesn't match.
  function parseSessionProgress(sessions) {
    const match = /(\d+)\s*of\s*(\d+)/i.exec(sessions || "");
    if (!match) return null;
    const total = Number(match[2]);
    if (!total) return null;
    return Math.max(0, Math.min(100, Math.round((Number(match[1]) / total) * 100)));
  }

  function initials(name) {
    const words = (name || "").trim().split(/\s+/).filter(Boolean);
    if (!words.length) return "?";
    if (words.length === 1) return words[0].slice(0, 2).toUpperCase();
    return (words[0][0] + words[words.length - 1][0]).toUpperCase();
  }

  /* ---- Card ------------------------------------------------------------- */

  function renderCard(adv) {
    const open = adv.slug === openSlug;
    const pct = parseSessionProgress(adv.sessions);
    const latest = adv.world && adv.world.length ? adv.world[adv.world.length - 1] : null;
    const openStyle = open
      ? `border-color: var(--${adv.tone}); box-shadow: 0 6px 0 0 var(--${adv.tone});`
      : "";

    return `
      <button type="button" class="campaign-card tone-${adv.tone} ${open ? "is-active" : ""}"
        data-slug="${esc(adv.slug)}" aria-expanded="${open}" aria-controls="quest-panel"
        style="${openStyle}">
        <span class="campaign-card-head">
          <span class="campaign-icon" style="background-color: var(--${adv.tone});">
            ${shapeMark(adv.tone)}
          </span>
          <span class="campaign-tag" style="background-color: var(--${adv.tone});">${esc(adv.sessions)}</span>
        </span>
        <h3 style="color: color-mix(in oklab, var(--${adv.tone}) 78%, black);">${esc(adv.name)}</h3>
        <p class="campaign-card-tagline">${esc(adv.tagline)}</p>
        ${adv.spots ? `<span class="campaign-card-spots">${esc(adv.spots)}</span>` : ""}
        ${
          latest && !isRecruiting(adv)
            ? `<p class="campaign-card-latest">
                <span class="latest-dot" style="background-color: var(--${adv.tone});"></span>
                Latest: <strong>${esc(latest.title)}</strong>
              </p>`
            : ""
        }
        ${
          pct !== null
            ? `<span class="campaign-card-progress" role="presentation">
                <span class="campaign-card-progress-fill" style="width: ${pct}%; background-color: var(--${adv.tone});"></span>
              </span>`
            : ""
        }
        <span class="campaign-card-cta">${open ? "Hide details" : "See this quest"}</span>
      </button>`;
  }

  /* ---- Panel tab bodies -------------------------------------------------- */

  function renderWorldLog(adv) {
    if (!adv.world || !adv.world.length) {
      return `<p class="timeline-empty">This quest hasn't begun yet. Once the party sits down at session one, everything they discover gets logged here &mdash; so you can follow the story from the outside.</p>`;
    }
    const upcoming = isRecruiting(adv);
    const items = adv.world
      .map((entry, i) => {
        const last = i === adv.world.length - 1;
        const badge = last
          ? `<span class="timeline-latest-badge">${upcoming ? "Up next" : "Latest"}</span>`
          : "";
        return `
          <li class="${last ? "is-latest" : ""}" style="--current-tone: var(--${adv.tone});">
            <p class="timeline-session">${esc(entry.session)}${badge}</p>
            <h4>${esc(entry.title)}</h4>
            <p>${esc(entry.body)}</p>
          </li>`;
      })
      .join("");
    return `<ol class="timeline">${items}</ol>`;
  }

  function renderCharacters(adv) {
    if (!adv.characters || !adv.characters.length) {
      return `<p class="characters-empty">The party for this quest is still being assembled.</p>`;
    }
    const cards = adv.characters
      .map((c) => {
        // NPCs have no player, so don't render a dangling " · " separator.
        const meta = c.player ? `${esc(c.role)} &middot; ${esc(c.player)}` : esc(c.role);
        return `
          <article class="character-card" style="background-color: var(--${adv.tone}-soft); border-color: color-mix(in oklab, var(--${adv.tone}) 30%, white);">
            <span class="character-avatar" style="background-color: var(--${adv.tone});">${esc(initials(c.name))}</span>
            <div class="character-card-body">
              <h4>${esc(c.name)}</h4>
              <p class="character-role">${meta}</p>
              <p class="character-note">${esc(c.note)}</p>
            </div>
          </article>`;
      })
      .join("");

    const intro = isRecruiting(adv)
      ? `<p class="privacy-note" style="margin-top:0; margin-bottom:1.25rem;">The party hasn't formed yet &mdash; these are the faces waiting for them.</p>`
      : "";

    return `${intro}<div class="characters-grid">${cards}</div>
      <p class="privacy-note">We never publish players' real names. Characters are listed by their in-world name, and players by an anonymous label only.</p>`;
  }

  function renderLearning(adv) {
    const done = adv.objectives.filter((o) => o.done).length;
    const pct = Math.round((done / adv.objectives.length) * 100);
    const upcoming = isRecruiting(adv);

    const items = adv.objectives
      .map((o) => {
        const tone = SKILL_TONE[o.skill];
        return `
          <li class="objective ${o.done ? "is-done" : ""}">
            <span class="objective-check" aria-hidden="true" style="background-color: ${o.done ? `var(--${tone})` : "transparent"}; border-color: var(--${tone});">${o.done ? "&#10003;" : ""}</span>
            <span class="sr-only">${o.done ? "Completed:" : "Not yet completed:"}</span>
            <span class="objective-label">${esc(o.label)}</span>
            <span class="skill-tag" style="background-color: var(--${tone}-soft); color: color-mix(in oklab, var(--${tone}) 78%, black);">${esc(o.skill)}</span>
          </li>`;
      })
      .join("");

    // Nothing to chart on a quest that hasn't started — show the goals instead
    // of a 0% progress bar.
    const header = upcoming
      ? `<div class="progress-header"><p>The ${adv.objectives.length} goals this quest is built around</p></div>`
      : `<div class="progress-header">
           <p>${done} of ${adv.objectives.length} objectives completed</p>
           <span class="progress-pct">${pct}%</span>
         </div>
         <div class="progress-track" role="progressbar" aria-valuenow="${pct}" aria-valuemin="0" aria-valuemax="100" aria-label="${esc(adv.name)} learning progress" style="--current-tone: var(--${adv.tone});">
           <div class="progress-fill" style="width: ${pct}%;"></div>
         </div>`;

    return `
      <div>
        ${header}
        <ul class="objectives-list" style="margin-top: 1.25rem;">${items}</ul>
        <p class="objectives-note">Every player also receives their own personalised learning record &mdash; this board is the party-wide view.</p>
      </div>`;
  }

  /* ---- Panel ------------------------------------------------------------- */

  function renderTabs(adv) {
    return `
      <div class="tab-list" role="tablist" aria-label="${esc(adv.name)} sections">
        ${TABS.map((t, i) => {
          const selected = t === activeTab;
          const style = selected ? `background-color: var(--${adv.tone});` : "";
          const iconStyle = selected
            ? ""
            : "background-color: var(--muted-foreground); border-color: var(--muted-foreground);";
          return `
            <button type="button" id="tab-${esc(adv.slug)}-${i}" class="tab-btn ${selected ? "is-active" : ""}"
              style="${style}" data-tab="${t}" role="tab" aria-selected="${selected}" aria-controls="tabpanel-${esc(adv.slug)}">
              <span class="tab-icon"><span class="shape-${TAB_SHAPE[t] || "circle"}" aria-hidden="true" style="${iconStyle}"></span></span>
              ${t}
            </button>`;
        }).join("")}
      </div>`;
  }

  function renderPanel(adv) {
    let body = "";
    if (activeTab === "World Log") body = renderWorldLog(adv);
    if (activeTab === "Characters") body = renderCharacters(adv);
    if (activeTab === "Learning") body = renderLearning(adv);

    const recruiting = isRecruiting(adv);
    const ctaMessage = recruiting
      ? `<strong>${esc(adv.spots || "Spots open")}</strong> on this quest. Tell us about your young adventurer and we'll let you know if it's the right table.`
      : `This party is under way, but new quests open regularly. Ask to be told when the next one starts.`;

    return `
      <section id="quest-panel" class="campaign-panel quest-panel-inline"
        style="border-color: color-mix(in oklab, var(--${adv.tone}) 35%, white);">
        <button type="button" class="quest-panel-close" data-close-panel aria-label="Close ${esc(adv.name)} details">&times;</button>
        <div class="panel-header">
          <span class="panel-icon" style="background-color: var(--${adv.tone});">${shapeMark(adv.tone)}</span>
          <div class="panel-heading">
            <p class="campaign-eyebrow">${esc(adv.group)}</p>
            <h3 tabindex="-1" style="color: color-mix(in oklab, var(--${adv.tone}) 78%, black);">${esc(adv.name)}</h3>
          </div>
          <span class="panel-session-tag" style="background-color: var(--${adv.tone});">${esc(adv.sessions)}</span>
        </div>
        <p class="campaign-blurb">${esc(adv.blurb)}</p>
        ${renderTabs(adv)}
        <div class="tab-panel is-active" role="tabpanel" id="tabpanel-${esc(adv.slug)}"
          aria-labelledby="tab-${esc(adv.slug)}-${TABS.indexOf(activeTab)}" tabindex="0">${body}</div>
        <div class="panel-cta" style="border-color: color-mix(in oklab, var(--${adv.tone}) 45%, transparent);">
          <p>${ctaMessage}</p>
          <a href="${joinUrl}" ${/^https?:/.test(joinUrl) ? 'target="_blank" rel="noopener noreferrer"' : ""}
             class="btn btn-accent" data-track-cta="quest-${esc(adv.slug)}">
            ${recruiting ? "Ask About a Spot" : "Join the Waitlist"}
          </a>
        </div>
      </section>`;
  }

  /* ---- Render + wiring --------------------------------------------------- */

  // How many cards sit in a row at the current width. Must match the
  // .campaign-switcher breakpoints in css/style.css.
  function columnCount() {
    if (window.matchMedia("(min-width: 1024px)").matches) return 3;
    if (window.matchMedia("(min-width: 768px)").matches) return 2;
    return 1;
  }

  let renderedCols = columnCount();

  function render(focusPanel) {
    const cols = columnCount();
    renderedCols = cols;

    // Open the panel after the LAST card in the active card's row, so the
    // cards in that row stay side by side instead of being pushed down.
    const activeIndex = ADVENTURES.findIndex((a) => a.slug === openSlug);
    const panelAfter =
      activeIndex === -1
        ? -1
        : Math.min(Math.floor(activeIndex / cols) * cols + cols - 1, ADVENTURES.length - 1);

    let html = "";
    ADVENTURES.forEach((adv, i) => {
      html += renderCard(adv);
      if (i === panelAfter) html += renderPanel(ADVENTURES[activeIndex]);
    });
    gridEl.innerHTML = html;
    wire();

    if (focusPanel && openSlug) {
      const heading = gridEl.querySelector(".panel-heading h3");
      if (heading) {
        heading.focus({ preventScroll: true });
        heading.scrollIntoView({ block: "nearest", behavior: "smooth" });
      }
    }
  }

  // Rotating a phone or resizing can change the column count, which changes
  // where the panel belongs. Only re-render when it actually changes.
  window.addEventListener("resize", () => {
    if (openSlug && columnCount() !== renderedCols) render(false);
  });

  function wire() {
    gridEl.querySelectorAll(".campaign-card").forEach((btn) => {
      btn.addEventListener("click", () => {
        const slug = btn.dataset.slug;
        if (openSlug === slug) {
          // Toggling closed — return focus to the card that was open.
          openSlug = null;
          render(false);
          const again = gridEl.querySelector(`.campaign-card[data-slug="${slug}"]`);
          if (again) again.focus();
          return;
        }
        openSlug = slug;
        activeTab = TABS[0];
        render(true);
      });
    });

    gridEl.querySelectorAll(".tab-btn").forEach((btn) => {
      btn.addEventListener("click", () => {
        activeTab = btn.dataset.tab;
        render(false);
      });
    });

    const closeBtn = gridEl.querySelector("[data-close-panel]");
    if (closeBtn) {
      closeBtn.addEventListener("click", () => {
        const slug = openSlug;
        openSlug = null;
        render(false);
        const card = gridEl.querySelector(`.campaign-card[data-slug="${slug}"]`);
        if (card) card.focus();
      });
    }
  }

  // Escape closes an open quest.
  document.addEventListener("keydown", (e) => {
    if (e.key !== "Escape" || !openSlug) return;
    const slug = openSlug;
    openSlug = null;
    render(false);
    const card = gridEl.querySelector(`.campaign-card[data-slug="${slug}"]`);
    if (card) card.focus();
  });

  // Deep links still work: /#lantern-marsh opens that quest on load, so old
  // links and anything you share on social land in the right place.
  const hash = decodeURIComponent(window.location.hash.replace(/^#/, ""));
  if (ADVENTURES.some((a) => a.slug === hash)) openSlug = hash;

  render(false);
})();
