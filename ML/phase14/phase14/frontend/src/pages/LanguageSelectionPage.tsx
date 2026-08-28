import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { SUPPORTED_LANGUAGES } from '@/i18n';
import { useSessionStore } from '@/stores/sessionStore';
import { useCreateSession, useDevToken } from '@/hooks/useApi';
import { Card, LanguageCard } from '@/components';

export function LanguageSelectionPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { selectedLanguage, setSelectedLanguage, setSessionId, session } = useSessionStore();
  const createSession = useCreateSession();
  const devToken = useDevToken();

  useEffect(() => {
    devToken.mutate('dev-user');
  }, [devToken]);

  const handleLanguageSelect = async (languageCode: string) => {
    setSelectedLanguage(languageCode as 'hi' | 'en' | 'or' | 'bn' | 'te');
    const result = await createSession.mutateAsync();
    if (result) {
      setSessionId(result.session_id);
      navigate('/consent');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        <div className="text-center mb-10">
          <h1 className="text-3xl font-bold text-gray-900">{t('app.title')}</h1>
          <p className="mt-2 text-gray-600">{t('app.subtitle')}</p>
        </div>

        <Card className="mb-8">
          <div className="p-4 text-center">
            <p className="text-gray-600">{t('languageSelection.subtitle')}</p>
          </div>
        </Card>

        <Card>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 p-4">
            {SUPPORTED_LANGUAGES.map((lang) => (
              <LanguageCard
                key={lang.code}
                language={lang}
                isSelected={selectedLanguage === lang.code}
                onSelect={() => handleLanguageSelect(lang.code)}
                disabled={createSession.isPending}
              />
            ))}
          </div>

          {createSession.isError && (
            <div className="mx-4 mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
              {t('errors.generic')}
            </div>
          )}
        </Card>

        {session && (
          <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-sm text-blue-800">
              {t('session.sessionId')}: <code className="bg-blue-100 px-1 rounded">{session.session_id}</code>
            </p>
          </div>
        )}
      </div>
    </div>
  );
}