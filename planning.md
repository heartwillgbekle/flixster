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
- **Responsibility:** Display the app title/logo and branding.
- **Renders:** App title ("Flixster"), logo/icon.
- **Props:** None.
- **State:** None (presentational).

#### SearchBar
- **Responsibility:** Capture user search input and trigger search/clear actions.
- **Renders:** Controlled text input, submit button, clear button (when there's an active query).
- **Props:** `onSearch: (query: string) => void`, `onClear: () => void`, `activeQuery: string` (so the bar can show what's currently searched and reset its input on clear).
- **State:** Local controlled-input state (`inputValue`) — only lifted to App on submit, not on every keystroke.

#### SortControl
- **Responsibility:** Let user pick a sort option for the current movie list.
- **Renders:** A `<select>` dropdown (or button group) with options: Title (A–Z), Release Date (newest), Rating (highest).
- **Props:** `sortOption: string`, `onSortChange: (option: string) => void`.
- **State:** None — controlled by App.

#### MovieList
- **Responsibility:** Render a grid of movie cards plus a "Load More" button. Pure presentation — no fetching.
- **Renders:** A list of `MovieCard` components, a Load More button (when `hasMore`), and inline status messages (loading, error, empty).
- **Props:** `movies: Movie[]`, `onLoadMore: () => void`, `hasMore: boolean`, `isLoading: boolean`, `error: string | null`. (Adds `onCardClick` in the modal milestone.)
- **State:** None — pure presentation of data passed in.

#### MovieCard
- **Responsibility:** Display a single movie's poster, title, and rating; opens modal on click.
- **Renders:** Poster `<img>`, title, vote average.
- **Props:** `movie: { id, title, poster_path, vote_average, release_date }`, `onClick: (id: number) => void`.
- **State:** None.

#### MovieModal
- **Responsibility:** Show full movie details (including runtime + genres which require a separate fetch) and the AI insight.
- **Renders:** Backdrop image, title, overview, runtime, genres, release date, AI-generated watch recommendation, close button.
- **Props:** `movieId: number`, `onClose: () => void`.
- **State:** Owns its own `details` (full movie object), `aiInsight`, `isLoadingDetails`, `isLoadingAi`, `error` — fetched on mount via the movie ID prop.

#### Footer
- **Responsibility:** Display attribution to TMDb and any copyright/links.
- **Renders:** "Powered by TMDb" text + logo.
- **Props:** None.
- **State:** None.

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
- **Endpoint:** `GET /movie/{movie_id}`
- **Required params:** `api_key`, `language=en-US`
- **Response fields used:** `id`, `title`, `overview`, `runtime`, `genres[].name`, `backdrop_path`, `release_date`, `vote_average`, `tagline`
- **Error cases:** 404 (movie not found / deleted), network failure, missing fields (e.g., `runtime: null`)

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
| `selectedMovieId` | `number \| null` | `null` | App | User clicks MovieCard; cleared on modal close (modal milestone) |
| `sortOption` | `string` | `"default"` | App | User changes SortControl (sort milestone) |
| `isLoading` | `boolean` | `false` | App | Set true before fetch, false on resolve/reject |
| `error` | `string \| null` | `null` | App | Set on fetch failure; cleared on next attempt |
| `hasMore` | `boolean` | `true` | App | Set from `page < total_pages` after fetch |
| `inputValue` | `string` | `""` | SearchBar | Every keystroke (controlled input) |
| `details` | `MovieDetails \| null` | `null` | MovieModal | Set after movie-details fetch |
| `aiInsight` | `string \| null` | `null` | MovieModal | Set after AI fetch |
| `isLoadingDetails` | `boolean` | `false` | MovieModal | True during details fetch |
| `isLoadingAi` | `boolean` | `false` | MovieModal | True during AI fetch |

**Notes:**
- Sorting is applied client-side over `movies` (no API param) — derived value, not stored separately.
- Switching between Now Playing and Search resets `page = 1` and clears `movies`.
- Modal state lives in MovieModal (not App) because details/AI are scoped to its lifetime.

---

## 4. Data Flow

**Fetch → Render path:**
1. App mounts → `useEffect` calls `fetchNowPlaying(page=1)` → sets `isLoading=true`.
2. Fetch resolves → response JSON parsed → `results` array stored in `movies` state. No transformation needed for the list view; TMDb fields map directly to MovieCard props.
3. App passes `movies` (optionally sorted client-side based on `sortOption`) into MovieList.
4. MovieList maps over `movies`, rendering one MovieCard per entry with the movie object as a prop.
5. MovieCard reads `movie.poster_path` and prepends the image base URL (`https://image.tmdb.org/t/p/w500`) to form the full image URL — this is the only transformation at the card layer.

**Click → Modal path:**
1. User clicks a MovieCard → `onClick(movie.id)` fires → propagates up via MovieList's `onCardClick` prop → App sets `selectedMovieId = id`.
2. App renders `<MovieModal movieId={selectedMovieId} onClose={...} />`.
3. MovieModal's `useEffect` (keyed on `movieId`) fires `fetchMovieDetails(movieId)` → populates local `details` state.
4. In parallel, MovieModal calls the AI endpoint with `{title, genres, overview}` once details have loaded → populates `aiInsight`.
5. Closing the modal sets `selectedMovieId = null` in App, which unmounts the modal and clears its local state.

**Search flow:** SearchBar's onSubmit → App sets `searchQuery`, resets `page=1`, calls `fetchSearch(query, 1)` → swaps `movies` with new results. Empty query reverts to Now Playing.

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
