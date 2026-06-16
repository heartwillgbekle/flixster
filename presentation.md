# Flixster — Demo Presentation

> Paste each `## Slide N` section into a separate slide in Google Slides / Keynote / PowerPoint. Section headings = slide titles. Text below them = slide body. Code blocks are meant to be screenshots/embedded code on the slide.

---

## Slide 1 — Title / Project Overview

**Flixster**
by Hgbekle

A movie discovery web app that lets users browse the latest movies, search the entire TMDb catalog, save favorites, mark what they've watched, watch trailers, and get an AI-generated "watch recommendation" inside a polished dark-mode UI.

**Built with:** React + Vite, The Movie Database (TMDb) API, OpenRouter (gpt-oss-120b) for AI insights, YouTube embeds for trailers.

**Live:** [paste your render.com URL here]

---

## Slide 2 — Design Inspiration

**Color palette inspired by Tubi**

I picked Tubi's signature deep indigo-purple as the page canvas because it reads cinematic without feeling generic — most streaming apps default to flat black, but the saturated purple gives Flixster its own identity while still letting movie posters pop.

**Palette:**
- `#3a1f6e` — Deep indigo-purple (page canvas)
- `#4a2c8c` — Slate-purple (cards, modal, inputs)
- `#8b5cf6` — Brighter violet (buttons, accents, borders)
- `#ffff13` — Electric yellow (CTAs, ratings, focus rings, brand tagline)
- `#ffffff` — White (titles, headings)
- `#d4cce8` — Muted lavender (body copy, metadata)

Typography: **Inter** (Google Fonts), weights 400 → 900.

All design tokens live as CSS custom properties on `:root` in `index.css` — swapping the palette is a single-file change.

**Contrast:** Every text/background pair is ≥ 7:1 (WCAG AAA), well above the 4.5:1 AA threshold.

---

## Slide 3 — Favorite Feature: Hover-Reveal Movie Cards

**The interaction**

Each movie card displays only the poster when idle — clean grid, posters dominate. On hover (or keyboard focus), three controls fade in over the image:

- ⭐ **Rating pill** (top-left)
- ♡ **Favorite heart** (top-right)
- **Mark as watched** translucent pill (bottom)

When the user moves their mouse away, every control disappears again.

**Why I love it**

Two things make it work:
1. **Click ≠ Click.** Clicking the heart or "Mark as watched" toggles state *without opening the modal* — the inner buttons call `event.stopPropagation()`. Clicking anywhere else on the card opens the modal. One card, three distinct interactions, zero ambiguity.
2. **Idle cards stay calm.** Without hover chrome, the grid feels like a movie wall, not a control panel. The user only sees actions when they reach for them.

---

## Slide 4 — Code Snippet: Hover-Reveal in Action

**The card knows the difference between "open" and "toggle"**

```jsx
// MovieCard.jsx
const open = () => onClick?.(movie.id);

const handleAction = (e, fn) => {
  e.stopPropagation();   // <-- the magic: don't bubble to the card
  fn?.(movie.id);
};

return (
  <div
    className="movie-card"
    role="button"
    tabIndex={0}
    onClick={open}                                  // card → modal
    onKeyDown={handleKeyDown}
    aria-label={`Open details for ${movie.title}`}
  >
    <img src={posterUrl} alt={`${movie.title} poster`} />
    <span className="movie-card__rating">⭐ {movie.vote_average}</span>
    <button onClick={(e) => handleAction(e, onToggleFavorite)}>
      {isFavorite ? '♥' : '♡'}                     {/* heart toggles */}
    </button>
    <button onClick={(e) => handleAction(e, onToggleWatched)}>
      {isWatched ? '✓ Watched' : 'Mark as watched'} {/* toggles */}
    </button>
  </div>
);
```

```css
/* MovieCard.css — hidden by default, revealed on hover/focus */
.movie-card__rating {
  opacity: 0;
  transform: translateY(-4px);
  pointer-events: none;
  transition: opacity 0.2s ease, transform 0.2s ease;
}

.movie-card:hover .movie-card__rating,
.movie-card:focus-within .movie-card__rating {
  opacity: 1;
  transform: translateY(0);
  pointer-events: auto;
}
```

`pointer-events: none` is the safety net — even if the rating overlaps a clickable area while invisible, it can't intercept the click.

---

## Slide 5 — Trailer Auto-Play (Netflix-Style)

**The decision**

I went back and forth on where to put trailers. Two options were on the table:

- **(A) "Watch trailer" button** — user clicks → trailer expands. Conservative, no surprise motion.
- **(B) Auto-play in the backdrop slot** — like Netflix and Apple TV+. Modal opens with the static backdrop image, then 1.5s later it cross-fades into the YouTube trailer.

I picked **(B)**. The 1.5-second delay is the trick: the user sees the static art first, *then* the motion arrives — never mid-blink, never jarring. It feels like the modal is "loading itself" into a richer state.

**How it works:**
- App fetches `/movie/{id}/videos` in parallel with details
- Picker filters to YouTube + Trailer/Teaser, official first, newest first
- MovieModal sets `showTrailer = true` after 1.5s via `setTimeout`
- The iframe replaces the backdrop with `autoplay=1`, `loop=1`, `controls=0`, `modestbranding=1`
- If no trailer exists, the backdrop just stays — additive, never load-bearing

---

## Slide 6 — Most Challenging: Deployment on Render

**What happened**

The stretch goal was deploying to render.com. I went down a rabbit hole because I assumed I needed a database — I downloaded **pgAdmin** and started setting up Postgres, since I thought a "real deployment" required a backend.

Render's setup wizard kept asking me for keys and configurations I didn't recognize. I had no idea what I was doing.

**The fix**

I asked **Devarsh** for help. He pointed out the obvious thing I had missed: **Flixster is a frontend-only app.** No database, no backend — TMDb is the only data source, and the API key already lives in the browser via `import.meta.env`. I just needed to deploy as a static site.

I redeployed using Render's static site flow (point at the GitHub repo, set the build command to `npm run build`, publish `dist/`) and it worked first try.

**Lesson learned:** Match the tool to the architecture. I was trying to bring a backend to a problem that didn't have one.

---

## Slide 7 — Most Challenging (Honorable Mention): Hover Mechanics

**Why hover was harder than it looks**

The "show controls on hover" idea took 30 seconds to describe but several iterations to get right. Three problems I had to solve:

1. **The card was a `<button>`, but the controls inside also needed to be `<button>`s.** Nesting buttons is invalid HTML — screen readers ignore inner buttons, keyboards behave unpredictably. Switched the card to `<div role="button" tabIndex={0}>` with manual Enter/Space handlers.

2. **Click bubbling.** When you click the heart, the click event bubbles up to the card, which would open the modal. Solved with `event.stopPropagation()` in the inner handlers.

3. **Hidden ≠ inaccessible.** Setting `opacity: 0` doesn't remove an element from the tab order or click handling. Without `pointer-events: none`, an invisible button could still steal clicks. Without `:focus-within` on the card, keyboard users couldn't see the controls when they tabbed to them.

The final result: works with mouse, works with keyboard, works with touch (`@media (hover: none)` keeps controls always visible), and screen readers correctly announce each control.

---

## Slide 8 — Next Steps

**If I had more time**

✱ **Cast list inside the modal** — fetch `/movie/{id}/credits` and display the top 5 actors with their photos. Clicking an actor would show their other films (using `/person/{id}/movie_credits`).

✱ **Personalized recommendations** — use the user's favorites and watched list to build a "Recommended for you" row on the home page. Either compute it client-side from genre overlap, or feed the favorited movies' titles + genres into the OpenRouter API and let the AI suggest similar films.

✱ **Persist favorites and watched lists** to `localStorage` so they survive refreshes (currently session-only).

✱ **Trailer picker** — let users cycle between multiple trailers/teasers/clips for a movie instead of always picking the "best" one.

---

## Slide 9 — Shoutouts

Big thanks to the people who helped me through this project:

✱ **Devarsh** — for unblocking my deployment when I went down the Postgres rabbit hole and pointing me toward a static-site deploy.

✱ **Doris** — [add what they helped with]

✱ **Benny** — [add what they helped with]

✱ **Audrey** — [add what they helped with]

This project would have stalled at "almost works" without them.

---

## Slide 10 — Resources

**APIs & Services**
- ✱ **The Movie Database (TMDb)** — https://www.themoviedb.org/
- ✱ **OpenRouter** (`openai/gpt-oss-120b:free`) — https://openrouter.ai/
- ✱ **YouTube embed API** — for trailer playback

**Tools**
- ✱ **Claude Code** — paired with me through architecture, debugging, and iterations
- ✱ **Render.com** — static-site hosting for the live deploy
- ✱ **Vite + React 18** — build tool + UI framework
- ✱ **Inter** by Rasmus Andersson (Google Fonts) — typography

**Inspiration**
- ✱ **Tubi** — color palette (deep indigo-purple)
- ✱ **Netflix / Apple TV+** — trailer auto-play behavior, hero banner, hover-reveal cards

---

## Demo flow suggestions (talk track)

1. **Open homepage** — "This is Flixster. I'll start at the home view." Point at the Hero banner cycling through top-rated movies.
2. **Hover over a card** — "Notice that when I hover, three controls appear — the rating, the heart, and the 'Mark as watched' button." Show them disappearing on mouseout.
3. **Click the heart** — "I can favorite a movie without opening the modal. The card click opens the modal; the heart click toggles state."
4. **Click the card** — Modal opens with backdrop. Wait 1.5s — "And there's the trailer auto-playing. No click needed."
5. **Scroll down inside the modal** — "Below the poster, the AI-generated watch recommendation."
6. **Close modal, click hamburger** — Sidebar slides in. Click "Favorites" → page changes.
7. **Return home, search** — Type a query, show search results.
8. **Resize the window** — Show responsive behavior (sort dropdown collapses on mobile, brand stays centered, sidebar still works).
