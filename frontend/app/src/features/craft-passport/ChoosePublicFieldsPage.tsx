import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useProductDraft } from '@/app/providers/ProductDraftProvider';
import { useLanguage } from '@/app/providers/LanguageProvider';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Toggle } from '@/components/ui/Toggle';
import { ArrowRight, ShieldCheck, Package, UserCheck, Tag } from 'lucide-react';

export const ChoosePublicFieldsPage: React.FC = () => {
  const { draft, updatePublicFields } = useProductDraft();
  const { t } = useLanguage();
  const navigate = useNavigate();

  const publicCount = Object.values(draft.publicFields).filter(Boolean).length;
  const totalFields = Object.keys(draft.publicFields).length;
  const buyerConfidenceScore = Math.min(100, Math.round((publicCount / totalFields) * 115));

  const handleContinue = () => {
    navigate('/artisan/products/new/approve');
  };

  return (
    <div className="w-full flex flex-col gap-6 animate-in fade-in duration-200">
      {/* Step Header */}
      <div className="flex flex-col gap-1">
        <h1 className="font-display text-2xl sm:text-3xl font-bold text-primary tracking-tight">
          {t('productCreation.step5Title')}
        </h1>
        <p className="text-sm sm:text-base text-on-surface-variant">
          {t('publicFields.selectInstructions')}
        </p>
      </div>

      {/* Two-Column Responsive Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Toggles Groups (8 cols) */}
        <div className="lg:col-span-8 flex flex-col gap-5">
          {/* Group 1: Product Heritage Details */}
          <Card className="p-5 sm:p-6 bg-white rounded-2xl border border-surface-variant/80 card-shadow flex flex-col gap-3">
            <div className="flex items-center gap-2 border-b border-surface-variant/70 pb-2.5">
              <Package className="w-4 h-4 text-secondary" />
              <h2 className="font-bold text-base text-primary">
                Product & Craft Attributes
              </h2>
            </div>

            <div className="flex flex-col divide-y divide-surface-variant/50">
              <Toggle
                label="Craft Origin & Geography"
                description={`Show "${draft.origin}" on Craft Passport`}
                checked={draft.publicFields.origin}
                onChange={(checked) => updatePublicFields({ origin: checked })}
              />
              <Toggle
                label="Weaving / Craft Technique"
                description={`Show "${draft.technique}"`}
                checked={draft.publicFields.technique}
                onChange={(checked) => updatePublicFields({ technique: checked })}
              />
              <Toggle
                label="Raw Materials & Natural Dyes"
                description={`Show "${draft.materials.join(', ')}"`}
                checked={draft.publicFields.materials}
                onChange={(checked) => updatePublicFields({ materials: checked })}
              />
              <Toggle
                label="Dimensions & Sizing"
                description={`Show "${draft.dimensions}"`}
                checked={draft.publicFields.dimensions}
                onChange={(checked) => updatePublicFields({ dimensions: checked })}
              />
              <Toggle
                label="Artisan Heritage Story"
                description="Display personal notes on heritage technique and creation duration"
                checked={draft.publicFields.story}
                onChange={(checked) => updatePublicFields({ story: checked })}
              />
            </div>
          </Card>

          {/* Group 2: Artisan Profile Details */}
          <Card className="p-5 sm:p-6 bg-white rounded-2xl border border-surface-variant/80 card-shadow flex flex-col gap-3">
            <div className="flex items-center gap-2 border-b border-surface-variant/70 pb-2.5">
              <UserCheck className="w-4 h-4 text-secondary" />
              <h2 className="font-bold text-base text-primary">
                Artisan Identity & Workshop
              </h2>
            </div>

            <div className="flex flex-col divide-y divide-surface-variant/50">
              <Toggle
                label="Master Artisan Name"
                description="Include your verified artisan name in QR verification badge"
                checked={draft.publicFields.artisanName}
                onChange={(checked) => updatePublicFields({ artisanName: checked })}
              />
              <Toggle
                label="Workshop Location"
                description="Show cluster & district name for regional authenticity"
                checked={draft.publicFields.workshopLocation}
                onChange={(checked) => updatePublicFields({ workshopLocation: checked })}
              />
              <Toggle
                label="Direct Buyer Enquiries"
                description="Enable buyers to message you directly from the public Craft Passport"
                checked={draft.publicFields.directContact}
                onChange={(checked) => updatePublicFields({ directContact: checked })}
              />
            </div>
          </Card>

          {/* Group 3: Commercial Terms */}
          <Card className="p-5 sm:p-6 bg-white rounded-2xl border border-surface-variant/80 card-shadow flex flex-col gap-3">
            <div className="flex items-center gap-2 border-b border-surface-variant/70 pb-2.5">
              <Tag className="w-4 h-4 text-secondary" />
              <h2 className="font-bold text-base text-primary">
                Commercial Information
              </h2>
            </div>

            <div className="flex flex-col divide-y divide-surface-variant/50">
              <Toggle
                label="Transparent Retail Price"
                description={`Show fair-trade retail price of ₹${draft.selectedPrice.toLocaleString('en-IN')}`}
                checked={draft.publicFields.retailPrice}
                onChange={(checked) => updatePublicFields({ retailPrice: checked })}
              />
              <Toggle
                label="Wholesale Orders Available"
                description="Indicate willingness to accept boutique bulk orders"
                checked={draft.publicFields.wholesaleAvailable}
                onChange={(checked) => updatePublicFields({ wholesaleAvailable: checked })}
              />
            </div>
          </Card>
        </div>

        {/* Right Column: Transparency Meter Card (4 cols) */}
        <div className="lg:col-span-4 flex flex-col gap-4">
          <Card className="p-5 bg-white rounded-2xl border border-surface-variant/80 card-shadow flex flex-col gap-3.5">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-secondary" />
              <h3 className="font-bold text-sm text-primary">
                Buyer Trust Score
              </h3>
            </div>

            <div className="flex flex-col gap-2">
              <div className="flex items-center justify-between text-xs">
                <span className="text-on-surface-variant">Disclosed Fields</span>
                <span className="font-bold text-primary">{publicCount} of {totalFields}</span>
              </div>
              <div className="w-full bg-surface-variant/80 h-2 rounded-full overflow-hidden">
                <div
                  className="bg-secondary h-full transition-all duration-300 rounded-full"
                  style={{ width: `${buyerConfidenceScore}%` }}
                />
              </div>
              <p className="text-xs text-on-surface-variant mt-1 leading-relaxed">
                Items with high provenance disclosure receive 3x more direct buyer inquiries.
              </p>
            </div>
          </Card>
        </div>
      </div>

      {/* Page Actions Footer */}
      <div className="flex items-center justify-between pt-6 border-t border-surface-variant/70">
        <Button variant="ghost" onClick={() => navigate('/artisan/products/new/price')} className="text-xs">
          {t('common.back')}
        </Button>

        <Button
          size="md"
          onClick={handleContinue}
          rightIcon={<ArrowRight className="w-4 h-4" />}
          className="font-bold text-xs px-6"
        >
          {t('common.continue')}
        </Button>
      </div>
    </div>
  );
};
