import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Search, ShoppingBag, User, Heart, Menu, ShieldAlert } from 'lucide-react';
import { Show, SignInButton, UserButton } from '@clerk/react';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { useWishlist } from '../context/WishlistContext';

export function Navbar({ onOpenSearch, onOpenMobileDrawer, onOpenAuthModal }) {
  const { totalItemCount } = useCart();
  const { user, isAdmin } = useAuth();
  const { wishlist } = useWishlist();
  const location = useLocation();
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const navLinks = [
    { name: 'Home', path: '/' },
    { name: 'Shop', path: '/shop' },
    { name: 'About Us', path: '/about' },
    { name: 'Contact Us', path: '/contact' },
  ];

  const handleProfileClick = (e) => {
    if (!user) {
      e.preventDefault();
      if (onOpenAuthModal) onOpenAuthModal();
    }
  };

  const displayName = user?.displayName || user?.name || user?.email?.split('@')[0] || 'Account';

  return (
    <header className={`sticky top-0 z-40 transition-all duration-300 ${scrolled ? 'glass-nav shadow-md border-b border-wagh-border/60 py-3' : 'bg-wagh-bg py-4 border-b border-wagh-border/40'}`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between">
        
        {/* Left Mobile Menu Toggle + Logo */}
        <div className="flex items-center gap-3">
          <button
            onClick={onOpenMobileDrawer}
            className="lg:hidden p-2 rounded-xl text-wagh-dark hover:bg-wagh-teal/10 transition-colors focus:outline-none"
            aria-label="Open Mobile Menu"
          >
            <Menu className="w-6 h-6" />
          </button>

          <Link to="/" className="flex items-center group py-1">
            <img 
              src="/assets/branding/wagh-logo-2x.png" 
              alt="WAGH Mobile Accessories" 
              className="h-8 sm:h-10 w-auto object-contain group-hover:scale-105 transition-transform" 
            />
          </Link>
        </div>

        {/* Center Nav Links (Desktop) */}
        <nav className="hidden lg:flex items-center gap-8">
          {navLinks.map((link) => {
            const isActive = location.pathname === link.path;
            return (
              <Link
                key={link.name}
                to={link.path}
                className={`text-sm font-semibold tracking-wide transition-all relative py-1 ${
                  isActive ? 'text-wagh-teal' : 'text-wagh-dark/80 hover:text-wagh-teal'
                }`}
              >
                {link.name}
                {isActive && (
                  <span className="absolute bottom-0 left-0 w-full h-[2px] bg-wagh-gold rounded-full" />
                )}
              </Link>
            );
          })}
        </nav>

        {/* Right Icon Actions */}
        <div className="flex items-center gap-2 sm:gap-4">
          {/* Admin badge link if user is admin */}
          {isAdmin && (
            <Link
              to="/admin"
              className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 bg-wagh-gold/20 text-wagh-teal font-semibold text-xs rounded-full border border-wagh-gold/40 hover:bg-wagh-gold/30 transition-colors"
            >
              <ShieldAlert className="w-3.5 h-3.5" />
              <span>Admin</span>
            </Link>
          )}

          {/* Search Trigger */}
          <button
            onClick={onOpenSearch}
            className="p-2.5 rounded-full text-wagh-dark/80 hover:text-wagh-teal hover:bg-wagh-teal/10 transition-colors"
            aria-label="Search"
            title="Search products"
          >
            <Search className="w-5 h-5" />
          </button>

          {/* Wishlist */}
          <Link
            to={user ? "/profile" : "#"}
            onClick={handleProfileClick}
            className="hidden sm:flex p-2.5 rounded-full text-wagh-dark/80 hover:text-wagh-teal hover:bg-wagh-teal/10 transition-colors relative"
            title="Saved items"
          >
            <Heart className="w-5 h-5" />
            {wishlist.length > 0 && (
              <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-wagh-gold" />
            )}
          </Link>

          {/* Profile / Sign In with Clerk Show pattern */}
          <Show when="signed-out">
            <button
              onClick={onOpenAuthModal}
              className="p-2.5 rounded-full text-wagh-dark/80 hover:text-wagh-teal hover:bg-wagh-teal/10 transition-colors flex items-center gap-1"
              title="Sign In"
            >
              <User className="w-5 h-5" />
              <span className="hidden md:inline text-xs font-semibold text-wagh-dark/80 hover:text-wagh-teal">
                Sign In
              </span>
            </button>
          </Show>

          <Show when="signed-in">
            <div className="flex items-center gap-2">
              <Link
                to="/profile"
                className="p-2.5 rounded-full text-wagh-dark/80 hover:text-wagh-teal hover:bg-wagh-teal/10 transition-colors flex items-center gap-1"
                title={displayName}
              >
                <User className="w-5 h-5" />
                <span className="hidden md:inline text-xs font-semibold text-wagh-teal max-w-[100px] truncate">
                  {displayName.split(' ')[0]}
                </span>
              </Link>
              <UserButton afterSignOutUrl="/" />
            </div>
          </Show>

          {/* Cart Icon with Live Badge */}
          <Link
            to="/cart"
            className="p-2.5 rounded-full bg-wagh-teal text-white hover:bg-wagh-teal-dark transition-all duration-300 flex items-center gap-2 shadow-md hover:shadow-lg hover:scale-105 relative"
            aria-label="Cart"
          >
            <ShoppingBag className="w-5 h-5" />
            <span className="font-mono-tag font-bold text-xs bg-wagh-gold text-wagh-dark px-2 py-0.5 rounded-full">
              {totalItemCount}
            </span>
          </Link>
        </div>
      </div>
    </header>
  );
}
