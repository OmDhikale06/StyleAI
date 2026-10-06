import { Link } from "react-router-dom";

export default function Footer() {
  return (
    <footer className="footer">
      <div className="container footer-inner">
        <div>
          <div className="logo">STYLE<span>AI</span></div>
          <p className="muted">Your AI-Powered Personal Stylist.<br />StyleAI doesn't just help you find clothes. It helps you decide what to wear.</p>
        </div>
        <div className="footer-links">
          <Link to="/stylist">AI Stylist</Link>
          <Link to="/shop">Shop</Link>
          <Link to="/wishlist">Wishlist</Link>
          <Link to="/orders">My Orders</Link>
        </div>
      </div>
      <div className="container footer-bottom">© {new Date().getFullYear()} StyleAI. A college project — demo payments only.</div>
    </footer>
  );
}
