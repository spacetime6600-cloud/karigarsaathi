import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { permissionService } from '@/services/permissions/permissionService';

describe('PermissionService — Microphone & Camera Diagnostics and Scenarios', () => {
  beforeEach(() => {
    permissionService.resetPermissions();
    vi.restoreAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('1. Initializes with prompt state', () => {
    const permissions = permissionService.getPermissions();
    expect(permissions.camera).toBe('prompt');
    expect(permissions.microphone).toBe('prompt');
  });

  it('2. Updates and persists permission state changes', () => {
    permissionService.setPermission('camera', 'granted');
    expect(permissionService.getPermission('camera')).toBe('granted');

    permissionService.setPermission('camera', 'denied');
    expect(permissionService.getPermission('camera')).toBe('denied');
  });

  it('3. Captures comprehensive diagnostic snapshot', async () => {
    const diag = await permissionService.getMicrophoneDiagnostics();
    expect(diag).toHaveProperty('origin');
    expect(diag).toHaveProperty('isSecureContext');
    expect(diag).toHaveProperty('hasMediaDevices');
    expect(diag).toHaveProperty('hasGetUserMedia');
    expect(diag).toHaveProperty('hasMediaRecorder');
    expect(diag).toHaveProperty('permissionQueryStatus');
    expect(['granted', 'denied', 'prompt', 'unknown']).toContain(diag.permissionQueryStatus);
  });

  it('4. Detects Insecure Context and provides precise guidance', async () => {
    const originalSecure = window.isSecureContext;
    Object.defineProperty(window, 'isSecureContext', { value: false, configurable: true });

    const result = await permissionService.requestMicrophone();
    expect(result.status).toBe('insecure_context');
    expect(result.error).toContain('Secure Context');
    expect(result.recoveryInstructions).toContain('localhost');

    Object.defineProperty(window, 'isSecureContext', { value: originalSecure, configurable: true });
  });

  it('5. Handles NotAllowedError / PermissionDeniedError', async () => {
    Object.defineProperty(window, 'isSecureContext', { value: true, configurable: true });
    const mockGetUserMedia = vi.fn().mockRejectedValue({ name: 'NotAllowedError', message: 'Permission denied' });
    Object.defineProperty(navigator, 'mediaDevices', {
      value: { getUserMedia: mockGetUserMedia },
      configurable: true,
    });

    const result = await permissionService.requestMicrophone();
    expect(result.status).toBe('denied');
    expect(result.error).toContain('denied');
    expect(result.recoveryInstructions).toMatch(/lock|settings|Windows/i);
  });

  it('6. Handles NotFoundError when no microphone is connected', async () => {
    Object.defineProperty(window, 'isSecureContext', { value: true, configurable: true });
    const mockGetUserMedia = vi.fn().mockRejectedValue({ name: 'NotFoundError', message: 'Requested device not found' });
    Object.defineProperty(navigator, 'mediaDevices', {
      value: { getUserMedia: mockGetUserMedia },
      configurable: true,
    });

    const result = await permissionService.requestMicrophone();
    expect(result.status).toBe('unavailable');
    expect(result.error).toMatch(/no microphone/i);
    expect(result.recoveryInstructions).toMatch(/connect a microphone|upload/i);
  });

  it('7. Handles NotReadableError when microphone is locked by another application', async () => {
    Object.defineProperty(window, 'isSecureContext', { value: true, configurable: true });
    const mockGetUserMedia = vi.fn().mockRejectedValue({ name: 'NotReadableError', message: 'Could not start audio source' });
    Object.defineProperty(navigator, 'mediaDevices', {
      value: { getUserMedia: mockGetUserMedia },
      configurable: true,
    });

    const result = await permissionService.requestMicrophone();
    expect(result.status).toBe('blocked');
    expect(result.error).toMatch(/in use by another application/i);
  });

  it('8. Aborts and releases stream if permission request is cancelled', async () => {
    Object.defineProperty(window, 'isSecureContext', { value: true, configurable: true });
    const stopMock = vi.fn();
    const mockStream = { getTracks: () => [{ stop: stopMock }] } as unknown as MediaStream;
    const mockGetUserMedia = vi.fn().mockResolvedValue(mockStream);
    Object.defineProperty(navigator, 'mediaDevices', {
      value: { getUserMedia: mockGetUserMedia },
      configurable: true,
    });

    const controller = new AbortController();
    controller.abort(); // pre-aborted

    const result = await permissionService.requestMicrophone(controller.signal);
    expect(result.status).toBe('dismissed');
  });

  it('9. Releases MediaStream tracks cleanly on stopMediaStream call', () => {
    const stopMock = vi.fn();
    const mockStream = {
      getTracks: () => [{ stop: stopMock }, { stop: stopMock }],
    } as unknown as MediaStream;

    permissionService.stopMediaStream(mockStream);
    expect(stopMock).toHaveBeenCalledTimes(2);
  });
});
