import { useEffect, useState } from 'react'
import './App.css'
import MovieList from './components/MovieList'
import SearchBar from './components/SearchBar'
import { getNowPlaying, searchMovies } from './api/tmdb'

const App = () => {
  const [movies, setMovies] = useState([])
  const [searchQuery, setSearchQuery] = useState('')
  const [page, setPage] = useState(1)
  const [mode, setMode] = useState('now_playing')
  const [hasMore, setHasMore] = useState(true)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState(null)

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

  return (
    <div className="App">
      <header className="App-header">
        <h1>Flixster</h1>
        <button
          type="button"
          className="App-header__nav"
          onClick={handleClear}
          disabled={mode === 'now_playing'}
        >
          Now Playing
        </button>
      </header>
      <SearchBar
        activeQuery={mode === 'search' ? searchQuery : ''}
        onSearch={handleSearch}
        onClear={handleClear}
      />
      <MovieList
        movies={movies}
        isLoading={isLoading}
        error={error}
        hasMore={hasMore}
        onLoadMore={handleLoadMore}
      />
    </div>
  )
}

export default App
