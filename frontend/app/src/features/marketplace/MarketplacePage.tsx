import React, { useState, useMemo, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { PublicLayout } from '@/components/layout/PublicLayout';
import { MARKETPLACE_PRODUCTS, MarketplaceProduct } from '@/data/marketplaceData';
import { BUYER_REVIEWS } from '@/data/reviewsData';
import {
  Search,
  X,
  QrCode,
  ArrowUpDown,
  MessageSquare,
  ChevronRight,
  ArrowRight,
  ShieldCheck,
  Star,
  CheckCircle2,
  Filter,
} from 'lucide-react';

// Editorial & Atmospheric Video Assets
import marketplaceVideoMp4 from '@/assets/ecosystem/marketplace-artisan-desktop.mp4';
import marketplaceVideoWebm from '@/assets/ecosystem/marketplace-artisan-desktop.webm';
import marketplaceVideoMobile from '@/assets/ecosystem/marketplace-artisan-mobile.mp4';
import marketplaceVideoPoster from '@/assets/ecosystem/marketplace-artisan-poster.webp';
import { AtmosphericVideo } from '@/components/media/AtmosphericVideo';
import craftStoryLoomJpg from '@/assets/marketplace/craft-story-loom.jpg';
import catPotteryJpg from '@/assets/marketplace/craft-category-pottery.jpg';
import catTextilesJpg from '@/assets/marketplace/craft-category-textiles.jpg';
import catWoodcraftJpg from '@/assets/marketplace/craft-category-woodcraft.jpg';
import catMetalworkJpg from '@/assets/marketplace/craft-category-metalwork.jpg';
import catPaintingJpg from '@/assets/marketplace/craft-category-painting.jpg';
import catCaneJpg from '@/assets/marketplace/craft-category-cane.jpg';
import craftMapAtmospherePng from '@/assets/ecosystem/craft-map-atmosphere.png';
import workshopLightPng from '@/assets/ecosystem/craft-workshop-light.png';

const CATEGORY_ITEMS = [
  { id: 'all', name: 'All Crafts', key: 'all', image: catPotteryJpg },
  { id: 'textiles', name: 'Textiles & Handloom', key: 'Handloom Textiles', image: catTextilesJpg },
  { id: 'pottery', name: 'Pottery & Ceramics', key: 'Pottery & Ceramics', image: catPotteryJpg },
  { id: 'woodcraft', name: 'Woodcraft', key: 'Woodcraft', image: catWoodcraftJpg },
  { id: 'metalwork', name: 'Metalwork & Dhokra', key: 'Metalwork', image: catMetalworkJpg },
  { id: 'painting', name: 'Painting & Folk Art', key: 'Painting & Folk Art', image: catPaintingJpg },
  { id: 'cane', name: 'Cane & Basketry', key: 'Cane & Basketry', image: catCaneJpg },
];

type SortOption = 'recommended' | 'newest' | 'price_low' | 'price_high';

export const MarketplacePage: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedState, setSelectedState] = useState<string>('all');
  const [sortBy, setSortBy] = useState<SortOption>('recommended');
  const [visibleCount, setVisibleCount] = useState<number>(8);
  const [isMobileFilterOpen, setIsMobileFilterOpen] = useState(false);
  const [selectedProductForModal, setSelectedProductForModal] = useState<MarketplaceProduct | null>(null);
  const [enquirySentProduct, setEnquirySentProduct] = useState<string | null>(null);

  const collectionRef = useRef<HTMLDivElement>(null);
  const categoriesRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  // Featured Product spotlight (Jamdani Saree)
  const featuredProduct = useMemo(() => {
    return MARKETPLACE_PRODUCTS[0];
  }, []);

  // Compute category product counts dynamically
  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = { all: MARKETPLACE_PRODUCTS.length };
    MARKETPLACE_PRODUCTS.forEach((p) => {
      counts[p.category] = (counts[p.category] || 0) + 1;
    });
    return counts;
  }, []);

  // Extract unique states from real data
  const states = useMemo(() => {
    const set = new Set(MARKETPLACE_PRODUCTS.map((p) => p.state));
    return ['all', ...Array.from(set).sort()];
  }, []);

  // Filtered & Sorted Products
  const filteredProducts = useMemo(() => {
    return MARKETPLACE_PRODUCTS.filter((product) => {
      // Search Query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matches =
          product.title.toLowerCase().includes(q) ||
          product.craft.toLowerCase().includes(q) ||
          product.artisanName.toLowerCase().includes(q) ||
          product.state.toLowerCase().includes(q) ||
          product.materials.some((m) => m.toLowerCase().includes(q)) ||
          product.story.toLowerCase().includes(q);
        if (!matches) return false;
      }

      // Category
      if (selectedCategory !== 'all' && product.category !== selectedCategory) {
        return false;
      }

      // State
      if (selectedState !== 'all' && product.state !== selectedState) {
        return false;
      }

      return true;
    }).sort((a, b) => {
      if (sortBy === 'newest') {
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      }
      if (sortBy === 'price_low') {
        return a.price - b.price;
      }
      if (sortBy === 'price_high') {
        return b.price - a.price;
      }
      return 0; // recommended
    });
  }, [searchQuery, selectedCategory, selectedState, sortBy]);

  const resetFilters = () => {
    setSearchQuery('');
    setSelectedCategory('all');
    setSelectedState('all');
    setSortBy('recommended');
  };

  const handleSendEnquiry = (product: MarketplaceProduct) => {
    setEnquirySentProduct(product.id);
    setTimeout(() => {
      setSelectedProductForModal(null);
      setEnquirySentProduct(null);
      navigate('/login');
    }, 1200);
  };

  const scrollToCollection = () => {
    if (typeof collectionRef.current?.scrollIntoView === 'function') {
      collectionRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const scrollToCategories = () => {
    if (typeof categoriesRef.current?.scrollIntoView === 'function') {
      categoriesRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const activeFilterCount = (selectedCategory !== 'all' ? 1 : 0) + (selectedState !== 'all' ? 1 : 0) + (searchQuery.trim() ? 1 : 0);

  return (
    <PublicLayout>
      {/* Background Page Atmosphere */}
      <div className="absolute inset-0 z-0 pointer-events-none select-none overflow-hidden" aria-hidden="true">
        <img
          src={workshopLightPng}
          alt=""
          role="presentation"
          loading="lazy"
          decoding="async"
          className="w-full h-[1400px] object-cover opacity-10"
        />
        <div
          className="absolute inset-0"
          style={{
            background:
              'linear-gradient(180deg, rgba(255, 249, 239, 0.4) 0%, rgba(255, 249, 239, 0.85) 500px, #FFF9EF 900px)',
          }}
        />
      </div>

      <div className="marketplace-page w-full flex flex-col relative z-10">
        {/* ========================================================= */}
        {/* 1. EDITORIAL MARKETPLACE HERO                              */}
        {/* ========================================================= */}
        <section
          aria-label="The KarigarSaathi Marketplace"
          className="marketplace-hero"
        >
          {/* Atmospheric Artisan Video Background */}
          <AtmosphericVideo
            desktopWebm={marketplaceVideoWebm}
            desktopMp4={marketplaceVideoMp4}
            mobileMp4={marketplaceVideoMobile}
            poster={marketplaceVideoPoster}
            veilVariant="marketplace"
            fadeBottom
            priority
          />

          {/* Centered Editorial Hero Content */}
          <div className="marketplace-hero__content">
            <div className="marketplace-hero__eyebrow">
              THE KARIGARSAATHI MARKETPLACE
            </div>

            <h1 className="marketplace-hero__title">
              <span className="marketplace-hero__line marketplace-hero__line--primary">Made by hand.</span>{' '}
              <span className="marketplace-hero__line marketplace-hero__line--accent">Shared with meaning.</span>
            </h1>

            <p className="marketplace-hero__description">
              Discover handmade products, regional traditions and the people who keep them alive.
            </p>

            <div className="marketplace-hero__actions">
              <button
                type="button"
                onClick={scrollToCollection}
                className="marketplace-hero__btn marketplace-hero__btn--primary"
              >
                Explore the collection
              </button>

              <button
                type="button"
                onClick={scrollToCategories}
                className="marketplace-hero__btn marketplace-hero__btn--secondary"
              >
                Browse by craft
              </button>
            </div>
          </div>
        </section>

        <div className="max-w-[1220px] w-full mx-auto px-4 sm:px-8 lg:px-12 py-8 flex flex-col gap-12 sm:gap-16">
          {/* ========================================================= */}
          {/* 2. COMPACT BROWSING TOOLBAR                                */}
          {/* ========================================================= */}
          <section aria-label="Marketplace Filters and Search">
            <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 bg-white/80 backdrop-blur-xs p-3 sm:p-3.5 rounded-2xl border border-[#001D36]/10 shadow-xs">
              {/* Search input */}
              <div className="flex items-center gap-2.5 bg-[#FFF9EF]/90 border border-[#001D36]/12 rounded-xl px-3.5 py-2 flex-1 shadow-2xs">
                <Search className="w-4 h-4 text-[#001D36]/60 shrink-0" />
                <input
                  type="text"
                  placeholder="Search products, crafts, artisans or regions..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full text-xs sm:text-sm bg-transparent placeholder:text-[#001D36]/50 text-[#001D36] font-medium focus:outline-none"
                  aria-label="Search products, crafts, artisans or regions"
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery('')}
                    className="text-[#001D36]/50 hover:text-[#001D36] p-1 rounded-md"
                    aria-label="Clear search"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              {/* Desktop Filters & Sorting */}
              <div className="hidden md:flex items-center gap-2.5 shrink-0">
                {/* Category Selector */}
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="px-3 py-2 bg-[#FFF9EF]/90 border border-[#001D36]/12 rounded-xl text-xs font-semibold text-[#001D36] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#FFB955] cursor-pointer shadow-2xs"
                  aria-label="Filter by Category"
                >
                  <option value="all">All Categories</option>
                  <option value="Handloom Textiles">Handloom Textiles</option>
                  <option value="Pottery & Ceramics">Pottery & Ceramics</option>
                  <option value="Woodcraft">Woodcraft</option>
                  <option value="Metalwork">Metalwork</option>
                  <option value="Painting & Folk Art">Painting & Folk Art</option>
                  <option value="Cane & Basketry">Cane & Basketry</option>
                </select>

                {/* State Selector */}
                <select
                  value={selectedState}
                  onChange={(e) => setSelectedState(e.target.value)}
                  className="px-3 py-2 bg-[#FFF9EF]/90 border border-[#001D36]/12 rounded-xl text-xs font-semibold text-[#001D36] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#FFB955] cursor-pointer shadow-2xs"
                  aria-label="Filter by State"
                >
                  <option value="all">All States</option>
                  {states
                    .filter((s) => s !== 'all')
                    .map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                </select>

                {/* Sort Selector */}
                <div className="flex items-center gap-1.5 px-3 py-2 bg-[#FFF9EF]/90 border border-[#001D36]/12 rounded-xl text-xs font-semibold text-[#001D36] shadow-2xs">
                  <ArrowUpDown className="w-3.5 h-3.5 text-[#001D36]/60" />
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value as SortOption)}
                    className="bg-transparent text-xs font-semibold text-[#001D36] focus:outline-none cursor-pointer"
                    aria-label="Sort products"
                  >
                    <option value="recommended">Recommended</option>
                    <option value="newest">Newest</option>
                    <option value="price_low">Price: Low to High</option>
                    <option value="price_high">Price: High to Low</option>
                  </select>
                </div>
              </div>

              {/* Mobile Filter Button */}
              <div className="flex md:hidden items-center justify-between gap-2">
                <div className="flex items-center gap-1.5 px-3 py-2 bg-[#FFF9EF] border border-[#001D36]/12 rounded-xl text-xs font-semibold text-[#001D36] flex-1">
                  <ArrowUpDown className="w-3.5 h-3.5 text-[#001D36]/60" />
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value as SortOption)}
                    className="w-full bg-transparent text-xs font-semibold text-[#001D36] focus:outline-none"
                    aria-label="Sort products"
                  >
                    <option value="recommended">Recommended</option>
                    <option value="newest">Newest</option>
                    <option value="price_low">Price: Low to High</option>
                    <option value="price_high">Price: High to Low</option>
                  </select>
                </div>

                <button
                  type="button"
                  onClick={() => setIsMobileFilterOpen(true)}
                  className="flex items-center gap-1.5 px-3.5 py-2 bg-[#001D36] text-white rounded-xl text-xs font-bold shadow-xs touch-target"
                  aria-label="Open filter drawer"
                >
                  <Filter className="w-3.5 h-3.5" />
                  <span>Filters</span>
                  {activeFilterCount > 0 && (
                    <span className="w-4 h-4 rounded-full bg-[#A13F1C] text-white text-[10px] flex items-center justify-center font-bold">
                      {activeFilterCount}
                    </span>
                  )}
                </button>
              </div>
            </div>

            {/* Active Filter Chips */}
            {activeFilterCount > 0 && (
              <div className="flex flex-wrap items-center gap-2 mt-3 pt-2">
                <span className="text-xs text-[#001D36]/70 font-semibold">Active filters:</span>
                {selectedCategory !== 'all' && (
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[#001D36]/8 text-[#001D36] text-xs font-semibold border border-[#001D36]/12">
                    <span>{selectedCategory}</span>
                    <button
                      type="button"
                      onClick={() => setSelectedCategory('all')}
                      className="hover:text-[#A13F1C]"
                      aria-label={`Remove category filter ${selectedCategory}`}
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                )}
                {selectedState !== 'all' && (
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[#001D36]/8 text-[#001D36] text-xs font-semibold border border-[#001D36]/12">
                    <span>{selectedState}</span>
                    <button
                      type="button"
                      onClick={() => setSelectedState('all')}
                      className="hover:text-[#A13F1C]"
                      aria-label={`Remove state filter ${selectedState}`}
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                )}
                {searchQuery.trim() && (
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[#001D36]/8 text-[#001D36] text-xs font-semibold border border-[#001D36]/12">
                    <span>&ldquo;{searchQuery}&rdquo;</span>
                    <button
                      type="button"
                      onClick={() => setSearchQuery('')}
                      className="hover:text-[#A13F1C]"
                      aria-label="Remove search filter"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                )}
                <button
                  type="button"
                  onClick={resetFilters}
                  className="text-xs text-[#A13F1C] hover:underline font-bold ml-1 touch-target"
                >
                  Clear all
                </button>
              </div>
            )}
          </section>

          {/* ========================================================= */}
          {/* 3. SHOP BY CRAFT (CATEGORY ROW)                            */}
          {/* ========================================================= */}
          <section ref={categoriesRef} aria-label="Explore by craft" className="flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="font-display text-xl sm:text-2xl font-bold text-[#001D36] tracking-tight">
                  Explore by craft
                </h2>
                <p className="text-xs sm:text-sm text-[#001D36]/70 font-medium">
                  Curated disciplines preserved across regional Indian lineages.
                </p>
              </div>
            </div>

            {/* Horizontal Category Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-7 gap-3 overflow-x-auto pb-2 scrollbar-none">
              {CATEGORY_ITEMS.map((item) => {
                const isSelected = selectedCategory === (item.key === 'all' ? 'all' : item.key);
                const count = categoryCounts[item.key] || 0;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setSelectedCategory(item.key === 'all' ? 'all' : item.key)}
                    className={`flex flex-col items-center gap-2 p-2.5 rounded-2xl border transition-all duration-150 text-center group cursor-pointer touch-target ${
                      isSelected
                        ? 'bg-[#A13F1C]/10 border-[#A13F1C] shadow-xs'
                        : 'bg-white/80 hover:bg-white border-[#001D36]/10 hover:border-[#001D36]/25'
                    }`}
                  >
                    <div className="w-16 h-16 sm:w-18 sm:h-18 rounded-xl overflow-hidden bg-[#FFF9EF] border border-[#001D36]/10 shrink-0">
                      <img
                        src={item.image}
                        alt=""
                        role="presentation"
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                        loading="lazy"
                      />
                    </div>
                    <div className="flex flex-col items-center">
                      <span
                        className={`text-xs font-bold leading-tight ${
                          isSelected ? 'text-[#A13F1C]' : 'text-[#001D36] group-hover:text-[#A13F1C]'
                        }`}
                      >
                        {item.name}
                      </span>
                      <span className="text-[10px] text-[#001D36]/60 font-semibold mt-0.5">
                        {count} {count === 1 ? 'piece' : 'pieces'}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          </section>

          {/* ========================================================= */}
          {/* 4. QUIET EDITORIAL STATEMENT                               */}
          {/* ========================================================= */}
          <section
            aria-label="Editorial Craft Manifesto"
            className="py-6 sm:py-8 px-4 sm:px-6 rounded-2xl bg-white/50 border border-[#001D36]/8 text-center flex items-center justify-center"
          >
            <p className="font-display text-base sm:text-lg md:text-xl font-semibold text-[#001D36] leading-relaxed max-w-2xl">
              Made by hand
              <img
                src={catPotteryJpg}
                alt=""
                role="presentation"
                className="w-7 h-7 sm:w-8 sm:h-8 rounded-full inline-block object-cover mx-1.5 align-middle border border-white shadow-xs"
              />
              rooted in place,
              <img
                src={craftStoryLoomJpg}
                alt=""
                role="presentation"
                className="w-7 h-7 sm:w-8 sm:h-8 rounded-full inline-block object-cover mx-1.5 align-middle border border-white shadow-xs"
              />
              shared with honest intent.
              <img
                src={catWoodcraftJpg}
                alt=""
                role="presentation"
                className="w-7 h-7 sm:w-8 sm:h-8 rounded-full inline-block object-cover mx-1.5 align-middle border border-white shadow-xs"
              />
            </p>
          </section>

          {/* ========================================================= */}
          {/* 5. FEATURED CRAFTSMANSHIP SPOTLIGHT                        */}
          {/* ========================================================= */}
          <section aria-label="Featured Craftsmanship" className="flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-xs font-bold text-[#A13F1C] tracking-wider uppercase">Spotlight</span>
                <h2 className="font-display text-xl sm:text-2xl font-bold text-[#001D36] tracking-tight">
                  Featured craftsmanship
                </h2>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-12 rounded-3xl bg-white/90 border border-[#001D36]/10 overflow-hidden shadow-xs">
              {/* Left Large Featured Image */}
              <div className="md:col-span-7 relative min-h-[320px] sm:min-h-[380px] bg-[#FFF9EF] overflow-hidden">
                <img
                  src={craftStoryLoomJpg}
                  alt={featuredProduct.title}
                  className="w-full h-full object-cover"
                  loading="lazy"
                />
                <div className="absolute top-3.5 left-3.5 flex items-center gap-2">
                  <span className="px-3 py-1 rounded-full bg-[#001D36]/85 backdrop-blur-xs text-white text-xs font-bold flex items-center gap-1.5 shadow-xs">
                    <QrCode className="w-3.5 h-3.5 text-[#FFB955]" />
                    <span>Craft Passport Verified</span>
                  </span>
                </div>
              </div>

              {/* Right Concise Story & Spec Panel */}
              <div className="md:col-span-5 p-6 sm:p-8 flex flex-col justify-between gap-6">
                <div className="flex flex-col gap-2.5">
                  <div className="flex items-center gap-2 text-xs font-semibold text-[#A13F1C]">
                    <span>{featuredProduct.craft}</span>
                    <span>&bull;</span>
                    <span className="text-[#001D36]/70">{featuredProduct.state}</span>
                  </div>

                  <h3 className="font-display text-xl sm:text-2xl font-bold text-[#001D36] tracking-tight leading-snug">
                    {featuredProduct.title}
                  </h3>

                  <p className="text-xs sm:text-sm text-[#001D36]/80 leading-relaxed">
                    {featuredProduct.story}
                  </p>

                  <div className="pt-3 border-t border-[#001D36]/8 flex flex-col gap-2 text-xs">
                    <div className="flex items-center justify-between text-[#001D36]/70">
                      <span className="font-medium">Maker:</span>
                      <span className="font-bold text-[#001D36]">{featuredProduct.artisanName}</span>
                    </div>
                    <div className="flex items-center justify-between text-[#001D36]/70">
                      <span className="font-medium">Collective:</span>
                      <span className="font-semibold text-[#001D36]">{featuredProduct.artisanGroup}</span>
                    </div>
                    <div className="flex items-center justify-between text-[#001D36]/70">
                      <span className="font-medium">Materials:</span>
                      <span className="font-semibold text-[#001D36] text-right">{featuredProduct.materials.slice(0, 2).join(', ')}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between gap-4 pt-4 border-t border-[#001D36]/8">
                  <div className="flex flex-col">
                    <span className="text-[10px] text-[#001D36]/60 font-semibold uppercase tracking-wider">Direct Maker Price</span>
                    <span className="font-display text-xl font-bold text-[#001D36]">₹{featuredProduct.price.toLocaleString('en-IN')}</span>
                  </div>

                  <button
                    type="button"
                    onClick={() => setSelectedProductForModal(featuredProduct)}
                    className="px-4 py-2.5 rounded-xl bg-[#001D36] hover:bg-[#082949] text-white font-bold text-xs flex items-center gap-1.5 transition-all shadow-xs touch-target"
                  >
                    <span>View craft</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          </section>

          {/* ========================================================= */}
          {/* 6. SELECTED HANDMADE PIECES (PRODUCT GRID)                 */}
          {/* ========================================================= */}
          <section ref={collectionRef} aria-label="Selected handmade pieces" className="flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="font-display text-xl sm:text-2xl font-bold text-[#001D36] tracking-tight">
                  Selected handmade pieces
                </h2>
                <p className="text-xs sm:text-sm text-[#001D36]/70 font-medium">
                  Showing {filteredProducts.length} {filteredProducts.length === 1 ? 'craft item' : 'craft items'}
                </p>
              </div>
            </div>

            {/* Zero State */}
            {filteredProducts.length === 0 ? (
              <div className="py-16 px-4 rounded-3xl bg-white/70 border border-[#001D36]/10 text-center flex flex-col items-center gap-3">
                <p className="font-display text-lg font-bold text-[#001D36]">
                  No handmade pieces match these filters yet.
                </p>
                <p className="text-xs sm:text-sm text-[#001D36]/70 max-w-md">
                  Try adjusting your search terms or clearing selected category and state filters.
                </p>
                <button
                  type="button"
                  onClick={resetFilters}
                  className="mt-2 px-5 py-2.5 rounded-full bg-[#A13F1C] text-white font-bold text-xs shadow-xs touch-target hover:bg-[#8A2E10] transition-colors"
                >
                  Clear filters
                </button>
              </div>
            ) : (
              <>
                {/* 3-4 Column Product Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
                  {filteredProducts.slice(0, visibleCount).map((product) => (
                    <div
                      key={product.id}
                      onClick={() => setSelectedProductForModal(product)}
                      className="group flex flex-col rounded-2xl bg-white/85 hover:bg-white border border-[#001D36]/10 hover:border-[#001D36]/25 transition-all duration-200 overflow-hidden shadow-2xs hover:shadow-xs cursor-pointer"
                    >
                      {/* Product Image (4:5 Aspect Ratio) */}
                      <div className="relative aspect-[4/5] bg-[#FFF9EF] overflow-hidden">
                        <img
                          src={product.photos[0]}
                          alt={product.title}
                          className="w-full h-full object-cover group-hover:scale-[1.02] transition-transform duration-300"
                          loading="lazy"
                        />
                        {/* Craft Passport chip */}
                        {product.hasCraftPassport && (
                          <div className="absolute top-2.5 left-2.5">
                            <span className="px-2 py-0.5 rounded-md bg-[#001D36]/80 backdrop-blur-2xs text-white text-[10px] font-bold flex items-center gap-1">
                              <QrCode className="w-3 h-3 text-[#FFB955]" />
                              <span>Passport</span>
                            </span>
                          </div>
                        )}
                        {/* Availability Pill */}
                        <div className="absolute top-2.5 right-2.5">
                          <span
                            className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${
                              product.availability === 'in_stock'
                                ? 'bg-[#001D36]/10 text-[#001D36] border border-[#001D36]/15'
                                : 'bg-[#A13F1C]/10 text-[#A13F1C] border border-[#A13F1C]/15'
                            }`}
                          >
                            {product.availability === 'in_stock' ? 'In Stock' : 'Made to Order'}
                          </span>
                        </div>
                      </div>

                      {/* Card Content */}
                      <div className="p-3.5 flex flex-col justify-between flex-1 gap-2.5">
                        <div className="flex flex-col gap-1">
                          <div className="flex items-center gap-1.5 text-[11px] font-semibold text-[#A13F1C]">
                            <span>{product.craft}</span>
                            <span>&bull;</span>
                            <span className="text-[#001D36]/60">{product.state}</span>
                          </div>

                          <h3 className="font-display text-sm font-bold text-[#001D36] group-hover:text-[#A13F1C] transition-colors line-clamp-2 leading-snug">
                            {product.title}
                          </h3>

                          <p className="text-[11px] text-[#001D36]/65 line-clamp-1">
                            By {product.artisanName} {product.artisanGroup ? `(${product.artisanGroup})` : ''}
                          </p>
                        </div>

                        <div className="flex items-center justify-between pt-2 border-t border-[#001D36]/8">
                          <span className="font-display text-sm font-bold text-[#001D36]">
                            ₹{product.price.toLocaleString('en-IN')}
                          </span>

                          <span className="text-[11px] font-bold text-[#A13F1C] group-hover:translate-x-0.5 transition-transform flex items-center gap-0.5">
                            <span>View</span>
                            <ChevronRight className="w-3.5 h-3.5" />
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Show More Action */}
                {visibleCount < filteredProducts.length && (
                  <div className="flex justify-center pt-4">
                    <button
                      type="button"
                      onClick={() => setVisibleCount((prev) => prev + 4)}
                      className="px-6 py-2.5 rounded-full bg-white hover:bg-[#FFF9EF] border border-[#001D36]/15 text-[#001D36] font-bold text-xs shadow-2xs touch-target transition-all"
                    >
                      Show more ({filteredProducts.length - visibleCount} remaining)
                    </button>
                  </div>
                )}
              </>
            )}
          </section>

          {/* ========================================================= */}
          {/* 7. CRAFT STORY SECTION ("The story behind each piece")     */}
          {/* ========================================================= */}
          <section
            aria-label="Craft Story"
            className="grid grid-cols-1 md:grid-cols-12 rounded-3xl bg-white/70 border border-[#001D36]/10 overflow-hidden shadow-xs"
          >
            <div className="md:col-span-6 relative min-h-[280px] sm:min-h-[340px] bg-[#FFF9EF]">
              <img
                src={craftStoryLoomJpg}
                alt="Artisan handloom weaving in traditional workshop"
                className="w-full h-full object-cover"
                loading="lazy"
              />
            </div>

            <div className="md:col-span-6 p-6 sm:p-10 flex flex-col justify-center gap-4">
              <span className="text-xs font-bold text-[#A13F1C] tracking-wider uppercase">Artisan Provenance</span>
              <h2 className="font-display text-2xl sm:text-3xl font-bold text-[#001D36] tracking-tight leading-snug">
                The story behind each piece
              </h2>
              <p className="text-xs sm:text-sm text-[#001D36]/80 leading-relaxed">
                Handmade craft carries the subtle marks of natural materials, seasonal weather, and generations of lineage knowledge. Every piece on KarigarSaathi includes direct artisan attribution, verified provenance, and honest pricing set by makers.
              </p>
              <div className="pt-2">
                <Link
                  to="/about"
                  className="inline-flex items-center gap-1.5 text-xs font-bold text-[#001D36] hover:text-[#A13F1C] transition-colors"
                >
                  <span>Learn about artisan control & ethics</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>
          </section>

          {/* ========================================================= */}
          {/* 8. REGIONAL DISCOVERY ("Explore crafts across India")       */}
          {/* ========================================================= */}
          <section
            aria-label="Regional Discovery"
            className="relative rounded-3xl overflow-hidden p-6 sm:p-10 border border-[#001D36]/12 bg-[#001D36] text-white flex flex-col md:flex-row items-center justify-between gap-6"
          >
            <div className="relative z-10 max-w-lg flex flex-col gap-2">
              <span className="text-xs font-bold text-[#FFB955] tracking-wider uppercase">Geography of Craft</span>
              <h2 className="font-display text-2xl sm:text-3xl font-bold text-white tracking-tight">
                Explore crafts across India
              </h2>
              <p className="text-xs sm:text-sm text-white/80 leading-relaxed font-medium">
                Discover 36 state traditions, GI-tagged lineages, and verified artisan clusters on the interactive craft map.
              </p>
            </div>

            <div className="relative z-10 shrink-0">
              <Link
                to="/#craft-map"
                className="px-5 py-3 rounded-full bg-[#FFF9EF] hover:bg-white text-[#001D36] font-bold text-xs sm:text-sm shadow-md transition-all flex items-center gap-2 touch-target"
              >
                <span>View Interactive Craft Map</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>

            {/* Background Map Atmosphere Layer */}
            <div className="absolute inset-0 z-0 opacity-20 pointer-events-none">
              <img
                src={craftMapAtmospherePng}
                alt=""
                role="presentation"
                className="w-full h-full object-cover"
              />
            </div>
          </section>

          {/* ========================================================= */}
          {/* 9. REVIEW PREVIEW ("What buyers are saying")               */}
          {/* ========================================================= */}
          <section aria-label="What buyers are saying" className="flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-xs font-bold text-[#A13F1C] tracking-wider uppercase">Community Stories</span>
                <h2 className="font-display text-xl sm:text-2xl font-bold text-[#001D36] tracking-tight">
                  What buyers are saying
                </h2>
              </div>

              <Link
                to="/reviews"
                className="text-xs font-bold text-[#001D36] hover:text-[#A13F1C] flex items-center gap-1 transition-colors touch-target"
              >
                <span>Read all reviews</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {BUYER_REVIEWS.slice(0, 3).map((review) => (
                <div
                  key={review.id}
                  className="p-5 rounded-2xl bg-white/80 border border-[#001D36]/10 flex flex-col justify-between gap-3 shadow-2xs"
                >
                  <div className="flex flex-col gap-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1">
                        {[...Array(5)].map((_, i) => (
                          <Star
                            key={i}
                            className={`w-3.5 h-3.5 ${
                              i < review.rating ? 'fill-[#A13F1C] text-[#A13F1C]' : 'text-[#001D36]/20'
                            }`}
                          />
                        ))}
                      </div>
                      {review.isVerifiedBuyer && (
                        <span className="text-[10px] text-[#001D36]/70 font-semibold flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3 text-[#A13F1C]" />
                          <span>Verified</span>
                        </span>
                      )}
                    </div>

                    <p className="text-xs text-[#001D36]/85 italic leading-relaxed">
                      &ldquo;{review.reviewText}&rdquo;
                    </p>
                  </div>

                  <div className="pt-2 border-t border-[#001D36]/8 flex flex-col">
                    <span className="text-xs font-bold text-[#001D36]">{review.reviewerName}</span>
                    <span className="text-[10px] text-[#001D36]/60 font-semibold">{review.productTitle}</span>
                  </div>
                </div>
              ))}
            </div>
          </section>
        </div>
      </div>

      {/* ========================================================= */}
      {/* PRODUCT DETAIL MODAL & ENQUIRY WORKFLOW                   */}
      {/* ========================================================= */}
      {selectedProductForModal && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="modal-product-title"
          className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150"
        >
          <div
            className="relative w-full max-w-2xl bg-[#FFF9EF] rounded-3xl border border-[#001D36]/15 shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-150"
          >
            {/* Header / Close */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-[#001D36]/10 bg-white/70">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-[#A13F1C]">{selectedProductForModal.craft}</span>
                <span className="text-[#001D36]/40">&bull;</span>
                <span className="text-xs text-[#001D36]/70 font-medium">{selectedProductForModal.state}</span>
              </div>

              <button
                type="button"
                onClick={() => setSelectedProductForModal(null)}
                className="w-8 h-8 rounded-full flex items-center justify-center text-[#001D36]/70 hover:text-[#001D36] hover:bg-[#001D36]/5 transition-colors touch-target"
                aria-label="Close product details"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto flex flex-col gap-5">
              <div className="aspect-[16/9] w-full rounded-2xl bg-white border border-[#001D36]/10 overflow-hidden">
                <img
                  src={selectedProductForModal.photos[0]}
                  alt={selectedProductForModal.title}
                  className="w-full h-full object-cover"
                />
              </div>

              <div className="flex flex-col gap-2">
                <h2 id="modal-product-title" className="font-display text-xl sm:text-2xl font-bold text-[#001D36]">
                  {selectedProductForModal.title}
                </h2>

                <p className="text-xs sm:text-sm text-[#001D36]/80 leading-relaxed">
                  {selectedProductForModal.story}
                </p>
              </div>

              {/* Specs Grid */}
              <div className="grid grid-cols-2 gap-3 p-3.5 rounded-2xl bg-white/70 border border-[#001D36]/8 text-xs">
                <div>
                  <span className="text-[#001D36]/60 font-medium">Artisan Maker</span>
                  <p className="font-bold text-[#001D36]">{selectedProductForModal.artisanName}</p>
                </div>
                <div>
                  <span className="text-[#001D36]/60 font-medium">Guild / Collective</span>
                  <p className="font-semibold text-[#001D36]">{selectedProductForModal.artisanGroup || 'Independent'}</p>
                </div>
                <div>
                  <span className="text-[#001D36]/60 font-medium">Dimensions</span>
                  <p className="font-semibold text-[#001D36]">{selectedProductForModal.dimensions}</p>
                </div>
                <div>
                  <span className="text-[#001D36]/60 font-medium">Materials</span>
                  <p className="font-semibold text-[#001D36]">{selectedProductForModal.materials.join(', ')}</p>
                </div>
              </div>

              {/* Craft Passport notice */}
              {selectedProductForModal.hasCraftPassport && (
                <div className="p-3 rounded-xl bg-[#001D36]/5 border border-[#001D36]/10 flex items-center justify-between gap-3 text-xs">
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-[#A13F1C]" />
                    <span className="font-semibold text-[#001D36]">Digitally Verified Craft Passport</span>
                  </div>
                  <span className="font-mono text-[10px] text-[#001D36]/70">{selectedProductForModal.passportId}</span>
                </div>
              )}
            </div>

            {/* Footer Action */}
            <div className="p-4 sm:p-6 border-t border-[#001D36]/10 bg-white/80 flex items-center justify-between gap-4">
              <div className="flex flex-col">
                <span className="text-[10px] text-[#001D36]/60 font-bold uppercase tracking-wider">Direct Price</span>
                <span className="font-display text-xl font-bold text-[#001D36]">
                  ₹{selectedProductForModal.price.toLocaleString('en-IN')}
                </span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleSendEnquiry(selectedProductForModal)}
                  className="px-5 py-2.5 rounded-xl bg-[#A13F1C] hover:bg-[#8A2E10] text-white font-bold text-xs flex items-center gap-1.5 shadow-xs touch-target transition-colors"
                >
                  {enquirySentProduct === selectedProductForModal.id ? (
                    <>
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Enquiry Sent!</span>
                    </>
                  ) : (
                    <>
                      <MessageSquare className="w-4 h-4" />
                      <span>Send buyer enquiry</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MOBILE FILTER DRAWER                                       */}
      {/* ========================================================= */}
      {isMobileFilterOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Filter Options"
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 backdrop-blur-xs md:hidden animate-in fade-in duration-150"
        >
          <div className="w-full bg-[#FFF9EF] rounded-t-3xl border-t border-[#001D36]/15 p-6 flex flex-col gap-4 max-h-[85vh] overflow-y-auto animate-in slide-in-from-bottom duration-200 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-[#001D36]/10">
              <h2 className="font-display text-lg font-bold text-[#001D36]">Filter Crafts</h2>
              <button
                type="button"
                onClick={() => setIsMobileFilterOpen(false)}
                className="p-1 text-[#001D36]/70 hover:text-[#001D36]"
                aria-label="Close filters"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex flex-col gap-3">
              <label className="text-xs font-bold text-[#001D36]">Category</label>
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="px-3 py-2.5 bg-white border border-[#001D36]/15 rounded-xl text-xs font-semibold text-[#001D36]"
              >
                <option value="all">All Categories</option>
                <option value="Handloom Textiles">Handloom Textiles</option>
                <option value="Pottery & Ceramics">Pottery & Ceramics</option>
                <option value="Woodcraft">Woodcraft</option>
                <option value="Metalwork">Metalwork</option>
                <option value="Painting & Folk Art">Painting & Folk Art</option>
                <option value="Cane & Basketry">Cane & Basketry</option>
              </select>
            </div>

            <div className="flex flex-col gap-3">
              <label className="text-xs font-bold text-[#001D36]">State / Region</label>
              <select
                value={selectedState}
                onChange={(e) => setSelectedState(e.target.value)}
                className="px-3 py-2.5 bg-white border border-[#001D36]/15 rounded-xl text-xs font-semibold text-[#001D36]"
              >
                <option value="all">All States</option>
                {states
                  .filter((s) => s !== 'all')
                  .map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
              </select>
            </div>

            <div className="pt-4 border-t border-[#001D36]/10 flex items-center gap-3">
              <button
                type="button"
                onClick={() => {
                  resetFilters();
                  setIsMobileFilterOpen(false);
                }}
                className="flex-1 py-3 rounded-xl border border-[#001D36]/20 font-bold text-xs text-[#001D36]"
              >
                Reset
              </button>
              <button
                type="button"
                onClick={() => setIsMobileFilterOpen(false)}
                className="flex-1 py-3 rounded-xl bg-[#001D36] text-white font-bold text-xs shadow-xs"
              >
                Apply ({filteredProducts.length})
              </button>
            </div>
          </div>
        </div>
      )}
    </PublicLayout>
  );
};
