/**
 * Candidates View
 *
 * Dashboard view for managing the hiring pipeline: list candidates, filter by status/activity,
 * view details (scores, context, timeline), and accept/reject with configurable threshold.
 *
 * Structure:
 * - useCandidates: data loading, filters, selection, and decision actions
 * - CandidateFilters: status dropdown, seen/unseen toggle, threshold input
 * - CandidateListTable: scrollable table with loading/empty states
 * - CandidateDetailPanel: slide-in panel with scores, context, timeline, actions
 */

import { useAuthContext } from '@asgardeo/auth-react';
import { useCandidates } from '@/hooks/useCandidates';
import {
  CandidateFilters,
  CandidateListTable,
  CandidateDetailPanel,
} from '@/components/dashboard';

export default function CandidateManager() {
  const { state } = useAuthContext();
  const userId = state.sub;

  const {
    filteredCandidates,
    selectedCandidate,
    threshold,
    isLoading,
    isProcessing,
    statusFilter,
    setStatusFilter,
    activityFilter,
    setActivityFilter,
    setThreshold,
    setSelectedCandidate,
    handleViewDetails,
    handleApplyDecision,
  } = useCandidates({ userId });

  return (
    <div className="flex h-[calc(100vh-8rem)] gap-6 animate-in fade-in duration-500">
      {/* Main list: filters + table */}
      <div
        className={`flex-1 flex flex-col space-y-4 transition-all ${selectedCandidate ? 'w-1/2' : 'w-full'}`}
      >
        <div className="flex flex-col md:flex-row justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Candidates</h2>
            <p className="text-gray-500">Manage hiring pipeline.</p>
          </div>
          <CandidateFilters
            statusFilter={statusFilter}
            onStatusChange={setStatusFilter}
            activityFilter={activityFilter}
            onActivityChange={setActivityFilter}
            threshold={threshold}
            onThresholdChange={setThreshold}
          />
        </div>

        <CandidateListTable
          candidates={filteredCandidates}
          selectedId={selectedCandidate?.candidateId ?? null}
          isLoading={isLoading}
          onSelectCandidate={handleViewDetails}
        />
      </div>

      {/* Detail panel (slides in when a candidate is selected) */}
      {selectedCandidate && (
        <CandidateDetailPanel
          candidate={selectedCandidate}
          threshold={threshold}
          isProcessing={isProcessing}
          onClose={() => setSelectedCandidate(null)}
          onApplyDecision={handleApplyDecision}
        />
      )}
    </div>
  );
}
