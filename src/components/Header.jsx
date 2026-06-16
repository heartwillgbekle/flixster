import { Children } from 'react';
import logo from '../assets/flixster-logo.svg';
import './Header.css';

const Header = ({ leading, children }) => {
  const hasActions = Children.count(children) > 0;
  return (
    <header className="header">
      {leading && <div className="header__leading">{leading}</div>}
      <div className="header__brand">
        <img src={logo} alt="Flixster logo" className="header__logo" />
        <div className="header__text">
          <h1 className="header__title">Flixster</h1>
          <p className="header__tagline">Discover what's playing now.</p>
        </div>
      </div>
      {hasActions && <div className="header__actions">{children}</div>}
    </header>
  );
};

export default Header;
