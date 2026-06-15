import { useEffect, useMemo, useState } from 'react'
import './App.css'
import Header from './components/Header'
import Footer from './components/Footer'
import MovieList from './components/MovieList'
import SearchBar from './components/SearchBar'
import SortControl from './components/SortControl'
import MovieModal from './components/MovieModal'
import { getMovieDetails, getNowPlaying, searchMovies } from './api/tmdb'

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

  const [selectedMovieId, setSelectedMovieId] = useState(null)
  const [details, setDetails] = useState(null)
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
      setDetailsError(null)
      return
    }

    let cancelled = false
    setIsLoadingDetails(true)
    setDetailsError(null)
    setDetails(null)

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
  }

  const handleClear = () => {
    setSearchQuery('')
    setMode('now_playing')
    setPage(1)
  }

  const handleLoadMore = () => {
    setPage((prev) => prev + 1)
  }

  const handleCardClick = (id) => setSelectedMovieId(id)
  const handleCloseModal = () => setSelectedMovieId(null)

  return (
    <div className="App">
      <Header />
      <main className="App-main">
        <div className="App-toolbar">
          <button
            type="button"
            className="App-toolbar__nav"
            onClick={handleClear}
            disabled={mode === 'now_playing'}
          >
            Now Playing
          </button>
        </div>
        <SearchBar
          activeQuery={mode === 'search' ? searchQuery : ''}
          onSearch={handleSearch}
          onClear={handleClear}
        />
        <SortControl sortOption={sortOption} onSortChange={setSortOption} />
        <MovieList
          movies={sortedMovies}
          isLoading={isLoading}
          error={error}
          hasMore={hasMore}
          onLoadMore={handleLoadMore}
          onCardClick={handleCardClick}
        />
      </main>
      <Footer />
      {selectedMovieId !== null && (
        <MovieModal
          details={details}
          isLoading={isLoadingDetails}
          error={detailsError}
          onClose={handleCloseModal}
        />
      )}
    </div>
  )
}

export default App
