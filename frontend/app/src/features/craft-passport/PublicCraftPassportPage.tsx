import React, { useState, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { passportManager } from '@/services/passport/passportManager';
import { enquirySubmissionService } from '@/services/enquiries/enquirySubmissionService';
import { PublicCraftPassport, PreferredContactMethod } from '@/types';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { TextArea } from '@/components/ui/TextArea';
import { Modal } from '@/components/ui/Modal';
import {
  ShieldCheck,
  MessageCircle,
  MapPin,
  CheckCircle2,
  Lock,
  AlertCircle,
  Loader2,
  Send,
  Sparkles,
  Share2,
  Check,
} from 'lucide-react';
import { whatsappService } from '@/services/export/whatsappService';
import {
  resolveProductImageUrl,
  handleImageFallback,
  FALLBACK_PRODUCT_IMAGE_URL,
} from '@/services/media/imageUrlResolver';

export const PublicCraftPassportPage: React.FC = () => {
  const { publicSlug, passportId } = useParams<{ publicSlug?: string; passportId?: string }>();
  const lookupSlug = publicSlug || passportId || 'KP_01_7721';

  const [passport, setPassport] = useState<PublicCraftPassport | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Buyer Enquiry Modal State
  const [isEnquiryModalOpen, setIsEnquiryModalOpen] = useState(false);
  const [buyerName, setBuyerName] = useState('');
  const [buyerContact, setBuyerContact] = useState('');
  const [buyerOrganisation, setBuyerOrganisation] = useState('');
  const [destinationCity, setDestinationCity] = useState('');
  const [targetPrice, setTargetPrice] = useState('');
  const [quantity, setQuantity] = useState('1');
  const [preferredMethod, setPreferredMethod] = useState<PreferredContactMethod>('whatsapp');
  const [consentGranted, setConsentGranted] = useState(false);
  const [enquiryMessage, setEnquiryMessage] = useState('');
  const [honeypot, setHoneypot] = useState('');
  const formStartedAtRef = useRef<number>(0);

  const [isSubmittingEnquiry, setIsSubmittingEnquiry] = useState(false);
  const [enquirySentSuccess, setEnquirySentSuccess] = useState(false);
  const [enquiryError, setEnquiryError] = useState<string | null>(null);

  // Link Copied State
  const [copiedLink, setCopiedLink] = useState(false);

  useEffect(() => {
    let isMounted = true;
    async function loadPublicData() {
      setLoading(true);
      setError(null);
      try {
        const data = await passportManager.getPublicPassport(lookupSlug);
        if (isMounted) {
          if (!data) {
            setError('not_found');
          } else {
            setPassport(data);
          }
        }
      } catch {
        if (isMounted) setError('load_error');
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    loadPublicData();
    return () => {
      isMounted = false;
    };
  }, [lookupSlug]);

  const handleOpenEnquiryModal = () => {
    formStartedAtRef.current = Date.now();
    setEnquiryError(null);
    setIsEnquiryModalOpen(true);
  };

  const handleWhatsAppInquiry = () => {
    if (!passport || passport.status !== 'active') return;
    const url = typeof window !== 'undefined' ? window.location.href : '';
    const shareUrl = whatsappService.getWhatsAppShareUrl({
      productTitle: passport.publicData.title,
      artisanName: passport.publicData.artisanName,
      location: passport.publicData.state,
      publicPassportUrl: url,
    });
    window.open(shareUrl, '_blank', 'noopener,noreferrer');
  };

  const handleCopyLink = () => {
    if (typeof window !== 'undefined') {
      navigator.clipboard.writeText(window.location.href);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2500);
    }
  };

  const handleSendEnquiry = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!passport || !buyerName.trim() || !buyerContact.trim() || !enquiryMessage.trim() || !consentGranted) {
      if (!consentGranted) {
        setEnquiryError('Please confirm your consent to be contacted regarding this enquiry.');
      }
      return;
    }

    setIsSubmittingEnquiry(true);
    setEnquiryError(null);

    try {
      const result = await enquirySubmissionService.submitStructuredEnquiry({
        publicSlug: passport.slug,
        buyerName: buyerName.trim(),
        buyerContact: buyerContact.trim(),
        buyerOrganisation: buyerOrganisation.trim() || undefined,
        destinationCity: destinationCity.trim() || undefined,
        quantityRequested: parseInt(quantity, 10) || 1,
        targetPrice: targetPrice ? parseFloat(targetPrice) : undefined,
        message: enquiryMessage.trim(),
        preferredContactMethod: preferredMethod,
        consentToBeContacted: consentGranted,
        honeypot,
        formStartedAt: formStartedAtRef.current,
      });

      if (!result.success) {
        setEnquiryError(result.message || 'Failed to send enquiry. Please try again.');
        return;
      }

      setEnquirySentSuccess(true);
      setTimeout(() => {
        setIsEnquiryModalOpen(false);
        setEnquirySentSuccess(false);
        setBuyerName('');
        setBuyerContact('');
        setBuyerOrganisation('');
        setDestinationCity('');
        setTargetPrice('');
        setEnquiryMessage('');
        setQuantity('1');
        setConsentGranted(false);
      }, 2500);
    } catch (err) {
      setEnquiryError(err instanceof Error ? err.message : 'A temporary error occurred while sending your enquiry.');
    } finally {
      setIsSubmittingEnquiry(false);
    }
  };

  // 1. Loading State
  if (loading) {
    return (
      <div className="w-full min-h-[60vh] flex flex-col items-center justify-center gap-3 text-on-surface-variant">
        <Loader2 className="w-8 h-8 text-secondary animate-spin" />
        <p className="text-xs font-semibold">Verifying Digital Craft Passport...</p>
      </div>
    );
  }

  // 2. Revoked State — Strict Privacy: Zero Product Data Displayed
  if (passport && passport.status === 'revoked') {
    return (
      <div className="w-full max-w-lg mx-auto py-16 px-4 animate-in fade-in duration-200">
        <Card className="p-8 bg-white border border-surface-variant rounded-2xl flex flex-col items-center text-center gap-4 card-shadow">
          <div className="w-14 h-14 rounded-full bg-error-container/40 text-error flex items-center justify-center">
            <AlertCircle className="w-8 h-8" />
          </div>
          <div>
            <h1 className="font-display text-xl sm:text-2xl font-bold text-primary">
              This Craft Passport is no longer available.
            </h1>
            <p className="text-xs sm:text-sm text-on-surface-variant mt-2 leading-relaxed">
              This authentic craft certificate was revoked by the creator or has been updated with a new revision.
            </p>
          </div>
          <div className="text-[11px] font-mono text-on-surface-variant bg-surface-container px-3 py-1.5 rounded-md border border-surface-variant">
            Slug Reference: {lookupSlug}
          </div>
        </Card>
      </div>
    );
  }

  // 3. Not Found Error State
  if (error || !passport) {
    return (
      <div className="w-full max-w-lg mx-auto py-16 px-4 animate-in fade-in duration-200">
        <Card className="p-8 bg-white border border-surface-variant rounded-2xl flex flex-col items-center text-center gap-4 card-shadow">
          <div className="w-14 h-14 rounded-full bg-surface-container-high text-on-surface-variant flex items-center justify-center">
            <AlertCircle className="w-8 h-8" />
          </div>
          <div>
            <h1 className="font-display text-xl font-bold text-primary">Craft Passport Not Found</h1>
            <p className="text-xs text-on-surface-variant mt-1.5 leading-relaxed">
              The requested digital craft certificate could not be located. Please verify the URL or QR code.
            </p>
          </div>
        </Card>
      </div>
    );
  }

  const { publicData } = passport;
  const coverPhoto = resolveProductImageUrl(publicData.photos?.[0], {
    fallback: FALLBACK_PRODUCT_IMAGE_URL,
  });
  const lastUpdatedFormatted = new Date(passport.updatedAt).toLocaleDateString('en-IN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  return (
    <div className="w-full flex flex-col gap-8 max-w-5xl mx-auto py-4 px-3 sm:px-6 animate-in fade-in duration-200">
      {/* Provenance Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 sm:p-5 rounded-2xl bg-surface-container border border-surface-variant card-shadow-1">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-full bg-success-container text-on-success-container flex items-center justify-center shrink-0 border border-green-300 shadow-xs">
            <ShieldCheck className="w-6 h-6 text-success" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-display font-bold text-base text-primary">
                Official Digital Craft Passport
              </span>
              <Badge variant="success" className="text-[10px]">100% Certified Origin</Badge>
            </div>
            <p className="text-xs text-on-surface-variant mt-0.5">
              Verified Heritage • Updated {lastUpdatedFormatted}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <button
            type="button"
            onClick={handleCopyLink}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-white rounded-lg border border-surface-variant text-xs font-semibold text-primary hover:bg-surface-container transition-colors"
          >
            {copiedLink ? <Check className="w-3.5 h-3.5 text-success" /> : <Share2 className="w-3.5 h-3.5 text-secondary" />}
            <span>{copiedLink ? 'Link Copied' : 'Share'}</span>
          </button>
          <span className="font-mono text-xs text-on-surface-variant font-bold bg-white px-3 py-1.5 rounded-lg border border-surface-variant">
            {passport.passportId}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: Visual Gallery & Provenance Story (7 cols) */}
        <div className="lg:col-span-7 flex flex-col gap-6">
          {/* Gallery Grid */}
          <div className="grid grid-cols-3 gap-3 rounded-2xl overflow-hidden bg-surface-container-lowest p-2 card-shadow-1 border border-surface-variant">
            <div className="col-span-3 aspect-[4/3] rounded-xl overflow-hidden relative bg-slate-900 flex items-center justify-center p-2">
              <img
                src={coverPhoto}
                alt={publicData.title}
                onError={handleImageFallback}
                className="max-w-full max-h-full w-auto h-auto object-contain object-center"
              />
              <div className="absolute top-3 left-3 bg-surface-container-lowest/95 backdrop-blur-sm rounded-full px-3 py-1 flex items-center gap-1.5 shadow text-xs font-bold text-primary border border-surface-variant">
                <CheckCircle2 className="w-4 h-4 text-secondary" />
                <span>Handcrafted Authentic</span>
              </div>
            </div>

            {publicData.photos.slice(1, 4).map((imgUrl, i) => (
              <div key={i} className="col-span-1 aspect-square rounded-lg overflow-hidden border border-surface-variant bg-slate-900 flex items-center justify-center p-1">
                <img
                  src={resolveProductImageUrl(imgUrl)}
                  alt={`Detail view ${i + 1}`}
                  onError={handleImageFallback}
                  className="max-w-full max-h-full w-auto h-auto object-contain object-center"
                />
              </div>
            ))}
          </div>

          {/* Heritage Story */}
          {publicData.artisanStory && (
            <Card className="p-6 flex flex-col gap-3 bg-surface-container-lowest border border-surface-variant rounded-2xl card-shadow">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-secondary" />
                <h2 className="font-display text-lg font-bold text-primary">
                  Artisan Story & Craft Legacy
                </h2>
              </div>
              <p className="text-sm text-on-surface leading-relaxed italic">
                "{publicData.artisanStory}"
              </p>
            </Card>
          )}

          {/* Cryptographic Proof Card */}
          {publicData.verificationHash && (
            <div className="p-4 bg-surface-container-low rounded-xl border border-surface-variant flex items-center justify-between text-xs text-on-surface-variant">
              <div className="flex items-center gap-2 min-w-0">
                <Lock className="w-4 h-4 text-secondary shrink-0" />
                <span className="font-mono text-[11px] truncate">{publicData.verificationHash}</span>
              </div>
              <span className="text-[11px] text-success font-bold shrink-0 ml-2">Verified Authenticity</span>
            </div>
          )}
        </div>

        {/* Right Column: Specifications & Direct Buyer Engagement (5 cols) */}
        <div className="lg:col-span-5 flex flex-col gap-6 sticky top-20">
          <Card className="p-6 flex flex-col gap-5 bg-white card-shadow-2 border border-surface-variant rounded-2xl">
            <div>
              {publicData.category && (
                <span className="text-xs font-bold text-secondary uppercase tracking-wider">
                  {publicData.category}
                </span>
              )}
              <h1 className="font-display text-2xl sm:text-3xl font-bold text-primary leading-tight mt-1">
                {publicData.title}
              </h1>
              {publicData.titleHindi && (
                <p className="text-sm font-hindi text-on-surface-variant mt-0.5">
                  {publicData.titleHindi}
                </p>
              )}
              {publicData.state && (
                <p className="text-xs text-on-surface-variant mt-2 flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5 text-secondary" /> Crafted in {publicData.state}
                </p>
              )}
            </div>

            {publicData.price !== undefined && (
              <div className="p-4 bg-surface-container-low rounded-xl border border-surface-variant flex items-center justify-between">
                <div>
                  <span className="text-xs text-on-surface-variant uppercase font-bold tracking-wider">
                    Direct Artisan Price
                  </span>
                  <p className="text-[11px] text-success font-medium">Fair Trade Certified</p>
                </div>
                <span className="text-2xl sm:text-3xl font-bold text-primary">
                  {publicData.currency || '₹'} {publicData.price.toLocaleString('en-IN')}
                </span>
              </div>
            )}

            {/* Specifications Table */}
            <div className="flex flex-col divide-y divide-surface-variant text-xs">
              {publicData.artisanName && (
                <div className="py-2.5 flex justify-between">
                  <span className="text-on-surface-variant font-medium">Master Artisan</span>
                  <span className="font-bold text-primary">{publicData.artisanName}</span>
                </div>
              )}
              {publicData.technique && (
                <div className="py-2.5 flex justify-between">
                  <span className="text-on-surface-variant font-medium">Craft Technique</span>
                  <span className="font-bold text-primary">{publicData.technique}</span>
                </div>
              )}
              {publicData.materials && publicData.materials.length > 0 && (
                <div className="py-2.5 flex justify-between">
                  <span className="text-on-surface-variant font-medium">Raw Materials</span>
                  <span className="font-bold text-primary">{publicData.materials.join(', ')}</span>
                </div>
              )}
              {publicData.dimensions && (
                <div className="py-2.5 flex justify-between">
                  <span className="text-on-surface-variant font-medium">Dimensions</span>
                  <span className="font-bold text-primary">{publicData.dimensions}</span>
                </div>
              )}
              {publicData.careInstructions && (
                <div className="py-2.5 flex justify-between">
                  <span className="text-on-surface-variant font-medium">Care Instructions</span>
                  <span className="font-bold text-primary text-right max-w-[60%]">{publicData.careInstructions}</span>
                </div>
              )}
            </div>

            {/* Buyer Actions: 3 Clear and Distinct Options */}
            <div className="flex flex-col gap-3 pt-2">
              {publicData.contactOption !== false && (
                <Button
                  size="lg"
                  onClick={handleWhatsAppInquiry}
                  leftIcon={<MessageCircle className="w-5 h-5" />}
                  className="w-full font-bold text-sm bg-[#128C7E] hover:bg-[#075E54] text-white shadow-xs"
                >
                  Inquire on WhatsApp
                </Button>
              )}

              {/* Verified Structured Enquiry */}
              <Button
                size="lg"
                onClick={handleOpenEnquiryModal}
                leftIcon={<Send className="w-4 h-4" />}
                className="w-full font-bold text-sm bg-secondary hover:bg-secondary-hover text-white shadow-xs"
              >
                Send Verified Direct Enquiry
              </Button>
            </div>
          </Card>
        </div>
      </div>

      {/* Buyer Enquiry Modal Form */}
      <Modal
        isOpen={isEnquiryModalOpen}
        onClose={() => {
          if (!isSubmittingEnquiry) setIsEnquiryModalOpen(false);
        }}
        title="Send Direct Enquiry to Master Artisan"
      >
        <form onSubmit={handleSendEnquiry} className="flex flex-col gap-4">
          <p className="text-xs text-on-surface-variant leading-relaxed">
            Your enquiry will be securely routed directly to the artisan's personal workspace. Your contact details remain private.
          </p>

          {/* Hidden Honeypot Field (Abuse Control) */}
          <div className="hidden" aria-hidden="true" style={{ display: 'none' }}>
            <label htmlFor="website_hp">Leave this field blank</label>
            <input
              id="website_hp"
              name="website_hp"
              type="text"
              tabIndex={-1}
              value={honeypot}
              onChange={(e) => setHoneypot(e.target.value)}
              autoComplete="off"
            />
          </div>

          {enquirySentSuccess ? (
            <div className="p-6 bg-success-container/30 border border-success/40 rounded-xl flex flex-col items-center justify-center text-center gap-2">
              <CheckCircle2 className="w-10 h-10 text-success" />
              <h4 className="font-bold text-sm text-primary">Enquiry Delivered Successfully!</h4>
              <p className="text-xs text-on-surface-variant">
                The artisan has received your enquiry in their workspace and will connect via your preferred contact method.
              </p>
            </div>
          ) : (
            <>
              {enquiryError && (
                <div className="p-3 bg-error-container/20 border border-error/30 rounded-lg text-xs text-error font-medium flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{enquiryError}</span>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <Input
                  label="Your Full Name *"
                  value={buyerName}
                  onChange={(e) => setBuyerName(e.target.value)}
                  placeholder="e.g. Priya Sharma"
                  required
                />

                <Input
                  label="Phone Number or Email *"
                  value={buyerContact}
                  onChange={(e) => setBuyerContact(e.target.value)}
                  placeholder="e.g. +91 9876543210 or buyer@domain.in"
                  required
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <Input
                  label="Organisation / Boutique"
                  value={buyerOrganisation}
                  onChange={(e) => setBuyerOrganisation(e.target.value)}
                  placeholder="e.g. Heritage Crafts Mumbai"
                />

                <Input
                  label="Destination City"
                  value={destinationCity}
                  onChange={(e) => setDestinationCity(e.target.value)}
                  placeholder="e.g. New Delhi"
                />

                <Input
                  label="Quantity Required"
                  type="number"
                  min="1"
                  value={quantity}
                  onChange={(e) => setQuantity(e.target.value)}
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <Input
                  label="Target Price / Budget (₹ INR, Optional)"
                  type="number"
                  min="0"
                  value={targetPrice}
                  onChange={(e) => setTargetPrice(e.target.value)}
                  placeholder="e.g. 14000"
                />

                <div>
                  <label className="block text-xs font-bold text-on-surface mb-1">
                    Preferred Contact Method
                  </label>
                  <select
                    value={preferredMethod}
                    onChange={(e) => setPreferredMethod(e.target.value as PreferredContactMethod)}
                    className="w-full h-10 px-3 text-xs bg-white border border-surface-variant rounded-lg focus:outline-none focus:ring-2 focus:ring-secondary text-primary"
                  >
                    <option value="whatsapp">WhatsApp</option>
                    <option value="phone">Telephone Call</option>
                    <option value="email">Email</option>
                  </select>
                </div>
              </div>

              <TextArea
                label="Message / Customisation Requirements *"
                value={enquiryMessage}
                onChange={(e) => setEnquiryMessage(e.target.value)}
                placeholder="Describe specific customisation, dimensions, bulk timeline, or delivery requirements..."
                rows={3}
                required
              />

              {/* Explicit Contact Consent Checkbox */}
              <div className="flex items-start gap-2.5 p-3 rounded-xl bg-surface-container border border-surface-variant text-xs">
                <input
                  id="enquiry_consent"
                  type="checkbox"
                  checked={consentGranted}
                  onChange={(e) => setConsentGranted(e.target.checked)}
                  className="mt-0.5 w-4 h-4 rounded text-secondary focus:ring-secondary"
                  required
                />
                <label htmlFor="enquiry_consent" className="text-[11px] text-on-surface leading-tight cursor-pointer">
                  <span className="font-bold text-primary">Contact Consent: </span>
                  I explicitly consent to being contacted by the master artisan regarding this craft enquiry.
                </label>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-surface-variant">
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => setIsEnquiryModalOpen(false)}
                  disabled={isSubmittingEnquiry}
                  className="text-xs"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={
                    isSubmittingEnquiry ||
                    !buyerName.trim() ||
                    !buyerContact.trim() ||
                    !enquiryMessage.trim() ||
                    !consentGranted
                  }
                  leftIcon={
                    isSubmittingEnquiry ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <Send className="w-3.5 h-3.5" />
                    )
                  }
                  className="text-xs font-bold"
                >
                  {isSubmittingEnquiry ? 'Submitting...' : 'Send Enquiry'}
                </Button>
              </div>
            </>
          )}
        </form>
      </Modal>
    </div>
  );
};
