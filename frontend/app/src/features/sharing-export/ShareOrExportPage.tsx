import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useProductDraft } from '@/app/providers/ProductDraftProvider';
import { useAuth } from '@/app/providers/AuthProvider';
import { useLanguage } from '@/app/providers/LanguageProvider';
import { whatsappService } from '@/services/export/whatsappService';
import { csvExportService } from '@/services/export/csvExportService';
import { jsonExportService } from '@/services/export/jsonExportService';
import { pdfExportService } from '@/services/export/pdfExportService';
import { marketplaceAdapters } from '@/services/adapters/marketplaceAdapters';
import { exportAuditService } from '@/services/audit/exportAuditService';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Modal } from '@/components/ui/Modal';
import {
  MessageCircle,
  FileText,
  Download,
  Share2,
  Check,
  Globe,
  ShoppingBag,
  Building,
  Code2,
  AlertCircle,
  Home,
  CheckCircle2,
  ExternalLink,
} from 'lucide-react';
import { MarketplaceChannel } from '@/types';

export const ShareOrExportPage: React.FC = () => {
  const { draft, updateDraft } = useProductDraft();
  const { user } = useAuth();
  const { t } = useLanguage();
  const navigate = useNavigate();

  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedMessage, setCopiedMessage] = useState(false);
  const [exportNotice, setExportNotice] = useState<string | null>(null);

  // Marketplace Modal Preview State
  const [activeChannelModal, setActiveChannelModal] = useState<MarketplaceChannel | null>(null);
  const [preparedPayload, setPreparedPayload] = useState<Record<string, unknown> | null>(null);

  const ownerId = user?.id || draft.ownerId || '';
  const passportSlug = draft.passportSlug || draft.passportId || 'chanderi-silk-saree-kamrup-7721';
  const baseUrl = typeof window !== 'undefined' ? window.location.origin : 'https://karigarsaathi.web.app';
  const publicPassportUrl = `${baseUrl}/passport/${passportSlug}`;

  const shareParams = {
    productTitle: draft.title,
    artisanName: user?.name,
    location: draft.origin,
    publicPassportUrl,
  };

  // 1. WhatsApp Action
  const handleWhatsAppShare = async () => {
    const key = exportAuditService.getIdempotencyKey(ownerId, draft.id, 'whatsapp', 'shared');
    if (!exportAuditService.isDuplicate(key)) {
      const audit = exportAuditService.createRecord({
        ownerId,
        productId: draft.id,
        format: 'whatsapp',
        action: 'shared',
        status: 'completed',
      });
      exportAuditService.logAudit(audit);
    }

    updateDraft({ lifecycleStatus: 'shared' });
    await whatsappService.shareOrRedirect(shareParams);
  };

  const handleCopyWhatsAppMessage = async () => {
    const success = await whatsappService.copyShareMessage(shareParams);
    if (success) {
      setCopiedMessage(true);
      setTimeout(() => setCopiedMessage(false), 2500);
    }
  };

  const handleCopyLink = async () => {
    const success = await whatsappService.copyPublicUrl(publicPassportUrl);
    if (success) {
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2500);
    }
  };

  // 2. PDF Spec Sheet Action
  const handleExportPdf = async () => {
    const key = exportAuditService.getIdempotencyKey(ownerId, draft.id, 'pdf', 'downloaded');
    if (!exportAuditService.isDuplicate(key)) {
      const audit = exportAuditService.createRecord({
        ownerId,
        productId: draft.id,
        format: 'pdf',
        action: 'downloaded',
        status: 'completed',
      });
      exportAuditService.logAudit(audit);
    }

    updateDraft({ lifecycleStatus: 'exported' });
    await pdfExportService.exportToPrintablePdf(
      [{ draft, publicUrl: publicPassportUrl }],
      `${draft.title || 'Product'} Spec Sheet`
    );
  };

  // 3. CSV Export Action
  const handleExportCsv = () => {
    const key = exportAuditService.getIdempotencyKey(ownerId, draft.id, 'csv', 'downloaded');
    if (!exportAuditService.isDuplicate(key)) {
      const audit = exportAuditService.createRecord({
        ownerId,
        productId: draft.id,
        format: 'csv',
        action: 'downloaded',
        status: 'completed',
      });
      exportAuditService.logAudit(audit);
    }

    updateDraft({ lifecycleStatus: 'exported' });
    const row = csvExportService.draftToCsvRow(draft, undefined, publicPassportUrl);
    const csvContent = csvExportService.generateCsvContent([row]);
    const cleanTitle = (draft.title || 'product').toLowerCase().replace(/[^a-z0-9_-]/g, '_');
    csvExportService.downloadCsv(csvContent, `${cleanTitle}-catalogue.csv`);

    setExportNotice('CSV spreadsheet exported successfully.');
    setTimeout(() => setExportNotice(null), 3000);
  };

  // 4. Structured JSON Export Action
  const handleExportJson = () => {
    const key = exportAuditService.getIdempotencyKey(ownerId, draft.id, 'json', 'downloaded');
    if (!exportAuditService.isDuplicate(key)) {
      const audit = exportAuditService.createRecord({
        ownerId,
        productId: draft.id,
        format: 'json',
        action: 'downloaded',
        status: 'completed',
      });
      exportAuditService.logAudit(audit);
    }

    updateDraft({ lifecycleStatus: 'exported' });
    const jsonStr = jsonExportService.exportToJsonString([draft], {
      [draft.id]: { publicUrl: publicPassportUrl, slug: passportSlug, passportId: draft.passportId },
    });
    const cleanTitle = (draft.title || 'product').toLowerCase().replace(/[^a-z0-9_-]/g, '_');
    jsonExportService.downloadJson(jsonStr, `${cleanTitle}-structured-export.json`);

    setExportNotice('Structured JSON export generated successfully.');
    setTimeout(() => setExportNotice(null), 3000);
  };

  // 5. Marketplace Adapter Preparation Modal
  const handleOpenMarketplaceModal = async (channel: MarketplaceChannel) => {
    const adapter = marketplaceAdapters[channel];
    if (!adapter) return;

    const prep = await adapter.prepare(draft, undefined, publicPassportUrl);
    setPreparedPayload(prep.payload);
    setActiveChannelModal(channel);
  };

  const handleDownloadChannelJson = async () => {
    if (!activeChannelModal) return;
    const adapter = marketplaceAdapters[activeChannelModal];
    const prep = await adapter.prepare(draft, undefined, publicPassportUrl);
    const artifact = await adapter.export(prep);

    const blob = new Blob([artifact.data as string], { type: artifact.mimeType });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = artifact.fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    setExportNotice(`${adapter.displayName} export file downloaded.`);
    setTimeout(() => setExportNotice(null), 3000);
  };

  return (
    <div className="w-full flex flex-col gap-6 animate-in fade-in duration-200">
      {/* Step Header */}
      <div className="flex flex-col gap-1">
        <h1 className="font-display text-2xl sm:text-3xl font-bold text-primary tracking-tight">
          {t('productCreation.step8Title')}
        </h1>
        <p className="text-sm sm:text-base text-on-surface-variant">
          {t('productCreation.step8Subtitle')}
        </p>
      </div>

      {exportNotice && (
        <div className="p-3 bg-success-container/40 border border-success/40 text-success rounded-xl text-xs font-semibold flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4" />
          <span>{exportNotice}</span>
        </div>
      )}

      {/* Export Options Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Option 1: WhatsApp Share */}
        <Card className="p-5 bg-white rounded-2xl border border-surface-variant/80 hover:border-secondary transition-all card-shadow flex flex-col justify-between gap-4">
          <div className="flex items-start gap-4">
            <div className="w-11 h-11 rounded-xl bg-green-100 text-green-700 flex items-center justify-center shrink-0">
              <MessageCircle className="w-5 h-5" />
            </div>
            <div className="flex flex-col gap-1 flex-1">
              <div className="flex items-center gap-2">
                <h2 className="font-bold text-sm text-primary">WhatsApp Buyer Share</h2>
                <Badge variant="success" className="text-[10px]">Instant</Badge>
              </div>
              <p className="text-xs text-on-surface-variant leading-relaxed">
                Send verified craft details, certified pricing, and live Craft Passport link directly to buyers.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 pt-2 border-t border-surface-variant/50">
            <Button
              size="sm"
              onClick={handleWhatsAppShare}
              className="flex-1 text-xs font-bold bg-green-700 hover:bg-green-800"
            >
              Share on WhatsApp
            </Button>
            <Button
              size="sm"
              variant="secondary"
              onClick={handleCopyWhatsAppMessage}
              className="text-xs font-bold"
            >
              {copiedMessage ? 'Copied Message!' : 'Copy Text'}
            </Button>
          </div>
        </Card>

        {/* Option 2: Printable PDF Spec Sheet */}
        <Card className="p-5 bg-white rounded-2xl border border-surface-variant/80 hover:border-secondary transition-all card-shadow flex flex-col justify-between gap-4">
          <div className="flex items-start gap-4">
            <div className="w-11 h-11 rounded-xl bg-primary-fixed text-primary flex items-center justify-center shrink-0">
              <FileText className="w-5 h-5" />
            </div>
            <div className="flex flex-col gap-1 flex-1">
              <div className="flex items-center gap-2">
                <h2 className="font-bold text-sm text-primary">Printable Bulk-Buyer PDF</h2>
                <Badge variant="neutral" className="text-[10px]">Spec Sheet</Badge>
              </div>
              <p className="text-xs text-on-surface-variant leading-relaxed">
                Generate a clean, print-ready specification sheet with QR code, materials, dimensions, and wholesale pricing.
              </p>
            </div>
          </div>

          <div className="pt-2 border-t border-surface-variant/50">
            <Button
              size="sm"
              variant="secondary"
              onClick={handleExportPdf}
              leftIcon={<Download className="w-3.5 h-3.5" />}
              className="w-full text-xs font-bold"
            >
              Generate Printable PDF
            </Button>
          </div>
        </Card>

        {/* Option 3: CSV Spreadsheet Export */}
        <Card className="p-5 bg-white rounded-2xl border border-surface-variant/80 hover:border-secondary transition-all card-shadow flex flex-col justify-between gap-4">
          <div className="flex items-start gap-4">
            <div className="w-11 h-11 rounded-xl bg-secondary/10 text-secondary flex items-center justify-center shrink-0">
              <Download className="w-5 h-5" />
            </div>
            <div className="flex flex-col gap-1 flex-1">
              <div className="flex items-center gap-2">
                <h2 className="font-bold text-sm text-primary">Spreadsheet CSV Export</h2>
                <Badge variant="neutral" className="text-[10px]">Excel / Sheets</Badge>
              </div>
              <p className="text-xs text-on-surface-variant leading-relaxed">
                Export clean UTF-8 CSV with formula injection defense for spreadsheet management and inventory tracking.
              </p>
            </div>
          </div>

          <div className="pt-2 border-t border-surface-variant/50">
            <Button
              size="sm"
              variant="secondary"
              onClick={handleExportCsv}
              leftIcon={<Download className="w-3.5 h-3.5" />}
              className="w-full text-xs font-bold"
            >
              Download CSV (.csv)
            </Button>
          </div>
        </Card>

        {/* Option 4: Structured JSON Export */}
        <Card className="p-5 bg-white rounded-2xl border border-surface-variant/80 hover:border-secondary transition-all card-shadow flex flex-col justify-between gap-4">
          <div className="flex items-start gap-4">
            <div className="w-11 h-11 rounded-xl bg-surface-container-high text-primary flex items-center justify-center shrink-0">
              <Code2 className="w-5 h-5" />
            </div>
            <div className="flex flex-col gap-1 flex-1">
              <div className="flex items-center gap-2">
                <h2 className="font-bold text-sm text-primary">Structured JSON Export</h2>
                <Badge variant="terracotta" className="text-[10px]">v1.0.0</Badge>
              </div>
              <p className="text-xs text-on-surface-variant leading-relaxed">
                Standard versioned catalogue export with verified provenance claims and language variants.
              </p>
            </div>
          </div>

          <div className="pt-2 border-t border-surface-variant/50">
            <Button
              size="sm"
              variant="secondary"
              onClick={handleExportJson}
              leftIcon={<Download className="w-3.5 h-3.5" />}
              className="w-full text-xs font-bold"
            >
              Download JSON (.json)
            </Button>
          </div>
        </Card>
      </div>

      {/* Marketplace Channel Preparation Section */}
      <div className="flex flex-col gap-3 pt-4 border-t border-surface-variant/70">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="font-display text-lg font-bold text-primary">
              Marketplace Channel Preparation
            </h2>
            <p className="text-xs text-on-surface-variant">
              Prepare standardized submission files for external e-commerce and handloom portals.
            </p>
          </div>
          <Badge variant="neutral" className="text-[10px]">Export Prepared Only</Badge>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {/* Channel: ONDC */}
          <Card className="p-4 bg-white rounded-xl border border-surface-variant flex flex-col justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <Globe className="w-4 h-4 text-secondary" />
              <h3 className="font-bold text-xs text-primary">ONDC Retail Protocol</h3>
            </div>
            <p className="text-[11px] text-on-surface-variant leading-relaxed">
              Standard Beckn catalog schema for ONDC seller apps.
            </p>
            <Button
              size="sm"
              variant="secondary"
              onClick={() => handleOpenMarketplaceModal('ondc')}
              className="w-full text-xs font-bold py-1"
            >
              Prepare & Preview
            </Button>
          </Card>

          {/* Channel: Indiahandmade */}
          <Card className="p-4 bg-white rounded-xl border border-surface-variant flex flex-col justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <ShoppingBag className="w-4 h-4 text-secondary" />
              <h3 className="font-bold text-xs text-primary">Indiahandmade Portal</h3>
            </div>
            <p className="text-[11px] text-on-surface-variant leading-relaxed">
              Ministry of Textiles artisan batch specification.
            </p>
            <Button
              size="sm"
              variant="secondary"
              onClick={() => handleOpenMarketplaceModal('indiahandmade')}
              className="w-full text-xs font-bold py-1"
            >
              Prepare & Preview
            </Button>
          </Card>

          {/* Channel: GeM ODOP */}
          <Card className="p-4 bg-white rounded-xl border border-surface-variant flex flex-col justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <Building className="w-4 h-4 text-secondary" />
              <h3 className="font-bold text-xs text-primary">GeM ODOP Handlooms</h3>
            </div>
            <p className="text-[11px] text-on-surface-variant leading-relaxed">
              Government e-Marketplace ODOP procurement format.
            </p>
            <Button
              size="sm"
              variant="secondary"
              onClick={() => handleOpenMarketplaceModal('gem_odop')}
              className="w-full text-xs font-bold py-1"
            >
              Prepare & Preview
            </Button>
          </Card>
        </div>
      </div>

      {/* Action Footer */}
      <div className="flex items-center justify-between pt-6 border-t border-surface-variant/70">
        <Button
          variant="ghost"
          onClick={handleCopyLink}
          leftIcon={copiedLink ? <Check className="w-3.5 h-3.5 text-success" /> : <Share2 className="w-3.5 h-3.5" />}
          className="text-xs"
        >
          {copiedLink ? 'Public Link Copied!' : 'Copy Passport URL'}
        </Button>

        <Button
          size="md"
          onClick={() => navigate('/artisan/inventory')}
          leftIcon={<Home className="w-4 h-4" />}
          className="font-bold text-xs px-6"
        >
          Return to Inventory Management
        </Button>
      </div>

      {/* Marketplace Preparation Modal */}
      <Modal
        isOpen={Boolean(activeChannelModal)}
        onClose={() => {
          setActiveChannelModal(null);
          setPreparedPayload(null);
        }}
        title={`${activeChannelModal ? marketplaceAdapters[activeChannelModal]?.displayName : 'Channel'} Preparation`}
      >
        <div className="flex flex-col gap-4">
          <div className="p-3 bg-surface-container-low rounded-xl text-xs flex flex-col gap-1 border border-surface-variant">
            <div className="flex items-center gap-1.5 font-bold text-primary">
              <AlertCircle className="w-3.5 h-3.5 text-secondary" />
              <span>Export prepared — external submission not connected.</span>
            </div>
            <p className="text-[11px] text-on-surface-variant">
              This structured file is formatted to channel specifications. Direct API submission requires verified channel credentials.
            </p>
          </div>

          <div className="flex flex-col gap-1.5">
            <span className="text-[11px] font-bold text-on-surface-variant uppercase">
              Generated Payload Preview
            </span>
            <pre className="p-3 bg-surface-container-lowest border border-surface-variant rounded-xl font-mono text-[10px] text-primary overflow-x-auto max-h-56">
              {JSON.stringify(preparedPayload, null, 2)}
            </pre>
          </div>

          <div className="flex items-center justify-between pt-2 border-t border-surface-variant">
            {activeChannelModal === 'indiahandmade' ? (
              <a
                href="https://indiahandmade.com/artisan-login"
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs font-bold text-secondary hover:underline flex items-center gap-1"
              >
                <span>Open Artisan Portal</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            ) : <div />}

            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setActiveChannelModal(null)}
                className="text-xs"
              >
                Close
              </Button>
              <Button
                size="sm"
                onClick={handleDownloadChannelJson}
                leftIcon={<Download className="w-3.5 h-3.5" />}
                className="text-xs font-bold"
              >
                Download Channel JSON
              </Button>
            </div>
          </div>
        </div>
      </Modal>
    </div>
  );
};
