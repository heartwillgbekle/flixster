## Unit Assignment: Flixster

Submitted by: **Heartwill**

Estimated time spent: **15** hours spent in total

Deployed Application: [Flixster Deployed Site](https://flixster-3k0r.onrender.com/)

### Application Features

#### REQUIRED FEATURES

- [x] **Display Movies**
  - [x] Users can view a list of current movies from The Movie Database API in a grid view.
    - [x] Movie tiles should be reasonably sized (at least 6 playlists on your laptop when full screen; large enough that the playlist components detailed in the next feature are legible).
  - [x] For each movie displayed, users can see the movie's:
    - [x] Title
    - [x] Poster image
    - [x] Vote average
  - [x] Users can load more current movies by clicking a button which adds more movies to the grid without reloading the entire page. 
- [x] **Search Functionality**
  - [x] Users can use a search bar to search for movies by title.
  - [x] The search bar should include:
    - [x] Text input field
    - [x] Submit/Search button
    - [x] Clear button
  - [x] Movies with a title containing the search query in the text input field are displayed in a grid view when the user either:
    - [x] Presses the Enter key
    - [x] Clicks the Submit/Search button
  - [x] Users can click the Clear button. When clicked:
    - [x] All text in the text input field is deleted
    - [x] The most recent search results are cleared from the text input field and the grid view and all current movies are displayed in a grid view
- [x] **Design Features**
  - [x] Website implements all of the following accessibility features:
    - [x] Semantic HTML
    - [x] [Color contrast](https://webaim.org/resources/contrastchecker/)
    - [x] Alt text for images 
  - [x] Website implements responsive web design.
    - [x] Uses CSS Flexbox or CSS Grid
    - [x] Movie tiles and images shrink/grow in response to window size
  - [x] Users can click on a movie tile to view more details about a movie in a pop-up modal.
    - [x] The pop-up window is centered in the screen and does not occupy the entire screen.
    - [x] The pop-up window has a shadow to show that it is a pop-up and appears floating on the screen.
    - [x] The backdrop of the pop-up appears darker or in a different shade than before. including:
    - [x] The pop-up displays additional details about the moving including:
      - [x] Runtime in minutes
      - [x] Backdrop poster
      - [x] Release date
      - [x] Genres
      - [x] An overview
  - [x] Users can use a drop-down menu to sort movies.
    - [x] Drop-down allows movies to be sorted by:
      - [x] Title (alphabetic, A-Z)
      - [x] Release date (chronologically, most recent to oldest)
      - [x] Vote average (descending, highest to lowest)
    - [x] When a sort option is clicked, movies display in a grid according to selected criterion.
  - [x] Website displays:
    - [x] Header section
    - [x] Banner section
    - [x] Search bar
    - [x] Movie grid
    - [x] Footer section
    - [x] **VIDEO WALKTHROUGH SPECIAL INSTRUCTIONS**: To ease the grading process, please use the [color contrast checker](https://webaim.org/resources/contrastchecker/) to demonstrate to the grading team that text and background colors on your website have appropriate contrast. The Contrast Ratio should be above 4.5:1 and should have a green box surrounding it. 
- [x] **Planning Documentation**
  - [x] Repository includes a `planning.md` file with:
    - [x] A **Component Architecture** section listing at least 5 components, each with its responsibility, what it renders, and its props.
    - [x] An **API Contracts** section documenting at least 2 TMDb endpoints used, with URL, query parameters, and relevant response fields for each.
    - [x] A **State Architecture** section listing state variables with name, type, initial value, owner component, and what user action triggers an update.
    - [x] A **Data Flow** section (paragraph or diagram) explaining how data flows from the TMDb API response through the component hierarchy to the `MovieCard`, including any transformations.
- [x] **AI Watch Recommendation**
  - [x] When a movie's detail modal is opened, an AI-generated watch recommendation is displayed alongside the movie details.
  - [x] A loading state is shown while the AI response is being generated, and a graceful fallback message is shown if the AI call fails.
  - [x] `planning.md` includes an **AI Feature Spec** documenting role, task, inputs, output format, constraints, and failure behavior for the AI call.
  - [x] **VIDEO WALKTHROUGH SPECIAL INSTRUCTIONS**: To ease the grading process, open your browser's DevTools **Network** tab, trigger the AI recommendation (open a movie modal), and show the outbound request going **directly to an AI API URL** (e.g., `openrouter.ai`) — not to a backend server URL. Graders need to see this call in the Network tab to award full credit.

#### STRETCH FEATURES

- [x] **Deployment**
  - [x] Website is deployed via Render.
  - [x] **VIDEO WALKTHROUGH SPECIAL INSTRUCTIONS**: For ease of grading, please use the deployed version of your website when creating your walkthrough. 
- [x] **Embedded Movie Trailers**
  - [x] Within the pop-up modal displaying a movie's details, the movie trailer is viewable.
    - [x] When the trailer is clicked, users can play the movie trailer.
- [x] **Favorite Button**
  - [x] For each movie displayed, users can favorite the movie.
  - [x] There should be visual element (such as a heart icon) on each movie's tile to show whether or not the movie has been favorited.
  - [x] If the movie is not favorited:
    - [x] Clicking on the visual element should mark the movie as favorited
    - [x] There should be visual feedback (such as the heart turning a different color) to show that the movie has been favorited by the user.
  - [x] If the movie is already favorited:
    - [x] Clicking on the visual element should mark the movie as *not* favorited.
    - [x] There should be visual feedback (such as the heart turning a different color) to show that the movie has been unfavorited. 
- [x] **Watched Checkbox**
  - [x] For each movie displayed, users can mark the movie as watched.
  - [x] There should be visual element (such as an eye icon) on each movie's tile to show whether or not the movie has been watched.
  - [x] If the movie has not been watched:
    - [x] Clicking on the visual element should mark the movie as watched
    - [x] There should be visual feedback (such as the eye turning a different color) to show that the movie has been watched by the user.
  - [x] If the movie is already watched:
    - [x] Clicking on the visual element should mark the movie as *not* watched.
    - [x] There should be visual feedback (such as the eye turning a different color) to show that the movie has not been watched.
- [x] **Sidebar**
  - [x] The website includes a side navigation bar.
  - [x] The sidebar has three pages:
    - [x] Home
    - [x] Favorites
    - [x] Watched
  - [x] The Home page displays all current movies in a grid view, the search bar, and the sort movies drop-down.
  - [x] The Favorites page displays all favorited movies in a grid view.
  - [x] The Watched page displays all watched movies in a grid view.

### Walkthrough Video

**Walkthrough video:** [Flixster Walkthrough](https://www.loom.com/share/967b3334326f421cbf43a720049040aa)

### Reflection

* Did the topics discussed in your labs prepare you to complete the assignment? Be specific, which features in your weekly assignment did you feel unprepared to complete?

The labs gave me a solid foundation for the core React work — `useState`, `useEffect`, controlled inputs, fetching from a public API, and lifting state up between sibling components. Building the search bar, the Now Playing grid, and "Load More" pagination all felt like direct extensions of what we covered.

The features I felt least prepared for were the ones that required composing multiple async sources or coordinating state across deeply nested components. The AI watch recommendation in particular was new territory — writing a structured prompt spec, hitting OpenRouter with a system + user message, validating non-empty responses, and handling loading/error/fallback states inside the modal pulled together patterns we hadn't explicitly practiced. The trailer auto-play was similar: I had to fetch videos in parallel with the details endpoint, debounce a `setTimeout` swap from backdrop image to YouTube iframe, and cancel stale fetches when users clicked through movies quickly. Stretch features like Render deployment also went beyond lab content — that's where I got stuck the longest.

* If you had more time, what would you have done differently? Would you have added additional features? Changed the way your project responded to a particular event, etc.

Three things I'd add:

1. **Cast list inside the modal** — fetch `/movie/{id}/credits` and show the top 5 actors with photos. Clicking an actor would open their other films via `/person/{id}/movie_credits`.
2. **Personalized recommendations** — feed the user's favorited movies (titles + genres) into the OpenRouter API and generate a "Recommended for you" row on the home page based on what they've already saved.
3. **Persist favorites and watched lists** to `localStorage` so they survive a page reload (currently session-only).

I'd also revisit the architecture earlier. I started with fetch logic inside `MovieList`, then had to lift it to `App` once `SearchBar` and `SortControl` arrived, then added a `movieCache` Map when favorites started disappearing after searches. If I'd front-loaded the planning around state ownership before writing components, I would have avoided two refactors.

* Reflect on your project demo, what went well? Were there things that maybe didn't go as planned? Did you notice something that your peer did that you would like to try next time?

What went well: the hover-reveal cards landed exactly the way I wanted — clean grid when idle, controls fade in on hover, and the heart/watched buttons toggle without opening the modal thanks to `event.stopPropagation()`. The trailer auto-play with the 1.5-second delay also felt polished — viewers see the static backdrop first, then the trailer arrives without being jarring.

What didn't go as planned: deployment. I assumed I needed a backend and Postgres because the assignment mentioned a stretch deployment goal, so I downloaded pgAdmin and started configuring a database I didn't need. Render's setup wizard kept asking me for credentials I couldn't make sense of. Once Devarsh pointed out that Flixster is a frontend-only app and a static-site deploy was all I needed, the actual deployment took five minutes.

What I'd take from peers: I noticed how some classmates structured their planning.md as a living document — updating it after every milestone instead of writing it once at the start. I started doing that in the second half of the project (every milestone now has a "Reflections" entry in my planning.md) and it made decisions much easier to revisit. I'd start that habit on day one next time.

### Open-source libraries used

- [The Movie Database (TMDb) API](https://developer.themoviedb.org/) — movie data, posters, trailers, details
- [OpenRouter](https://openrouter.ai/) (`openai/gpt-oss-120b:free`) — AI watch recommendation
- [YouTube Embed API](https://developers.google.com/youtube/iframe_api_reference) — in-modal trailer playback

### Shout out

Huge shout out to **Devarsh** for helping me on the deployment stretch goal. Also shout out to **Doris**, **Benny**, and **Audrey**.