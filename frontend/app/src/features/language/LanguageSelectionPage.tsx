import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '@/app/providers/LanguageProvider';
import { supportedLanguages } from '@/i18n';
import { SupportedLanguage } from '@/types';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { CheckCircle2, Circle, Info, ArrowRight } from 'lucide-react';
import { clsx } from 'clsx';

export const LanguageSelectionPage: React.FC = () => {
  const { language, setLanguage, t } = useLanguage();
  const navigate = useNavigate();

  const handleSelectLanguage = (code: SupportedLanguage) => {
    setLanguage(code);
  };

  const handleContinue = () => {
    navigate('/sign-in');
  };

  return (
    <div className="w-full max-w-[600px] flex flex-col gap-6 mx-auto animate-in fade-in duration-200">
      <Card className="p-6 md:p-10 flex flex-col gap-6 bg-surface-container-lowest rounded-xl card-shadow border border-surface-variant">
        {/* Title & Subtitle */}
        <div className="text-center flex flex-col gap-2">
          <h2 className="font-display text-2xl md:text-3xl font-bold text-on-surface tracking-tight">
            {t('language.title')}
          </h2>
          <p className="text-sm md:text-base text-on-surface-variant">
            {t('language.subtitle')}
          </p>
        </div>

        {/* Radio Group List */}
        <div
          role="radiogroup"
          aria-label="Select Language"
          className="flex flex-col gap-3"
        >
          {supportedLanguages.map((lang) => {
            const isSelected = language === lang.code;

            return (
              <button
                key={lang.code}
                role="radio"
                type="button"
                aria-checked={isSelected}
                onClick={() => handleSelectLanguage(lang.code)}
                className={clsx(
                  'group flex items-center justify-between p-4 rounded-xl text-left min-h-[72px] transition-all touch-target focus:outline-none focus-visible:ring-2 focus-visible:ring-[#FFB955] focus-visible:ring-offset-2',
                  isSelected
                    ? 'border-2 border-secondary bg-surface-container-lowest shadow-sm'
                    : 'border-[1.5px] border-outline-variant bg-surface-container-lowest hover:border-outline hover:bg-surface-container-low'
                )}
              >
                <div className="flex flex-col">
                  <span className="font-bold text-lg text-on-surface">
                    {lang.name}
                  </span>
                  <span className="text-xs text-on-surface-variant font-medium">
                    {lang.englishName}
                  </span>
                </div>

                <div className="shrink-0 flex items-center">
                  {isSelected ? (
                    <CheckCircle2 className="w-6 h-6 text-secondary fill-secondary text-white stroke-[2.5]" />
                  ) : (
                    <Circle className="w-6 h-6 text-outline-variant group-hover:text-outline" />
                  )}
                </div>
              </button>
            );
          })}
        </div>

        {/* Supporting Notice */}
        <div className="flex items-center justify-center gap-2 text-on-surface-variant opacity-80 mt-1 text-xs">
          <Info className="w-4 h-4 text-on-surface-variant shrink-0" />
          <span>Provisional translations — human review required.</span>
        </div>

        {/* Primary Action */}
        <Button
          size="lg"
          onClick={handleContinue}
          rightIcon={<ArrowRight className="w-5 h-5" />}
          className="w-full font-bold text-base min-h-[56px] rounded-lg mt-2"
        >
          {t('common.continue')}
        </Button>
      </Card>
    </div>
  );
};
