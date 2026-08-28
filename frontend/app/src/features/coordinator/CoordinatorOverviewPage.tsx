import React, { useState, useEffect } from 'react';
import { useAuth } from '@/app/providers/AuthProvider';
import { coordinatorService } from '@/services/coordinator/coordinatorService';
import { CoordinatorArtisanProjection } from '@/types';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
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
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export const CoordinatorOverviewPage: React.FC = () => {
  const { user, userAccount } = useAuth();
  const navigate = useNavigate();

  const [projections, setProjections] = useState<CoordinatorArtisanProjection[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');

  const coordinatorUid = userAccount?.uid || user?.id;

  useEffect(() => {
    let isMounted = true;
    async function loadAssignedArtisans() {
      if (!coordinatorUid) {
        setLoading(false);
        return;
      }

      setLoading(true);
      setError(null);
      try {
        const list = await coordinatorService.listAssignedArtisans(coordinatorUid);
        if (isMounted) {
          setProjections(list);
        }
      } catch (err) {
        if (isMounted) {
          setError(err instanceof Error ? err.message : 'Failed to load assigned artisan data.');
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    loadAssignedArtisans();
    return () => {
      isMounted = false;
    };
  }, [coordinatorUid]);

  // If user is not authenticated
  if (!user) {
    return (
      <div className="max-w-lg mx-auto py-16 px-4">
        <Card className="p-8 text-center flex flex-col items-center gap-4 bg-white border border-surface-variant rounded-2xl shadow-sm">
          <div className="w-12 h-12 rounded-full bg-error-container/40 text-error flex items-center justify-center">
            <AlertCircle className="w-6 h-6" />
          </div>
          <h2 className="font-bold text-lg text-primary">Authentication Required</h2>
          <p className="text-xs text-on-surface-variant">
            Please sign in as an authorized cluster coordinator to access regional artisan assistance.
          </p>
          <Button onClick={() => navigate('/login')} className="text-xs font-bold mt-2">
            Sign In
          </Button>
        </Card>
      </div>
    );
  }

  const filteredProjections = projections.filter((p) => {
    const term = search.toLowerCase();
    return (
      p.artisanDisplayName.toLowerCase().includes(term) ||
      (p.clusterName && p.clusterName.toLowerCase().includes(term))
    );
  });

  const totalAssigned = projections.length;
  const totalProducts = projections.reduce((acc, p) => acc + p.productCounts.total, 0);
  const totalEnquiries = projections.reduce((acc, p) => acc + p.newEnquiryCount, 0);
  const totalExportIssues = projections.reduce((acc, p) => acc + p.exportProblemsCount, 0);

  return (
    <div className="w-full flex flex-col gap-6 max-w-6xl mx-auto animate-in fade-in duration-200">
      {/* Header Info */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-surface-variant pb-6">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="font-display text-2xl sm:text-3xl font-bold text-primary">
              Cluster Coordinator Workspace
            </h1>
            <Badge variant="indigo" className="text-[10px] uppercase font-bold">
              Privacy-Safe Projections
            </Badge>
          </div>
          <p className="text-xs sm:text-sm text-on-surface-variant mt-1">
            Monitoring digitization progress, catalog readiness, export assistance, and enquiry status for assigned artisans.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            size="sm"
            onClick={() => alert('Exporting cluster assistance report summary...')}
            leftIcon={<Download className="w-4 h-4" />}
            variant="secondary"
            className="text-xs font-bold"
          >
            Export Summary
          </Button>
        </div>
      </div>

      {/* Stats Cards Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-4 flex flex-col gap-1 bg-white border border-surface-variant rounded-xl card-shadow">
          <span className="text-xs font-bold text-on-surface-variant uppercase tracking-wider">
            Assigned Artisans
          </span>
          <span className="text-2xl sm:text-3xl font-bold text-primary">{totalAssigned}</span>
          <span className="text-[11px] text-on-surface-variant">Active Cluster Grants</span>
        </Card>

        <Card className="p-4 flex flex-col gap-1 bg-white border border-surface-variant rounded-xl card-shadow">
          <span className="text-xs font-bold text-on-surface-variant uppercase tracking-wider">
            Total Crafts
          </span>
          <span className="text-2xl sm:text-3xl font-bold text-secondary">{totalProducts}</span>
          <span className="text-[11px] text-secondary font-semibold">Across Assigned Profiles</span>
        </Card>

        <Card className="p-4 flex flex-col gap-1 bg-white border border-surface-variant rounded-xl card-shadow">
          <span className="text-xs font-bold text-on-surface-variant uppercase tracking-wider">
            New Enquiries
          </span>
          <span className="text-2xl sm:text-3xl font-bold text-success">{totalEnquiries}</span>
          <span className="text-[11px] text-success font-semibold">Pending Artisan Review</span>
        </Card>

        <Card className="p-4 flex flex-col gap-1 bg-white border border-surface-variant rounded-xl card-shadow">
          <span className="text-xs font-bold text-on-surface-variant uppercase tracking-wider">
            Export Problems
          </span>
          <span className="text-2xl sm:text-3xl font-bold text-error">{totalExportIssues}</span>
          <span className="text-[11px] text-error font-semibold">Action Required</span>
        </Card>
      </div>

      {/* Search Bar */}
      <div className="flex items-center justify-between gap-4">
        <div className="w-full sm:w-80">
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Filter by artisan or cluster..."
            leftIcon={<Search className="w-4 h-4" />}
            className="text-xs"
          />
        </div>
      </div>

      {/* Main Content Area */}
      {loading ? (
        <div className="py-20 flex flex-col items-center justify-center gap-3 text-on-surface-variant">
          <Loader2 className="w-8 h-8 text-secondary animate-spin" />
          <p className="text-xs font-semibold">Loading assigned artisan status projections...</p>
        </div>
      ) : error ? (
        <Card className="p-8 text-center flex flex-col items-center gap-3 bg-white border border-error/30 rounded-2xl">
          <AlertCircle className="w-8 h-8 text-error" />
          <h3 className="font-bold text-base text-primary">Access Restricted</h3>
          <p className="text-xs text-on-surface-variant max-w-md">{error}</p>
        </Card>
      ) : projections.length === 0 ? (
        <Card className="p-12 text-center flex flex-col items-center gap-3 bg-white border border-surface-variant rounded-2xl">
          <div className="w-12 h-12 rounded-full bg-surface-container text-on-surface-variant flex items-center justify-center">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <h2 className="font-bold text-base text-primary">No Assigned Artisans</h2>
          <p className="text-xs text-on-surface-variant max-w-md">
            You do not currently have active cluster assignments. Cluster assignments are authorized by regional administrators to guarantee artisan data privacy.
          </p>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {filteredProjections.map((artisan) => (
            <Card
              key={artisan.artisanUid}
              className="p-6 bg-white border border-surface-variant rounded-2xl card-shadow flex flex-col justify-between gap-5"
            >
              <div className="flex flex-col gap-3">
                {/* Artisan Header */}
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h3 className="font-bold text-base text-primary">{artisan.artisanDisplayName}</h3>
                    <div className="flex items-center gap-2 text-xs text-on-surface-variant mt-0.5">
                      {artisan.clusterName && (
                        <span className="flex items-center gap-1">
                          <Building className="w-3 h-3 text-secondary" /> {artisan.clusterName}
                        </span>
                      )}
                      {artisan.state && (
                        <span className="flex items-center gap-1">
                          <MapPin className="w-3 h-3 text-secondary" /> {artisan.state}
                        </span>
                      )}
                    </div>
                  </div>

                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-success-container text-on-success-container border border-success/30">
                    Active Grant
                  </span>
                </div>

                {/* Status Breakdown Grid */}
                <div className="grid grid-cols-5 gap-2 p-3 bg-surface-container-low rounded-xl border border-surface-variant text-center">
                  <div className="flex flex-col">
                    <span className="text-[10px] text-on-surface-variant font-medium">Draft</span>
                    <span className="font-bold text-sm text-primary">{artisan.productCounts.draft}</span>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-[10px] text-on-surface-variant font-medium">Ready</span>
                    <span className="font-bold text-sm text-secondary">{artisan.productCounts.ready}</span>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-[10px] text-on-surface-variant font-medium">Shared</span>
                    <span className="font-bold text-sm text-primary">{artisan.productCounts.shared}</span>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-[10px] text-on-surface-variant font-medium">Enquiries</span>
                    <span className="font-bold text-sm text-success">{artisan.productCounts.enquiry_received}</span>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-[10px] text-on-surface-variant font-medium">Archived</span>
                    <span className="font-bold text-sm text-gray-500">{artisan.productCounts.archived}</span>
                  </div>
                </div>

                {/* Export Problems Box (if assistExports permission enabled) */}
                {artisan.permissions.assistExports && artisan.exportProblems && artisan.exportProblems.length > 0 && (
                  <div className="p-3 bg-error-container/20 border border-error/30 rounded-xl flex flex-col gap-2">
                    <div className="flex items-center gap-1.5 text-xs font-bold text-error">
                      <AlertTriangle className="w-3.5 h-3.5" />
                      <span>Export Issues Requiring Assistance ({artisan.exportProblems.length})</span>
                    </div>
                    <div className="flex flex-col gap-1.5 divide-y divide-error/20 text-[11px]">
                      {artisan.exportProblems.map((prob, i) => (
                        <div key={i} className="pt-1.5 first:pt-0 flex items-start justify-between gap-2">
                          <span className="font-medium text-primary truncate">{prob.productTitle} ({prob.format.toUpperCase()})</span>
                          <span className="text-error shrink-0">{prob.errorMessage}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Bottom Card Footer */}
              <div className="flex items-center justify-between pt-3 border-t border-surface-variant text-[11px] text-on-surface-variant">
                <span className="flex items-center gap-1">
                  <Clock className="w-3 h-3" /> Updated recently
                </span>
                <span className="font-mono text-[10px] bg-surface-container px-2 py-0.5 rounded border border-surface-variant">
                  UID: {artisan.artisanUid.slice(0, 8)}...
                </span>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};
