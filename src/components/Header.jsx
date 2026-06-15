import logo from '../assets/flixster-logo.svg';
import './Header.css';

const Header = ({ children }) => (
  <header className="header">
    <div className="header__brand">
      <img src={logo} alt="BackDrop logo" className="header__logo" />
      <div className="header__text">
        <h1 className="header__title">BackDrop</h1>
        <p className="header__tagline">Discover what's playing now.</p>
      </div>
    </div>
    {children && <div className="header__actions">{children}</div>}
  </header>
);

export default Header;
