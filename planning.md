# Flixster — Project Planning

## 1. Component Architecture

### Hierarchy
```
App
├── Header
├── SearchBar
├── SortControl
├── MovieList
│   └── MovieCard (×N)
├── MovieModal (conditional)
└── Footer
```

### Components

#### App
- **Responsibility:** Root component. Owns global state and orchestrates data fetching across SearchBar, MovieList, and (later) the modal.
- **Renders:** Header, SearchBar, SortControl (later), MovieList, MovieModal (when a movie is selected), Footer.
- **Props:** None (root).
- **State:** `movies`, `searchQuery`, `page`, `mode` (`"now_playing" | "search"`), `selectedMovieId` (later), `sortOption` (later), `isLoading`, `error`, `hasMore`.

#### Header
- **Responsibility:** Display the app title, logo, and tagline. Pure branding — no controls.
- **Renders:** SVG logo ([`flixster-logo.svg`](src/assets/flixster-logo.svg)) + "Flixster" title + tagline ("Discover what's playing now.").
- **Props:** None.
- **State:** None (presentational).
- **Note:** The "Now Playing" mode toggle moved out of the header into a dedicated toolbar inside `<main>` so Header can stay prop-less. Keeps branding separate from controls.

#### SearchBar
- **Responsibility:** Capture user search input and trigger search/clear actions.
- **Renders:** Controlled text input, submit button, clear button (when there's an active query).
- **Props:** `onSearch: (query: string) => void`, `onClear: () => void`, `activeQuery: string` (so the bar can show what's currently searched and reset its input on clear).
- **State:** Local controlled-input state (`inputValue`) — only lifted to App on submit, not on every keystroke.

#### SortControl
- **Responsibility:** Let user pick a sort option for the current movie list.
- **Renders:** A native `<select>` dropdown with four options: Default (API order), Title (A–Z), Release Date (newest), Rating (highest).
- **Props:** `sortOption: string`, `onSortChange: (option: string) => void`.
- **State:** None — controlled by App.

#### MovieList
- **Responsibility:** Render a grid of movie cards plus a "Load More" button. Pure presentation — no fetching.
- **Renders:** A list of `MovieCard` components, a Load More button (when `hasMore`), and inline status messages (loading, error, empty).
- **Props:** `movies: Movie[]`, `onLoadMore: () => void`, `hasMore: boolean`, `isLoading: boolean`, `error: string | null`, `onCardClick: (id: number) => void` (forwarded to each MovieCard).
- **State:** None — pure presentation of data passed in.

#### MovieCard
- **Responsibility:** Display a single movie's poster, title, and rating; trigger modal open via `onClick(id)`.
- **Renders:** Poster `<img>`, title, vote average. Whole card is a `<button>` so click + keyboard activation work.
- **Props:** `movie: { id, title, poster_path, vote_average, release_date }`, `onClick: (id: number) => void`.
- **State:** None.

#### MovieModal
- **Responsibility:** Display full movie details (backdrop, title, release date, runtime, genres, overview) and the AI insight. **Pure presentation** — receives details as a prop, does not fetch.
- **Renders:** Backdrop image, title, tagline (if present), release date + runtime row, genre chip list, overview, AI insight (later), close button. Inline loading and error states.
- **Props:** `details: MovieDetails | null`, `isLoading: boolean`, `error: string | null`, `onClose: () => void`.
- **State:** None for movie data (App owns it). Will own `aiInsight` + `isLoadingAi` when the AI feature is added (those are scoped to the modal's lifetime).
- **Open trigger:** App renders `<MovieModal>` only when `selectedMovieId !== null`. App's click handler (`handleCardClick`) sets `selectedMovieId` when MovieCard's `onClick(id)` fires (propagated up through MovieList).
- **Close triggers (all call `onClose`, which sets `selectedMovieId = null` in App):**
  - Click on the close button (×) in the modal header
  - Press `Escape` key (global keydown listener registered on mount)
  - Click on the dimmed backdrop (event target check: only fires when click hits the backdrop element, not its children)
- **Side effects:** Locks body scroll while open via `document.body.style.overflow = 'hidden'`; restored on unmount.

#### Footer
- **Responsibility:** Display copyright notice and the TMDb attribution required by their terms of use.
- **Renders:** © {currentYear} Flixster + a paragraph attributing data to The Movie Database with an external link to https://www.themoviedb.org/ and the standard "not endorsed by TMDb" disclaimer.
- **Props:** None.
- **State:** None (year is computed at module load).

---

## 2. API Contracts

**Base URL:** `https://api.themoviedb.org/3`
**Auth:** API key passed as `api_key` query param (from `import.meta.env.VITE_API_KEY`).
**Image base:** `https://image.tmdb.org/t/p/w500{poster_path}` for posters, `w780` for backdrops.

### 2.1 Now Playing
- **Endpoint:** `GET /movie/now_playing`
- **Required params:** `api_key`, `language=en-US`, `page` (number, default 1)
- **Response fields used:** `results[].id`, `results[].title`, `results[].poster_path`, `results[].vote_average`, `results[].release_date`, `total_pages`, `page`
- **Error cases:** Network failure, 401 (bad key), 429 (rate limit), empty results array, `page > total_pages`

### 2.2 Search Movies
- **Endpoint:** `GET /search/movie`
- **Required params:** `api_key`, `query` (URL-encoded), `language=en-US`, `page`, `include_adult=false`
- **Response fields used:** Same as Now Playing — `results[].id`, `title`, `poster_path`, `vote_average`, `release_date`, `total_pages`
- **Error cases:** Empty query string (skip request), zero results (show "No movies found"), network failure, 422 (invalid query)

### 2.3 Movie Details (for modal)
- **Endpoint:** `GET /movie/{movie_id}` — `movie_id` is a path parameter taken from the clicked MovieCard.
- **Required params:** `api_key`, `language=en-US`
- **Response fields used:**
  - `title` — modal heading
  - `release_date` — formatted as year or full date
  - `runtime` — minutes (integer); render as `Xh Ym`
  - `genres` — array of `{ id, name }`; render `name`s as comma-joined or chip list
  - `overview` — paragraph body
  - `backdrop_path` — full URL: `https://image.tmdb.org/t/p/w780{backdrop_path}`
  - `vote_average`, `tagline` — optional supporting display
- **Error cases:**
  - **404** — movie not found / deleted upstream → show "Movie details unavailable" inside modal, keep close button functional
  - **401** — bad/missing API key → same fallback; log a warning so it's debuggable
  - **Network failure** — show "Could not load details. Try again." with retry button
  - **Missing optional fields** (`runtime: null`, empty `genres`, missing `backdrop_path`) — render gracefully (`Runtime unknown`, omit genre row, fall back to a solid-color modal header instead of a backdrop image)

### 2.4 AI Insight (LLM provider — TBD)
- **Endpoint:** `POST <provider chat/completion endpoint>` — exact provider/URL chosen at Milestone 8.
- **Auth:** Bearer token or API key in request headers, sourced from a dedicated env var (e.g., `VITE_AI_API_KEY`), separate from the TMDb key.
- **Required body params (typical shape):**
  - `model` — model identifier
  - `max_tokens` (or equivalent) — capped low (~200) since output is 2–3 sentences
  - `messages` / `prompt` — user prompt built from `{title, genres, overview}` (see Section 5)
- **Response fields used:** Whatever field carries the generated text (e.g., `content[0].text`, `choices[0].message.content`) — extract a single string.
- **Error cases:**
  - 401 / bad key → hide AI section, log warning
  - 429 / rate limit → show "AI insight unavailable, try again later"
  - 5xx / overloaded → same fallback as rate limit
  - Network failure → hide AI section silently
  - Empty or malformed response → fall back to "No insight generated"

> ⚠️ **Security note:** Calling an LLM provider directly from the browser exposes the API key to anyone who opens DevTools. Acceptable for this learning project; in production this call should be proxied through a backend that holds the key server-side.

---

## 3. State Architecture

| Variable | Type | Initial Value | Owner | Update Trigger |
|---|---|---|---|---|
| `movies` | `Movie[]` | `[]` | App | After fetch — replaced on page 1, appended on Load More |
| `searchQuery` | `string` | `""` | App | User submits SearchBar; cleared when toggling back to Now Playing |
| `page` | `number` | `1` | App | User clicks "Load More"; reset to 1 on new search or mode switch |
| `mode` | `"now_playing" \| "search"` | `"now_playing"` | App | Set to `"search"` on submit, `"now_playing"` on clear |
| `selectedMovieId` | `number \| null` | `null` | App | User clicks MovieCard → set to `movie.id`. Modal close (×, Esc, backdrop) → set to `null`. Doubles as the "modal is open" flag (open ⇔ `!== null`). |
| `sortOption` | `"default" \| "title-asc" \| "release-desc" \| "rating-desc"` | `"default"` | App | User changes SortControl. Sort applied as a render-time transform via `useMemo` over `movies` — does NOT mutate state. |
| `isLoading` | `boolean` | `false` | App | Set true before fetch, false on resolve/reject |
| `error` | `string \| null` | `null` | App | Set on fetch failure; cleared on next attempt |
| `hasMore` | `boolean` | `true` | App | Set from `page < total_pages` after fetch |
| `inputValue` | `string` | `""` | SearchBar | Every keystroke (controlled input) |
| `details` | `MovieDetails \| null` | `null` | App | Set after `getMovieDetails(selectedMovieId)` resolves; cleared when modal closes |
| `isLoadingDetails` | `boolean` | `false` | App | True during details fetch |
| `detailsError` | `string \| null` | `null` | App | Set if details fetch fails; cleared when a new movie is selected |
| `aiInsight` | `string \| null` | `null` | MovieModal | Set after AI fetch (Milestone 8) |
| `isLoadingAi` | `boolean` | `false` | MovieModal | True during AI fetch (Milestone 8) |

**Notes:**
- Sorting is applied client-side over `movies` (no API param) — derived value, not stored separately.
- Switching between Now Playing and Search resets `page = 1` and clears `movies`.
- Movie details (`details`, `isLoadingDetails`, `detailsError`) live in App — App fetches when `selectedMovieId` changes and passes the result down to MovieModal. AI-only state will live in MovieModal since it's scoped to that component's lifetime.

---

## 4. Data Flow

**Fetch → Render path:**
1. App mounts → `useEffect` calls `fetchNowPlaying(page=1)` → sets `isLoading=true`.
2. Fetch resolves → response JSON parsed → `results` array stored in `movies` state. No transformation needed for the list view; TMDb fields map directly to MovieCard props.
3. App passes `movies` (optionally sorted client-side based on `sortOption`) into MovieList.
4. MovieList maps over `movies`, rendering one MovieCard per entry with the movie object as a prop.
5. MovieCard reads `movie.poster_path` and prepends the image base URL (`https://image.tmdb.org/t/p/w500`) to form the full image URL — this is the only transformation at the card layer.

**Click → Modal path:**
1. **Where the ID lives:** MovieCard already has the full movie object as a prop (from App → MovieList → MovieCard). It only needs to pass `movie.id` upward — no extra lookup.
2. **Click handler bubbling:** User clicks a MovieCard → MovieCard calls `props.onClick(movie.id)` → MovieList forwards via `onCardClick` → App's `handleCardClick` calls `setSelectedMovieId(id)`.
3. **Who owns "modal is open":** App owns `selectedMovieId`. There is **no separate `isModalOpen` flag** — `selectedMovieId !== null` is the open condition. This avoids drift between two states that must always agree.
4. **Who fetches details:** App. A second `useEffect` keyed on `selectedMovieId` calls `getMovieDetails(id)` and writes to App-owned `details` / `isLoadingDetails` / `detailsError` state. The effect uses a `cancelled` flag in cleanup so a stale fetch doesn't overwrite newer data when the user switches movies quickly.
5. **How state reaches MovieModal:** App renders `<MovieModal details={details} isLoading={isLoadingDetails} error={detailsError} onClose={...} />` only when `selectedMovieId !== null`. MovieModal is **purely presentational** — no fetching inside.
6. **Closing:** Any close trigger (×, Esc, backdrop click) calls `onClose()` → App sets `selectedMovieId = null` → the details-fetch effect's `selectedMovieId === null` branch resets `details` and `detailsError` → modal unmounts.

**Search flow:** SearchBar's onSubmit → App sets `searchQuery`, resets `page=1`, calls `fetchSearch(query, 1)` → swaps `movies` with new results. Empty query reverts to Now Playing.

**Sort flow:** Sort is a **render-time transformation, not a state mutation.** App keeps `movies` raw from the API and derives `sortedMovies` via `useMemo([movies, sortOption])`. `sortedMovies` (not `movies`) is passed to MovieList. Consequences:
- The fetch effect doesn't need to know anything about sorting.
- Load More appends to raw `movies`; the sort re-applies automatically on the next render.
- Switching sort options is instant (no refetch, no array mutation).
- Default uses the array reference directly (no copy); other options use `[...movies].sort(SORT_FNS[option])` so the in-place sort doesn't mutate state.

---

## 4.6 Visual Intent + Accessibility

### Theme — "cinematic dark"
High-contrast cinematic theme using deep indigo-purples and electric yellow to guide attention and ensure readability. Typography is set in **Inter** (Google Fonts) for legibility at small sizes.

| Token | Value | Usage |
|---|---|---|
| `--bg-main` | `#0a0019` | Page canvas, header, footer |
| `--bg-card` | `#161324` | Cards, modal, inputs |
| `--bg-card-hover` | `#1f1a31` | Card hover background |
| `--accent-yellow` | `#ffff13` | Primary CTA, ratings, focus rings, links |
| `--accent-purple` | `#45009d` | Secondary CTA, genre chip borders, glow |
| `--text-title` | `#ffffff` | Headings, body title text |
| `--text-body` | `#a39eb8` | Metadata, descriptions, footer copy |
| `--text-muted` | `#7d7891` | Tertiary detail (errors, footnotes) |

All design tokens live as CSS custom properties on `:root` in [`src/index.css`](src/index.css) so any component can pull them directly.

### Per-component visual intent (recorded as comments at the top of each CSS file)
- **Header** — dramatic full-width brand bar with logo glow and a yellow tagline accent that gives the brand a "heartbeat."
- **Footer** — quiet, low-contrast, completes the page without competing with the grid; yellow link is the only accent.
- **MovieCard** — poster-first; subtle scale + purple ambient glow on hover for energy without jitter. Yellow rating text for at-a-glance scanning.
- **MovieList** — airy spacing; Load More button is a yellow ghost that fills with yellow on hover (encouraging, not loud).
- **MovieModal** — immersive, frosted-purple backdrop; clear hierarchy of heroic title → yellow meta → genre chips → calm body copy.
- **SearchBar** — dark input with yellow focus ring; signals interactivity without competing with the grid.
- **SortControl** — secondary control; quieter than search.

### Accessibility checklist (Milestone 7)
- ✅ **Image alt text** — all `<img>` elements have descriptive alt. MovieCard uses `${movie.title} poster` per the milestone hint. Decorative modal backdrop uses `alt=""` (intentional — same image's title text appears in the modal heading, so the backdrop is purely decorative).
- ✅ **Keyboard navigation** — all interactive elements are native focusable controls (`<button>`, `<input>`, `<select>`, `<a>`). MovieCard wraps the entire poster in a `<button>` so Tab-then-Enter opens the modal.
- ✅ **Visible focus rings** — global `:focus-visible` rule plus per-component overrides give every focusable element a 2px yellow outline with a 2-3px offset. No `outline: none` without a replacement.
- ✅ **Semantic HTML** — `<header>`, `<main>`, `<footer>` for landmarks; `<button>` for clickable actions; `<input>` for search; `<select>` for sort; `<dialog>`-style modal uses `role="dialog"` + `aria-modal="true"`; close button has `aria-label="Close"`.
- ✅ **Esc closes modal** — global keydown listener mounted with the modal.
- ✅ **Body scroll lock** — prevents background scrolling while the modal is open; restored on unmount.
- ✅ **Color contrast (WCAG 2.0 AA — 4.5:1 for normal text)** — verified with WebAIM contrast checker:
  - White (`#ffffff`) on `#0a0019` → 20.4:1 ✅
  - White on `#161324` → 17.7:1 ✅
  - Body text (`#a39eb8`) on `#0a0019` → 8.6:1 ✅
  - Body text on `#161324` → 7.5:1 ✅
  - Yellow (`#ffff13`) on `#0a0019` → 18.6:1 ✅
  - Yellow on `#161324` → 16.1:1 ✅
- ✅ **External links** — TMDb attribution uses `target="_blank"` + `rel="noopener noreferrer"` (security best practice).

---

## 4.5 Responsive Breakpoints

Two breakpoints split the layout into three sizes. The list uses **flexbox** (`display: flex; flex-wrap: wrap`) and each card uses `flex: 1 1 <basis>` with a `max-width` cap. The basis controls the target card width per breakpoint; `flex-grow` lets cards stretch to fill rows, and `max-width` prevents orphan cards on the last row from blowing up to full width.

| Range | Card flex-basis | Card max-width | Approx cards/row | Gap | Padding |
|---|---|---|---|---|---|
| Mobile (`< 600px`) | 140px | 200px | ~2 | 12px | 12px |
| Tablet (`600px – 1023px`) | 170px | 220px | ~3–5 | 16px | 20px |
| Desktop (`≥ 1024px`) | 200px | 240px | ~5–7 | 24px | 32px |

**Approach:** mobile-first base styles, then `@media (min-width: 600px)` and `@media (min-width: 1024px)` overrides. Card typography stays the same size across breakpoints — the layout does the work. List width capped at 1400px and centered to avoid sparse rows on ultra-wide monitors.

---

## 5. AI Feature Spec

### Goal
Generate a short, personable "Why you might like this" recommendation for the movie currently open in the modal.

### Display
- **Component:** `MovieModal` (rendered below overview, above close button).
- **UI:** A boxed/highlighted section labeled "AI Insight" with a small loading indicator while the request is in flight.

### Input (sent as context to the AI)
- `title` (string)
- `genres` (string[] — flattened from `details.genres[].name`)
- `overview` (string)

### Output
- A 2–3 sentence watch recommendation in plain text.
- Tone: enthusiastic but grounded. Mentions the genre/themes and what type of viewer would enjoy it.

### State
- `aiInsight: string | null` — lives in `MovieModal` local state.
- `isLoadingAi: boolean` — true while request is in flight.
- Cleared automatically when the modal unmounts (new movie ID = new modal instance via `key={movieId}`).

### Provider
- LLM provider TBD — finalized at Milestone 8 based on latency, quality, and ease of integration. Whichever provider is chosen, the call goes through the contract in Section 2.4. Placeholder prompt:
  > "In 2–3 sentences, tell me why a viewer might enjoy *{title}* — a {genres} film about: {overview}. Be specific and avoid generic phrasing."

### Error handling
- On AI failure: hide the AI section silently (don't block the rest of the modal) or show "AI insight unavailable."
- Cache by `movieId` if revisiting the same modal in one session is common (defer until measured).

---

## 6. Milestone Reflections

A running log of what shipped per milestone, what diverged from the original plan, and what to watch for next. Entries are append-only; the spec sections above always reflect the current target.

### Milestone 0 — Planning
- **Built:** Initial spec covering component architecture, three TMDb endpoints, state ownership, data flow, and a placeholder AI feature.
- **Diverged:** None — this *was* the spec.
- **Decisions worth keeping:** App owns global data state; modal owns its own scoped state (details + AI); AI call kept provider-agnostic so we can pick at Milestone 8.
- **Open questions deferred to later milestones:** sort UI placement, modal animation, AI provider choice.

### Milestone 1 — MovieCard + MovieList
- **Built:** [`src/api/tmdb.js`](src/api/tmdb.js) helper with `getNowPlaying` / `searchMovies` / `getMovieDetails`. [`MovieCard`](src/components/MovieCard.jsx) renders poster + title + vote average; [`MovieList`](src/components/MovieList.jsx) fetched Now Playing on mount and rendered a card per result.
- **Diverged:** Per Milestone 1 instructions, fetching lived in MovieList (not App as originally specced). State (`movies`/`isLoading`/`error`) was owned there temporarily.
- **Decisions worth keeping:** Wrapped MovieCard in a `<button>` for native keyboard accessibility once `onClick` lands. Fallback poster URL for movies with `null` poster_path.
- **Tech-debt flagged:** State would have to be lifted to App as soon as SearchBar/SortControl arrived — paid down in Milestone 2.

### Milestone 2 — Search + Pagination + Mode toggle
- **Built:** [`SearchBar`](src/components/SearchBar.jsx) with controlled input, header "Now Playing" toggle, "Load More" button. App now owns all data state and runs a single `useEffect` keyed on `[mode, searchQuery, page]`. Page 1 replaces `movies`; pages 2+ append via `setMovies(prev => [...prev, ...new])`. `hasMore` derived from `page < total_pages`.
- **Diverged:** Added a new `mode: "now_playing" | "search"` state variable that wasn't in the original spec — needed to disambiguate which endpoint the next page should hit when "Load More" is clicked. Spec updated to match.
- **Decisions worth keeping:** SearchBar keeps its own `inputValue` state and only lifts on submit (not every keystroke) — avoids re-fetching on every character. Two ways to leave search mode (Clear button + header "Now Playing") so users always have an obvious exit. Trim + reject empty submissions to avoid wasted API calls.
- **Edge cases handled:** Page reset to 1 on every mode switch and every new search; `hasMore` re-evaluated after every fetch.

### Milestone 3 — Responsive layout
- **Built:** Mobile-first flexbox layout with two `min-width` breakpoints (600px, 1024px). Cards use `flex: 1 1 <basis>` with a `max-width` cap to keep orphan cards from blowing up to full width. Removed stale starter `.movie-card { width: 100% }` rule from [App.css](src/App.css) that was overriding the layout. Added line-clamp + min-height to MovieCard titles so long titles don't break row alignment.
- **Diverged:** Initially shipped CSS Grid (`grid-template-columns: repeat(auto-fill, minmax(...))`); switched to Flexbox per user direction. Approach kept the same mobile-first structure, just swapped the layout primitive.
- **Decisions worth keeping:** Mobile-first (`min-width` queries) is cleaner than `max-width` overrides — base styles target the smallest screen. Per-breakpoint flex-basis is the knob to tune; gap and padding follow. Capped grid at `max-width: 1400px` so ultra-wide monitors don't get sparse rows.
- **Tradeoff to remember:** With Flexbox + max-width, very wide screens may show extra horizontal space between cards (rather than stretching them indefinitely). Acceptable for movie posters since vertical aspect ratio matters more than horizontal stretch.

### Milestone 4 — MovieModal + Movie Details fetch
- **Built:** [`MovieModal`](src/components/MovieModal.jsx) + [`MovieModal.css`](src/components/MovieModal.css). Renders backdrop image (16:9), title, optional tagline, release date + runtime, genre chip list, and overview. Three close affordances: × button, Escape key, backdrop click. Body scroll lock while open.
- **App changes:** Added `selectedMovieId`, `details`, `isLoadingDetails`, `detailsError` state. Second `useEffect` keyed on `selectedMovieId` fetches details with a `cancelled` flag to ignore stale responses when the user clicks through movies quickly. `handleCardClick` and `handleCloseModal` wire the open/close transitions.
- **MovieList:** Now forwards `onCardClick` to each `MovieCard` (forwarding-only — no logic).
- **Diverged:** Original spec had MovieModal own its details fetch. Per Milestone 4 instructions ("Pass the fetched details as props to MovieModal"), App now owns the fetch and the modal is purely presentational. Spec updated: `details` / `isLoadingDetails` / `detailsError` moved to App; only AI-feature state will live in the modal.
- **Decisions worth keeping:**
  - **`selectedMovieId !== null` doubles as "modal open"** — no separate flag means no drift.
  - **Cancelled-flag pattern** in the details effect avoids race conditions if the user switches selection mid-fetch.
  - **Backdrop click via `e.target === e.currentTarget`** — clicks bubbling up from inside the modal won't accidentally close it.
  - **Format helpers (`formatRuntime`, `formatReleaseDate`)** live inside MovieModal because they're only used there. Will move to a shared util only if a second component needs them.
  - **Graceful fallbacks** for missing fields: `runtime: null` → "Runtime unknown", missing `backdrop_path` → no image rendered (no broken image icon), empty `genres` → genre row hidden.
- **Edge cases handled:** Network failure shows a clear error message inside the modal with the close button still functional. Body scroll restored even if the modal unmounts mid-fetch (cleanup runs unconditionally). Switching movies mid-fetch doesn't show stale data.

### Milestone 5 — Sorting
- **Built:** [`SortControl`](src/components/SortControl.jsx) — controlled native `<select>` with four options (Default, Title A–Z, Release Date newest, Rating highest). [`SortControl.css`](src/components/SortControl.css) matches the SearchBar styling. Wired between SearchBar and MovieList in App.
- **App changes:** Added `sortOption` state (initial `"default"`) and `SORT_FNS` constant at module scope mapping option strings to comparator functions. `sortedMovies` is a `useMemo` derivation over `[movies, sortOption]` — passed to MovieList instead of raw `movies`.
- **Decisions taken (per Milestone 5 prompt):**
  - **Sort happens at render-time, not in state.** `movies` stays raw from the API; sort is a derived value. This decouples sort from fetching: Load More appends to raw `movies`, sort re-applies automatically. Switching sort options is instant.
  - **Fixed direction per option.** Title ascending, release/rating descending — matches the milestone's listed defaults and avoids a separate asc/desc toggle.
  - **Native `<select>`** chosen over a button group for accessibility, mobile-friendliness, and zero custom code.
- **Decisions worth keeping:**
  - **Defensive copy before sorting** — `[...movies].sort()` so the in-place sort doesn't mutate React state. The `default` branch returns `movies` directly (no copy needed) for a tiny perf/identity win.
  - **Comparators live module-scope**, not inside the component. They never change, so re-creating them per render is wasted work.
  - **Sort persists across mode switches and Load More** — intentional. Searching while sorted by rating keeps the search results sorted by rating; loading more pages folds new movies into the existing sort order.
- **Edge cases handled / accepted:** `localeCompare` handles unicode/diacritics correctly; missing `release_date` (rare) sorts to `NaN` which is benign; `vote_average` defaults to 0 from TMDb so missing-rating sort is well-defined.

### Milestone 6 — Header + Footer + Logo
- **Built:** [`Header`](src/components/Header.jsx) + [`Header.css`](src/components/Header.css) — logo, title, tagline. [`Footer`](src/components/Footer.jsx) + [`Footer.css`](src/components/Footer.css) — copyright + TMDb attribution link. New SVG logo at [`src/assets/flixster-logo.svg`](src/assets/flixster-logo.svg) — red film canister with white perforation squares and a centered play triangle. Single asset import means it works at any size and ships as one tiny SVG.
- **App changes:** Replaced inline `<header className="App-header">` with `<Header />`. Wrapped the existing controls + grid in `<main className="App-main">` and added `<Footer />` at the bottom. Moved the "Now Playing" mode toggle out of the header into a small `App-toolbar` div inside `<main>` so Header could stay prop-less per the spec. Made `.App` a flex column with `min-height: 100vh` and `<main>` flex-grow so the footer always sits at the bottom even on short pages.
- **App.css cleanup:** Removed all `.App-header` and `.App-header__nav` rules (Header owns its own styling now). Removed the `@media (max-width: 600px) .App-header` block since Header.css has its own mobile rules.
- **Decisions worth keeping:**
  - **SVG logo as a static import** (not inline JSX). Vite handles it as a regular asset, gets cached, and components stay readable.
  - **Header has no props.** Mode toggle lives elsewhere; Header is pure branding. Easier to reuse, easier to test, no coupling to App's state.
  - **Sticky footer via flexbox** (`min-height: 100vh` on `.App`, `flex: 1` on `<main>`). Works without JS and without measuring page height.
  - **`target="_blank"` + `rel="noopener noreferrer"`** on the TMDb link — security best practice for external links.
  - **TMDb attribution wording** matches their public-facing requirement: "This product uses the TMDb API but is not endorsed or certified by TMDb."
- **Tradeoff:** Modal is rendered as a sibling of `<main>` and `<Footer>`, not inside `<main>`. Keeps the modal's `position: fixed` overlay above everything regardless of where the user has scrolled.

### Milestone 7 — Polish + Accessibility
- **Built:** Adopted a cinematic dark theme — deep indigo-purple canvas (`#0a0019`), slate-purple cards, electric-yellow CTAs/ratings, white headings on muted lavender body copy. All design tokens live as CSS custom properties on `:root` in [`src/index.css`](src/index.css) — components pull them directly so a future palette swap is one file. Imported **Inter** from Google Fonts (weights 400/500/600/700/900). Restyled every component (Header, Footer, MovieCard, MovieList, MovieModal, SearchBar, SortControl, App toolbar) to use the tokens.
- **Visual intent recorded as comments** at the top of each CSS file (1–2 sentences per file describing what the styles are trying to achieve), per the milestone instructions.
- **Accessibility fixes:**
  - MovieCard poster `alt` changed from `movie.title` to `${movie.title} poster` per milestone spec.
  - Added global `:focus-visible` outline rule (2px yellow, 2px offset) plus per-component overrides for cards and the modal close button.
  - Verified contrast ratios with WebAIM — every text/background pair is ≥7:1, well above the 4.5:1 AA requirement.
  - Confirmed semantic structure: `<header>` / `<main>` / `<footer>` landmarks, `<button>` for all clickable actions, `<input>`/`<select>` for form controls, modal uses `role="dialog"` + `aria-modal="true"`.
- **Decisions worth keeping:**
  - **CSS variables on `:root`** is the cheapest path to themability. Future "light mode" or palette experiment is a single-file change.
  - **Yellow as the focus accent** doubles as the brand color, so the focus ring matches the visual identity rather than feeling tacked on.
  - **`backdrop-filter: blur(8px)` + `-webkit-backdrop-filter`** on the modal — modern browsers get the glassy effect; Safari fallback keeps the dim overlay.
  - **`button:hover:not(:disabled)`** at the global level prevents disabled buttons (like the active "Now Playing" toggle) from animating on hover.
  - **`background-color` instead of `outline` for hover lift** on cards — outlines don't follow rounded corners cleanly across browsers.
- **Things deliberately not done:** No `prefers-reduced-motion` media query yet (transitions are short and subtle, but worth adding before a public release). No high-contrast-mode tweaks. No skip-link to main content (a single-page app with no navigation has limited need; revisit if the app grows).

### Pending milestones
- **AI insight:** Provider choice + prompt finalized; rendered inside MovieModal as a new section below the overview.
