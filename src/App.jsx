import { useEffect, useMemo, useState } from 'react'
import './App.css'
import Header from './components/Header'
import Footer from './components/Footer'
import Sidebar from './components/Sidebar'
import ListPage from './components/ListPage'
import MovieList from './components/MovieList'
import SearchBar from './components/SearchBar'
import SortControl from './components/SortControl'
import MovieModal from './components/MovieModal'
import {
  getMovieDetails,
  getMovieVideos,
  getNowPlaying,
  pickBestTrailer,
  searchMovies,
} from './api/tmdb'

const SORT_FNS = {
  'title-asc': (a, b) => a.title.localeCompare(b.title),
  'release-desc': (a, b) =>
    new Date(b.release_date) - new Date(a.release_date),
  'rating-desc': (a, b) => b.vote_average - a.vote_average,
}

const App = () => {
  const [movies, setMovies] = useState([])
  const [searchQuery, setSearchQuery] = useState('')
  const [page, setPage] = useState(1)
  const [mode, setMode] = useState('now_playing')
  const [hasMore, setHasMore] = useState(true)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState(null)

  const [sortOption, setSortOption] = useState('default')

  const [favorites, setFavorites] = useState(() => new Set())
  const [watched, setWatched] = useState(() => new Set())
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)
  const [view, setView] = useState('home')

  const [selectedMovieId, setSelectedMovieId] = useState(null)
  const [details, setDetails] = useState(null)
  const [trailer, setTrailer] = useState(null)
  const [isLoadingDetails, setIsLoadingDetails] = useState(false)
  const [detailsError, setDetailsError] = useState(null)

  const sortedMovies = useMemo(() => {
    if (sortOption === 'default') return movies
    return [...movies].sort(SORT_FNS[sortOption])
  }, [movies, sortOption])

  useEffect(() => {
    const fetcher =
      mode === 'search'
        ? () => searchMovies(searchQuery, page)
        : () => getNowPlaying(page)

    setIsLoading(true)
    setError(null)
    fetcher()
      .then((data) => {
        setMovies((prev) =>
          page === 1 ? data.results : [...prev, ...data.results]
        )
        setHasMore(data.page < data.total_pages)
      })
      .catch((err) => setError(err.message))
      .finally(() => setIsLoading(false))
  }, [mode, searchQuery, page])

  useEffect(() => {
    if (selectedMovieId === null) {
      setDetails(null)
      setTrailer(null)
      setDetailsError(null)
      return
    }

    let cancelled = false
    setIsLoadingDetails(true)
    setDetailsError(null)
    setDetails(null)
    setTrailer(null)

    getMovieDetails(selectedMovieId)
      .then((data) => {
        if (!cancelled) setDetails(data)
      })
      .catch((err) => {
        if (!cancelled) setDetailsError(err.message)
      })
      .finally(() => {
        if (!cancelled) setIsLoadingDetails(false)
      })

    getMovieVideos(selectedMovieId)
      .then((data) => {
        if (!cancelled) setTrailer(pickBestTrailer(data.results))
      })
      .catch(() => {
        if (!cancelled) setTrailer(null)
      })

    return () => {
      cancelled = true
    }
  }, [selectedMovieId])

  const handleSearch = (query) => {
    const trimmed = query.trim()
    if (!trimmed) return
    setSearchQuery(trimmed)
    setMode('search')
    setPage(1)
    setView('home')
  }

  const handleClear = () => {
    setSearchQuery('')
    setMode('now_playing')
    setPage(1)
    setView('home')
  }

  const handleLoadMore = () => {
    setPage((prev) => prev + 1)
  }

  const handleCardClick = (id) => setSelectedMovieId(id)
  const handleCloseModal = () => setSelectedMovieId(null)

  const toggleFavorite = (id) => {
    setFavorites((prev) => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  const toggleWatched = (id) => {
    setWatched((prev) => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  const favoriteMovies = useMemo(
    () => movies.filter((m) => favorites.has(m.id)),
    [movies, favorites]
  )
  const watchedMovies = useMemo(
    () => movies.filter((m) => watched.has(m.id)),
    [movies, watched]
  )

  return (
    <div className="App">
      <Header>
        <SearchBar
          activeQuery={mode === 'search' ? searchQuery : ''}
          onSearch={handleSearch}
          onClear={handleClear}
        />
      </Header>
      <main className="App-main">
        <div className="App-toolbar">
          <button
            type="button"
            className={`App-toolbar__sidebar-toggle${
              isSidebarOpen ? ' is-open' : ''
            }`}
            onClick={() => setIsSidebarOpen((prev) => !prev)}
            aria-expanded={isSidebarOpen}
            aria-controls="lists-panel"
            aria-label={isSidebarOpen ? 'Hide lists' : 'Show lists'}
            title={isSidebarOpen ? 'Hide lists' : 'Show lists'}
          >
            <span className="App-toolbar__bars" aria-hidden="true">
              <span />
              <span />
              <span />
            </span>
          </button>
          <button
            type="button"
            className="App-toolbar__nav"
            onClick={handleClear}
            disabled={mode === 'now_playing' && view === 'home'}
          >
            Now Playing
          </button>
        </div>
        <Sidebar
          id="lists-panel"
          isOpen={isSidebarOpen}
          view={view}
          onNavigate={(next) => {
            setView(next)
            setIsSidebarOpen(false)
          }}
          favoritesCount={favoriteMovies.length}
          watchedCount={watchedMovies.length}
        />
        {isSidebarOpen && (
          <div
            className="App-sidebar-scrim"
            onClick={() => setIsSidebarOpen(false)}
            aria-hidden="true"
          />
        )}

        {view === 'home' && (
          <>
            <SortControl
              sortOption={sortOption}
              onSortChange={setSortOption}
            />
            <MovieList
              movies={sortedMovies}
              isLoading={isLoading}
              error={error}
              hasMore={hasMore}
              onLoadMore={handleLoadMore}
              onCardClick={handleCardClick}
              favorites={favorites}
              watched={watched}
              onToggleFavorite={toggleFavorite}
              onToggleWatched={toggleWatched}
            />
          </>
        )}

        {view === 'favorites' && (
          <ListPage
            title="Favorites"
            description="Movies you've marked with a heart this session."
            emptyTitle="No favorites yet"
            emptyText="Click the heart on any movie to save it here."
            movies={favoriteMovies}
            onCardClick={handleCardClick}
            favorites={favorites}
            watched={watched}
            onToggleFavorite={toggleFavorite}
            onToggleWatched={toggleWatched}
          />
        )}

        {view === 'watched' && (
          <ListPage
            title="Watched"
            description="Movies you've already seen this session."
            emptyTitle="Nothing watched yet"
            emptyText="Tap “Mark as watched” on a movie to track it here."
            movies={watchedMovies}
            onCardClick={handleCardClick}
            favorites={favorites}
            watched={watched}
            onToggleFavorite={toggleFavorite}
            onToggleWatched={toggleWatched}
          />
        )}
      </main>
      <Footer />
      {selectedMovieId !== null && (
        <MovieModal
          details={details}
          trailer={trailer}
          isLoading={isLoadingDetails}
          error={detailsError}
          onClose={handleCloseModal}
        />
      )}
    </div>
  )
}

export default App
