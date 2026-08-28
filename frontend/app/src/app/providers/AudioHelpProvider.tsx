import React, { createContext, useContext, useState, useEffect } from 'react';
import { useLanguage } from './LanguageProvider';

interface AudioHelpContextType {
  isPlaying: boolean;
  activeSpeechText: string | null;
  speak: (text: string) => void;
  stop: () => void;
  toggleHelp: (fallbackText?: string) => void;
}

const AudioHelpContext = createContext<AudioHelpContextType | undefined>(undefined);

export const AudioHelpProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { language } = useLanguage();
  const [isPlaying, setIsPlaying] = useState(false);
  const [activeSpeechText, setActiveSpeechText] = useState<string | null>(null);

  const stop = () => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    setIsPlaying(false);
    setActiveSpeechText(null);
  };

  const speak = (text: string) => {
    stop();
    setActiveSpeechText(text);
    setIsPlaying(true);

    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = language === 'hi' ? 'hi-IN' : language === 'bn' ? 'bn-IN' : language === 'te' ? 'te-IN' : 'en-IN';
      utterance.onend = () => {
        setIsPlaying(false);
        setActiveSpeechText(null);
      };
      utterance.onerror = () => {
        setIsPlaying(false);
        setActiveSpeechText(null);
      };
      window.speechSynthesis.speak(utterance);
    } else {
      // Simulate audio playback duration
      setTimeout(() => {
        setIsPlaying(false);
        setActiveSpeechText(null);
      }, 4000);
    }
  };

  const toggleHelp = (fallbackText?: string) => {
    if (isPlaying) {
      stop();
    } else {
      const defaultText = fallbackText || 'KarigarSaathi voice assistant. Follow the on-screen instructions to complete your craft documentation.';
      speak(defaultText);
    }
  };

  useEffect(() => {
    return () => {
      stop();
    };
  }, []);

  return (
    <AudioHelpContext.Provider value={{ isPlaying, activeSpeechText, speak, stop, toggleHelp }}>
      {children}
    </AudioHelpContext.Provider>
  );
};

export const useAudioHelp = (): AudioHelpContextType => {
  const ctx = useContext(AudioHelpContext);
  if (!ctx) throw new Error('useAudioHelp must be used within AudioHelpProvider');
  return ctx;
};
