import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useProductDraft } from '@/app/providers/ProductDraftProvider';
import { useLanguage } from '@/app/providers/LanguageProvider';
import { qrService, generateQrPng } from '@/services/export/qrService';
import { passportManager } from '@/services/passport/passportManager';
import { PublicCraftPassport } from '@/types';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import {
  CheckCircle2,
  Copy,
  Download,
  ArrowRight,
  ExternalLink,
  ShieldCheck,
  Check,
  AlertCircle,
  Loader2,
  RefreshCw,
} from 'lucide-react';

interface PassportLocationState {
  passportId?: string;
  publicSlug?: string;
  publicUrl?: string;
}

export const QRCraftPassportCreatedPage: React.FC = () => {
  const { draft } = useProductDraft();
  const { t } = useLanguage();
  const navigate = useNavigate();
  const location = useLocation();
  const locationState = (location.state as PassportLocationState | null) || null;

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [passportRecord, setPassportRecord] = useState<PublicCraftPassport | null>(null);
  const [qrDataUrl, setQrDataUrl] = useState<string>('');
  const [copied, setCopied] = useState(false);

  // Determine target slug from navigation state or persisted draft
  const targetSlug = locationState?.publicSlug || draft.passportSlug;

  const baseUrl = useMemo(() => {
    return typeof window !== 'undefined' ? window.location.origin : 'https://karigarsaathi.web.app';
  }, []);

  useEffect(() => {
    let isMounted = true;

    async function loadPersistedPassport() {
      setLoading(true);
      setError(null);

      if (!targetSlug) {
        if (isMounted) {
          setError('No active Craft Passport found. Please approve and activate your passport.');
          setLoading(false);
        }
        return;
      }

      try {
        // Fetch persisted public projection directly from Firestore / repository
        const publicDoc = await passportManager.getPublicPassport(targetSlug);

        if (!publicDoc) {
          if (isMounted) {
            setError(`Craft Passport "${targetSlug}" was not found in persistence.`);
            setLoading(false);
          }
          return;
        }

        if (publicDoc.status !== 'active') {
          if (isMounted) {
            setError('This Craft Passport has been revoked or is inactive.');
            setLoading(false);
          }
          return;
        }

        // Stale-state guard: verify slug integrity
        if (!publicDoc.slug || publicDoc.slug !== targetSlug) {
          if (isMounted) {
            setError('Stale Passport identifier detected. Please re-issue your passport.');
            setLoading(false);
          }
          return;
        }

        const publicUrl = `${baseUrl}/passport/${publicDoc.slug}`;

        // Generate verified, scannable QR Code PNG Data URL
        const generatedQr = await generateQrPng(publicUrl);

        if (isMounted) {
          setPassportRecord(publicDoc);
          setQrDataUrl(generatedQr);
          setLoading(false);
        }
      } catch (err) {
        if (isMounted) {
          setError(err instanceof Error ? err.message : 'Failed to load verified Craft Passport.');
          setLoading(false);
        }
      }
    }

    loadPersistedPassport();

    return () => {
      isMounted = false;
    };
  }, [targetSlug, baseUrl]);

  // Derived verified values from the persisted record
  const verifiedSlug = passportRecord?.slug || '';
  const verifiedPublicUrl = verifiedSlug ? `${baseUrl}/passport/${verifiedSlug}` : '';
  const verifiedTitle = passportRecord?.publicData?.title || draft.title || 'Handmade Craft';
  const verifiedDescription = passportRecord?.publicData?.description || draft.description || '';
  const verifiedCategory = passportRecord?.publicData?.category || draft.category || 'Handloom Textiles';
  const verifiedTechnique = passportRecord?.publicData?.technique || draft.technique || draft.craftType || 'Traditional Craft';
  const verifiedPrice = passportRecord?.publicData?.price ?? draft.selectedPrice;
  const verifiedCurrency = passportRecord?.publicData?.currency || draft.currency || 'INR';
  const verifiedLocation = [passportRecord?.publicData?.district, passportRecord?.publicData?.state].filter(Boolean).join(', ') || draft.origin || 'India';

  const handleCopyLink = () => {
    if (!verifiedPublicUrl) return;
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(verifiedPublicUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleDownloadQr = () => {
    if (!verifiedPublicUrl || !qrDataUrl) return;
    qrService.downloadQRCodePng(verifiedPublicUrl, `${verifiedSlug || 'craft-passport'}-qr.png`);
  };

  return (
    <div className="w-full flex flex-col gap-6 animate-in fade-in duration-200">
      {/* Step Header */}
      <div className="flex flex-col gap-1 text-center sm:text-left">
        <div className="inline-flex items-center gap-1.5 text-xs font-bold text-success uppercase tracking-wider bg-success-container/80 px-3 py-1 rounded-full border border-green-200 w-fit mb-1">
          <CheckCircle2 className="w-3.5 h-3.5" /> Provenance Verified & Active
        </div>
        <h1 className="font-display text-2xl sm:text-3xl font-bold text-primary tracking-tight">
          {t('productCreation.step7Title')}
        </h1>
        <p className="text-sm sm:text-base text-on-surface-variant">
          {t('productCreation.step7Subtitle')}
        </p>
      </div>

      {/* Loading State */}
      {loading && (
        <Card className="p-12 flex flex-col items-center justify-center text-center gap-3 bg-white rounded-2xl border border-surface-variant/80">
          <Loader2 className="w-8 h-8 text-secondary animate-spin" />
          <p className="font-bold text-sm text-primary">Loading verified Craft Passport from persistence...</p>
          <span className="text-xs text-on-surface-variant">Generating scannable QR Code and certificate</span>
        </Card>
      )}

      {/* Stale State / Fetch Error State */}
      {!loading && error && (
        <Card className="p-6 bg-error-container text-on-error-container rounded-2xl border border-error/30 flex flex-col gap-4">
          <div className="flex items-center gap-3">
            <AlertCircle className="w-6 h-6 text-error shrink-0" />
            <div>
              <h2 className="font-bold text-base">Passport State Verification Failed</h2>
              <p className="text-xs text-on-error-container/90 mt-0.5">{error}</p>
            </div>
          </div>
          <div className="flex items-center gap-3 pt-2">
            <Button
              size="sm"
              variant="secondary"
              onClick={() => navigate('/artisan/products/new/approve')}
              leftIcon={<RefreshCw className="w-3.5 h-3.5" />}
              className="text-xs font-bold"
            >
              Return to Approval & Re-issue
            </Button>
          </div>
        </Card>
      )}

      {/* Verified QR & Certificate Display */}
      {!loading && !error && passportRecord && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
          {/* Left: QR Code Showcase Card (5 cols) */}
          <Card className="lg:col-span-5 p-6 flex flex-col items-center justify-center text-center gap-4 bg-white rounded-2xl border border-surface-variant/80 card-shadow">
            <div className="p-4 bg-white rounded-2xl border border-surface-variant shadow-xs flex flex-col items-center justify-center">
              {qrDataUrl ? (
                <img
                  src={qrDataUrl}
                  alt={`QR code for ${verifiedTitle}`}
                  data-testid="passport-qr-image"
                  className="w-48 h-48 sm:w-56 sm:h-56 object-contain rounded-lg"
                />
              ) : (
                <div className="w-48 h-48 flex items-center justify-center bg-surface-container rounded-xl">
                  <span className="text-xs text-on-surface-variant">Generating QR...</span>
                </div>
              )}
            </div>

            <div className="flex flex-col items-center gap-1 w-full">
              <span
                data-testid="passport-slug-display"
                className="text-[11px] font-mono text-on-surface-variant font-bold bg-surface-container px-2.5 py-1 rounded-md border border-surface-variant max-w-full truncate"
              >
                Slug: {verifiedSlug}
              </span>
              <span className="text-xs text-primary font-semibold mt-0.5">
                Scan with any phone camera to view authentic passport
              </span>
            </div>

            {/* Quick Actions */}
            <div className="flex items-center gap-2 w-full pt-1">
              <Button
                size="sm"
                variant="secondary"
                onClick={handleDownloadQr}
                data-testid="download-qr-button"
                leftIcon={<Download className="w-3.5 h-3.5" />}
                className="flex-1 text-xs font-bold"
              >
                Download PNG
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={handleCopyLink}
                data-testid="copy-link-button"
                leftIcon={copied ? <Check className="w-3.5 h-3.5 text-success" /> : <Copy className="w-3.5 h-3.5" />}
                className="flex-1 text-xs font-bold border border-surface-variant"
              >
                {copied ? 'Copied!' : 'Copy Link'}
              </Button>
            </div>
          </Card>

          {/* Right: Certified Details Summary Card (7 cols) */}
          <div className="lg:col-span-7 flex flex-col gap-4">
            <Card className="p-6 bg-white rounded-2xl border border-surface-variant/80 card-shadow flex flex-col gap-4">
              <div className="flex items-center justify-between border-b border-surface-variant/70 pb-3">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-5 h-5 text-secondary" />
                  <h2 className="font-bold text-sm text-primary uppercase tracking-wider">
                    Digital Craft Passport Certificate
                  </h2>
                </div>
                <Badge variant="success" className="text-[10px]">Active & Verified</Badge>
              </div>

              <div className="flex flex-col gap-2.5">
                <h3 data-testid="certificate-product-title" className="font-display text-xl font-bold text-primary">
                  {verifiedTitle}
                </h3>
                {verifiedDescription && (
                  <p className="text-xs text-on-surface-variant leading-relaxed line-clamp-3">
                    {verifiedDescription}
                  </p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-3 py-2 bg-surface-container-low p-3.5 rounded-xl text-xs">
                <div>
                  <span className="text-on-surface-variant text-[11px]">Craft Category</span>
                  <p className="font-bold text-primary">{verifiedCategory}</p>
                </div>
                <div>
                  <span className="text-on-surface-variant text-[11px]">Technique</span>
                  <p className="font-bold text-primary">{verifiedTechnique}</p>
                </div>
                <div>
                  <span className="text-on-surface-variant text-[11px]">Direct Price</span>
                  <p className="font-bold text-primary">
                    {verifiedPrice !== undefined
                      ? `${verifiedCurrency === 'INR' ? '₹' : `${verifiedCurrency} `}${verifiedPrice.toLocaleString('en-IN')}`
                      : 'Direct on Request'}
                  </p>
                </div>
                <div>
                  <span className="text-on-surface-variant text-[11px]">Origin Region</span>
                  <p className="font-bold text-primary">{verifiedLocation}</p>
                </div>
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-surface-variant/70">
                <span className="text-xs text-on-surface-variant">Live Public Link:</span>
                <a
                  href={verifiedPublicUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  data-testid="view-live-passport-link"
                  className="text-xs font-bold text-secondary hover:underline flex items-center gap-1"
                >
                  <span>View Live Passport</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>
            </Card>
          </div>
        </div>
      )}

      {/* Page Actions Footer */}
      <div className="flex items-center justify-between pt-6 border-t border-surface-variant/70">
        <Button variant="ghost" onClick={() => navigate('/artisan/products/new/approve')} className="text-xs">
          {t('common.back')}
        </Button>

        <Button
          size="md"
          onClick={() => navigate('/artisan/products/new/share')}
          rightIcon={<ArrowRight className="w-4 h-4" />}
          className="font-bold text-xs px-6 bg-secondary hover:bg-secondary-hover"
        >
          Proceed to Share & Export Hub
        </Button>
      </div>
    </div>
  );
};
