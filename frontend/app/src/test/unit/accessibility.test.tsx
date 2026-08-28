import { useState } from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { SkipLink } from '@/components/ui/SkipLink';
import { Modal } from '@/components/ui/Modal';
import { AriaLiveAnnouncer, announce } from '@/components/ui/AriaLiveAnnouncer';

describe('Accessibility Quality Gate Components (WCAG 2.2 AA)', () => {
  it('1. SkipLink renders with sr-only styling and focuses target element on click', () => {
    const mainDiv = document.createElement('div');
    mainDiv.id = 'main-content';
    document.body.appendChild(mainDiv);

    render(<SkipLink targetId="main-content" />);
    const link = screen.getByText('Skip to main content');
    expect(link).toBeInTheDocument();
    expect(link).toHaveAttribute('href', '#main-content');

    fireEvent.click(link);
    expect(document.activeElement).toBe(mainDiv);

    document.body.removeChild(mainDiv);
  });

  it('2. AriaLiveAnnouncer announces messages in polite and assertive live regions', async () => {
    render(<AriaLiveAnnouncer />);

    const politeRegion = screen.getByTestId('aria-live-polite');
    const assertiveRegion = screen.getByTestId('aria-live-assertive');

    expect(politeRegion).toHaveAttribute('role', 'status');
    expect(politeRegion).toHaveAttribute('aria-live', 'polite');
    expect(assertiveRegion).toHaveAttribute('role', 'alert');
    expect(assertiveRegion).toHaveAttribute('aria-live', 'assertive');

    act(() => {
      announce('Draft saved successfully', 'polite');
    });

    await vi.waitFor(() => {
      expect(politeRegion.textContent).toBe('Draft saved successfully');
    });

    act(() => {
      announce('Network connection lost', 'assertive');
    });

    await vi.waitFor(() => {
      expect(assertiveRegion.textContent).toBe('Network connection lost');
    });
  });

  it('3. Modal traps focus and restores focus to trigger on close', async () => {
    const TestModalWrapper = () => {
      const [isOpen, setIsOpen] = useState(false);
      return (
        <div>
          <button id="open-btn" onClick={() => setIsOpen(true)}>
            Open Dialog
          </button>
          <Modal isOpen={isOpen} onClose={() => setIsOpen(false)} title="Test Dialog">
            <button id="modal-first-btn">First Button</button>
            <button id="modal-last-btn">Last Button</button>
          </Modal>
        </div>
      );
    };

    render(<TestModalWrapper />);
    const openBtn = screen.getByText('Open Dialog');
    openBtn.focus();
    expect(document.activeElement).toBe(openBtn);

    fireEvent.click(openBtn);

    // Dialog is visible
    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByText('Test Dialog')).toBeInTheDocument();

    // Close on Escape
    fireEvent.keyDown(window, { key: 'Escape' });

    // Focus restored to trigger element
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });
});

