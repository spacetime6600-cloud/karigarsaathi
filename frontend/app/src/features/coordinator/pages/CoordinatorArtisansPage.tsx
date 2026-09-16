import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '@/app/providers/AuthProvider';
import { coordinatorService } from '@/services/coordinator/coordinatorService';
import { CoordinatorArtisanProjection } from '@/types';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import {
  Search,
  Users,
  Building,
  MapPin,
  Clock,
  Loader2,
  AlertTriangle,
  ArrowRight,
  Sparkles,
} from 'lucide-react';
import { ROUTES } from '@/routes';
import { demoDataService } from '@/services/demo/demoDataService';

export const CoordinatorArtisansPage: React.FC = () => {
  const { user, userAccount } = useAuth();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const [projections, setProjections] = useState<CoordinatorArtisanProjection[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [searchTerm, setSearchTerm] = useState('');
  const activeClusterParam = searchParams.get('cluster') || 'all';

  const coordinatorUid = userAccount?.uid || user?.id || 'coord_001';

  useEffect(() => {
    let isMounted = true;
    async function loadArtisans() {
      setLoading(true);
      setError(null);
      try {
        const list = await coordinatorService.listAssignedArtisans(coordinatorUid);
        if (isMounted) {
          setProjections(list);
        }
      } catch (err: unknown) {
        if (isMounted) {
          setError(err instanceof Error ? err.message : 'Failed to load assigned artisans.');
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    loadArtisans();
    return () => {
      isMounted = false;
    };
  }, [coordinatorUid]);

  // Extract unique clusters
  const clusters = Array.from(
    new Set(projections.map((p) => p.clusterName || 'Regional Cluster'))
  );

  // Filter projections
  const filteredProjections = projections.filter((p) => {
    const term = searchTerm.toLowerCase();
    const matchesSearch =
      p.artisanDisplayName.toLowerCase().includes(term) ||
      (p.clusterName && p.clusterName.toLowerCase().includes(term)) ||
      (p.state && p.state.toLowerCase().includes(term));

    const matchesCluster =
      activeClusterParam === 'all' || p.clusterName === activeClusterParam;

    return matchesSearch && matchesCluster;
  });

  return (
    <div className="flex flex-col gap-6 w-full animate-in fade-in duration-200">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-surface-variant/80 pb-6">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-secondary uppercase tracking-wider">
              Assigned Directory
            </span>
            <Badge variant="indigo" className="text-[10px] uppercase font-bold">
              {projections.length} Active Grants
            </Badge>
          </div>
          <div className="flex items-center gap-2.5 flex-wrap mt-1">
            <h2 className="font-display text-2xl sm:text-3xl font-bold text-primary tracking-tight">
              Assigned Artisans
            </h2>
            {(demoDataService.isSeeded() || coordinatorUid.startsWith('demo_')) && (
              <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-[#FFDDB5] text-[#2A1800] border border-[#FFB955]">
                <Sparkles className="w-3 h-3" />
                Demo Data Active
              </span>
            )}
          </div>
          <p className="text-xs sm:text-sm text-on-surface-variant mt-0.5">
            Privacy-safe roster of verified artisans and craft clusters within your assigned jurisdiction.
          </p>
        </div>
      </div>

      {/* Search and Cluster Tabs */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        {/* Search Bar */}
        <div className="w-full sm:w-80">
          <Input
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by artisan, craft, or state..."
            leftIcon={<Search className="w-4 h-4 text-on-surface-variant" />}
            className="text-xs"
          />
        </div>

        {/* Cluster Tabs */}
        {clusters.length > 0 && (
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 max-w-full">
            <button
              type="button"
              onClick={() => setSearchParams({})}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all touch-target ${
                activeClusterParam === 'all'
                  ? 'bg-secondary text-white shadow-xs'
                  : 'bg-surface-container text-on-surface-variant hover:text-primary'
              }`}
            >
              All Clusters ({projections.length})
            </button>
            {clusters.map((cl) => {
              const count = projections.filter((p) => p.clusterName === cl).length;
              const isSelected = activeClusterParam === cl;
              return (
                <button
                  key={cl}
                  type="button"
                  onClick={() => setSearchParams({ cluster: cl })}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all touch-target ${
                    isSelected
                      ? 'bg-secondary text-white shadow-xs'
                      : 'bg-surface-container text-on-surface-variant hover:text-primary'
                  }`}
                >
                  {cl} ({count})
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Main Content List / Grid */}
      {loading ? (
        <div className="py-20 flex flex-col items-center justify-center gap-3 text-on-surface-variant">
          <Loader2 className="w-8 h-8 text-secondary animate-spin" />
          <p className="text-xs font-semibold">Loading assigned artisans...</p>
        </div>
      ) : error ? (
        <Card className="p-8 text-center flex flex-col items-center gap-3 bg-white border border-error/30 rounded-2xl max-w-lg mx-auto">
          <AlertTriangle className="w-8 h-8 text-error" />
          <h3 className="font-bold text-base text-primary">Access Restricted</h3>
          <p className="text-xs text-on-surface-variant leading-relaxed">{error}</p>
        </Card>
      ) : filteredProjections.length === 0 ? (
        <Card className="p-12 text-center flex flex-col items-center gap-3 bg-white border border-surface-variant rounded-2xl">
          <div className="w-12 h-12 rounded-full bg-surface-container text-on-surface-variant flex items-center justify-center">
            <Users className="w-6 h-6" />
          </div>
          <h3 className="font-bold text-base text-primary">No Matching Artisans</h3>
          <p className="text-xs text-on-surface-variant max-w-md">
            {searchTerm
              ? `No artisans match the search "${searchTerm}".`
              : 'No assigned artisans found for the selected cluster filter.'}
          </p>
          {(searchTerm || activeClusterParam !== 'all') && (
            <Button
              size="sm"
              variant="secondary"
              onClick={() => {
                setSearchTerm('');
                setSearchParams({});
              }}
              className="text-xs font-bold mt-2"
            >
              Clear Filters
            </Button>
          )}
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredProjections.map((artisan) => (
            <Card
              key={artisan.artisanUid}
              className="p-5 bg-white border border-surface-variant/80 rounded-2xl shadow-xs hover:border-secondary/50 transition-all flex flex-col justify-between gap-5 group"
            >
              <div className="flex flex-col gap-3.5">
                {/* Top header */}
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-11 h-11 rounded-full bg-primary text-white flex items-center justify-center font-bold text-base shrink-0 ring-1 ring-white/60">
                      {artisan.artisanDisplayName.charAt(0) || 'A'}
                    </div>
                    <div className="flex flex-col min-w-0">
                      <h3 className="font-bold text-sm text-primary truncate group-hover:text-secondary transition-colors">
                        {artisan.artisanDisplayName}
                      </h3>
                      <div className="flex items-center gap-2 text-xs text-on-surface-variant truncate mt-0.5">
                        {artisan.clusterName && (
                          <span className="flex items-center gap-1 truncate">
                            <Building className="w-3 h-3 text-secondary shrink-0" /> {artisan.clusterName}
                          </span>
                        )}
                        {artisan.state && (
                          <span className="flex items-center gap-1 shrink-0">
                            <MapPin className="w-3 h-3 text-secondary shrink-0" /> {artisan.state}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <span className="px-2 py-0.5 rounded-full bg-success-container/70 text-on-success-container text-[10px] font-bold shrink-0">
                    Active
                  </span>
                </div>

                {/* Product lifecycle status pills */}
                <div className="grid grid-cols-4 gap-1.5 p-2.5 bg-surface-container-low rounded-xl text-center border border-surface-variant/40">
                  <div className="flex flex-col">
                    <span className="text-[9px] text-on-surface-variant font-semibold">Total</span>
                    <span className="font-bold text-xs text-primary">{artisan.productCounts.total}</span>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-[9px] text-amber-800 font-semibold">Drafts</span>
                    <span className="font-bold text-xs text-amber-900">{artisan.productCounts.draft}</span>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-[9px] text-secondary font-semibold">Ready</span>
                    <span className="font-bold text-xs text-secondary">{artisan.productCounts.ready}</span>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-[9px] text-success font-semibold">Enquiries</span>
                    <span className="font-bold text-xs text-success">{artisan.newEnquiryCount}</span>
                  </div>
                </div>

                {/* Export issues badge if any */}
                {artisan.exportProblemsCount > 0 && (
                  <div className="p-2.5 bg-error-container/30 border border-error/30 rounded-xl flex items-center justify-between gap-2 text-xs text-error">
                    <div className="flex items-center gap-1.5 font-bold">
                      <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                      <span>{artisan.exportProblemsCount} Export Error(s)</span>
                    </div>
                    <span className="text-[10px] font-semibold underline">Help Needed</span>
                  </div>
                )}
              </div>

              {/* Action Button */}
              <div className="pt-3 border-t border-surface-variant flex items-center justify-between gap-2">
                <span className="text-[11px] text-on-surface-variant flex items-center gap-1">
                  <Clock className="w-3 h-3" /> Recent Activity
                </span>
                <Button
                  size="sm"
                  onClick={() => navigate(ROUTES.artisanDetail(artisan.artisanUid))}
                  rightIcon={<ArrowRight className="w-3.5 h-3.5" />}
                  className="text-xs font-bold"
                >
                  View Details
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};
