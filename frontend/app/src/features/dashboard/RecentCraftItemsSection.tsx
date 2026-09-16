import React from 'react';
import { Link } from 'react-router-dom';
import { ProductDraft } from '@/types';
import { QrCode, MapPin } from 'lucide-react';
import { clsx } from 'clsx';
import { ROUTES } from '@/routes';
import { resolveProductCoverUrl, handleImageFallback } from '@/services/media/imageUrlResolver';

export interface RecentCraftItemsSectionProps {
  products: ProductDraft[];
  className?: string;
}

export const RecentCraftItemsSection: React.FC<RecentCraftItemsSectionProps> = ({
  products,
  className,
}) => {
  if (!products || products.length === 0) {
    return (
      <section
        aria-label="Recent Craft Items"
        className={clsx(
          'w-full bg-[#FBF8F3] rounded-[26px] p-6 sm:p-8 lg:p-10 border border-[#E9DFCF] shadow-xs flex flex-col items-center justify-center text-center gap-2',
          className
        )}
      >
        <h2 className="font-display text-2xl font-bold text-primary tracking-tight">
          Recent Craft Items
        </h2>
        <p className="text-xs sm:text-sm text-on-surface-variant">
          No digitized craft items cataloged yet.
        </p>
      </section>
    );
  }

  // Display up to 3 products in the editorial showcase
  const showcaseProducts = products.slice(0, 3);

  return (
    <section
      aria-labelledby="recent-craft-items-heading"
      className={clsx(
        'w-full bg-[#FBF8F3] rounded-[26px] p-6 sm:p-8 lg:p-10 border border-[#E9DFCF] shadow-xs flex flex-col',
        className
      )}
    >
      {/* 1. Centred Section Header */}
      <div className="flex flex-col items-center justify-center text-center mb-7 sm:mb-9">
        <h2
          id="recent-craft-items-heading"
          className="font-display text-2xl sm:text-3xl font-bold text-primary tracking-tight"
        >
          Recent Craft Items
        </h2>
        <p className="text-xs sm:text-sm font-medium text-on-surface-variant mt-1 tracking-wide">
          {products.length} {products.length === 1 ? 'Product' : 'Products'} Digitized
        </p>
      </div>

      {/* 2. Three-Panel Editorial Product Mosaic */}
      <ul
        role="list"
        aria-label="Digitized craft products mosaic"
        className="grid grid-cols-1 md:grid-cols-3 gap-3.5 lg:gap-4.5 w-full m-0 p-0 list-none"
      >
        {showcaseProducts.map((item, index) => {
          // Alternating rhythm on desktop:
          // Index 0: Image Top, Info Bottom
          // Index 1: Info Top, Image Bottom
          // Index 2: Image Top, Info Bottom
          const isInfoTopOnDesktop = index === 1;

          const passportId = `KP_${item.id.replace('draft_', '')}`;
          const imageUrl = resolveProductCoverUrl(item);

          return (
            <li
              key={item.id}
              className={clsx(
                'bg-white rounded-2xl border border-surface-variant/80 overflow-hidden shadow-xs hover:shadow-md transition-all duration-200 group flex flex-col',
                'min-h-[440px] md:h-[490px]'
              )}
            >
              {/* Image Block */}
              <div
                className={clsx(
                  'w-full overflow-hidden bg-surface-container relative shrink-0',
                  'h-[260px] md:h-[62%]',
                  // Alternating position on desktop:
                  isInfoTopOnDesktop ? 'md:order-2' : 'md:order-1'
                )}
              >
                <img
                  src={imageUrl}
                  alt={item.title}
                  loading="lazy"
                  onError={handleImageFallback}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300 ease-out"
                />
                {/* Refined Small Category Badge */}
                <span className="absolute top-3 left-3 bg-white/95 backdrop-blur-sm text-primary text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full border border-surface-variant/70 shadow-xs select-none">
                  {item.category || 'Handloom Textiles'}
                </span>
              </div>

              {/* Information Block */}
              <div
                className={clsx(
                  'p-4 sm:p-5 flex flex-col justify-between flex-1 min-w-0 bg-white',
                  // Alternating position on desktop:
                  isInfoTopOnDesktop ? 'md:order-1' : 'md:order-2'
                )}
              >
                <div className="flex flex-col gap-1">
                  <h3 className="font-bold text-sm sm:text-base text-primary leading-snug line-clamp-2 group-hover:text-secondary transition-colors">
                    {item.title}
                  </h3>
                  <p className="text-xs text-on-surface-variant flex items-center gap-1 mt-0.5 truncate">
                    <MapPin className="w-3.5 h-3.5 text-secondary shrink-0" />
                    <span>{item.origin || 'Assam & Pochampally, India'}</span>
                  </p>
                </div>

                <div className="flex items-center justify-between pt-3 border-t border-surface-variant/60 mt-2">
                  <span className="font-bold text-base text-primary">
                    ₹{item.selectedPrice.toLocaleString('en-IN')}
                  </span>

                  <Link
                    to={`/passport/${passportId}`}
                    state={{ from: ROUTES.ARTISAN_DASHBOARD, fromLabel: 'Artisan Dashboard', sourceRole: 'artisan' }}
                    aria-label={`View Craft Passport for ${item.title}`}
                    className="inline-flex items-center gap-1.5 text-xs font-bold text-secondary hover:text-secondary-hover hover:underline touch-target focus:outline-none focus-visible:ring-2 focus-visible:ring-[#FFB955] rounded-md px-1 py-0.5"
                  >
                    <QrCode className="w-3.5 h-3.5" />
                    <span>View Passport</span>
                  </Link>
                </div>
              </div>
            </li>
          );
        })}
      </ul>

      {/* 3. Centred Footer Summary Line */}
      <footer className="mt-8 pt-2 text-center">
        <p className="text-xs text-on-surface-variant font-medium tracking-wide">
          {products.length} products digitized • Each includes a Craft Passport
        </p>
      </footer>
    </section>
  );
};
