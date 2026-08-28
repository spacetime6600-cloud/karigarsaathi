import React, { useEffect, useState } from 'react';

type AnnouncementListener = (message: string, priority?: 'polite' | 'assertive') => void;
const listeners = new Set<AnnouncementListener>();

/**
 * Programmatic helper to trigger polite or assertive screen reader announcements.
 */
export function announce(message: string, priority: 'polite' | 'assertive' = 'polite'): void {
  if (!message) return;
  for (const listener of listeners) {
    listener(message, priority);
  }
}

export const AriaLiveAnnouncer: React.FC = () => {
  const [politeMessage, setPoliteMessage] = useState('');
  const [assertiveMessage, setAssertiveMessage] = useState('');

  useEffect(() => {
    const handleAnnouncement: AnnouncementListener = (message, priority = 'polite') => {
      if (priority === 'assertive') {
        setAssertiveMessage('');
        setTimeout(() => setAssertiveMessage(message), 50);
      } else {
        setPoliteMessage('');
        setTimeout(() => setPoliteMessage(message), 50);
      }
    };

    listeners.add(handleAnnouncement);
    return () => {
      listeners.delete(handleAnnouncement);
    };
  }, []);

  return (
    <>
      <div
        role="status"
        aria-live="polite"
        aria-atomic="true"
        className="sr-only"
        data-testid="aria-live-polite"
      >
        {politeMessage}
      </div>
      <div
        role="alert"
        aria-live="assertive"
        aria-atomic="true"
        className="sr-only"
        data-testid="aria-live-assertive"
      >
        {assertiveMessage}
      </div>
    </>
  );
};

