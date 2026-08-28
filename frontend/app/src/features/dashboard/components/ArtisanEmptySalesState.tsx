import React from 'react';
import { Link } from 'react-router-dom';
import { Sparkles, MessageSquare, Plus } from 'lucide-react';

export interface ArtisanEmptySalesStateProps {
  onAddProduct: () => void;
}

export const ArtisanEmptySalesState: React.FC<ArtisanEmptySalesStateProps> = ({ onAddProduct }) => {
  return (
    <div className="w-full bg-white/95 rounded-2xl border border-surface-variant/80 p-6 sm:p-8 shadow-xs flex flex-col md:flex-row items-center justify-between gap-6">
      <div className="flex flex-col gap-2 max-w-xl text-center md:text-left">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-secondary/10 text-secondary text-xs font-bold w-fit mx-auto md:mx-0">
          <Sparkles className="w-3.5 h-3.5" />
          <span>Your sales insights will appear here</span>
        </div>

        <h2 className="text-lg sm:text-xl font-bold text-primary tracking-tight">
          Start recording confirmed craft sales
        </h2>

        <p className="text-xs sm:text-sm text-on-surface-variant leading-relaxed font-normal">
          When buyers respond to your verified Craft Passports and confirm orders through direct enquiries or marketplace exports, sales trends, regional distribution and price comparisons will automatically populate here.
        </p>
      </div>

      <div className="flex flex-col sm:flex-row items-center gap-3 shrink-0">
        <Link
          to="/artisan/enquiries"
          className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-surface hover:bg-surface-container border border-surface-variant/80 text-primary text-xs font-bold flex items-center justify-center gap-2 transition-colors touch-target focus:outline-none focus-visible:ring-2 focus-visible:ring-[#FFB955]"
        >
          <MessageSquare className="w-4 h-4 text-secondary" />
          <span>Check enquiries</span>
        </Link>

        <button
          type="button"
          onClick={onAddProduct}
          className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-secondary hover:bg-secondary-hover text-white text-xs font-bold flex items-center justify-center gap-2 shadow-xs transition-colors touch-target focus:outline-none focus-visible:ring-2 focus-visible:ring-[#FFB955]"
        >
          <Plus className="w-4 h-4" />
          <span>Add product</span>
        </button>
      </div>
    </div>
  );
};
