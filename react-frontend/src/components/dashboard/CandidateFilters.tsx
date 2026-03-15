/**
 * @fileoverview Filter controls for the candidate list: status, activity (seen/unseen), and auto-pass threshold.
 */

import { Settings2 } from 'lucide-react';
import type { ActivityFilter, StatusFilter } from '@/types';

export interface CandidateFiltersProps {
  statusFilter: StatusFilter;
  onStatusChange: (v: StatusFilter) => void;
  activityFilter: ActivityFilter;
  onActivityChange: (v: ActivityFilter) => void;
  threshold: number;
  onThresholdChange: (v: number) => void;
}

const STATUS_OPTIONS: { value: StatusFilter; label: string }[] = [
  { value: 'all', label: 'All Status' },
  { value: 'pending', label: 'Pending' },
  { value: 'accepted', label: 'Accepted' },
  { value: 'rejected', label: 'Rejected' },
  { value: 'scheduled', label: 'Scheduled' },
];

export function CandidateFilters({
  statusFilter,
  onStatusChange,
  activityFilter,
  onActivityChange,
  threshold,
  onThresholdChange,
}: CandidateFiltersProps) {
  return (
    <div className="flex space-x-2">
      {/* Activity: All / Unseen */}
      <div className="flex space-x-1 bg-gray-100 p-1 rounded-md">
        <button
          type="button"
          onClick={() => onActivityChange('all')}
          className={`px-3 py-1 text-xs rounded ${activityFilter === 'all' ? 'bg-white shadow' : 'text-gray-500'}`}
        >
          All
        </button>
        <button
          type="button"
          onClick={() => onActivityChange('unseen')}
          className={`px-3 py-1 text-xs rounded ${activityFilter === 'unseen' ? 'bg-white shadow font-bold text-blue-600' : 'text-gray-500'}`}
        >
          Unseen
        </button>
      </div>

      {/* Status dropdown */}
      <select
        className="bg-white border border-gray-200 text-gray-700 text-sm rounded-md focus:ring-[#FF7300] focus:border-[#FF7300] block p-2"
        value={statusFilter}
        onChange={(e) => onStatusChange(e.target.value as StatusFilter)}
        aria-label="Filter by status"
      >
        {STATUS_OPTIONS.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>

      {/* Auto-pass threshold */}
      <div className="flex items-center space-x-2 bg-white border border-gray-200 rounded-md px-3">
        <Settings2 className="w-4 h-4 text-gray-400" aria-hidden />
        <span className="text-sm text-gray-500 font-medium">Auto-Pass Threshold:</span>
        <input
          type="number"
          min={0}
          max={100}
          value={threshold}
          onChange={(e) => onThresholdChange(Number(e.target.value))}
          className="w-14 text-sm font-bold text-[#FF7300] focus:outline-none bg-transparent"
          aria-label="Auto-pass threshold percentage"
        />
        <span className="text-sm font-bold text-gray-400">%</span>
      </div>
    </div>
  );
}
