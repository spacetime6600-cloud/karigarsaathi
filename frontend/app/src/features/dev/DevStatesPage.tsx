import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/app/providers/AuthProvider';
import { useSync } from '@/app/providers/SyncProvider';
import { useProductDraft } from '@/app/providers/ProductDraftProvider';
import { storage } from '@/services/storage/localStorage';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Shield, Trash2, Wifi, WifiOff, ExternalLink } from 'lucide-react';

export const DevStatesPage: React.FC = () => {
  const { user, switchRole } = useAuth();
  const { isOnline, toggleSimulatedOffline } = useSync();
  const { resetDraft } = useProductDraft();

  const [toggles, setToggles] = useState({
    cameraDenied: localStorage.getItem('simulate_camera_denied') === 'true',
    micDenied: localStorage.getItem('simulate_mic_denied') === 'true',
    passportFailed: localStorage.getItem('simulate_passport_failed') === 'true',
    exportFailed: localStorage.getItem('simulate_export_failed') === 'true',
    whatsAppUnavailable: localStorage.getItem('simulate_whatsapp_unavailable') === 'true',
    enquiryWaiting: localStorage.getItem('simulate_enquiry_waiting') === 'true',
  });

  const handleToggle = (key: keyof typeof toggles, storageKey: string) => {
    const nextVal = !toggles[key];
    setToggles((prev) => ({ ...prev, [key]: nextVal }));
    localStorage.setItem(storageKey, String(nextVal));
  };

  const handleResetAllData = () => {
    storage.clearAll();
    localStorage.clear();
    resetDraft();
    alert('All local demo storage and test state flags have been cleared.');
    window.location.reload();
  };

  const recoveryStatesList = [
    {
      id: 'camera_denied',
      title: '04 Camera Permission Denied',
      desc: 'Triggers camera permission blocked fallback and file manager selection.',
      targetRoute: '/artisan/products/new/photos',
      key: 'cameraDenied' as const,
      storageKey: 'simulate_camera_denied',
    },
    {
      id: 'mic_denied',
      title: '05 Microphone Permission Denied',
      desc: 'Triggers audio permission blocked fallback to manual text inputs.',
      targetRoute: '/artisan/products/new/details',
      key: 'micDenied' as const,
      storageKey: 'simulate_mic_denied',
    },
    {
      id: 'passport_failed',
      title: '05 Craft Passport Creation Failed',
      desc: 'Simulates cryptographic QR minting failure with local draft retry.',
      targetRoute: '/artisan/products/new/approve',
      key: 'passportFailed' as const,
      storageKey: 'simulate_passport_failed',
    },
    {
      id: 'export_failed',
      title: '06 Export Failed',
      desc: 'Simulates export rendering interruption with retry action.',
      targetRoute: '/artisan/products/new/share',
      key: 'exportFailed' as const,
      storageKey: 'simulate_export_failed',
    },
    {
      id: 'whatsapp_unavailable',
      title: '07 WhatsApp Unavailable',
      desc: 'Triggers WhatsApp fallback dialog with copy message & public link actions.',
      targetRoute: '/artisan/products/new/share',
      key: 'whatsAppUnavailable' as const,
      storageKey: 'simulate_whatsapp_unavailable',
    },
    {
      id: 'enquiry_waiting',
      title: '08 Enquiry Waiting to Send',
      desc: 'Queues reply in offline local storage until connection is restored.',
      targetRoute: '/artisan/enquiries/enq_101',
      key: 'enquiryWaiting' as const,
      storageKey: 'simulate_enquiry_waiting',
    },
  ];

  return (
    <div className="min-h-screen bg-app-bg p-6 sm:p-10 max-w-5xl mx-auto flex flex-col gap-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-surface-variant pb-6">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold bg-primary text-white px-2.5 py-0.5 rounded-full uppercase tracking-wider">
              Reviewer Test Harness
            </span>
            <span className="text-xs text-secondary font-bold">Phase 5 State Control</span>
          </div>
          <h1 className="font-display text-3xl font-bold text-primary mt-1">
            Recovery & Permission Test Sandbox
          </h1>
          <p className="text-xs text-on-surface-variant mt-1">
            Toggle simulated environment exceptions to test deterministic recovery flows across the application.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            to="/artisan/dashboard"
            className="px-4 py-2.5 bg-primary text-white rounded-md text-xs font-bold hover:bg-primary-container touch-target"
          >
            ← Open Application
          </Link>
          <Button
            size="sm"
            variant="danger"
            onClick={handleResetAllData}
            leftIcon={<Trash2 className="w-4 h-4" />}
            className="text-xs font-bold"
          >
            Reset Demo Data
          </Button>
        </div>
      </div>

      {/* Global State Modifiers */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="p-6 flex flex-col gap-4 bg-surface-container-lowest border border-surface-variant">
          <h3 className="font-bold text-base text-primary flex items-center gap-2">
            <Shield className="w-5 h-5 text-secondary" />
            Simulated User Role
          </h3>
          <p className="text-xs text-on-surface-variant">
            Currently active: <strong>{user?.name}</strong> ({user?.role})
          </p>
          <div className="flex items-center gap-3">
            <Button
              size="sm"
              variant={user?.role === 'artisan' ? 'primary' : 'secondary'}
              onClick={() => switchRole('artisan')}
              className="text-xs font-bold"
            >
              Artisan Profile
            </Button>
            <Button
              size="sm"
              variant={user?.role === 'coordinator' ? 'primary' : 'secondary'}
              onClick={() => switchRole('coordinator')}
              className="text-xs font-bold"
            >
              Coordinator Profile
            </Button>
          </div>
        </Card>

        <Card className="p-6 flex flex-col gap-4 bg-surface-container-lowest border border-surface-variant">
          <h3 className="font-bold text-base text-primary flex items-center gap-2">
            {isOnline ? <Wifi className="w-5 h-5 text-success" /> : <WifiOff className="w-5 h-5 text-error" />}
            Network Connectivity Simulation
          </h3>
          <p className="text-xs text-on-surface-variant">
            Status: <strong>{isOnline ? 'Online (Connected)' : 'Offline (Simulated)'}</strong>
          </p>
          <div className="flex items-center gap-3">
            <Button
              size="sm"
              variant={isOnline ? 'primary' : 'secondary'}
              onClick={() => toggleSimulatedOffline(false)}
              className="text-xs font-bold"
            >
              Force Online
            </Button>
            <Button
              size="sm"
              variant={!isOnline ? 'danger' : 'secondary'}
              onClick={() => toggleSimulatedOffline(true)}
              className="text-xs font-bold"
            >
              Force Offline Mode
            </Button>
          </div>
        </Card>
      </div>

      {/* Recovery State Triggers */}
      <div className="flex flex-col gap-4">
        <h2 className="font-display text-xl font-bold text-primary">
          Contextual Recovery State Toggles
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {recoveryStatesList.map((item) => {
            const isActive = toggles[item.key];

            return (
              <Card
                key={item.id}
                className="p-5 flex flex-col justify-between gap-3 bg-surface-container-lowest border border-surface-variant"
              >
                <div className="flex flex-col gap-1">
                  <div className="flex items-center justify-between">
                    <h3 className="font-bold text-sm text-primary">{item.title}</h3>
                    <Badge variant={isActive ? 'warning' : 'neutral'}>
                      {isActive ? 'Simulating Exception' : 'Normal'}
                    </Badge>
                  </div>
                  <p className="text-xs text-on-surface-variant">{item.desc}</p>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-surface-variant">
                  <button
                    onClick={() => handleToggle(item.key, item.storageKey)}
                    className={`px-3 py-1.5 rounded-md text-xs font-bold transition-colors touch-target ${
                      isActive
                        ? 'bg-warning text-white hover:bg-amber-700'
                        : 'bg-surface-container text-primary hover:bg-surface-container-high'
                    }`}
                  >
                    {isActive ? 'Disable Simulation' : 'Enable Exception'}
                  </button>

                  <Link
                    to={item.targetRoute}
                    className="text-xs font-bold text-secondary hover:underline flex items-center gap-1 touch-target"
                  >
                    Open Screen <ExternalLink className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </Card>
            );
          })}
        </div>
      </div>
    </div>
  );
};
