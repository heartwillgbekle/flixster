import './Sidebar.css';

const NAV_ITEMS = [
  { view: 'home', label: 'Home', icon: '⌂' },
  { view: 'favorites', label: 'Favorites', icon: '❤' },
  { view: 'watched', label: 'Watched', icon: '✓' },
];

const Sidebar = ({
  id,
  isOpen = true,
  view,
  onNavigate,
  favoritesCount = 0,
  watchedCount = 0,
}) => (
  <aside
    id={id}
    className={`sidebar${isOpen ? ' sidebar--open' : ''}`}
    aria-label="Navigation"
    aria-hidden={!isOpen}
  >
    <div className="sidebar__inner">
      <h2 className="sidebar__title">My Lists</h2>
      <nav className="sidebar__nav">
        {NAV_ITEMS.map((item) => {
          const count =
            item.view === 'favorites'
              ? favoritesCount
              : item.view === 'watched'
                ? watchedCount
                : null;
          const isActive = view === item.view;
          return (
            <button
              key={item.view}
              type="button"
              className={`sidebar__nav-item${isActive ? ' is-active' : ''}`}
              onClick={() => onNavigate(item.view)}
              aria-current={isActive ? 'page' : undefined}
            >
              <span className="sidebar__nav-icon" aria-hidden="true">
                {item.icon}
              </span>
              <span className="sidebar__nav-label">{item.label}</span>
              {count !== null && (
                <span className="sidebar__nav-count">{count}</span>
              )}
            </button>
          );
        })}
      </nav>
    </div>
  </aside>
);

export default Sidebar;
