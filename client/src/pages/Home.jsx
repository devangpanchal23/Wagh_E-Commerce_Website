import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Zap, Shield, Sparkles, Cpu, CheckCircle2, ChevronRight } from 'lucide-react';
import { StatStrip } from '../components/StatStrip';
import { TrustStrip } from '../components/TrustStrip';
import { ProductCard } from '../components/ProductCard';
import { NewsletterBlock } from '../components/NewsletterBlock';
import { LoadingSkeleton } from '../components/LoadingSkeleton';
import { fetchApi } from '../api';

export function Home() {
  const [collections, setCollections] = useState({ bestSellers: [], newArrivals: [], featured: [] });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadHomeData = async () => {
      try {
        const res = await fetchApi('/products/collections/featured');
        if (res.success && res.data) {
          setCollections(res.data);
        }
      } catch (err) {
        console.error('Home collections error', err);
      } finally {
        setLoading(false);
      }
    };
    loadHomeData();
  }, []);

  return (
    <div className="space-y-12 pb-16">
      
      {/* HERO SECTION */}
      <section className="relative overflow-hidden bg-gradient-to-b from-wagh-teal/10 via-wagh-bg to-wagh-bg pt-12 pb-20 px-4 sm:px-6 lg:px-8 border-b border-wagh-border/40">
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          
          {/* Left Hero Text */}
          <div className="lg:col-span-7 space-y-6 text-left">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-wagh-teal/10 text-wagh-teal font-mono-tag text-xs font-bold uppercase tracking-widest border border-wagh-teal/20">
              <Zap className="w-4 h-4 text-wagh-gold fill-wagh-gold" />
              <span>Flagship 45W PPS Super Fast Charger</span>
            </div>

            <h1 className="font-editorial text-4xl sm:text-5xl lg:text-6xl font-extrabold text-wagh-dark tracking-tight leading-[1.1]">
              Power that feels <span className="text-wagh-teal underline decoration-wagh-gold decoration-4 underline-offset-8">premium.</span>
              <br />
              Speed you can trust.
            </h1>

            <p className="text-wagh-dark/80 text-base sm:text-lg max-w-2xl leading-relaxed">
              Experience zero-compromise charging engineered with 45W PPS Super Fast Output, multi-layer heat management, and aerospace-grade braided cables.
            </p>

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 pt-4">
              <Link
                to="/shop?category=chargers-adapters"
                className="px-8 py-4 rounded-full bg-wagh-teal text-white font-extrabold text-sm sm:text-base hover:bg-wagh-teal-dark transition-all duration-300 shadow-lg hover:shadow-teal-glow flex items-center justify-center gap-3 group"
              >
                <span>Shop the 45W Adapter</span>
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </Link>
              <Link
                to="/shop"
                className="px-8 py-4 rounded-full bg-white text-wagh-dark border border-wagh-border font-bold text-sm sm:text-base hover:bg-gray-50 hover:border-wagh-teal transition-all duration-200 flex items-center justify-center gap-2 shadow-sm"
              >
                <span>Explore Collection</span>
              </Link>
            </div>

            {/* Quick trust metrics */}
            <div className="pt-6 flex flex-wrap items-center gap-6 text-xs font-mono-tag text-wagh-dark/80 border-t border-wagh-border/60">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-wagh-success" />
                <span>Samsung SFC 2.0 Verified</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-wagh-success" />
                <span>24 Months Doorstep Warranty</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-wagh-success" />
                <span>Free Express Delivery</span>
              </div>
            </div>
          </div>

          {/* Right Hero Image Card */}
          <div className="lg:col-span-5 relative w-full">
            <div className="absolute -inset-4 bg-gradient-to-r from-wagh-teal to-wagh-gold rounded-3xl opacity-20 blur-2xl transform -rotate-3" />
            <div className="relative bg-white rounded-3xl p-5 sm:p-6 lg:p-8 border border-wagh-border shadow-2xl space-y-5 sm:space-y-6">
              
              {/* Product Badge */}
              <div className="flex items-center justify-between">
                <span className="font-mono-tag text-xs font-bold text-wagh-gold bg-wagh-dark px-3 py-1 rounded-full uppercase tracking-wider">
                  ₹749 <span className="line-through text-gray-400 font-normal ml-1">₹1,499</span>
                </span>
                <span className="text-xs font-mono-tag font-semibold text-wagh-teal bg-wagh-teal/10 px-3 py-1 rounded-full">
                  50% OFF TODAY
                </span>
              </div>

              {/* Responsive Hero Banner Image Container */}
              <div className="relative aspect-square w-full rounded-2xl overflow-hidden bg-slate-900 border border-slate-200/80 shadow-md group">
                <img
                  src="/assets/branding/wagh-100w-launch-banner.png"
                  alt="WAGH 100W Fast Charger New Launch Banner"
                  className="w-full h-full object-cover sm:object-contain group-hover:scale-105 transition-transform duration-500 rounded-2xl"
                />
              </div>

              <div className="space-y-2">
                <h3 className="font-editorial text-xl sm:text-2xl font-bold text-wagh-dark">
                  WAGH 100W Super Fast Charger 2.0
                </h3>
                <p className="text-xs text-wagh-muted font-sans">
                  Engineered with 100W Supported Fast Charging & Braided Type-C Cable.
                </p>
              </div>

              <Link
                to="/shop?category=chargers-adapters"
                className="w-full py-3.5 rounded-full bg-wagh-teal hover:bg-wagh-teal-dark text-white font-bold text-sm transition-all flex items-center justify-center gap-2 shadow-md hover:shadow-lg cursor-pointer"
              >
                <span>Buy 100W Adapter Now</span>
                <ChevronRight className="w-4 h-4" />
              </Link>
            </div>
          </div>

        </div>
      </section>

      {/* STAT STRIP */}
      <StatStrip />

      {/* FEATURE GRID */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center max-w-3xl mx-auto space-y-3 mb-12">
          <span className="font-mono-tag text-xs font-bold uppercase tracking-widest text-wagh-teal bg-wagh-teal/10 px-3 py-1 rounded-full">
            Engineering Excellence
          </span>
          <h2 className="font-editorial text-3xl sm:text-4xl font-extrabold text-wagh-dark">
            Why WAGH Outperforms Generic Chargers
          </h2>
          <p className="text-wagh-muted text-sm sm:text-base">
            Every WAGH accessory undergoes 48 hours of stress testing before leaving our facility.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-white p-6 rounded-2xl border border-wagh-border shadow-soft space-y-3">
            <div className="w-12 h-12 rounded-xl bg-wagh-teal text-wagh-gold flex items-center justify-center font-bold">
              <Zap className="w-6 h-6 fill-wagh-gold" />
            </div>
            <h3 className="font-editorial text-xl font-bold text-wagh-dark">45W Super Fast 2.0</h3>
            <p className="text-sm text-wagh-muted leading-relaxed">
              True PPS fast charging protocol boosts phone battery to 65% in under 25 minutes with intelligent voltage matching.
            </p>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-wagh-border shadow-soft space-y-3">
            <div className="w-12 h-12 rounded-xl bg-wagh-teal text-wagh-gold flex items-center justify-center font-bold">
              <Cpu className="w-6 h-6" />
            </div>
            <h3 className="font-editorial text-xl font-bold text-wagh-dark">Universal Fit</h3>
            <p className="text-sm text-wagh-muted leading-relaxed">
              Seamlessly powers Samsung, iPhone 15/16, Google Pixel, iPads, and Type-C laptops without needing separate bricks.
            </p>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-wagh-border shadow-soft space-y-3">
            <div className="w-12 h-12 rounded-xl bg-wagh-teal text-wagh-gold flex items-center justify-center font-bold">
              <Shield className="w-6 h-6" />
            </div>
            <h3 className="font-editorial text-xl font-bold text-wagh-dark">Multi-Protection</h3>
            <p className="text-sm text-wagh-muted leading-relaxed">
              10-layer smart safety guards against over-voltage, short-circuiting, high temperature spikes, and over-current.
            </p>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-wagh-border shadow-soft space-y-3">
            <div className="w-12 h-12 rounded-xl bg-wagh-teal text-wagh-gold flex items-center justify-center font-bold">
              <Sparkles className="w-6 h-6" />
            </div>
            <h3 className="font-editorial text-xl font-bold text-wagh-dark">Safety Assured</h3>
            <p className="text-sm text-wagh-muted leading-relaxed">
              BIS-Certified Indian plug standard with flame-retardant polycarbonate outer casing and anodized aluminum accent trim.
            </p>
          </div>
        </div>
      </section>

      {/* BEST SELLER CAROUSEL / GRID */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-end justify-between mb-8">
          <div>
            <span className="font-mono-tag text-xs font-bold uppercase tracking-widest text-wagh-gold bg-wagh-dark px-3 py-1 rounded-full">
              Customer Favorites
            </span>
            <h2 className="font-editorial text-3xl font-extrabold text-wagh-dark mt-2">
              Best Sellers Collection
            </h2>
          </div>
          <Link to="/shop" className="text-sm font-bold text-wagh-teal hover:underline flex items-center gap-1">
            <span>View All</span>
            <ChevronRight className="w-4 h-4" />
          </Link>
        </div>

        {loading ? (
          <LoadingSkeleton count={4} />
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {collections.bestSellers.map((product) => (
              <ProductCard key={product._id} product={product} />
            ))}
          </div>
        )}
      </section>

      {/* FLAGSHIP BANNER */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-wagh-dark text-white rounded-3xl overflow-hidden shadow-2xl grid grid-cols-1 lg:grid-cols-12 items-center border border-gray-800">
          <div className="lg:col-span-7 p-8 sm:p-12 space-y-6">
            <span className="font-mono-tag text-xs font-bold uppercase tracking-widest text-wagh-gold bg-wagh-teal/30 px-3 py-1 rounded-full border border-wagh-gold/30">
              NEW RELEASE
            </span>

            <h2 className="font-editorial text-3xl sm:text-4xl md:text-5xl font-extrabold leading-tight text-white">
              The Super Fast Charger 2.0 — <br />
              <span className="text-wagh-gold italic">Now in Premium Teal</span>
            </h2>

            <p className="text-gray-300 text-sm sm:text-base leading-relaxed max-w-xl">
              Compact power redefined. Delivers continuous 45W Power Delivery in a body 40% smaller than standard wall adapters.
            </p>

            <div className="pt-2 flex items-center gap-4">
              <Link
                to="/shop?category=chargers-adapters"
                className="px-8 py-4 rounded-full bg-wagh-gold text-wagh-dark font-extrabold text-sm sm:text-base hover:bg-wagh-gold-light transition-all duration-200 shadow-lg hover:scale-105"
              >
                Get Yours — ₹749
              </Link>
            </div>
          </div>

          <div className="lg:col-span-5 p-8 flex items-center justify-center bg-gradient-to-t from-wagh-teal/20 to-transparent">
            <img
              src="https://images.unsplash.com/photo-1622445268465-843dcb642733?w=800&auto=format&fit=crop&q=80"
              alt="Flagship Charger"
              className="w-72 h-72 object-contain drop-shadow-2xl hover:rotate-3 transition-transform duration-500"
            />
          </div>
        </div>
      </section>

      {/* NEW ARRIVALS GRID */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-end justify-between mb-8">
          <div>
            <span className="font-mono-tag text-xs font-bold uppercase tracking-widest text-wagh-teal bg-wagh-teal/10 px-3 py-1 rounded-full">
              Fresh Off the Line
            </span>
            <h2 className="font-editorial text-3xl font-extrabold text-wagh-dark mt-2">
              New Arrivals
            </h2>
          </div>
          <Link to="/shop" className="text-sm font-bold text-wagh-teal hover:underline flex items-center gap-1">
            <span>View All</span>
            <ChevronRight className="w-4 h-4" />
          </Link>
        </div>

        {loading ? (
          <LoadingSkeleton count={4} />
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {collections.newArrivals.map((product) => (
              <ProductCard key={product._id} product={product} />
            ))}
          </div>
        )}
      </section>

      {/* TRUST STRIP */}
      <TrustStrip />

      {/* NEWSLETTER */}
      <div className="max-w-7xl mx-auto px-4">
        <NewsletterBlock />
      </div>

    </div>
  );
}
