import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/app/providers/AuthProvider';
import { coordinatorService } from '@/services/coordinator/coordinatorService';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import {
  Users,
  FileCheck2,
  MessageSquareQuote,
  TrendingUp,
  AlertTriangle,
  ArrowRight,
  Loader2,
  ShieldCheck,
  MapPin,
  CheckCircle2,
  Clock,
  Download,
  Sparkles,
} from 'lucide-react';
import { ROUTES } from '@/routes';
import { clsx } from 'clsx';
import { demoDataService } from '@/services/demo/demoDataService';

export const CoordinatorOverviewPage: React.FC = () => {
  const { user, userAccount } = useAuth();
  const navigate = useNavigate();

  const [metrics, setMetrics] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dateRange, setDateRange] = useState<'30d' | 'quarter' | 'year' | 'all'>('all');

  const coordinatorUid = userAccount?.uid || user?.id || 'coord_001';

  useEffect(() => {
    let isMounted = true;
    async function loadData() {
      setLoading(true);
      setError(null);
      try {
        const data = await coordinatorService.getAssignedMetrics(coordinatorUid, dateRange);
        if (isMounted) {
          setMetrics(data);
        }
      } catch (err: unknown) {
        if (isMounted) {
          setError(err instanceof Error ? err.message : 'Failed to load coordinator metrics.');
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    loadData();
    return () => {
      isMounted = false;
    };
  }, [coordinatorUid, dateRange]);

  const handleExportSummary = async () => {
    try {
      const csv = await coordinatorService.exportClusterReport(coordinatorUid, 'csv');
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `coordinator_cluster_summary_${new Date().toISOString().slice(0, 10)}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch {
      alert('Could not export cluster summary.');
    }
  };

  if (loading) {
    return (
      <div className="py-24 flex flex-col items-center justify-center gap-3 text-on-surface-variant">
        <Loader2 className="w-8 h-8 text-secondary animate-spin" />
        <p className="text-xs font-semibold">Loading authorized cluster overview...</p>
      </div>
    );
  }

  if (error) {
    return (
      <Card className="p-8 text-center flex flex-col items-center gap-3 bg-white border border-error/30 rounded-2xl max-w-xl mx-auto my-12">
        <AlertTriangle className="w-8 h-8 text-error" />
        <h3 className="font-bold text-base text-primary">Access Restricted</h3>
        <p className="text-xs text-on-surface-variant leading-relaxed">{error}</p>
        <Button onClick={() => window.location.reload()} size="sm" className="mt-2 text-xs">
          Retry Loading
        </Button>
      </Card>
    );
  }

  const assignedScopeText = metrics?.clusterBreakdown?.length
    ? `${metrics.clusterBreakdown.length} Assigned Craft Clusters (${metrics.clusterBreakdown.map((c: any) => c.clusterName).join(', ')})`
    : 'Regional Cluster Jurisdiction';

  return (
    <div className="flex flex-col gap-8 w-full animate-in fade-in duration-200">
      {/* ========================================================= */}
      {/* HEADER WITH SCOPE & DATE FILTER                           */}
      {/* ========================================================= */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-surface-variant/80 pb-6">
        <div className="flex flex-col gap-1.5">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-secondary uppercase tracking-wider">
              Assigned Field Overview
            </span>
            <Badge variant="indigo" className="text-[10px] uppercase font-bold">
              Privacy-Safe
            </Badge>
          </div>
          <div className="flex items-center gap-2.5 flex-wrap">
            <h2 className="font-display text-2xl sm:text-3xl font-bold text-primary tracking-tight">
              Welcome back, {user?.name || 'Coordinator'}
            </h2>
            {(demoDataService.isSeeded() || coordinatorUid.startsWith('demo_')) && (
              <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-[#FFDDB5] text-[#2A1800] border border-[#FFB955]">
                <Sparkles className="w-3 h-3" />
                Demo Data Active
              </span>
            )}
          </div>
          <p className="text-xs sm:text-sm text-on-surface-variant flex items-center gap-1.5 mt-0.5">
            <ShieldCheck className="w-4 h-4 text-secondary shrink-0" />
            <span className="font-medium text-primary">{assignedScopeText}</span>
          </p>
        </div>

        {/* Action Controls & Date Filter */}
        <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
          {/* Date Filter Pills */}
          <div className="flex items-center bg-surface-container rounded-xl p-1 text-xs font-bold">
            <button
              type="button"
              onClick={() => setDateRange('30d')}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                dateRange === '30d' ? 'bg-white text-primary shadow-xs' : 'text-on-surface-variant hover:text-primary'
              }`}
            >
              30 Days
            </button>
            <button
              type="button"
              onClick={() => setDateRange('quarter')}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                dateRange === 'quarter' ? 'bg-white text-primary shadow-xs' : 'text-on-surface-variant hover:text-primary'
              }`}
            >
              Quarter
            </button>
            <button
              type="button"
              onClick={() => setDateRange('all')}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                dateRange === 'all' ? 'bg-white text-primary shadow-xs' : 'text-on-surface-variant hover:text-primary'
              }`}
            >
              All Time
            </button>
          </div>

          <Button
            size="sm"
            variant="secondary"
            onClick={handleExportSummary}
            leftIcon={<Download className="w-3.5 h-3.5" />}
            className="text-xs font-bold"
          >
            Export Summary
          </Button>
        </div>
      </div>

      {/* ========================================================= */}
      {/* 4 TOP SUMMARY METRICS                                     */}
      {/* ========================================================= */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
        {/* 1. Assigned Artisans */}
        <Card
          onClick={() => navigate(ROUTES.COORDINATOR_ARTISANS)}
          className="p-5 flex flex-col justify-between bg-surface-container-lowest border border-surface-variant/80 rounded-2xl shadow-xs hover:border-secondary/40 transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-on-surface-variant uppercase tracking-wider">
              Assigned Artisans
            </span>
            <div className="w-8 h-8 rounded-xl bg-primary/[0.04] text-primary flex items-center justify-center group-hover:bg-primary group-hover:text-white transition-colors">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="flex flex-col gap-1 mt-3">
            <span className="text-3xl font-bold text-primary leading-none">
              {metrics?.totalAssigned || 0}
            </span>
            <span className="text-[11px] text-on-surface-variant flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3 text-success" /> Active Cluster Grants
            </span>
          </div>
        </Card>

        {/* 2. Products Requiring Review */}
        <Card
          onClick={() => navigate(ROUTES.COORDINATOR_REVIEWS)}
          className="p-5 flex flex-col justify-between bg-surface-container-lowest border border-surface-variant/80 rounded-2xl shadow-xs hover:border-secondary/40 transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-on-surface-variant uppercase tracking-wider">
              Requires Review
            </span>
            <div className="w-8 h-8 rounded-xl bg-amber-100 text-amber-900 flex items-center justify-center group-hover:bg-amber-600 group-hover:text-white transition-colors">
              <FileCheck2 className="w-4 h-4" />
            </div>
          </div>
          <div className="flex flex-col gap-1 mt-3">
            <span className="text-3xl font-bold text-amber-900 leading-none">
              {metrics?.productsNeedingReview || 0}
            </span>
            <span className="text-[11px] text-amber-700 font-semibold">
              Drafts & readiness gaps
            </span>
          </div>
        </Card>

        {/* 3. Open Buyer Enquiries */}
        <Card
          onClick={() => navigate(ROUTES.COORDINATOR_ENQUIRIES)}
          className="p-5 flex flex-col justify-between bg-surface-container-lowest border border-surface-variant/80 rounded-2xl shadow-xs hover:border-secondary/40 transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-on-surface-variant uppercase tracking-wider">
              Open Enquiries
            </span>
            <div className="w-8 h-8 rounded-xl bg-secondary/10 text-secondary flex items-center justify-center group-hover:bg-secondary group-hover:text-white transition-colors">
              <MessageSquareQuote className="w-4 h-4" />
            </div>
          </div>
          <div className="flex flex-col gap-1 mt-3">
            <span className="text-3xl font-bold text-secondary leading-none">
              {metrics?.openEnquiries || 0}
            </span>
            <span className="text-[11px] text-secondary font-semibold">
              Pending replies or quotes
            </span>
          </div>
        </Card>

        {/* 4. Confirmed Units Sold */}
        <Card
          onClick={() => navigate(ROUTES.COORDINATOR_SALES)}
          className="p-5 flex flex-col justify-between bg-surface-container-lowest border border-surface-variant/80 rounded-2xl shadow-xs hover:border-secondary/40 transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-on-surface-variant uppercase tracking-wider">
              Confirmed Orders
            </span>
            <div className="w-8 h-8 rounded-xl bg-success-container/60 text-on-success-container flex items-center justify-center group-hover:bg-success group-hover:text-white transition-colors">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="flex flex-col gap-1 mt-3">
            <span className="text-3xl font-bold text-primary leading-none">
              {metrics?.confirmedSalesCount || 0}
            </span>
            <span className="text-[11px] text-on-surface-variant">
              Verified buyer transactions
            </span>
          </div>
        </Card>
      </div>

      {/* ========================================================= */}
      {/* HORIZONTAL ASSIGNED CRAFT CLUSTERS                        */}
      {/* ========================================================= */}
      <div className="flex flex-col gap-3.5">
        <div className="flex items-center justify-between">
          <h3 className="font-display text-lg font-bold text-primary">
            Assigned Craft Clusters
          </h3>
          <Link
            to={ROUTES.COORDINATOR_ARTISANS}
            className="text-xs font-bold text-secondary hover:underline flex items-center gap-1"
          >
            <span>View All Artisans</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {metrics?.clusterBreakdown?.length === 0 ? (
          <Card className="p-8 text-center bg-white border border-surface-variant rounded-2xl">
            <p className="text-xs text-on-surface-variant">No active cluster assignments.</p>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {metrics?.clusterBreakdown?.map((cluster: any, idx: number) => (
              <Card
                key={idx}
                onClick={() => navigate(`${ROUTES.COORDINATOR_ARTISANS}?cluster=${encodeURIComponent(cluster.clusterName)}`)}
                className="p-5 bg-white border border-surface-variant/80 rounded-2xl shadow-xs hover:border-secondary transition-all cursor-pointer flex flex-col justify-between gap-4 group"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex flex-col">
                    <span className="font-bold text-sm text-primary group-hover:text-secondary transition-colors">
                      {cluster.clusterName}
                    </span>
                    <span className="text-xs text-on-surface-variant flex items-center gap-1 mt-0.5">
                      <MapPin className="w-3 h-3 text-secondary shrink-0" /> {cluster.state}
                    </span>
                  </div>
                  <span className="px-2 py-0.5 rounded-full bg-surface-container text-primary text-[10px] font-bold">
                    Active
                  </span>
                </div>

                <div className="grid grid-cols-3 gap-2 p-2.5 bg-surface-container-low rounded-xl text-center border border-surface-variant/40">
                  <div>
                    <span className="text-[10px] text-on-surface-variant block">Artisans</span>
                    <span className="font-bold text-xs text-primary">{cluster.artisanCount}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-on-surface-variant block">Products</span>
                    <span className="font-bold text-xs text-secondary">{cluster.productCount}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-on-surface-variant block">Enquiries</span>
                    <span className="font-bold text-xs text-success">{cluster.enquiryCount}</span>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* ========================================================= */}
      {/* "NEEDS ATTENTION" PRIORITY QUEUE                          */}
      {/* ========================================================= */}
      <div className="flex flex-col gap-3.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h3 className="font-display text-lg font-bold text-primary">Needs Attention</h3>
            {metrics?.needsAttentionQueue?.length > 0 && (
              <span className="px-2 py-0.5 rounded-full bg-error-container text-error text-xs font-bold">
                {metrics.needsAttentionQueue.length} Tasks
              </span>
            )}
          </div>
          <span className="text-xs text-on-surface-variant">Prioritized by urgency</span>
        </div>

        {metrics?.needsAttentionQueue?.length === 0 ? (
          <Card className="p-8 text-center flex flex-col items-center gap-2 bg-white border border-surface-variant rounded-2xl">
            <CheckCircle2 className="w-8 h-8 text-success" />
            <h4 className="font-bold text-sm text-primary">All Caught Up!</h4>
            <p className="text-xs text-on-surface-variant">
              No outstanding draft reviews, export errors, or unanswered buyer enquiries across your assigned scope.
            </p>
          </Card>
        ) : (
          <div className="bg-white border border-surface-variant rounded-2xl shadow-xs overflow-hidden divide-y divide-surface-variant/60">
            {metrics?.needsAttentionQueue?.map((item: any) => (
              <div
                key={item.id}
                className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-surface-container-low transition-colors"
              >
                <div className="flex items-start gap-3.5 min-w-0">
                  <div
                    className={clsx(
                      'w-9 h-9 rounded-xl flex items-center justify-center shrink-0 mt-0.5',
                      item.type === 'export'
                        ? 'bg-red-100 text-error'
                        : item.type === 'review'
                        ? 'bg-amber-100 text-amber-900'
                        : 'bg-secondary/15 text-secondary'
                    )}
                  >
                    {item.type === 'export' ? (
                      <AlertTriangle className="w-4 h-4" />
                    ) : item.type === 'review' ? (
                      <FileCheck2 className="w-4 h-4" />
                    ) : (
                      <MessageSquareQuote className="w-4 h-4" />
                    )}
                  </div>

                  <div className="flex flex-col min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-bold text-sm text-primary truncate">{item.title}</span>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-surface-container text-on-surface-variant">
                        {item.artisanName}
                      </span>
                    </div>
                    <p className="text-xs text-on-surface-variant mt-0.5">{item.subtitle}</p>
                    <span className="text-[10px] text-on-surface-variant flex items-center gap-1 mt-1">
                      <Clock className="w-3 h-3" /> Updated recently
                    </span>
                  </div>
                </div>

                <div className="flex items-center justify-end shrink-0">
                  <Button
                    size="sm"
                    onClick={() => navigate(item.targetRoute)}
                    rightIcon={<ArrowRight className="w-3.5 h-3.5" />}
                    className="text-xs font-bold whitespace-nowrap"
                  >
                    {item.actionLabel}
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ========================================================= */}
      {/* CONFIRMED SALES TREND & SUMMARY (HONEST RECORD PRESENTATION) */}
      {/* ========================================================= */}
      <div className="flex flex-col gap-3.5">
        <h3 className="font-display text-lg font-bold text-primary">
          Confirmed Sales Overview
        </h3>

        <Card className="p-6 bg-white border border-surface-variant rounded-2xl shadow-xs flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex flex-col gap-1 text-center md:text-left">
            <span className="text-xs font-bold text-on-surface-variant uppercase tracking-wider">
              Verified Order Volume
            </span>
            <span className="text-3xl font-bold text-primary">
              ₹{(metrics?.confirmedSalesVolume || 0).toLocaleString('en-IN')}
            </span>
            <p className="text-xs text-on-surface-variant max-w-md mt-1">
              Calculated exclusively from buyer orders with confirmed status and verified payment terms. Drafts and listed catalogue prices are strictly excluded from confirmed sales metrics.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Button
              size="sm"
              variant="secondary"
              onClick={() => navigate(ROUTES.COORDINATOR_SALES)}
              rightIcon={<ArrowRight className="w-4 h-4" />}
              className="text-xs font-bold"
            >
              View Full Sales Reports
            </Button>
          </div>
        </Card>
      </div>
    </div>
  );
};
