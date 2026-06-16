import { useEffect, useMemo, useState } from 'react'
import './App.css'
import Header from './components/Header'
import Footer from './components/Footer'
import Sidebar from './components/Sidebar'
import Hero from './components/Hero'
import ListPage from './components/ListPage'
import MovieList from './components/MovieList'
import SearchBar from './components/SearchBar'
import SortControl from './components/SortControl'
import MovieModal from './components/MovieModal'
import {
  getMovieDetails,
  getMovieVideos,
  getNowPlaying,
  getTopRated,
  pickBestTrailer,
  searchMovies,
} from './api/tmdb'
import { acquireScrollLock, releaseScrollLock } from './utils/scrollLock'

const SORT_FNS = {
  'title-asc': (a, b) => a.title.localeCompare(b.title),
  'release-desc': (a, b) =>
    new Date(b.release_date) - new Date(a.release_date),
  'rating-desc': (a, b) => b.vote_average - a.vote_average,
}

const App = () => {
  const [movies, setMovies] = useState([])
  const [movieCache, setMovieCache] = useState(() => new Map())
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

  const [heroSlides, setHeroSlides] = useState([])

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
    if (!isSidebarOpen) return
    const handleKey = (e) => {
      if (e.key === 'Escape') setIsSidebarOpen(false)
    }
    window.addEventListener('keydown', handleKey)
    acquireScrollLock()
    return () => {
      window.removeEventListener('keydown', handleKey)
      releaseScrollLock()
    }
  }, [isSidebarOpen])

  useEffect(() => {
    let cancelled = false
    getTopRated(1)
      .then((data) => {
        if (cancelled) return
        const picks = data.results
          .filter((m) => m.backdrop_path && m.overview)
          .slice(0, 5)
        setHeroSlides(picks)
        setMovieCache((prev) => {
          const next = new Map(prev)
          for (const m of data.results) next.set(m.id, m)
          return next
        })
      })
      .catch(() => {
        if (!cancelled) setHeroSlides([])
      })
    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => {
    const fetcher =
      mode === 'search'
        ? () => searchMovies(searchQuery, page)
        : () => getNowPlaying(page)

    setIsLoading(true)
    setError(null)
    fetcher()
      .then((data) => {
        setMovies((prev) => {
          if (page === 1) return data.results
          const seen = new Set(prev.map((m) => m.id))
          const fresh = data.results.filter((m) => !seen.has(m.id))
          return [...prev, ...fresh]
        })
        setMovieCache((prev) => {
          const next = new Map(prev)
          for (const m of data.results) next.set(m.id, m)
          return next
        })
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
        if (cancelled) return
        setDetails(data)
        setMovieCache((prev) => {
          const next = new Map(prev)
          next.set(data.id, { ...prev.get(data.id), ...data })
          return next
        })
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
    if (isLoading) return
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
    () =>
      [...favorites]
        .map((id) => movieCache.get(id))
        .filter(Boolean),
    [movieCache, favorites]
  )
  const watchedMovies = useMemo(
    () =>
      [...watched]
        .map((id) => movieCache.get(id))
        .filter(Boolean),
    [movieCache, watched]
  )

  return (
    <div className="App">
      <Header
        leading={
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
        }
      >
        {view === 'home' && (
          <SortControl
            sortOption={sortOption}
            onSortChange={setSortOption}
          />
        )}
        <SearchBar
          key={mode === 'search' ? searchQuery : '__home__'}
          activeQuery={mode === 'search' ? searchQuery : ''}
          onSearch={handleSearch}
          onClear={handleClear}
        />
      </Header>
      <main className="App-main">
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
            <Hero
              slides={heroSlides}
              onCardClick={handleCardClick}
              mode={mode}
              onClearMode={handleClear}
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
