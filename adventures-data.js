// ═══════════════════════════════════════════════════════════════
// ADVENTURES DATA — the campaign content for the whole site.
// This one file drives the /adventures/ page AND the homepage
// teaser. Edit here, not in the HTML.
//
// Field guide:
//  - "tone"     must be one of: quest-1 … quest-6
//  - "status"   "recruiting" (taking new players) or "playing"
//               (under way). Recruiting campaigns show a spots
//               badge and a join button; playing ones show a
//               progress bar.
//  - "spots"    the short line shown in the badge, e.g.
//               "3 spots open" or "Full — waitlist open".
//               Keep it honest; scarcity only works once.
//  - "sessions" free text. If it contains "N of M" (e.g.
//               "Session 6 of 10") a progress bar is drawn.
//  - "skill"    on each objective must be exactly "Reading",
//               "Writing" or "Social"
//  - "player"   leave as "" for NPCs — the card then shows the
//               role on its own with no dangling separator.
//               Never put a real child's name here; use
//               "Player A" style labels only.
//
// The homepage teaser shows the FIRST THREE campaigns in this
// array — reorder them here to change that.
// ═══════════════════════════════════════════════════════════════

const ADVENTURES = [
  {
    "slug": "lantern-marsh",
    "name": "The Lantern Marsh",
    "tagline": "A soggy mystery with very polite cats",
    "tone": "quest-3",
    "group": "Ages 8–10 · Party of 4",
    "sessions": "Session 6 of 10",
    "status": "playing",
    "spots": "Full — waitlist open",
    "blurb": "The marsh lanterns have gone out one by one, and the treefolk of Reedhome need heroes small enough to sneak through the reeds and brave enough to ask the right questions.",
    "world": [
      {
        "session": "Session 1",
        "title": "Arrival at Reedhome",
        "body": "The party met Mayor Bulrush and learned that the lanterns keep the mist-things away. They were each given a reed charm."
      },
      {
        "session": "Session 3",
        "title": "The Sunken Library",
        "body": "Under the water sat a library of waterproof books. The heroes read three clues aloud to open the door."
      },
      {
        "session": "Session 5",
        "title": "The Lamplighter's Letter",
        "body": "A half-burnt letter revealed that the old lamplighter did not vanish — she is hiding. The party wrote a reply and sent it by heron."
      },
      {
        "session": "Session 6",
        "title": "Into the Deep Reeds",
        "body": "The party is currently exploring the deep reeds, following heron tracks towards a hidden houseboat."
      }
    ],
    "characters": [
      {
        "name": "Pipwick Marsh",
        "player": "Player A",
        "role": "Halfling Ranger",
        "note": "Keeps a field journal of every animal the party meets."
      }
    ],
    "objectives": [
      {
        "label": "Read a short passage aloud to the group",
        "skill": "Reading",
        "done": true
      },
      {
        "label": "Find key details in a written clue",
        "skill": "Reading",
        "done": true
      },
      {
        "label": "Write an in-character letter",
        "skill": "Writing",
        "done": true
      },
      {
        "label": "Describe a place using three senses",
        "skill": "Writing",
        "done": false
      },
      {
        "label": "Take turns without interrupting",
        "skill": "Social",
        "done": true
      },
      {
        "label": "Negotiate a plan the whole party agrees on",
        "skill": "Social",
        "done": false
      }
    ]
  },
  {
    "slug": "a-workshop-for-wizards-and-warriors",
    "name": "A Workshop for Wizards and Warriors",
    "tagline": "The first day of school for a new batch of adventurers",
    "tone": "quest-2",
    "group": "Ages 13–15",
    "sessions": "Starting soon",
    "status": "recruiting",
    "spots": "spots open",
    "blurb": "Jubilation fills the air, students fill the halls, and a new dawn rises over the grounds of the Gillview Institute. Headmaster Gill Octavius III, Viscount of Ardenvale and heir to the throne of Fellmore welcomes you with all the poise and elegance that only one with a title that long can carry. Will you study with the wizards, train with the barbarians, sing with the bards, or forge your own path entirely? Gillview is where you find out what kind of adventurer you really are.",
    "world": [
      {
        "session": "Session 1",
        "title": "First Day Jitters",
        "body": "Our heroes prepare themselves for the day ahead, the first step towards becoming a real adventurer. Gillview may be a safe training ground, but that does not mean there are no dangers, and nobody really knows what goes on behind those prestigious walls."
      }
    ],
    "characters": [
      {
        "name": "Professor Gill Octavius III",
        "player": "Non-Player Character",
        "role": "Headmaster, Gillview Institute",
        "note": "Heir to the most powerful kingdom in the land. In his old age Gill Octavius has taken a more… theoretical approach to adventuring, educating the heroes of a new era though he never can quite stay out of trouble."
      }
    ],
    "objectives": [
      {
        "label": "Read a short story and retell it",
        "skill": "Reading",
        "done": false
      },
      {
        "label": "Sound out unfamiliar words with support",
        "skill": "Reading",
        "done": false
      },
      {
        "label": "Write a motto or short creative line",
        "skill": "Writing",
        "done": false
      },
      {
        "label": "Write a character backstory paragraph",
        "skill": "Writing",
        "done": false
      },
      {
        "label": "Introduce yourself to a new group",
        "skill": "Social",
        "done": false
      },
      {
        "label": "Ask a quieter player for their idea",
        "skill": "Social",
        "done": false
      }
    ]
  },
  {
    "slug": "multidimensional-detective-agency",
    "name": "Multidimensional Detective Agency",
    "tagline": "Crime is afoot... or a hand, and sometimes a tentacle. You can never really be sure in this wacky whodunnit.",
    "tone": "quest-6",
    "group": "Ages 15–18",
    "sessions": "Starting soon",
    "status": "recruiting",
    "spots": "spots open",
    "blurb": "Martin Point a city built on a rift in the fabric of the universe began as a waypoint for weary inter-dimensional travellers has now grown into a metropolis. Its maze of back alleys, shopfronts and towering megaliths of industry rests on the shoulders of a powerless workforce. Now the curious death of Mayvil Aberneth, leader of the workers' movement, has pulled at a thread causing a whole web of deceit, propaganda and manipulation to unravel. What happened to Mayvil Aberneth? Who can you trust? And how will you bring justice to Martin Point?",
    "world": [],
    "characters": [
      {
        "name": "Mayvil Aberneth",
        "player": "Non-Player Character",
        "role": "Organiser, Martin Point Workers' Union",
        "note": "In a city as large as Martin Point people slip between the cracks, Mayvil was the one to pull them back up, now that she has fallen it is on the city to return that kindness. The official record says an accident. The official record says a lot of things."
      },
    ],
    "objectives": [
      {
        "label": "Read instructions and follow them in order",
        "skill": "Reading",
        "done": false
      },
      {
        "label": "Skim a document for one specific fact",
        "skill": "Reading",
        "done": false
      },
      {
        "label": "Write clear questions before asking them",
        "skill": "Writing",
        "done": false
      },
      {
        "label": "Keep a written session log",
        "skill": "Writing",
        "done": false
      },
      {
        "label": "Give a teammate a compliment in character",
        "skill": "Social",
        "done": false
      },
      {
        "label": "Disagree respectfully during a group decision",
        "skill": "Social",
        "done": false
      }
    ]
  }
];

// Colour tone used for each learning skill badge.
const SKILL_TONE = {
  "Reading": "quest-1",
  "Writing": "quest-5",
  "Social": "quest-3"
};

// Where every "join this quest" button points. Change it in one place here
// and it updates on both the homepage and the adventures page.
const JOIN_URL = "https://forms.gle/FaDSAM434s5T8QVz7";
