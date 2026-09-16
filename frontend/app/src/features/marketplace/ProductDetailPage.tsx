import React, { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { PublicLayout } from '@/components/layout/PublicLayout';
import { MARKETPLACE_PRODUCTS } from '@/data/marketplaceData';
import { ROUTES } from '@/routes';
import {
  ArrowLeft,
  QrCode,
  MapPin,
  MessageSquare,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  ShoppingBag,
} from 'lucide-react';
import workshopLightPng from '@/assets/ecosystem/craft-workshop-light.png';

export const ProductDetailPage: React.FC = () => {
  const { productId } = useParams<{ productId: string }>();
  const [selectedPhotoIdx, setSelectedPhotoIdx] = useState(0);
  const [enquirySent, setEnquirySent] = useState(false);

  const product = MARKETPLACE_PRODUCTS.find((p) => p.id === productId);

  if (!product) {
    return (
      <PublicLayout>
        <div className="max-w-[720px] w-full mx-auto px-4 py-20 text-center flex flex-col items-center gap-6">
          <div className="w-16 h-16 rounded-full bg-surface-container flex items-center justify-center text-primary">
            <AlertCircle className="w-8 h-8 text-secondary" />
          </div>
          <div className="flex flex-col gap-2">
            <h1 className="font-display text-3xl font-bold text-primary">
              Craft Item Not Found
            </h1>
            <p className="text-sm text-on-surface-variant max-w-md">
              The handmade piece with reference <span className="font-mono font-bold text-primary">"{productId}"</span> could not be found or may have been archived.
            </p>
          </div>
          <Link
            to={ROUTES.MARKETPLACE}
            className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-primary hover:bg-primary-container text-white font-bold text-xs shadow-md transition-colors touch-target"
          >
            <ShoppingBag className="w-4 h-4" />
            <span>Explore Other Authentic Crafts</span>
          </Link>
        </div>
      </PublicLayout>
    );
  }

  const handleSendEnquiry = () => {
    setEnquirySent(true);
    setTimeout(() => setEnquirySent(false), 4000);
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

      <div className="max-w-[1140px] w-full mx-auto px-4 sm:px-8 lg:px-12 py-8 sm:py-12 flex flex-col gap-8 relative z-10">
        {/* Back Link */}
        <div>
          <Link
            to={ROUTES.MARKETPLACE}
            className="inline-flex items-center gap-1.5 text-xs font-bold text-primary hover:text-secondary transition-colors touch-target"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to marketplace</span>
          </Link>
        </div>

        {/* 2-Column Product Showcase */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start">
          {/* Left Column: Image Gallery */}
          <div className="lg:col-span-7 flex flex-col gap-3">
            {/* Main Photo */}
            <div className="relative w-full aspect-[4/3] bg-slate-900 rounded-3xl overflow-hidden border border-[#001D36]/10 shadow-sm flex items-center justify-center p-3">
              <img
                src={product.photos[selectedPhotoIdx] || product.photos[0]}
                alt={product.title}
                className="max-w-full max-h-full w-auto h-auto object-contain object-center"
              />
              {product.hasCraftPassport && (
                <div className="absolute top-4 left-4 bg-white/90 backdrop-blur-md px-3 py-1 rounded-full border border-white/80 text-xs font-bold text-primary flex items-center gap-1.5 shadow-2xs">
                  <QrCode className="w-3.5 h-3.5 text-secondary" />
                  <span>Craft Passport Certified</span>
                </div>
              )}
            </div>

            {/* Thumbnail Row */}
            {product.photos.length > 1 && (
              <div className="flex items-center gap-3">
                {product.photos.map((photo, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setSelectedPhotoIdx(idx)}
                    className={`w-20 h-16 rounded-xl overflow-hidden border-2 transition-all cursor-pointer bg-slate-900 flex items-center justify-center p-1 ${
                      selectedPhotoIdx === idx ? 'border-secondary shadow-xs scale-105' : 'border-surface-variant opacity-75 hover:opacity-100'
                    }`}
                  >
                    <img src={photo} alt="" className="max-w-full max-h-full w-auto h-auto object-contain object-center" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Right Column: Details & Enquiry */}
          <div className="lg:col-span-5 flex flex-col gap-6 bg-white/90 backdrop-blur-xs p-6 sm:p-8 rounded-3xl border border-[#001D36]/10 shadow-sm">
            <div className="flex flex-col gap-2">
              <div className="flex items-center gap-2 text-xs font-semibold text-secondary">
                <span>{product.craft}</span>
                <span>•</span>
                <span className="flex items-center gap-1 text-on-surface-variant font-normal">
                  <MapPin className="w-3.5 h-3.5 text-secondary" />
                  {product.state}
                </span>
              </div>

              <h1 className="font-display text-2xl sm:text-3xl font-bold text-primary leading-snug">
                {product.title}
              </h1>

              <div className="text-xs text-on-surface-variant">
                Crafted by <strong>{product.artisanName}</strong> {product.artisanGroup && `(${product.artisanGroup})`}
              </div>

              <div className="font-bold text-2xl text-primary mt-2">
                ₹{product.price.toLocaleString('en-IN')}
              </div>
            </div>

            {/* Craft Story */}
            <div className="flex flex-col gap-1.5 pt-4 border-t border-[#001D36]/10">
              <h3 className="text-xs font-bold uppercase tracking-wider text-primary flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-secondary" /> Craft Story & Provenance
              </h3>
              <p className="text-xs sm:text-sm text-on-surface-variant leading-relaxed">
                {product.story}
              </p>
            </div>

            {/* Specifications */}
            <div className="grid grid-cols-1 gap-2.5 bg-[#FFF9EF] p-4 rounded-2xl border border-[#001D36]/10 text-xs">
              <div>
                <span className="font-bold text-primary block">Materials:</span>
                <span className="text-on-surface-variant">{product.materials.join(', ')}</span>
              </div>
              <div>
                <span className="font-bold text-primary block">Dimensions:</span>
                <span className="text-on-surface-variant">{product.dimensions}</span>
              </div>
              <div>
                <span className="font-bold text-primary block">Availability:</span>
                <span className="text-on-surface-variant">
                  {product.availability === 'in_stock' ? 'In Stock (Ships in 2-3 business days)' : 'Made to Order (Crafted on request)'}
                </span>
              </div>
            </div>

            {/* Craft Passport Certificate */}
            {product.hasCraftPassport && (
              <div className="flex items-center justify-between bg-secondary/10 p-3.5 rounded-2xl border border-secondary/20 text-xs">
                <div className="flex items-center gap-2 text-primary font-bold">
                  <CheckCircle2 className="w-4 h-4 text-[#2E7D32]" />
                  <span>Verifiable Craft Passport</span>
                </div>
                <Link
                  to={ROUTES.publicPassport(product.passportId || product.id)}
                  state={{
                    from: `/marketplace/products/${product.id}`,
                    fromLabel: product.title,
                    sourceRole: 'public',
                  }}
                  className="text-secondary font-bold hover:underline"
                >
                  View Passport
                </Link>
              </div>
            )}

            {/* Action CTA */}
            <div className="pt-2">
              <button
                type="button"
                onClick={handleSendEnquiry}
                className="w-full flex items-center justify-center gap-2 py-3 px-6 rounded-full bg-secondary hover:bg-secondary/90 text-white font-bold text-xs shadow-md active:scale-[0.98] transition-all touch-target focus:outline-none focus-visible:ring-2 focus-visible:ring-[#FFB955]"
              >
                {enquirySent ? (
                  <>
                    <CheckCircle2 className="w-4 h-4 text-white" />
                    <span>Direct Enquiry Sent to Artisan!</span>
                  </>
                ) : (
                  <>
                    <MessageSquare className="w-4 h-4" />
                    <span>Send Buyer Enquiry</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </PublicLayout>
  );
};
