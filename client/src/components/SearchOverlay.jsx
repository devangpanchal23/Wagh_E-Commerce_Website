import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Search, X, Zap, ArrowRight } from 'lucide-react';
import { fetchApi } from '../api';

export function SearchOverlay({ isOpen, onClose }) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const inputRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 100);
    } else {
      setQuery('');
      setResults([]);
    }
  }, [isOpen]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      return;
    }
    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await fetchApi(`/products?search=${encodeURIComponent(query)}&limit=6`);
        if (res.success && res.data?.products) {
          setResults(res.data.products);
        }
      } catch (e) {
        console.error('Search error', e);
      } finally {
        setLoading(false);
      }
    }, 250);

    return () => clearTimeout(timer);
  }, [query]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-wagh-dark/80 backdrop-blur-md flex flex-col items-center pt-16 px-4 animate-fade-in">
      <div className="w-full max-w-3xl bg-wagh-bg rounded-2xl shadow-2xl overflow-hidden border border-wagh-border">
        {/* Search Input Top Bar */}
        <div className="p-4 sm:p-6 border-b border-wagh-border flex items-center gap-4">
          <Search className="w-6 h-6 text-wagh-teal shrink-0" />
          <input
            ref={inputRef}
            type="text"
            placeholder="Type to search WAGH products (e.g. 45W Charger, Power Bank, Cable)..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full bg-transparent text-lg sm:text-xl font-medium text-wagh-dark placeholder:text-wagh-muted focus:outline-none"
          />
          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-wagh-teal/10 text-wagh-dark transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Live Search Results */}
        <div className="max-h-[60vh] overflow-y-auto p-4 sm:p-6 space-y-4">
          {loading && (
            <div className="py-8 text-center text-wagh-muted font-medium flex items-center justify-center gap-2">
              <Zap className="w-5 h-5 text-wagh-gold animate-bounce" />
              Searching WAGH catalog...
            </div>
          )}

          {!loading && query && results.length === 0 && (
            <div className="py-10 text-center">
              <p className="text-lg font-semibold text-wagh-dark">No accessories found matching "{query}"</p>
              <p className="text-sm text-wagh-muted mt-1">Try searching for "45W", "Power Bank", "Earbuds", or "Braided Cable"</p>
            </div>
          )}

          {!loading && results.length > 0 && (
            <div className="space-y-3">
              <p className="text-xs font-mono-tag tracking-wider uppercase text-wagh-muted">Matching Products</p>
              {results.map((product) => (
                <Link
                  key={product._id}
                  to={`/product/${product._id}`}
                  onClick={onClose}
                  className="flex items-center gap-4 p-3 rounded-xl hover:bg-wagh-teal/10 cursor-pointer transition-all duration-200 group"
                >
                  <img
                    src={product.images[0]}
                    alt={product.name}
                    className="w-14 h-14 object-cover rounded-lg bg-white border border-wagh-border"
                  />
                  <div className="flex-1 min-w-0">
                    <h4 className="font-bold text-wagh-dark group-hover:text-wagh-teal transition-colors truncate">
                      {product.name}
                    </h4>
                    <p className="text-xs text-wagh-muted truncate mt-0.5">{product.brand} · {product.specs?.outputPower || 'Premium Quality'}</p>
                  </div>
                  <div className="text-right font-mono-tag">
                    <div className="font-bold text-wagh-teal">₹{product.price}</div>
                    {product.mrp > product.price && (
                      <div className="text-xs text-wagh-muted line-through">₹{product.mrp}</div>
                    )}
                  </div>
                </Link>
              ))}
            </div>
          )}

          {!query && (
            <div>
              <p className="text-xs font-mono-tag tracking-wider uppercase text-wagh-muted mb-3">Popular Searches</p>
              <div className="flex flex-wrap gap-2">
                {['45W Super Fast Charger', '20000mAh Power Bank', 'MagSafe Wireless', '100W Type-C Cable', 'ANC TWS Earbuds'].map((term) => (
                  <button
                    key={term}
                    onClick={() => setQuery(term)}
                    className="px-3 py-1.5 rounded-full bg-white border border-wagh-border text-xs font-semibold text-wagh-dark hover:border-wagh-teal hover:text-wagh-teal transition-colors"
                  >
                    {term}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
