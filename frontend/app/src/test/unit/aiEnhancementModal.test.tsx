import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { AIEnhancementModal } from '@/features/photographs/components/AIEnhancementModal';
import { PhotographItem } from '@/types';

vi.mock('@/services/ai/aiEnhancementService', () => {
  return {
    aiEnhancementService: {
      isAiEnabled: vi.fn(() => true),
      checkHealth: vi.fn().mockResolvedValue({ status: 'healthy', model_ready: true }),
      enhanceImage: vi.fn().mockResolvedValue({
        job_id: 'job_modal_test',
        request_id: 'req_modal_test',
        artisan_id: 'artisan_001',
        product_id: 'prod_001',
        status: 'succeeded',
        enhanced_image_reference: '/v1/enhancements/job_modal_test/enhanced',
        preview_image_reference: '/v1/enhancements/job_modal_test/preview',
        enhancedDataUrl: 'https://example.com/enhanced.jpg',
        previewDataUrl: 'https://example.com/preview.jpg',
        operations_requested: ['background_removal'],
        operations_applied: ['background_removal'],
        warnings: [],
        metrics: {
          mean_delta_e: 1.1,
          luminance_ssim: 0.98,
          edge_preservation_ratio: 0.96,
        },
        processing_duration_ms: 1100,
        retryable: false,
        adapter_version: 'isnet-general-use',
        created_at: '2026-08-28T00:00:00Z',
      }),
      urlToBlob: vi.fn().mockResolvedValue(new Blob(['bytes'], { type: 'image/jpeg' })),
      cancelEnhancement: vi.fn(),
    },
    AIEnhancementError: class extends Error {
      public errorCode: string;
      public retryable: boolean;
      constructor(err: { message: string; errorCode: string; retryable: boolean }) {
        super(err.message);
        this.name = 'AIEnhancementError';
        this.errorCode = err.errorCode;
        this.retryable = err.retryable;
      }
    },
  };
});

describe('AIEnhancementModal', () => {
  const samplePhoto: PhotographItem = {
    id: 'photo_test_1',
    url: 'https://example.com/original.jpg',
    rawOriginalUrl: 'https://example.com/original.jpg',
    name: 'test_craft.jpg',
    size: 2000000,
    type: 'image/jpeg',
    uploadedAt: '2026-08-28T00:00:00Z',
    isCover: true,
  };

  const mockApprove = vi.fn();
  const mockReject = vi.fn();
  const mockClose = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders consent review step with disabled submit button until checkbox is checked', () => {
    render(
      <AIEnhancementModal
        isOpen={true}
        onClose={mockClose}
        photoItem={samplePhoto}
        productId="prod_001"
        artisanId="artisan_001"
        onApprove={mockApprove}
        onReject={mockReject}
      />
    );

    expect(screen.getByText(/AI Image Studio — Photograph Enhancement/i)).toBeInTheDocument();
    expect(screen.getByText(/Removes cluttered background cleanly/i)).toBeInTheDocument();

    const enhanceButton = screen.getByRole('button', { name: /Enhance with AI/i });
    expect(enhanceButton).toBeDisabled();

    // Check the consent checkbox
    const checkbox = screen.getByRole('checkbox');
    fireEvent.click(checkbox);

    expect(enhanceButton).not.toBeDisabled();
  });

  it('transitions to processing state and then to review comparison upon enhancement', async () => {
    render(
      <AIEnhancementModal
        isOpen={true}
        onClose={mockClose}
        photoItem={samplePhoto}
        productId="prod_001"
        artisanId="artisan_001"
        onApprove={mockApprove}
        onReject={mockReject}
      />
    );

    // Consent and submit
    const checkbox = screen.getByRole('checkbox');
    fireEvent.click(checkbox);

    const enhanceButton = screen.getByRole('button', { name: /Enhance with AI/i });
    fireEvent.click(enhanceButton);

    await waitFor(() => {
      expect(screen.getByText(/Compare the original photo with the enhanced catalogue version below/i)).toBeInTheDocument();
    });

    expect(screen.getByText(/Approve Enhanced Image/i)).toBeInTheDocument();
    expect(screen.getByText(/Decline & Use Original/i)).toBeInTheDocument();
  });

  it('calls onApprove with job result when artisan clicks Approve', async () => {
    render(
      <AIEnhancementModal
        isOpen={true}
        onClose={mockClose}
        photoItem={samplePhoto}
        productId="prod_001"
        artisanId="artisan_001"
        onApprove={mockApprove}
        onReject={mockReject}
      />
    );

    // Consent and submit
    fireEvent.click(screen.getByRole('checkbox'));
    fireEvent.click(screen.getByRole('button', { name: /Enhance with AI/i }));

    await waitFor(() => {
      expect(screen.getByText(/Approve Enhanced Image/i)).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText(/Approve Enhanced Image/i));

    expect(mockApprove).toHaveBeenCalledTimes(1);
    expect(mockApprove).toHaveBeenCalledWith('photo_test_1', expect.objectContaining({
      job_id: 'job_modal_test',
      status: 'succeeded',
    }));
    expect(mockClose).toHaveBeenCalledTimes(1);
  });

  it('calls onReject when artisan clicks Decline & Use Original', async () => {
    render(
      <AIEnhancementModal
        isOpen={true}
        onClose={mockClose}
        photoItem={samplePhoto}
        productId="prod_001"
        artisanId="artisan_001"
        onApprove={mockApprove}
        onReject={mockReject}
      />
    );

    // Consent and submit
    fireEvent.click(screen.getByRole('checkbox'));
    fireEvent.click(screen.getByRole('button', { name: /Enhance with AI/i }));

    await waitFor(() => {
      expect(screen.getByText(/Decline & Use Original/i)).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText(/Decline & Use Original/i));

    expect(mockReject).toHaveBeenCalledTimes(1);
    expect(mockReject).toHaveBeenCalledWith('photo_test_1');
    expect(mockClose).toHaveBeenCalledTimes(1);
  });
});