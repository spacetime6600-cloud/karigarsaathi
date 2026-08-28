import React, { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { PublicLayout } from '@/components/layout/PublicLayout';
import { BUYER_REVIEWS } from '@/data/reviewsData';
import {
  Star,
  CheckCircle2,
  ThumbsUp,
  SlidersHorizontal,
  ArrowUpDown,
  ShoppingBag,
  ShieldCheck,
  Sparkles,
} from 'lucide-react';
import workshopLightPng from '@/assets/ecosystem/craft-workshop-light.png';

interface ReviewMetrics {
  avgRating: string;
  totalReviews: number;
  distribution: Record<number, number>;
  qualityAvg: string;
  authenticityAvg: string;
  communicationAvg: string;
}

export const ReviewsPage: React.FC = () => {
  const [selectedRatingFilter, setSelectedRatingFilter] = useState<number | 'all'>('all');
  const [selectedCraftFilter, setSelectedCraftFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'recent' | 'helpful' | 'highest'>('recent');
  const [helpfulVotes, setHelpfulVotes] = useState<Record<string, number>>({});

  // Dynamic summary calculations directly from actual dataset
  const metrics: ReviewMetrics = useMemo(() => {
    const total = BUYER_REVIEWS.length;
    if (total === 0) {
      return {
        avgRating: '0.0',
        totalReviews: 0,
        distribution: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 },
        qualityAvg: '0.0',
        authenticityAvg: '0.0',
        communicationAvg: '0.0',
      };
    }

    const sumRating = BUYER_REVIEWS.reduce((acc, r) => acc + r.rating, 0);
    const sumQuality = BUYER_REVIEWS.reduce((acc, r) => acc + r.ratingsBreakdown.productQuality, 0);
    const sumAuthenticity = BUYER_REVIEWS.reduce((acc, r) => acc + r.ratingsBreakdown.craftAuthenticity, 0);
    const sumCommunication = BUYER_REVIEWS.reduce((acc, r) => acc + r.ratingsBreakdown.communication, 0);

    const dist: Record<number, number> = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
    BUYER_REVIEWS.forEach((r) => {
      dist[r.rating] = (dist[r.rating] || 0) + 1;
    });

    return {
      avgRating: (sumRating / total).toFixed(1),
      totalReviews: total,
      distribution: dist,
      qualityAvg: (sumQuality / total).toFixed(1),
      authenticityAvg: (sumAuthenticity / total).toFixed(1),
      communicationAvg: (sumCommunication / total).toFixed(1),
    };
  }, []);

  // Unique crafts list for filter
  const craftList = useMemo(() => {
    const set = new Set(BUYER_REVIEWS.map((r) => r.craft));
    return ['all', ...Array.from(set)];
  }, []);

  // Filtered reviews
  const filteredReviews = useMemo(() => {
    return BUYER_REVIEWS.filter((r) => {
      if (selectedRatingFilter !== 'all' && r.rating !== selectedRatingFilter) {
        return false;
      }
      if (selectedCraftFilter !== 'all' && r.craft !== selectedCraftFilter) {
        return false;
      }
      return true;
    }).sort((a, b) => {
      const aHelpful = a.helpfulCount + (helpfulVotes[a.id] || 0);
      const bHelpful = b.helpfulCount + (helpfulVotes[b.id] || 0);

      if (sortBy === 'helpful') return bHelpful - aHelpful;
      if (sortBy === 'highest') return b.rating - a.rating;
      return new Date(b.date).getTime() - new Date(a.date).getTime();
    });
  }, [selectedRatingFilter, selectedCraftFilter, sortBy, helpfulVotes]);

  const handleVoteHelpful = (id: string) => {
    setHelpfulVotes((prev) => ({
      ...prev,
      [id]: (prev[id] || 0) + 1,
    }));
  };

  return (
    <PublicLayout>
      {/* Background Atmosphere */}
      <div className="absolute inset-0 z-0 pointer-events-none select-none overflow-hidden" aria-hidden="true">
        <img
          src={workshopLightPng}
          alt=""
          role="presentation"
          loading="lazy"
          decoding="async"
          className="w-full h-[1200px] object-cover opacity-12"
        />
        <div
          className="absolute inset-0"
          style={{
            background:
              'linear-gradient(180deg, rgba(255, 249, 239, 0.7) 0%, rgba(255, 249, 239, 0.95) 400px, #FFF9EF 800px)',
          }}
        />
      </div>

      <div className="max-w-[1140px] w-full mx-auto px-4 sm:px-8 lg:px-12 py-8 sm:py-12 flex flex-col gap-10 sm:gap-14 relative z-10">
        {/* ========================================================= */}
        {/* PAGE INTRODUCTION                                         */}
        {/* ========================================================= */}
        <section aria-label="Reviews Introduction" className="flex flex-col gap-2 max-w-2xl">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-secondary/10 border border-secondary/20 text-secondary text-xs font-bold w-fit shadow-xs">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Community Experiences</span>
          </div>

          <h1 className="font-display text-3xl sm:text-4xl font-bold text-primary tracking-tight">
            Stories from buyers and craft communities.
          </h1>

          <p className="text-sm sm:text-base text-on-surface-variant leading-relaxed">
            Read verified experiences with handmade products, artisan communication and craft authenticity.
          </p>
        </section>

        {/* ========================================================= */}
        {/* RATING SUMMARY DASHBOARD                                  */}
        {/* ========================================================= */}
        <section aria-label="Summary Ratings" className="bg-white/90 backdrop-blur-xs rounded-3xl p-6 sm:p-8 border border-[#001D36]/10 shadow-xs flex flex-col lg:flex-row items-center gap-8 lg:gap-12">
          {/* Overall Score */}
          <div className="flex flex-col items-center sm:items-start gap-2 shrink-0 text-center sm:text-left">
            <div className="flex items-baseline gap-2">
              <span className="font-display text-5xl sm:text-6xl font-bold text-primary">
                {metrics.avgRating}
              </span>
              <span className="text-base text-on-surface-variant font-medium">/ 5.0</span>
            </div>

            <div className="flex items-center gap-1 text-secondary">
              {[1, 2, 3, 4, 5].map((s) => (
                <Star key={s} className="w-5 h-5 fill-secondary text-secondary" />
              ))}
            </div>

            <span className="text-xs font-semibold text-on-surface-variant">
              Based on {metrics.totalReviews} verified experiences
            </span>
          </div>

          {/* Detailed Aspect Averages */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 w-full flex-1 border-y lg:border-y-0 lg:border-x border-[#001D36]/10 py-4 lg:py-0 lg:px-8">
            <div className="flex flex-col gap-1 bg-[#FFF9EF]/80 p-3.5 rounded-2xl border border-[#001D36]/8">
              <span className="text-[11px] font-bold text-on-surface-variant uppercase">Product Quality</span>
              <span className="font-bold text-xl text-primary">{metrics.qualityAvg} ★</span>
              <span className="text-[10px] text-on-surface-variant/80">Handmade integrity & materials</span>
            </div>

            <div className="flex flex-col gap-1 bg-[#FFF9EF]/80 p-3.5 rounded-2xl border border-[#001D36]/8">
              <span className="text-[11px] font-bold text-on-surface-variant uppercase">Authenticity</span>
              <span className="font-bold text-xl text-primary">{metrics.authenticityAvg} ★</span>
              <span className="text-[10px] text-on-surface-variant/80">Verified craft provenance</span>
            </div>

            <div className="flex flex-col gap-1 bg-[#FFF9EF]/80 p-3.5 rounded-2xl border border-[#001D36]/8">
              <span className="text-[11px] font-bold text-on-surface-variant uppercase">Communication</span>
              <span className="font-bold text-xl text-primary">{metrics.communicationAvg} ★</span>
              <span className="text-[10px] text-on-surface-variant/80">Direct maker responsiveness</span>
            </div>
          </div>

          {/* Distribution Bars */}
          <div className="flex flex-col gap-1.5 w-full lg:w-48 shrink-0 text-xs">
            {[5, 4, 3, 2, 1].map((stars) => {
              const count = metrics.distribution[stars] || 0;
              const percent = metrics.totalReviews ? (count / metrics.totalReviews) * 100 : 0;
              return (
                <div key={stars} className="flex items-center gap-2">
                  <span className="w-5 font-semibold text-primary">{stars}★</span>
                  <div className="flex-1 h-2 bg-surface-container rounded-full overflow-hidden">
                    <div
                      className="h-full bg-secondary rounded-full"
                      style={{ width: `${percent}%` }}
                    />
                  </div>
                  <span className="w-5 text-right text-on-surface-variant">{count}</span>
                </div>
              );
            })}
          </div>
        </section>

        {/* ========================================================= */}
        {/* REVIEWS FILTER & SORT BAR                                 */}
        {/* ========================================================= */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3.5 bg-white/80 backdrop-blur-xs p-3 rounded-2xl border border-[#001D36]/10 shadow-2xs">
          <div className="flex items-center gap-2 flex-wrap">
            {/* Rating Filter */}
            <div className="flex items-center gap-1.5 text-xs font-semibold text-primary bg-[#FFF9EF] border border-[#001D36]/15 rounded-xl px-3 py-1.5 shadow-2xs">
              <SlidersHorizontal className="w-3.5 h-3.5 text-secondary shrink-0" />
              <select
                value={selectedRatingFilter}
                onChange={(e) => setSelectedRatingFilter(e.target.value === 'all' ? 'all' : Number(e.target.value))}
                aria-label="Filter by star rating"
                className="bg-transparent focus:outline-none cursor-pointer font-semibold"
              >
                <option value="all">All Ratings</option>
                <option value="5">5 Stars Only</option>
                <option value="4">4 Stars Only</option>
              </select>
            </div>

            {/* Craft Tradition Filter */}
            <div className="flex items-center gap-1.5 text-xs font-semibold text-primary bg-[#FFF9EF] border border-[#001D36]/15 rounded-xl px-3 py-1.5 shadow-2xs">
              <select
                value={selectedCraftFilter}
                onChange={(e) => setSelectedCraftFilter(e.target.value)}
                aria-label="Filter by craft tradition"
                className="bg-transparent focus:outline-none cursor-pointer font-semibold"
              >
                <option value="all">All Crafts</option>
                {craftList.filter((c) => c !== 'all').map((craft) => (
                  <option key={craft} value={craft}>
                    {craft}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Sort By */}
          <div className="flex items-center gap-1.5 text-xs font-semibold text-primary bg-[#FFF9EF] border border-[#001D36]/15 rounded-xl px-3 py-1.5 shadow-2xs self-end sm:self-auto">
            <ArrowUpDown className="w-3.5 h-3.5 text-secondary shrink-0" />
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as 'recent' | 'helpful' | 'highest')}
              aria-label="Sort reviews"
              className="bg-transparent focus:outline-none cursor-pointer font-semibold"
            >
              <option value="recent">Most Recent</option>
              <option value="helpful">Most Helpful</option>
              <option value="highest">Highest Rating</option>
            </select>
          </div>
        </div>

        {/* ========================================================= */}
        {/* REVIEWS CARDS LIST                                        */}
        {/* ========================================================= */}
        <section aria-label="Customer Reviews List" className="flex flex-col gap-5">
          {filteredReviews.length === 0 ? (
            <div className="bg-white/80 rounded-3xl p-10 text-center flex flex-col items-center gap-3 border border-[#001D36]/10">
              <Star className="w-8 h-8 text-secondary/50" />
              <h3 className="font-bold text-base text-primary">No reviews matched your filters</h3>
              <p className="text-xs text-on-surface-variant">Try selecting "All Ratings" or "All Crafts".</p>
            </div>
          ) : (
            filteredReviews.map((rev) => {
              const currentHelpful = rev.helpfulCount + (helpfulVotes[rev.id] || 0);
              const hasVoted = Boolean(helpfulVotes[rev.id]);

              return (
                <div
                  key={rev.id}
                  className="bg-white/90 backdrop-blur-xs rounded-3xl p-5 sm:p-7 border border-[#001D36]/10 shadow-xs flex flex-col gap-4"
                >
                  {/* Header: Reviewer & Stars */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#001D36]/8 pb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-secondary/10 text-secondary font-bold text-sm flex items-center justify-center shrink-0">
                        {rev.reviewerName.charAt(0)}
                      </div>

                      <div className="flex flex-col">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-sm text-primary">{rev.reviewerName}</span>
                          {rev.isVerifiedBuyer && (
                            <span className="inline-flex items-center gap-1 text-[10px] font-bold text-[#2E7D32] bg-[#E8F5E9] px-2 py-0.5 rounded-full">
                              <CheckCircle2 className="w-3 h-3" />
                              <span>Verified Buyer</span>
                            </span>
                          )}
                        </div>
                        <span className="text-[11px] text-on-surface-variant font-normal">
                          {rev.reviewerLocation} • {rev.date}
                        </span>
                      </div>
                    </div>

                    {/* Star Rating */}
                    <div className="flex items-center gap-1 text-secondary">
                      {[1, 2, 3, 4, 5].map((s) => (
                        <Star
                          key={s}
                          className={`w-4 h-4 ${
                            s <= rev.rating ? 'fill-secondary text-secondary' : 'text-surface-variant'
                          }`}
                        />
                      ))}
                    </div>
                  </div>

                  {/* Product Mini Banner */}
                  <div className="flex items-center gap-3 bg-[#FFF9EF] p-2.5 rounded-xl border border-[#001D36]/8 w-fit max-w-full">
                    <img
                      src={rev.productImage}
                      alt=""
                      className="w-10 h-10 rounded-lg object-cover shrink-0"
                    />
                    <div className="flex flex-col min-w-0 pr-2">
                      <span className="text-xs font-bold text-primary truncate">{rev.productTitle}</span>
                      <span className="text-[10px] text-secondary font-medium">{rev.craft} • {rev.state}</span>
                    </div>
                  </div>

                  {/* Review Text */}
                  <p className="text-xs sm:text-sm text-on-surface-variant leading-relaxed font-normal">
                    "{rev.reviewText}"
                  </p>

                  {/* Helpful Button */}
                  <div className="flex items-center justify-between pt-2">
                    <span className="text-[11px] text-on-surface-variant font-medium">
                      Was this review helpful?
                    </span>

                    <button
                      type="button"
                      onClick={() => handleVoteHelpful(rev.id)}
                      disabled={hasVoted}
                      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition-colors touch-target ${
                        hasVoted
                          ? 'bg-secondary/15 text-secondary cursor-default'
                          : 'bg-surface-container hover:bg-surface-container-high text-primary'
                      }`}
                    >
                      <ThumbsUp className="w-3.5 h-3.5" />
                      <span>Helpful ({currentHelpful})</span>
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </section>

        {/* ========================================================= */}
        {/* REVIEW SUBMISSION POLICY & DIRECT SHORTCUTS               */}
        {/* ========================================================= */}
        <section aria-label="Review Submission Policy" className="bg-white/80 rounded-3xl p-6 sm:p-8 border border-[#001D36]/10 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="flex items-start gap-3.5 max-w-xl text-left">
            <ShieldCheck className="w-6 h-6 text-secondary shrink-0 mt-1" />
            <div className="flex flex-col gap-1">
              <h3 className="font-bold text-sm sm:text-base text-primary">Verified Buyer Feedback Policy</h3>
              <p className="text-xs text-on-surface-variant leading-relaxed">
                To maintain genuine artisan feedback and fair craft appreciation, review submissions are exclusively open to verified buyers with confirmed orders.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <Link
              to="/marketplace"
              className="flex items-center gap-1.5 px-5 py-2.5 rounded-full bg-secondary text-white font-bold text-xs shadow-xs touch-target"
            >
              <ShoppingBag className="w-3.5 h-3.5" />
              <span>Explore Marketplace</span>
            </Link>
          </div>
        </section>
      </div>
    </PublicLayout>
  );
};
