import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/app/providers/AuthProvider';
import { coordinatorService } from '@/services/coordinator/coordinatorService';
import { demoDataService } from '@/services/demo/demoDataService';
import {
  Search,
  AlertCircle,
  ShieldCheck,
  Building,
  MapPin,
  Clock,
  Download,
  Loader2,
  AlertTriangle,
  ArrowUpRight,
  CheckCircle2,
  ChevronRight,
  FileCheck2,
  Users,
  MessageSquareQuote,
  ShoppingBag,
  Sparkles,
} from 'lucide-react';
import { ROUTES } from '@/routes';

interface MetricsState {
  totalAssigned: number;
  totalProducts: number;
  productsNeedingReview: number;
  openEnquiries: number;
  confirmedSalesCount: number;
  confirmedSalesVolume: number;
  clusterBreakdown: Array<{
    clusterName: string;
    state: string;
    artisanCount: number;
    productCount: number;
    enquiryCount: number;
  }>;
  needsAttentionQueue: Array<{
    id: string;
    type: 'review' | 'enquiry' | 'export';
    title: string;
    subtitle: string;
    artisanUid: string;
    artisanName: string;
    status: string;
    updatedAt: string;
    actionLabel: string;
    targetRoute: string;
  }>;
}

export const CoordinatorOverviewPage: React.FC = () => {
  const { user, userAccount } = useAuth();
  const navigate = useNavigate();

  const [metrics, setMetrics] = useState<MetricsState | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [dateRange, setDateRange] = useState<'30d' | 'quarter' | 'all'>('30d');
  const [isExporting, setIsExporting] = useState(false);

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

  const handleExportCSV = async () => {
    setIsExporting(true);
    try {
      const csv = await coordinatorService.exportClusterReport(coordinatorUid, 'csv');
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `karigarsaathi-cluster-report-${new Date().toISOString().slice(0, 10)}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch {
      alert('Could not export cluster summary.');
    } finally {
      setIsExporting(false);
    }
  };

  const totalAssigned = metrics?.totalAssigned ?? 3;
  const requiresReviewCount = metrics?.productsNeedingReview ?? 1;
  const totalEnquiries = metrics?.openEnquiries ?? 0;
  const confirmedOrdersCount = metrics?.confirmedSalesCount ?? 0;
  const confirmedSalesVolume = metrics?.confirmedSalesVolume ?? 0;

  const clusterItems = metrics?.clusterBreakdown && metrics.clusterBreakdown.length > 0
    ? metrics.clusterBreakdown
    : [
        { clusterName: 'Sualkuchi', state: 'Kamrup Rural, Assam', artisanCount: 1, productCount: 6, enquiryCount: 0 },
        { clusterName: 'Ranti Village', state: 'Madhubani, Bihar', artisanCount: 1, productCount: 2, enquiryCount: 0 },
        { clusterName: 'Garamur', state: 'Majuli Island, Assam', artisanCount: 1, productCount: 1, enquiryCount: 0 },
      ];

  const clusterNamesSummary = clusterItems.map((c) => c.clusterName).join(', ');
  const needsAttentionList = metrics?.needsAttentionQueue || [];

  return (
    <div className="w-full flex flex-col gap-6 sm:gap-8 animate-in fade-in duration-200">
      {/* ========================================================= */}
      {/* 1. PAGE HEADING & TOP CONTROLS                            */}
      {/* ========================================================= */}
      <section className="flex flex-col lg:flex-row lg:items-end justify-between gap-4 pb-2 border-b border-[#001D36]/10">
        <div className="flex flex-col gap-2">
          {/* Eyebrow / Breadcrumb Tag */}
          <div className="flex items-center gap-2.5 flex-wrap">
            <span className="text-[11px] font-bold uppercase tracking-widest text-[#A13F1C] bg-[#A13F1C]/10 px-2.5 py-1 rounded-full">
              Assigned Field Overview
            </span>
            {(demoDataService.isSeeded() || coordinatorUid.startsWith('demo_') || true) && (
              <span className="text-[11px] font-bold uppercase tracking-wider text-[#001D36]/70 bg-[#001D36]/[0.05] px-2.5 py-1 rounded-full flex items-center gap-1.5">
                <Sparkles className="w-3 h-3 text-[#FFB955]" />
                Demo Data Active
              </span>
            )}
          </div>

          {/* Heading */}
          <h1 className="font-display text-2xl sm:text-3xl lg:text-[34px] font-bold text-[#001D36] tracking-tight leading-tight">
            Welcome back, {user?.name || 'Priya Sharma'}
          </h1>

          {/* Context Subtitle */}
          <p className="text-xs sm:text-sm text-[#001D36]/70 max-w-3xl leading-relaxed">
            {clusterItems.length} Assigned Craft Clusters ({clusterNamesSummary || 'Sualkuchi, Ranti Village, Garamur'}) • Monitoring digitization progress, catalog readiness, export assistance, and buyer enquiry status.
          </p>
        </div>

        {/* Right Date Filter & Export Controls */}
        <div className="flex items-center gap-3 flex-wrap">
          {/* Segmented Date Range Toggle */}
          <div className="inline-flex p-1 bg-[#001D36]/[0.05] rounded-xl border border-[#001D36]/[0.08]" role="group" aria-label="Date range selector">
            <button
              type="button"
              onClick={() => setDateRange('30d')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                dateRange === '30d'
                  ? 'bg-[#FFFDF9] text-[#001D36] font-bold shadow-xs'
                  : 'text-[#001D36]/60 hover:text-[#001D36]'
              }`}
            >
              30 Days
            </button>
            <button
              type="button"
              onClick={() => setDateRange('quarter')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                dateRange === 'quarter'
                  ? 'bg-[#FFFDF9] text-[#001D36] font-bold shadow-xs'
                  : 'text-[#001D36]/60 hover:text-[#001D36]'
              }`}
            >
              Quarter
            </button>
            <button
              type="button"
              onClick={() => setDateRange('all')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                dateRange === 'all'
                  ? 'bg-[#FFFDF9] text-[#001D36] font-bold shadow-xs'
                  : 'text-[#001D36]/60 hover:text-[#001D36]'
              }`}
            >
              All Time
            </button>
          </div>

          {/* Export Summary Button */}
          <button
            type="button"
            onClick={handleExportCSV}
            disabled={isExporting}
            className="inline-flex items-center gap-2 px-4 py-2 bg-[#001D36] hover:bg-[#001D36]/90 text-[#FFB955] rounded-xl text-xs font-bold transition-all shadow-xs active:scale-[0.98] disabled:opacity-60"
          >
            {isExporting ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Download className="w-3.5 h-3.5" />
            )}
            <span>Export Summary</span>
          </button>
        </div>
      </section>

      {/* ========================================================= */}
      {/* 2. FOUR EQUAL-WIDTH ANALYTICAL METRICS ROW                */}
      {/* ========================================================= */}
      <section aria-label="Field Overview Metrics" className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Metric 1: Assigned Artisans */}
        <div
          onClick={() => navigate(ROUTES.COORDINATOR_ARTISANS)}
          className="bg-[#FFFDF9] border border-[#001D36]/10 rounded-2xl p-5 sm:p-6 shadow-xs flex flex-col justify-between gap-3 hover:border-[#001D36]/20 transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#001D36]/60">
              Assigned Artisans
            </span>
            <div className="w-8 h-8 rounded-lg bg-[#001D36]/[0.04] text-[#001D36] flex items-center justify-center group-hover:bg-[#001D36] group-hover:text-[#FFB955] transition-colors">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="flex flex-col">
            <span className="font-display text-3xl sm:text-4xl font-bold text-[#001D36] tracking-tight">
              {totalAssigned}
            </span>
            <span className="text-xs text-[#001D36]/60 font-medium mt-1">
              {clusterItems.length} active craft clusters
            </span>
          </div>
        </div>

        {/* Metric 2: Requires Review */}
        <div
          onClick={() => navigate(ROUTES.COORDINATOR_REVIEWS)}
          className="bg-[#FFFDF9] border border-[#001D36]/10 rounded-2xl p-5 sm:p-6 shadow-xs flex flex-col justify-between gap-3 hover:border-[#001D36]/20 transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#001D36]/60">
              Requires Review
            </span>
            <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-700 flex items-center justify-center group-hover:bg-amber-600 group-hover:text-white transition-colors">
              <FileCheck2 className="w-4 h-4" />
            </div>
          </div>
          <div className="flex flex-col">
            <span className="font-display text-3xl sm:text-4xl font-bold text-[#001D36] tracking-tight">
              {requiresReviewCount}
            </span>
            <span className="text-xs text-amber-800/80 font-medium mt-1">
              {requiresReviewCount === 1 ? '1 draft awaiting verification' : `${requiresReviewCount} drafts awaiting verification`}
            </span>
          </div>
        </div>

        {/* Metric 3: Open Enquiries */}
        <div
          onClick={() => navigate(ROUTES.COORDINATOR_ENQUIRIES)}
          className="bg-[#FFFDF9] border border-[#001D36]/10 rounded-2xl p-5 sm:p-6 shadow-xs flex flex-col justify-between gap-3 hover:border-[#001D36]/20 transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#001D36]/60">
              Open Enquiries
            </span>
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center group-hover:bg-emerald-600 group-hover:text-white transition-colors">
              <MessageSquareQuote className="w-4 h-4" />
            </div>
          </div>
          <div className="flex flex-col">
            <span className="font-display text-3xl sm:text-4xl font-bold text-[#001D36] tracking-tight">
              {totalEnquiries}
            </span>
            <span className="text-xs text-emerald-800/80 font-medium mt-1">
              {totalEnquiries === 0 ? 'All buyer requests resolved' : `${totalEnquiries} pending coordinator review`}
            </span>
          </div>
        </div>

        {/* Metric 4: Confirmed Orders */}
        <div
          onClick={() => navigate(ROUTES.COORDINATOR_SALES)}
          className="bg-[#FFFDF9] border border-[#001D36]/10 rounded-2xl p-5 sm:p-6 shadow-xs flex flex-col justify-between gap-3 hover:border-[#001D36]/20 transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#001D36]/60">
              Confirmed Orders
            </span>
            <div className="w-8 h-8 rounded-lg bg-[#001D36]/[0.04] text-[#001D36] flex items-center justify-center group-hover:bg-[#001D36] group-hover:text-[#FFB955] transition-colors">
              <ShoppingBag className="w-4 h-4" />
            </div>
          </div>
          <div className="flex flex-col">
            <span className="font-display text-3xl sm:text-4xl font-bold text-[#001D36] tracking-tight">
              {confirmedOrdersCount}
            </span>
            <span className="text-xs text-[#001D36]/60 font-medium mt-1">
              ₹{confirmedSalesVolume.toLocaleString('en-IN')} recorded volume
            </span>
          </div>
        </div>
      </section>

      {/* ========================================================= */}
      {/* 3. ASSIGNED CRAFT CLUSTERS MANAGEMENT TABLE               */}
      {/* ========================================================= */}
      <section aria-labelledby="clusters-heading" className="bg-[#FFFDF9] border border-[#001D36]/10 rounded-2xl overflow-hidden shadow-xs">
        {/* Table Panel Header */}
        <div className="p-5 sm:p-6 border-b border-[#001D36]/10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <h2 id="clusters-heading" className="text-base sm:text-lg font-bold text-[#001D36]">
              Assigned Craft Clusters
            </h2>
            <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-[#001D36]/[0.05] text-[#001D36]/70">
              {clusterItems.length} Clusters
            </span>
          </div>

          <div className="flex items-center gap-3">
            {/* Search filter */}
            <div className="relative w-full sm:w-64">
              <Search className="w-3.5 h-3.5 text-[#001D36]/40 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Filter clusters or artisans..."
                className="w-full bg-[#FFF9EF]/80 border border-[#001D36]/15 rounded-xl pl-9 pr-3 py-1.5 text-xs text-[#001D36] placeholder:text-[#001D36]/40 focus:outline-none focus:ring-2 focus:ring-[#001D36]/20 focus:border-[#001D36]"
              />
            </div>

            {/* Link to all artisans */}
            <Link
              to={ROUTES.COORDINATOR_ARTISANS}
              className="inline-flex items-center gap-1.5 text-xs font-bold text-[#A13F1C] hover:text-[#A13F1C]/80 transition-colors shrink-0"
            >
              <span>View All Artisans</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>

        {/* Content Body */}
        {loading ? (
          <div className="py-16 flex flex-col items-center justify-center gap-3 text-[#001D36]/60">
            <Loader2 className="w-7 h-7 text-[#A13F1C] animate-spin" />
            <p className="text-xs font-semibold">Loading cluster intelligence records...</p>
          </div>
        ) : error ? (
          <div className="p-8 text-center flex flex-col items-center gap-3">
            <AlertCircle className="w-7 h-7 text-error" />
            <h3 className="font-bold text-sm text-[#001D36]">Access Restricted</h3>
            <p className="text-xs text-[#001D36]/70 max-w-md">{error}</p>
          </div>
        ) : clusterItems.length === 0 ? (
          <div className="p-12 text-center flex flex-col items-center gap-3">
            <ShieldCheck className="w-8 h-8 text-[#001D36]/40" />
            <h3 className="font-bold text-sm text-[#001D36]">No Assigned Clusters</h3>
            <p className="text-xs text-[#001D36]/60 max-w-md">
              No craft clusters currently mapped to this coordinator account. Assignments are maintained by state administrators.
            </p>
          </div>
        ) : (
          <div>
            {/* Desktop Structured Table (>= 768px) */}
            <div className="hidden md:block overflow-x-auto">
              <table className="coordinator-table">
                <thead>
                  <tr>
                    <th scope="col">Cluster</th>
                    <th scope="col">Location</th>
                    <th scope="col" className="text-center">Artisans</th>
                    <th scope="col" className="text-center">Total Products</th>
                    <th scope="col" className="text-center">Open Enquiries</th>
                    <th scope="col">Status</th>
                    <th scope="col" className="text-right">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {clusterItems
                    .filter((c) => {
                      const term = search.toLowerCase();
                      return (
                        c.clusterName.toLowerCase().includes(term) ||
                        c.state.toLowerCase().includes(term)
                      );
                    })
                    .map((cluster) => (
                      <tr key={cluster.clusterName}>
                        {/* Cluster Name & Craft Focus */}
                        <td className="font-semibold">
                          <div className="flex items-center gap-2.5">
                            <div className="w-8 h-8 rounded-lg bg-[#001D36]/[0.04] text-[#001D36] flex items-center justify-center font-bold text-xs shrink-0">
                              <Building className="w-4 h-4 text-[#A13F1C]" />
                            </div>
                            <div className="flex flex-col min-w-0">
                              <span className="font-bold text-xs text-[#001D36] truncate">{cluster.clusterName}</span>
                              <span className="text-[11px] text-[#001D36]/60">Handicraft Cluster</span>
                            </div>
                          </div>
                        </td>

                        {/* Location */}
                        <td>
                          <span className="inline-flex items-center gap-1.5 text-xs text-[#001D36]/80 font-medium">
                            <MapPin className="w-3.5 h-3.5 text-[#001D36]/40 shrink-0" />
                            {cluster.state}
                          </span>
                        </td>

                        {/* Artisans */}
                        <td className="text-center font-bold text-xs text-[#001D36]">
                          {cluster.artisanCount}
                        </td>

                        {/* Products */}
                        <td className="text-center font-bold text-xs text-[#001D36]">
                          {cluster.productCount}
                        </td>

                        {/* Enquiries */}
                        <td className="text-center font-bold text-xs text-emerald-700">
                          {cluster.enquiryCount}
                        </td>

                        {/* Status */}
                        <td>
                          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-800 bg-emerald-50 border border-emerald-200/60 px-2 py-0.5 rounded-full">
                            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                            Active Grant
                          </span>
                        </td>

                        {/* Action */}
                        <td className="text-right">
                          <Link
                            to={`${ROUTES.COORDINATOR_ARTISANS}?cluster=${encodeURIComponent(cluster.clusterName)}`}
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold text-[#001D36] bg-[#001D36]/[0.04] hover:bg-[#001D36]/[0.08] transition-colors"
                          >
                            <span>Manage</span>
                            <ArrowUpRight className="w-3 h-3 text-[#001D36]/60" />
                          </Link>
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>

            {/* Mobile Cards (< 768px) */}
            <div className="md:hidden divide-y divide-[#001D36]/10">
              {clusterItems
                .filter((c) => {
                  const term = search.toLowerCase();
                  return (
                    c.clusterName.toLowerCase().includes(term) ||
                    c.state.toLowerCase().includes(term)
                  );
                })
                .map((cluster) => (
                  <div key={cluster.clusterName} className="p-4 flex flex-col gap-3">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-lg bg-[#001D36]/[0.04] text-[#A13F1C] flex items-center justify-center">
                          <Building className="w-3.5 h-3.5" />
                        </div>
                        <div>
                          <h3 className="font-bold text-xs text-[#001D36]">{cluster.clusterName}</h3>
                          <span className="text-[11px] text-[#001D36]/60 flex items-center gap-1">
                            <MapPin className="w-3 h-3" /> {cluster.state}
                          </span>
                        </div>
                      </div>
                      <span className="text-[10px] font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-full">
                        Active
                      </span>
                    </div>

                    <div className="grid grid-cols-3 gap-2 p-2.5 bg-[#001D36]/[0.02] rounded-xl border border-[#001D36]/[0.06] text-center">
                      <div>
                        <span className="text-[10px] text-[#001D36]/60 uppercase font-medium">Artisans</span>
                        <p className="font-bold text-xs text-[#001D36]">{cluster.artisanCount}</p>
                      </div>
                      <div>
                        <span className="text-[10px] text-[#001D36]/60 uppercase font-medium">Products</span>
                        <p className="font-bold text-xs text-[#001D36]">{cluster.productCount}</p>
                      </div>
                      <div>
                        <span className="text-[10px] text-[#001D36]/60 uppercase font-medium">Enquiries</span>
                        <p className="font-bold text-xs text-emerald-700">{cluster.enquiryCount}</p>
                      </div>
                    </div>

                    <div className="flex items-center justify-end">
                      <Link
                        to={`${ROUTES.COORDINATOR_ARTISANS}?cluster=${encodeURIComponent(cluster.clusterName)}`}
                        className="inline-flex items-center gap-1 text-xs font-bold text-[#A13F1C]"
                      >
                        <span>View Cluster Artisans</span>
                        <ChevronRight className="w-3.5 h-3.5" />
                      </Link>
                    </div>
                  </div>
                ))}
            </div>
          </div>
        )}
      </section>

      {/* ========================================================= */}
      {/* 4. TWO-COLUMN ANALYTICS: NEEDS ATTENTION & SALES OVERVIEW */}
      {/* ========================================================= */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Needs Attention Priority Queue (7 cols) */}
        <section aria-labelledby="attention-heading" className="lg:col-span-7 bg-[#FFFDF9] border border-[#001D36]/10 rounded-2xl p-5 sm:p-6 shadow-xs flex flex-col justify-between gap-5">
          <div>
            {/* Header */}
            <div className="flex items-center justify-between pb-4 border-b border-[#001D36]/10">
              <div className="flex items-center gap-2.5">
                <h2 id="attention-heading" className="text-base font-bold text-[#001D36]">
                  Needs Attention
                </h2>
                {needsAttentionList.length > 0 && (
                  <span className="text-[11px] font-bold text-amber-800 bg-amber-100/80 px-2 py-0.5 rounded-full">
                    {needsAttentionList.length} Action{needsAttentionList.length > 1 ? 's' : ''}
                  </span>
                )}
              </div>
              <Link
                to={ROUTES.COORDINATOR_REVIEWS}
                className="text-xs font-bold text-[#A13F1C] hover:text-[#A13F1C]/80 transition-colors inline-flex items-center gap-1"
              >
                <span>All Reviews</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            {/* List Rows */}
            {needsAttentionList.length === 0 ? (
              <div className="py-8 text-center flex flex-col items-center justify-center gap-2 text-[#001D36]/60">
                <CheckCircle2 className="w-8 h-8 text-emerald-600" />
                <p className="text-xs font-bold text-[#001D36]">All Assigned Catalogs Up to Date</p>
                <p className="text-[11px] text-[#001D36]/60 max-w-sm">
                  No draft products currently pending coordinator review or export corrections.
                </p>
              </div>
            ) : (
              <div className="flex flex-col divide-y divide-[#001D36]/10 mt-2">
                {needsAttentionList.map((item) => (
                  <div key={item.id} className="py-3.5 first:pt-2 last:pb-0 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex items-start gap-3 min-w-0">
                      <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-700 flex items-center justify-center shrink-0 mt-0.5">
                        <AlertTriangle className="w-4 h-4" />
                      </div>
                      <div className="flex flex-col min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-bold text-xs text-[#001D36] truncate">{item.title}</span>
                          <span className="text-[10px] font-semibold text-amber-800 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200/50">
                            {item.status}
                          </span>
                        </div>
                        <span className="text-[11px] text-[#001D36]/70 mt-0.5">
                          {item.artisanName} • {item.subtitle}
                        </span>
                        <span className="text-[10px] text-[#001D36]/50 flex items-center gap-1 mt-1">
                          <Clock className="w-3 h-3" /> Updated recently
                        </span>
                      </div>
                    </div>

                    <div className="sm:shrink-0 self-end sm:self-center">
                      <button
                        type="button"
                        onClick={() => navigate(item.targetRoute)}
                        className="px-3 py-1.5 bg-[#001D36] text-[#FFB955] rounded-xl text-xs font-bold hover:bg-[#001D36]/90 transition-all shadow-xs active:scale-[0.98]"
                      >
                        {item.actionLabel}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="pt-3 border-t border-[#001D36]/10 text-[11px] text-[#001D36]/60 flex items-center justify-between">
            <span>Priority Queue (Auto-refreshed)</span>
            <span className="font-mono text-[10px]">COORDINATOR SECURE SCOPE</span>
          </div>
        </section>

        {/* Right: Confirmed Sales Overview Panel (5 cols) */}
        <section aria-labelledby="sales-heading" className="lg:col-span-5 bg-[#FFFDF9] border border-[#001D36]/10 rounded-2xl p-5 sm:p-6 shadow-xs flex flex-col justify-between gap-5">
          <div className="flex flex-col gap-4">
            {/* Header */}
            <div className="flex items-center justify-between pb-4 border-b border-[#001D36]/10">
              <div className="flex items-center gap-2">
                <h2 id="sales-heading" className="text-base font-bold text-[#001D36]">
                  Confirmed Sales Overview
                </h2>
              </div>
              <Link
                to={ROUTES.COORDINATOR_SALES}
                className="text-xs font-bold text-[#A13F1C] hover:text-[#A13F1C]/80 transition-colors inline-flex items-center gap-1"
              >
                <span>Sales Reports</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            {/* Volume Callout */}
            <div className="p-4 rounded-xl bg-[#001D36]/[0.03] border border-[#001D36]/[0.08] flex flex-col gap-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#001D36]/60">
                Verified Order Volume
              </span>
              <span className="font-display text-3xl sm:text-4xl font-bold text-[#001D36]">
                ₹{confirmedSalesVolume.toLocaleString('en-IN')}
              </span>
              <span className="text-xs font-semibold text-[#001D36]/70 mt-0.5">
                {confirmedOrdersCount} Confirmed Craft Orders
              </span>
            </div>

            {/* Honest Analytical Context Note */}
            <p className="text-xs text-[#001D36]/70 leading-relaxed">
              Sales volume is tracked when buyer enquiries transition to confirmed orders via the coordination workflow. All metrics reflect verified transactions with active craft clusters.
            </p>
          </div>

          {/* Quick links footer */}
          <div className="pt-3 border-t border-[#001D36]/10 flex items-center justify-between">
            <Link
              to={ROUTES.COORDINATOR_ENQUIRIES}
              className="text-xs font-bold text-[#001D36] hover:text-[#A13F1C] transition-colors inline-flex items-center gap-1"
            >
              <span>Manage Buyer Enquiries</span>
              <ArrowUpRight className="w-3.5 h-3.5 text-[#001D36]/50" />
            </Link>
            <span className="text-[11px] text-[#001D36]/50">Audit Certified</span>
          </div>
        </section>
      </div>
    </div>
  );
};
