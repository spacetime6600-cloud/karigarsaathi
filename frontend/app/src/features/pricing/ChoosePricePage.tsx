import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useProductDraft } from '@/app/providers/ProductDraftProvider';
import { useLanguage } from '@/app/providers/LanguageProvider';
import { pricingService } from '@/services/api/pricingService';
import { ProductDraft } from '@/types';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';
import { Modal } from '@/components/ui/Modal';
import { ArrowRight, AlertTriangle, Calculator, Sparkles, Check } from 'lucide-react';
import { clsx } from 'clsx';

export const ChoosePricePage: React.FC = () => {
  const { draft, updateCostBreakdown, setSelectedPrice } = useProductDraft();
  const { t } = useLanguage();
  const navigate = useNavigate();

  const [customPriceInput, setCustomPriceInput] = useState<string>(
    draft.selectedPrice ? String(draft.selectedPrice) : '14243'
  );
  const [selectedTier, setSelectedTier] = useState<string>(draft.pricingStrategy || 'fair_trade');
  const [isBelowCostModalOpen, setIsBelowCostModalOpen] = useState(false);
  const [validationError, setValidationError] = useState<string>('');

  const totalCost = pricingService.calculateTotalCost(draft.costBreakdown);
  const suggestions = pricingService.getSuggestions(totalCost);

  const handleSelectTier = (tier: 'fair_trade' | 'market_standard' | 'premium_heritage', price: number) => {
    setSelectedTier(tier);
    setCustomPriceInput(String(price));
    setSelectedPrice(price, tier);
    setValidationError('');
  };

  const handleCustomPriceChange = (val: string) => {
    setCustomPriceInput(val);
    setSelectedTier('custom');
    const num = Number(val);
    if (!isNaN(num) && num > 0) {
      setSelectedPrice(num, 'custom');
      setValidationError('');
    }
  };

  const handleContinue = () => {
    const finalPrice = Number(customPriceInput);
    if (isNaN(finalPrice) || finalPrice <= 0) {
      setValidationError('Please enter a valid positive numeric price.');
      return;
    }

    if (pricingService.isPriceBelowCost(finalPrice, totalCost)) {
      setIsBelowCostModalOpen(true);
      return;
    }

    setSelectedPrice(finalPrice, selectedTier as ProductDraft['pricingStrategy']);
    navigate('/artisan/products/new/public-fields');
  };

  const handleConfirmBelowCost = () => {
    const finalPrice = Number(customPriceInput);
    setSelectedPrice(finalPrice, 'custom');
    setIsBelowCostModalOpen(false);
    navigate('/artisan/products/new/public-fields');
  };

  return (
    <div className="w-full flex flex-col gap-6 animate-in fade-in duration-200">
      {/* Step Header */}
      <div className="flex flex-col gap-1">
        <h1 className="font-display text-2xl sm:text-3xl font-bold text-primary tracking-tight">
          {t('productCreation.step4Title')}
        </h1>
        <p className="text-sm sm:text-base text-on-surface-variant">
          Product: <strong className="text-primary">{draft.title || 'Handcrafted Saree'}</strong>
        </p>
      </div>

      {/* Two-Column Responsive Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Direct Cost Breakdown (6 cols) */}
        <div className="lg:col-span-6 flex flex-col gap-5">
          <Card className="p-5 sm:p-6 bg-white rounded-2xl border border-surface-variant/80 card-shadow flex flex-col gap-4">
            <div className="flex items-center gap-2 border-b border-surface-variant/70 pb-2.5">
              <Calculator className="w-4 h-4 text-secondary" />
              <h2 className="font-bold text-base text-primary">
                Cost of Creation
              </h2>
            </div>

            <div className="flex flex-col gap-3.5">
              <Input
                label={t('pricing.materialsCost')}
                type="number"
                value={draft.costBreakdown.rawMaterials || ''}
                onChange={(e) => updateCostBreakdown({ rawMaterials: Number(e.target.value) })}
                placeholder="e.g. 3800"
                className="h-11 text-sm bg-surface-container-lowest"
              />

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <Input
                  label={t('pricing.hoursSpent')}
                  type="number"
                  value={draft.costBreakdown.laborHours || ''}
                  onChange={(e) => updateCostBreakdown({ laborHours: Number(e.target.value) })}
                  placeholder="e.g. 42"
                  className="h-11 text-sm bg-surface-container-lowest"
                />
                <Input
                  label={t('pricing.hourlyRate')}
                  type="number"
                  value={draft.costBreakdown.hourlyRate || ''}
                  onChange={(e) => updateCostBreakdown({ hourlyRate: Number(e.target.value) })}
                  placeholder="e.g. 150"
                  className="h-11 text-sm bg-surface-container-lowest"
                />
              </div>

              <Input
                label={t('pricing.packagingCost')}
                type="number"
                value={draft.costBreakdown.packagingAndLogistics || ''}
                onChange={(e) => updateCostBreakdown({ packagingAndLogistics: Number(e.target.value) })}
                placeholder="e.g. 450"
                className="h-11 text-sm bg-surface-container-lowest"
              />
            </div>

            {/* Total Base Cost Banner */}
            <div className="p-4 bg-surface-container-low rounded-xl border border-surface-variant/70 flex items-center justify-between mt-1">
              <span className="text-xs font-bold text-on-surface-variant uppercase tracking-wider">
                Total Production Cost
              </span>
              <span className="font-bold text-lg text-primary font-mono">
                ₹{totalCost.toLocaleString('en-IN')}
              </span>
            </div>
          </Card>
        </div>

        {/* Right Column: Pricing Strategies & Final Price Input (6 cols) */}
        <div className="lg:col-span-6 flex flex-col gap-5">
          <Card className="p-5 sm:p-6 bg-white rounded-2xl border border-surface-variant/80 card-shadow flex flex-col gap-4">
            <div className="flex items-center gap-2 border-b border-surface-variant/70 pb-2.5">
              <Sparkles className="w-4 h-4 text-secondary" />
              <h2 className="font-bold text-base text-primary">
                Fair-Trade Pricing Tiers
              </h2>
            </div>

            {/* Suggested Tiers */}
            <div className="flex flex-col gap-2.5">
              {suggestions.map((sug) => {
                const isSelected = selectedTier === sug.tier;

                return (
                  <div
                    key={sug.tier}
                    onClick={() => handleSelectTier(sug.tier, sug.price)}
                    className={clsx(
                      'p-3.5 rounded-xl border-2 transition-all cursor-pointer flex items-center justify-between select-none touch-target',
                      isSelected
                        ? 'border-secondary bg-surface-container-low shadow-sm ring-2 ring-secondary/20'
                        : 'border-surface-variant/70 hover:border-outline-variant bg-surface-container-lowest'
                    )}
                  >
                    <div className="flex flex-col">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-sm text-primary">{sug.label}</span>
                        {sug.tier === 'fair_trade' && (
                          <Badge variant="terracotta" className="text-[10px] py-0 px-2">Recommended</Badge>
                        )}
                      </div>
                      <span className="text-xs text-on-surface-variant mt-0.5">{sug.sublabel}</span>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="font-bold text-base text-primary font-mono">
                        ₹{sug.price.toLocaleString('en-IN')}
                      </span>
                      <div
                        className={clsx(
                          'w-5 h-5 rounded-full flex items-center justify-center border',
                          isSelected ? 'border-secondary bg-secondary text-white' : 'border-surface-variant'
                        )}
                      >
                        {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Final Retail Price Custom Input */}
            <div className="pt-3 border-t border-surface-variant/70 flex flex-col gap-2">
              <label htmlFor="final-price-input" className="text-xs font-bold text-primary">
                Final Retail Listing Price (₹ INR)
              </label>
              <Input
                id="final-price-input"
                type="number"
                value={customPriceInput}
                onChange={(e) => handleCustomPriceChange(e.target.value)}
                placeholder="Enter final price..."
                className="h-11 text-base font-bold text-primary bg-surface-container-lowest font-mono"
              />
              {validationError && (
                <p className="text-xs text-error font-semibold flex items-center gap-1">
                  <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                  <span>{validationError}</span>
                </p>
              )}
            </div>
          </Card>
        </div>
      </div>

      {/* Page Actions Footer */}
      <div className="flex items-center justify-between pt-6 border-t border-surface-variant/70">
        <Button variant="ghost" onClick={() => navigate('/artisan/products/new/review')} className="text-xs">
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

      {/* Price Below Cost Warning Modal */}
      <Modal
        isOpen={isBelowCostModalOpen}
        onClose={() => setIsBelowCostModalOpen(false)}
        title="Fair-Trade Price Alert"
      >
        <div className="flex flex-col gap-4">
          <div className="flex items-start gap-3 p-3 bg-warning-container rounded-xl text-on-warning-container text-xs border border-amber-300">
            <AlertTriangle className="w-5 h-5 text-secondary shrink-0 mt-0.5" />
            <p>
              The entered price (₹{customPriceInput}) is lower than the calculated cost to produce this handcrafted item (₹{totalCost}). This may undervalue your artisanal labor.
            </p>
          </div>
          <div className="flex flex-col sm:flex-row gap-2">
            <Button
              variant="secondary"
              onClick={() => setIsBelowCostModalOpen(false)}
              className="flex-1 text-xs font-bold"
            >
              Adjust Price
            </Button>
            <Button
              variant="ghost"
              onClick={handleConfirmBelowCost}
              className="flex-1 text-xs font-bold text-error"
            >
              Keep Under-Cost Price
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
