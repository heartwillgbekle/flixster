# Flixster — Project Planning

## 1. Component Architecture

### Hierarchy
```
App
├── Header (with SearchBar in actions slot)
├── App-main
│   ├── App-toolbar (☰ hamburger)
│   ├── Sidebar (slide-in drawer with nav: Home / Favorites / Watched)
│   ├── view = "home"      → Hero (now_playing mode only) + SortControl + MovieList → MovieCard (×N)
│   ├── view = "favorites" → ListPage → MovieList → MovieCard (×N)
│   └── view = "watched"   → ListPage → MovieList → MovieCard (×N)
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
- **Props:** `movies`, `onLoadMore`, `hasMore`, `isLoading`, `error`, `onCardClick`, `favorites: Set<number>`, `watched: Set<number>`, `onToggleFavorite`, `onToggleWatched` — favorites/watched are forwarded as Sets so each card can do an O(1) `.has(id)` lookup.
- **State:** None — pure presentation of data passed in.

#### MovieCard
- **Responsibility:** Display a single movie's poster, title, and rating; trigger modal open via `onClick(id)`; expose toggleable favorite (heart) and watched controls.
- **Renders:** Poster `<img>`, title, vote average, heart icon overlaid on the poster, "Mark as watched" / "✓ Watched" toggle button below the rating.
- **Props:** `movie`, `onClick: (id) => void`, `isFavorite: boolean`, `isWatched: boolean`, `onToggleFavorite: (id) => void`, `onToggleWatched: (id) => void`.
- **State:** None — favorite/watched status is owned by App; card just reflects the `isFavorite` / `isWatched` props.
- **Note:** Card root is a `<div role="button" tabIndex={0}>` rather than `<button>` so the inner heart + watched `<button>` elements aren't nested inside another button (invalid HTML). Keyboard handler maps Enter/Space to the open action; child buttons call `e.stopPropagation()` so toggling doesn't open the modal.

#### MovieModal
- **Responsibility:** Display full movie details (backdrop, title, release date, runtime, genres, overview), the AI insight, and the YouTube trailer. **Pure presentation for movie data** — receives `details` and `trailer` as props, does not fetch them.
- **Renders:** Media slot (backdrop image first, swaps to YouTube trailer iframe 1.5s after mount when one is available), title, tagline (if present), release date + runtime row, genre chip list, overview, AI insight, close button. Inline loading and error states.
- **Props:** `details: MovieDetails | null`, `trailer: { key, name } | null`, `isLoading: boolean`, `error: string | null`, `onClose: () => void`.
- **State:** None for movie data (App owns it). Owns AI-related state — `aiInsight` (string or null), `loadingInsight` (boolean), `aiError` (string or null) — since the recommendation is scoped to this modal's lifetime and resets when a new movie is selected.
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

#### Sidebar
- **Responsibility:** Slide-in navigation drawer. Routes the user between three views: Home (movie grid), Favorites, Watched. Does NOT render the lists themselves anymore — those have moved to dedicated `ListPage` views.
- **Renders:** "My Lists" heading + three nav buttons (Home, Favorites, Watched). Favorites and Watched display a count badge; the active view gets a purple-tinted background.
- **Props:** `id`, `isOpen: boolean`, `view: "home" | "favorites" | "watched"`, `onNavigate: (view) => void`, `favoritesCount: number`, `watchedCount: number`.
- **State:** None — fully controlled by App.
- **UX:** Drawer is `position: fixed` and slides in from the left with a 320ms cubic-bezier transform. A scrim with `backdrop-filter: blur(2px)` dims the rest of the page behind it. Clicking a nav item closes the drawer and switches the view in one action.

#### Hero
- **Responsibility:** Cinematic auto-rotating banner at the top of the home view. Cycles through the top 5 top-rated movies, cross-fading every 10 seconds. Hosts the "Now Playing" mode toggle (top-left) — the same control that previously lived in the toolbar.
- **Renders:** Layered backdrop images (only the active slide is opaque), a gradient overlay for text legibility, eyebrow text ("Top Rated"), title, truncated overview, rating + year, "View Details" CTA that opens the movie modal, and pagination dots tied to the active index.
- **Props:** `slides: Movie[]`, `onCardClick: (id) => void`, `mode: string`, `onClearMode: () => void`.
- **State:** Local `index` (current slide). Auto-advances via `setInterval` (cleared on unmount); clicking a dot or auto-advance both update the same index.
- **Trigger:** Renders only when `view === 'home' && mode === 'now_playing'`. Hidden during search and on Favorites/Watched pages so the banner doesn't compete with focused list views.

#### ListPage
- **Responsibility:** Single destination page for a curated list (Favorites or Watched). Generic — receives the list data and labels as props.
- **Renders:** A page header (title + description + count) and either a `<MovieList>` of the movies or an empty-state card with `emptyTitle` + `emptyText`.
- **Props:** `title`, `description`, `emptyTitle`, `emptyText`, `movies: Movie[]`, `onCardClick`, `favorites: Set`, `watched: Set`, `onToggleFavorite`, `onToggleWatched`.
- **State:** None — pure presentation. Reuses `<MovieList>` so cards keep the same hover effects, heart icon, and watched toggle behavior they have on Home.

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

### 2.6 Top Rated Movies (for Hero banner)
- **Endpoint:** `GET /movie/top_rated`
- **Required params:** `api_key`, `language=en-US`, `page` (default 1)
- **Response fields used:** `results[].id`, `title`, `backdrop_path`, `overview`, `vote_average`, `release_date`
- **Slide selection:** Filter to entries with both `backdrop_path` and `overview` (skip incomplete records), take the first 5.
- **Error cases:** Network failure / 401 / 429 — `setHeroSlides([])`, Hero renders nothing. Banner is additive UX, not load-bearing.

### 2.5 Movie Videos (for trailer playback)
- **Endpoint:** `GET /movie/{movie_id}/videos`
- **Required params:** `api_key`, `language=en-US`
- **Response shape:** `{ results: [{ name, key, site, type, official, published_at, ... }] }`
- **Picker logic** (`pickBestTrailer` in [tmdb.js](src/api/tmdb.js)):
  1. Filter to `site === "YouTube"` with a non-empty `key`.
  2. Filter to `type` ∈ {`Trailer`, `Teaser`}. (Skip Clips — those are scene-specific spoilers.)
  3. Sort: Trailers before Teasers → `official: true` first → newest `published_at` first.
  4. Return `{ key, name } | null`.
- **Error cases:**
  - **Network failure / 404 / 401** — return `null` silently; modal shows backdrop image instead. Trailer is additive UX, not load-bearing.
  - **No matching video** — same as above; backdrop stays.

### 2.4 AI Insight — OpenRouter
- **Endpoint:** `POST https://openrouter.ai/api/v1/chat/completions`
- **Auth:** `Authorization: Bearer ${import.meta.env.VITE_OPENROUTER_API_KEY}`
- **Recommended headers (per OpenRouter docs):**
  - `Authorization: Bearer <key>`
  - `Content-Type: application/json`
  - `HTTP-Referer: <site URL>` (optional — improves rate limits / attribution)
  - `X-Title: Flixster` (optional)
- **Required body params:**
  - `model` — `"openai/gpt-oss-120b:free"` (primary)
  - `messages` — array of `{ role, content }` (system prompt + user prompt; see Section 5 for full text)
  - `max_tokens` — `200` (output is 2–3 sentences)
  - `temperature` — `0.7` (some warmth, but not unhinged)
- **Response shape (OpenAI-compatible):** `{ choices: [{ message: { content: string } }] }` — extract `data.choices[0].message.content`, then `.trim()`.
- **Error cases:**
  - **401** — bad/missing OpenRouter key → set `aiError`, show fallback message, log warning
  - **429** — rate limit (free tier is generous but finite) → fallback message
  - **402 / billing** — out of free credits → fallback message
  - **5xx** — provider/upstream model down → fallback message
  - **Network failure** — fallback message
  - **Empty or whitespace-only `content`** — fallback message (treat as failure even though HTTP succeeded)

> ⚠️ **Security note:** Calling OpenRouter directly from the browser ships the API key to anyone who opens DevTools. Acceptable for this learning project; production would proxy through a backend that holds the key server-side.

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
| `favorites` | `Set<number>` | `new Set()` | App | Heart toggle on a MovieCard. Session-only — not persisted across reloads. |
| `watched` | `Set<number>` | `new Set()` | App | "Mark as watched" toggle on a MovieCard. Session-only. |
| `view` | `"home" \| "favorites" \| "watched"` | `"home"` | App | Sidebar nav clicks set this. `handleSearch` and `handleClear` both reset it to `"home"` so search results / Now Playing always land on the grid. |
| `isSidebarOpen` | `boolean` | `false` | App | Hamburger button toggles. Auto-closes on nav click and on scrim click. |
| `heroSlides` | `Movie[]` | `[]` | App | One-time fetch of `getTopRated(1).results` filtered + sliced to 5; Hero renders nothing if empty. |
| `inputValue` | `string` | `""` | SearchBar | Every keystroke (controlled input) |
| `details` | `MovieDetails \| null` | `null` | App | Set after `getMovieDetails(selectedMovieId)` resolves; cleared when modal closes |
| `trailer` | `{ key, name } \| null` | `null` | App | Set after `getMovieVideos` resolves and `pickBestTrailer` selects one; `null` if no trailer found or fetch fails |
| `isLoadingDetails` | `boolean` | `false` | App | True during details fetch |
| `detailsError` | `string \| null` | `null` | App | Set if details fetch fails; cleared when a new movie is selected |
| `showTrailer` | `boolean` | `false` | MovieModal | Flips to `true` 1.5s after a trailer-bearing modal mounts; gates the iframe render so the backdrop image displays first |
| `aiInsight` | `string \| null` | `null` | MovieModal | Set to trimmed response text on successful OpenRouter call |
| `loadingInsight` | `boolean` | `false` | MovieModal | True while OpenRouter request is in flight |
| `aiError` | `string \| null` | `null` | MovieModal | Set on AI failure (network, 4xx/5xx, empty response); UI renders friendly fallback |

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

## 5. AI Feature Spec — "Watch Recommendation"

### Goal
When the MovieModal opens, generate a 2–3 sentence AI-written recommendation that helps the user decide whether the film is worth their evening. Rendered alongside the movie details, below the overview.

### Provider + Endpoint
- **Provider:** OpenRouter (free-tier).
- **Endpoint:** `POST https://openrouter.ai/api/v1/chat/completions`
- **Model:** `openai/gpt-oss-120b:free` (primary — landed here after smoke-testing; Llama 3.3 free tier was upstream-rate-limited at implementation time, Gemma's free tier was retired).
- **Auth:** `Authorization: Bearer ${VITE_OPENROUTER_API_KEY}` header. Key lives in `.env` next to the existing `VITE_API_KEY`.

### Prompt Spec

**Role.** "You are an enthusiastic but honest film critic helping a friend decide what to watch tonight."

**Task.** "Write a short watch recommendation (2–3 sentences) that gives the reader a feel for the movie's vibe and tells them who would enjoy it most."

**System message** (sent as `messages[0]`, role `system`):
> You are an enthusiastic but honest film critic helping a friend decide what to watch tonight. Write 2–3 sentences in the second person, focused on the movie's tone, mood, and ideal audience. Do not include plot spoilers, do not say "this movie", do not start with "I", and avoid generic phrases like "must-see", "tour de force", or "edge-of-your-seat thriller". Output plain text only — no markdown, no headings, no bullet points.

**User message** (sent as `messages[1]`, role `user`):
> Title: `${title}`
> Genres: `${genres.join(', ')}`
> Overview: `${overview}`
>
> Recommend whether to watch this and who would enjoy it.

### Inputs (assembled in MovieModal from `details` prop)
- `title` (string) — `details.title`
- `genres` (string) — `details.genres.map(g => g.name).join(', ')`
- `overview` (string) — `details.overview`

### Output format
- Plain text, no markdown.
- 2–3 sentences (cap `max_tokens` at 200).
- Second person voice ("you'll enjoy…", "fans of X will…").
- No spoilers, no first-person, no generic praise phrases.
- If the model returns empty / whitespace-only text, treat as failure.

### Constraints (enforced in the prompt + post-processing)
- No plot spoilers
- No "I" or "this movie"
- No "must-see", "tour de force", "edge-of-your-seat", "instant classic"
- No comparisons to other films unless they sharpen the recommendation
- No markdown, headings, or bullets

### Trigger
- Fires when `details` becomes non-null inside MovieModal (i.e., the TMDb details fetch resolved).
- Effect keyed on `details?.id` so a new movie selection retriggers; same movie does not re-fetch.
- Skipped entirely when `details` is null, when the details fetch errored, or when `overview` is empty.

### State (lives in MovieModal local state)
- `aiInsight: string | null` — initial `null`, set to the trimmed response on success
- `loadingInsight: boolean` — initial `false`, true while the request is in flight
- `aiError: string | null` — initial `null`, set if the call fails so the UI can decide what to render
- All three reset automatically when the modal unmounts (App passes a fresh modal instance per `selectedMovieId`).

### UI / display
- New `.movie-modal__ai` block rendered below `.movie-modal__overview`.
- Heading: "Watch Recommendation" (small caps or yellow accent to match the meta row palette).
- States:
  - `loadingInsight === true` → skeleton shimmer or "Generating recommendation…"
  - `aiInsight` set → render the text
  - `aiError` set → friendly fallback: **"We couldn't generate a recommendation for this one — check out the overview above!"**

### Failure behavior
- Network failure / 401 / 429 / 5xx → set `aiError`, show fallback message, keep the rest of the modal functional.
- Empty/whitespace response → treat as failure, show fallback.
- Never block the modal on AI failure. Movie details are the primary content; the AI block is additive.

### Logging
- On error, `console.warn("AI insight failed", { movieId, status, message })` so failures are debuggable in DevTools without surfacing technical details to the user.

### Security note (carried over from §2.4)
> ⚠️ The OpenRouter API key ships to the browser via `import.meta.env`. Acceptable for this learning project; production would proxy through a backend.

### AI Feature — Decisions Log

- **What the API returned initially:** Smoke-tested with *The Batman* details → got: *"If you're in the mood for a brooding, rain-slick dive into Gotham's underbelly, The Batman delivers a moody, methodical mystery that rewards patience more than punch-lines. Expect a dense, atmospheric thriller where every clue feels earned — just be ready for a slower burn rather than nonstop action."* This hit the spec on first pass: 2 sentences, second-person ("you're in the mood"), no spoilers, no banned phrases ("must-see", "tour de force"), correct tone (enthusiastic but honest), no markdown. **No prompt iteration needed.**
- **What I changed in my prompt:** Nothing in the system/user message after the first response — the spec was tight enough that the first version worked. The only change was the **model**: spec called for `meta-llama/llama-3.3-70b-instruct:free`, but at implementation time it was upstream-rate-limited (HTTP 429 from Venice provider). Tried Gemma fallback — that free tier had been retired. Settled on `openai/gpt-oss-120b:free`, which responded cleanly with the requested tone. Updated §2.4 + §5 to reflect.
- **What fallback behavior I implemented:** On any failure (network, 401, 429, 5xx, empty/whitespace response), set `aiError`, log a warning to the console (`console.warn('AI insight failed', { movieId, message })`), and render the friendly fallback text inside the `.movie-modal__ai` panel: **"We couldn't generate a recommendation for this one — check out the overview above!"** The rest of the modal stays fully functional. Empty/whitespace responses are explicitly treated as failures so the user never sees a blank box. Helper short-circuits early if `details` or `details.overview` is missing, so the call never fires when there's no useful context to send.
- **What I learned:** Three things —
  1. **Prompt specs pay off.** Writing the role, task, constraints, and banned phrases in `planning.md` *before* coding meant the system prompt was already a structured paragraph rather than something I'd be tweaking interactively. First-call output matched the spec without iteration.
  2. **Free-tier model availability shifts.** Treat the spec'd model as a default, not a guarantee. The Llama → Gemma → gpt-oss path took 5 minutes of smoke-testing to discover. Worth keeping the model name in one constant (`MODEL` in [ai.js](src/api/ai.js)) so swapping it is a single-line change.
  3. **`useEffect` keyed on `details?.id` (not `details`)** prevents duplicate AI calls when React re-renders with a referentially-different but content-identical `details` object. Saves quota and avoids a flicker between cached response and "loading" state on every parent re-render.

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

### Milestone 8 — AI Watch Recommendation
- **Built:** [`src/api/ai.js`](src/api/ai.js) — `getWatchRecommendation(details)` helper that POSTs to OpenRouter with the system + user messages assembled from the spec. Validates non-empty response, throws specific errors so the modal can branch on them. New AI section in [`MovieModal`](src/components/MovieModal.jsx) — three local state vars (`aiInsight`, `loadingInsight`, `aiError`), a second `useEffect` keyed on `details?.id`, and a `<section className="movie-modal__ai" aria-live="polite">` block below the overview. Styled with a subtle purple-gradient panel + yellow uppercase heading.
- **Diverged from spec on model choice:** Spec called for `meta-llama/llama-3.3-70b-instruct:free` as primary with `google/gemma-3-27b-it:free` as fallback. Smoke-test caught two surprises:
  1. Llama free tier was upstream-rate-limited at implementation time (transient).
  2. Gemma 3 27B free tier had been retired ("paid version available" 404).
  Switched to **`openai/gpt-oss-120b:free`** which responded cleanly with the requested tone on first try. Spec sections §2.4 and §5 updated to match.
- **Decisions worth keeping:**
  - **AI state lives in MovieModal**, not App. Per the original architecture decision — recommendation is scoped to the modal's lifetime; new movie selection mounts a fresh modal which resets all three state vars.
  - **Cancelled-flag pattern** matches the details-fetch effect — clicking through movies fast doesn't show stale recommendations.
  - **Effect keyed on `details?.id`**, not `details` itself — re-render of details with the same ID won't retrigger the AI call (saves quota, faster perceived UX).
  - **`aria-live="polite"`** on the AI section — screen readers announce the recommendation when it loads without interrupting current speech.
  - **Empty/whitespace responses treated as failure** — model occasionally returns nothing; fallback message is friendlier than an empty box.
  - **Constraints in the system prompt**: banned phrases ("must-see", "tour de force", etc.) listed verbatim — easier than post-processing.
- **Edge cases handled:** Missing API key → throws early in helper, surfaces as `aiError`. Missing `overview` → effect skips entirely. Switching movies mid-AI-fetch → cancelled flag prevents stale state. Network failure / 401 / 429 → friendly fallback, modal stays functional.
- **What was deliberately deferred:**
  - **Streaming responses** — `max_tokens: 200` makes the call short enough that streaming wouldn't meaningfully improve perceived latency.
  - **Per-movie caching** — refetching on every modal open is fine at this volume; would matter only with heavy reuse.
  - **Retry logic** — single-shot for now; rate-limit responses surface as the friendly fallback rather than auto-retrying.

### Milestone 9 — Favorites + Watched + Sidebar
- **Built:** Heart icon (♡/♥) overlaid on each [`MovieCard`](src/components/MovieCard.jsx) poster + a "Mark as watched" / "✓ Watched" toggle button below the rating. New [`Sidebar`](src/components/Sidebar.jsx) component renders Favorites and Watched lists with thumbnail + title, count badges, and click-to-open behavior. App holds both lists as `Set<number>` for O(1) lookups; Sidebar receives derived `Movie[]` arrays via `useMemo` over the current `movies` list.
- **App-shell layout:** Wrapped main content in `.App-shell` (flex row) so Sidebar sits on the left and `<main>` flexes to fill. Below 900px the shell switches to a stacked column with the sidebar capped at 240px and internally scrollable.
- **Decisions worth keeping:**
  - **Sets for membership, derived arrays for rendering.** Toggling is `O(1)` via `Set.has` / `Set.add` / `Set.delete`; sidebar entries are computed via `movies.filter(m => favorites.has(m.id))` inside a `useMemo`. Cleanest of both worlds.
  - **MovieCard root changed from `<button>` to `<div role="button" tabIndex={0}>`.** Nested `<button>`s (heart + watched inside the card) are invalid HTML. Manual keyboard handler maps Enter/Space to the open action; child buttons call `e.stopPropagation()` so toggling never opens the modal.
  - **Sidebar uses `Movie[]`, MovieList uses `Set<number>`.** Different shape per consumer's need — sidebar needs to render thumbnails (full object), MovieList only needs to know if each card is favorite/watched (Set suffices).
  - **Functional state updates with `new Set(prev)`** — must clone before mutating; otherwise React's referential equality check sees the same reference and skips the re-render.
  - **Clicking a sidebar entry opens that movie's modal** via the existing `handleCardClick` flow — single code path for "open movie X."
- **Per-milestone-spec:** Favorites and watched status are session-only (reset on reload). No localStorage / persistence.
- **Tradeoff to remember:** A favorited movie that scrolls out of the loaded `movies` array (e.g., user marks it, switches to search, original list isn't reloaded) won't appear in the sidebar. Acceptable for the session-only scope; would need a separate `favoriteMoviesById` cache to fix once persistence lands.

### Milestone 10 — YouTube Trailer Playback
- **Built:** New `getMovieVideos(movieId)` + `pickBestTrailer(videos)` helpers in [`tmdb.js`](src/api/tmdb.js). App fetches videos in parallel with details when `selectedMovieId` changes; the picked trailer is stored in App state and passed to MovieModal as a `trailer` prop. Modal media slot now shows the backdrop image first, then swaps to a YouTube `<iframe>` 1.5s after mount when a trailer exists. Modal `max-width` bumped from 720px → 880px.
- **Picker rules:** YouTube only → Trailers before Teasers (Clips excluded as spoilers) → official first → newest first. Falls through to `null` if nothing matches.
- **Decisions worth keeping:**
  - **Trailer fetch is fire-and-forget.** Failure path is `setTrailer(null)` — modal shows the backdrop and nothing else changes. Trailer is additive UX, never load-bearing.
  - **`showTrailer` is local to MovieModal.** App owns whether a trailer *exists*; the modal owns the *delay* before swapping. Cleanest division: data ownership in App, presentation timing in the component that does the presenting.
  - **Effect keyed on `trailer?.key`** — switching movies remounts the modal anyway, but this is defensive: if the trailer prop ever changed without a remount, the timer resets cleanly.
  - **`autoplay=1` in the embed URL** — YouTube only honors muted autoplay across browsers; users may need to unmute. Acceptable: the 1.5s delay creates a moment where they expect motion, and the cinematic dim around the modal makes muted-then-unmute a natural action rather than a jarring one.
  - **`<iframe key={trailer.key}>`** — guarantees a fresh embed when the trailer prop changes mid-modal (e.g., if we later let users pick alternate trailers); without `key`, React would mutate the existing iframe's `src` and YouTube's player handles that poorly.
  - **`pointer-events` not blocked** — modal's existing `body { overflow: hidden }` doesn't prevent iframe interaction; fullscreen and player controls still work.
- **Tradeoff:** YouTube embeds load ~500KB of player JS lazily once the iframe mounts. Acceptable for this UX (user opted into the modal, motion is expected); a `loading="lazy"` attribute would help if the iframe ever became scroll-revealed instead of always above-the-fold.

### Milestone 11 — Tabs / Routing for Favorites + Watched
- **Built:** Sidebar refactored from a list-displaying drawer into a **navigation drawer** with three nav buttons (Home, Favorites, Watched). New generic [`ListPage`](src/components/ListPage.jsx) component renders a curated list with header + count + (movies grid OR empty state). App keeps a `view` state var (`"home" | "favorites" | "watched"`) and conditionally renders either the home grid (with SortControl) or a `<ListPage>`.
- **Routing without a router:** Used a simple state-driven view switch instead of pulling in `react-router-dom`. For three top-level views with no URL persistence requirement, a `view` state var is meaningfully simpler — no provider tree, no `<Route>` config, no URL-encoding of state, no library to learn.
- **Decisions worth keeping:**
  - **Single ListPage component for both Favorites and Watched** — same header/count/empty-state shape, just different labels and data. Saves code duplication and makes adding a third list (e.g., "Watch Later") a one-line change in App.
  - **Active nav state via `aria-current="page"`** — semantic, screen-reader friendly, and the CSS hooks off the same attribute via `.is-active` class for the visual treatment.
  - **`handleSearch` and `handleClear` both reset `view` to `"home"`** — search results should always land on the grid, never on a list page. Same for "Now Playing." Without this reset, hitting Enter in the search bar while on the Favorites page would fetch search results into a hidden state.
  - **Sidebar auto-closes on navigation** — single user action does both: switch view and dismiss drawer. Less click overhead.
  - **Now Playing button stays enabled when on a list page** even if `mode === 'now_playing'`, so users always have a way back to the grid via the toolbar.
- **What was removed:** The thumbnail-and-title list of saved movies that previously lived in the sidebar. Users now see those movies on the dedicated page rather than a peek-list inside the drawer. Trade-off: one extra click to see a saved movie, but the dedicated page has full poster cards instead of cramped thumbnails.
- **Tradeoff:** No deep linking. Reloading on `/favorites` won't actually preserve that view — the `view` state resets to `"home"`. Acceptable since Favorites/Watched are session-only anyway (reload clears them too).

### Milestone 12 — Hero Banner
- **Built:** New [`Hero`](src/components/Hero.jsx) component — Apple TV+-style auto-rotating banner showing the top 5 top-rated movies. New `getTopRated(page)` helper in [tmdb.js](src/api/tmdb.js). Backdrops cross-fade every 10 seconds; pagination dots reflect + control the active slide. "Now Playing" mode toggle relocated from the toolbar onto the hero (top-left) so it sits where it does on streaming services.
- **Decisions worth keeping:**
  - **All slides mounted at once** with `opacity` toggling between them. Cross-fade is buttery; mounting/unmounting would flash.
  - **`setInterval` cleaned up on unmount and on `slides.length` change** — switching pages or re-fetching slides resets the timer cleanly.
  - **Hero only renders on `view === 'home' && mode === 'now_playing'`** — invisible during search (the search results are themselves the focus) and on list pages (those pages have their own headers).
  - **Filter slides to ones with both `backdrop_path` and `overview`** — incomplete top-rated entries (e.g., obscure foreign titles) would otherwise show black rectangles or empty descriptions.
  - **"View Details" CTA reuses `handleCardClick`** — same modal flow as the grid cards. One code path, three entry points (grid, sidebar list pages, hero).
  - **Now Playing button uses backdrop-filter blur + frosted dark background** — sits on top of vivid backdrops without disappearing into them.
- **Tradeoff:** Hero takes a 21:9 aspect ratio at desktop. On very tall monitors the banner is shorter than ideal but never dominates the viewport. On phones it switches to 16:11 and tightens text padding.
