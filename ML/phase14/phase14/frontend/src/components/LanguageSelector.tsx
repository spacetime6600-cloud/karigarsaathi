import { useState } from 'react';
import { cn } from '@/utils/helpers';
import type { LanguageOption } from '@/types';

interface LanguageSelectorProps {
  languages: LanguageOption[];
  selectedLanguage: string | null;
  onSelect: (languageCode: string) => void;
  className?: string;
  disabled?: boolean;
}

export function LanguageSelector({
  languages,
  selectedLanguage,
  onSelect,
  className,
  disabled = false,
}: LanguageSelectorProps) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className={cn('relative w-full', className)}>
      <button
        type="button"
        onClick={() => !disabled && setExpanded(!expanded)}
        disabled={disabled}
        className={cn(
          'w-full px-4 py-3 border rounded-lg bg-white text-left',
          'focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500',
          'transition-colors',
          disabled ? 'opacity-50 cursor-not-allowed' : 'hover:border-gray-400',
          expanded ? 'border-primary-500' : 'border-gray-300'
        )}
        aria-expanded={expanded}
        aria-haspopup="listbox"
        aria-label="Select language"
      >
        <div className="flex items-center justify-between">
          <span className="text-gray-900">
            {languages.find((l) => l.code === selectedLanguage)?.label || 'Select language'}
          </span>
          <svg
            className={cn(
              'w-5 h-5 text-gray-500 flex-shrink-0 ml-2 transition-transform',
              expanded && 'rotate-180'
            )}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </button>

      {expanded && (
        <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-auto">
          <ul role="listbox" aria-label="Languages">
            {languages.map((lang) => (
              <li key={lang.code}>
                <button
                  role="option"
                  aria-selected={selectedLanguage === lang.code}
                  onClick={() => {
                    onSelect(lang.code);
                    setExpanded(false);
                  }}
                  disabled={disabled}
                  className={cn(
                    'w-full px-4 py-3 text-left transition-colors',
                    'focus:outline-none focus:bg-gray-50',
                    selectedLanguage === lang.code
                      ? 'bg-primary-50 text-primary-700 font-medium'
                      : 'text-gray-700 hover:bg-gray-50'
                  )}
                >
                  <div className="flex items-center">
                    <span className="flex-1">{lang.label}</span>
                    {selectedLanguage === lang.code && (
                      <svg className="w-5 h-5 text-primary-600 flex-shrink-0 ml-2" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    )}
                  </div>
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

interface LanguageCardProps {
  language: LanguageOption;
  isSelected: boolean;
  onSelect: () => void;
  disabled?: boolean;
}

export function LanguageCard({ language, isSelected, onSelect, disabled = false }: LanguageCardProps) {
  return (
    <button
      type="button"
      onClick={onSelect}
      disabled={disabled}
      className={cn(
        'relative w-full p-4 border-2 rounded-xl text-left transition-all',
        'focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2',
        disabled ? 'opacity-50 cursor-not-allowed' : 'hover:border-primary-300',
        isSelected
          ? 'border-primary-600 bg-primary-50'
          : 'border-gray-200 bg-white hover:border-gray-300'
      )}
      aria-pressed={isSelected}
    >
      <div className="flex items-center">
        <div className="flex-1">
          <span className="text-lg font-medium text-gray-900">{language.label}</span>
          <span className="text-sm text-gray-500 ml-2">({language.code})</span>
        </div>
        {isSelected && (
          <svg className="w-6 h-6 text-primary-600 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
          </svg>
        )}
      </div>
    </button>
  );
}