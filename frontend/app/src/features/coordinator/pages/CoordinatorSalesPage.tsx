import React, { useState, useEffect } from 'react';
import { useAuth } from '@/app/providers/AuthProvider';
import { coordinatorService } from '@/services/coordinator/coordinatorService';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import {
  CheckCircle2,
  FileSpreadsheet,
  FileCode,
  Building,
  Loader2,
  Info,
} from 'lucide-react';
import { clsx } from 'clsx';

export const CoordinatorSalesPage: React.FC = () => {
  const { user, userAccount } = useAuth();

  const [metrics, setMetrics] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dateRange, setDateRange] = useState<'30d' | 'quarter' | 'all'>('all');

  const coordinatorUid = userAccount?.uid || user?.id || 'coord_001';

  useEffect(() => {
    let isMounted = true;
    async function loadSalesMetrics() {
      setLoading(true);
      setError(null);
      try {
        const data = await coordinatorService.getAssignedMetrics(coordinatorUid, dateRange);
        if (isMounted) {
          setMetrics(data);
        }
      } catch (err: unknown) {
        if (isMounted) {
          setError(err instanceof Error ? err.message : 'Failed to load sales reports.');
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    loadSalesMetrics();
    return () => {
      isMounted = false;
    };
  }, [coordinatorUid, dateRange]);

  const handleDownload = async (format: 'csv' | 'json') => {
    try {
      const data = await coordinatorService.exportClusterReport(coordinatorUid, format);
      const mimeType = format === 'csv' ? 'text/csv;charset=utf-8;' : 'application/json;charset=utf-8;';
      const blob = new Blob([data], { type: mimeType });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `cluster_report_${dateRange}_${new Date().toISOString().slice(0, 10)}.${format}`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch {
      alert('Failed to generate export file.');
    }
  };

  if (loading) {
    return (
      <div className="py-24 flex flex-col items-center justify-center gap-3 text-on-surface-variant">
        <Loader2 className="w-8 h-8 text-secondary animate-spin" />
        <p className="text-xs font-semibold">Compiling cluster sales and export metrics...</p>
      </div>
    );
  }

  if (error) {
    return (
      <Card className="p-8 text-center flex flex-col items-center gap-3 bg-white border border-error/30 rounded-2xl max-w-md mx-auto my-12">
        <Info className="w-8 h-8 text-error" />
        <h3 className="font-bold text-base text-primary">Unable to load reports</h3>
        <p className="text-xs text-on-surface-variant leading-relaxed">{error}</p>
        <Button onClick={() => window.location.reload()} size="sm" className="mt-2 text-xs">
          Retry
        </Button>
      </Card>
    );
  }

  return (
    <div className="flex flex-col gap-6 w-full animate-in fade-in duration-200">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-surface-variant/80 pb-6">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-secondary uppercase tracking-wider">
              Analytics & Exports
            </span>
            <Badge variant="indigo" className="text-[10px] uppercase font-bold">
              Verified Metrics
            </Badge>
          </div>
          <h2 className="font-display text-2xl sm:text-3xl font-bold text-primary tracking-tight mt-1">
            Cluster Sales & Reports
          </h2>
          <p className="text-xs sm:text-sm text-on-surface-variant mt-0.5">
            Verified performance reports, cluster-wide turnover, and batch export diagnostics for assigned clusters.
          </p>
        </div>

        {/* Date Filter & Export CTAs */}
        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex items-center bg-surface-container rounded-xl p-1 text-xs font-bold">
            <button
              type="button"
              onClick={() => setDateRange('30d')}
              className={clsx(
                'px-3 py-1.5 rounded-lg transition-all',
                dateRange === '30d' ? 'bg-white text-primary shadow-xs' : 'text-on-surface-variant hover:text-primary'
              )}
            >
              Last 30 Days
            </button>
            <button
              type="button"
              onClick={() => setDateRange('quarter')}
              className={clsx(
                'px-3 py-1.5 rounded-lg transition-all',
                dateRange === 'quarter' ? 'bg-white text-primary shadow-xs' : 'text-on-surface-variant hover:text-primary'
              )}
            >
              This Quarter
            </button>
            <button
              type="button"
              onClick={() => setDateRange('all')}
              className={clsx(
                'px-3 py-1.5 rounded-lg transition-all',
                dateRange === 'all' ? 'bg-white text-primary shadow-xs' : 'text-on-surface-variant hover:text-primary'
              )}
            >
              All Time
            </button>
          </div>

          <Button
            size="sm"
            variant="secondary"
            onClick={() => handleDownload('csv')}
            leftIcon={<FileSpreadsheet className="w-3.5 h-3.5" />}
            className="text-xs font-bold"
          >
            Export CSV
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => handleDownload('json')}
            leftIcon={<FileCode className="w-3.5 h-3.5" />}
            className="text-xs font-bold border border-surface-variant"
          >
            JSON
          </Button>
        </div>
      </div>

      {/* Verified Sales Integrity Notice */}
      <div className="p-4 bg-primary/[0.03] border border-primary/[0.08] rounded-2xl flex items-start gap-3 text-xs">
        <Info className="w-4 h-4 text-secondary shrink-0 mt-0.5" />
        <div className="flex flex-col gap-0.5">
          <span className="font-bold text-primary">Data Integrity Standard</span>
          <p className="text-on-surface-variant leading-relaxed">
            Sales totals reflect only closed orders with verified status (<strong>order_confirmed</strong>). Unanswered enquiries, estimated valuations, and draft products are honestly separated and not counted as confirmed revenue.
          </p>
        </div>
      </div>

      {/* Top 3 Metric Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <Card className="p-5 bg-white border border-surface-variant/80 rounded-2xl shadow-xs flex flex-col justify-between gap-3">
          <span className="text-xs font-bold text-on-surface-variant uppercase tracking-wider">
            Confirmed Orders
          </span>
          <span className="text-3xl font-bold text-primary">
            {metrics?.confirmedSalesCount || 0}
          </span>
          <span className="text-[11px] text-success font-semibold flex items-center gap-1">
            <CheckCircle2 className="w-3.5 h-3.5" /> Verified Transactions
          </span>
        </Card>

        <Card className="p-5 bg-white border border-surface-variant/80 rounded-2xl shadow-xs flex flex-col justify-between gap-3">
          <span className="text-xs font-bold text-on-surface-variant uppercase tracking-wider">
            Total Cluster Turnover
          </span>
          <span className="text-3xl font-bold text-secondary">
            ₹{(metrics?.confirmedSalesVolume || 0).toLocaleString('en-IN')}
          </span>
          <span className="text-[11px] text-on-surface-variant">
            Gross direct artisan earnings
          </span>
        </Card>

        <Card className="p-5 bg-white border border-surface-variant/80 rounded-2xl shadow-xs flex flex-col justify-between gap-3">
          <span className="text-xs font-bold text-on-surface-variant uppercase tracking-wider">
            Active Cluster Artisans
          </span>
          <span className="text-3xl font-bold text-primary">
            {metrics?.totalAssigned || 0}
          </span>
          <span className="text-[11px] text-on-surface-variant">
            Across {metrics?.clusterBreakdown?.length || 0} regional craft clusters
          </span>
        </Card>
      </div>

      {/* Cluster-by-Cluster Breakdown Table */}
      <div className="flex flex-col gap-3">
        <h3 className="font-display text-base font-bold text-primary">
          Craft Cluster Breakdown
        </h3>

        <div className="bg-white border border-surface-variant/80 rounded-2xl shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-surface-container-low border-b border-surface-variant font-bold text-on-surface-variant uppercase text-[10px]">
                <tr>
                  <th className="py-3.5 px-4">Craft Cluster</th>
                  <th className="py-3.5 px-4">State</th>
                  <th className="py-3.5 px-4 text-center">Artisans</th>
                  <th className="py-3.5 px-4 text-center">Digitized Crafts</th>
                  <th className="py-3.5 px-4 text-center">Enquiries</th>
                  <th className="py-3.5 px-4 text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-variant/60">
                {metrics?.clusterBreakdown?.map((c: any, i: number) => (
                  <tr key={i} className="hover:bg-surface-container-low transition-colors">
                    <td className="py-3.5 px-4 font-bold text-primary flex items-center gap-2">
                      <Building className="w-3.5 h-3.5 text-secondary" />
                      <span>{c.clusterName}</span>
                    </td>
                    <td className="py-3.5 px-4 text-on-surface-variant">{c.state}</td>
                    <td className="py-3.5 px-4 text-center font-bold text-primary">{c.artisanCount}</td>
                    <td className="py-3.5 px-4 text-center font-bold text-secondary">{c.productCount}</td>
                    <td className="py-3.5 px-4 text-center font-bold text-success">{c.enquiryCount}</td>
                    <td className="py-3.5 px-4 text-right">
                      <span className="px-2 py-0.5 rounded-full bg-success-container text-on-success-container text-[10px] font-bold">
                        Active Grant
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};
