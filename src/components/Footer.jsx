import './Footer.css';

const currentYear = new Date().getFullYear();

const Footer = () => (
  <footer className="footer">
    <p className="footer__copy">© {currentYear} BackDrop</p>
    <p className="footer__attribution">
      Movie data provided by{' '}
      <a
        href="https://www.themoviedb.org/"
        target="_blank"
        rel="noopener noreferrer"
        className="footer__link"
      >
        The Movie Database (TMDb)
      </a>
      . This product uses the TMDb API but is not endorsed or certified by TMDb.
    </p>
  </footer>
);

export default Footer;
