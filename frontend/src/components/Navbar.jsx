import { useEffect, useState } from "react";
import { Link, NavLink, useLocation, useNavigate } from "react-router-dom";
import { BagIcon, CloseIcon, HeartIcon, MenuIcon, SearchIcon } from "./Icons.jsx";
import { useAuth } from "../context/AuthContext.jsx";
import { useShop } from "../context/ShopContext.jsx";

export default function Navbar() {
  const { user, logout } = useAuth();
  const { cart, wishlist } = useShop();
  const navigate = useNavigate();
  const location = useLocation();
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");

  useEffect(() => { setOpen(false); }, [location.pathname]);

  const submit = (e) => {
    e.preventDefault();
    const term = q.trim();
    navigate(term ? `/shop?q=${encodeURIComponent(term)}` : "/shop");
    setOpen(false);
  };
  const onLogout = () => { logout(); navigate("/"); };
  const link = ({ isActive }) => (isActive ? "nav-link active" : "nav-link");

  return (
    <header className="navbar">
      <div className="container nav-inner">
        <button className="icon-btn nav-toggle" onClick={() => setOpen((o) => !o)} aria-label="Menu" aria-expanded={open}>
          {open ? <CloseIcon /> : <MenuIcon />}
        </button>
        <Link to="/" className="logo">STYLE<span>AI</span></Link>

        <nav className={`nav-links ${open ? "open" : ""}`}>
          <NavLink to="/" end className={link}>Home</NavLink>
          <NavLink to="/stylist" className={link}>AI Stylist</NavLink>
          <NavLink to="/shop" className={link}>Shop</NavLink>
          <form className="nav-search" onSubmit={submit} role="search">
            <SearchIcon width={18} height={18} />
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search products, brands, occasions" aria-label="Search" />
          </form>
          <div className="nav-mobile-auth">
            {user ? (<><NavLink to="/orders" className={link}>My Orders</NavLink><button className="nav-link as-link" onClick={onLogout}>Logout</button></>) : (<NavLink to="/login" className={link}>Login / Sign up</NavLink>)}
          </div>
        </nav>

        <div className="nav-actions">
          <Link to="/wishlist" className="icon-btn badge-wrap" aria-label="Wishlist">
            <HeartIcon />{wishlist.length > 0 && <span className="count">{wishlist.length}</span>}
          </Link>
          <Link to="/cart" className="icon-btn badge-wrap" aria-label="Cart">
            <BagIcon />{cart.summary.items > 0 && <span className="count">{cart.summary.items}</span>}
          </Link>
          {user ? (
            <div className="user-menu">
              <Link to="/orders" className="user-name" title="My Orders">Hi, {user.name.split(" ")[0]}</Link>
              <button className="btn btn-outline btn-sm" onClick={onLogout}>Logout</button>
            </div>
          ) : (
            <Link to="/login" className="btn btn-dark btn-sm login-btn">Login</Link>
          )}
        </div>
      </div>
    </header>
  );
}
