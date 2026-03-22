/**
 * @fileoverview Filter controls for the candidate list: status, activity (seen/unseen), and auto-pass threshold.
 */

import { useState } from 'react';
import { Eye, EyeOff, Filter, Calculator } from 'lucide-react';
import type { ActivityFilter, StatusFilter } from '@/types';

export interface CandidateFiltersProps {
  statusFilter: StatusFilter;
  onStatusChange: (v: StatusFilter) => void;
  activityFilter: ActivityFilter;
  onActivityChange: (v: ActivityFilter) => void;
  threshold: number;
  onThresholdChange: (v: number) => void;
  cvWeight: number;
  onCvWeightChange: (v: number) => void;
  skillsWeight: number;
  onSkillsWeightChange: (v: number) => void;
  interviewWeight: number;
  onInterviewWeightChange: (v: number) => void;
}

const STATUS_OPTIONS: { value: StatusFilter; label: string; dot: string }[] = [
  { value: 'all',         label: 'All Status',  dot: 'bg-gray-400' },
  { value: 'applied',     label: 'Applied',     dot: 'bg-blue-300' },
  { value: 'pending',     label: 'Pending',     dot: 'bg-blue-400' },
  { value: 'shortlisted', label: 'Shortlisted', dot: 'bg-teal-400' },
  { value: 'accepted',    label: 'Accepted',    dot: 'bg-green-400' },
  { value: 'rejected',    label: 'Rejected',    dot: 'bg-red-400' },
];

export function CandidateFilters({
  statusFilter,
  onStatusChange,
  activityFilter,
  onActivityChange,
  threshold,
  onThresholdChange,
  cvWeight,
  onCvWeightChange,
  skillsWeight,
  onSkillsWeightChange,
  interviewWeight,
  onInterviewWeightChange,
}: CandidateFiltersProps) {
  const [localThreshold, setLocalThreshold] = useState(threshold);
  const [localCv, setLocalCv] = useState(cvWeight);
  const [localSkills, setLocalSkills] = useState(skillsWeight);
  const [localInterview, setLocalInterview] = useState(interviewWeight);

  const totalWeight = localCv + localSkills + localInterview;
  const isWeightValid = totalWeight === 100;

  const handleApply = () => {
    if (isWeightValid) {
      onThresholdChange(localThreshold);
      onCvWeightChange(localCv);
      onSkillsWeightChange(localSkills);
      onInterviewWeightChange(localInterview);
    }
  };

  return (
    <div className="flex flex-col gap-3 w-full self-start">
      <div className="flex flex-wrap items-center gap-2">
        {/* Activity toggle — All / Unseen */}
        <div className="flex items-center bg-gray-100 p-1 rounded-xl gap-1">
          <button
            type="button"
            onClick={() => onActivityChange('all')}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition-all duration-200
              ${activityFilter === 'all'
                ? 'bg-white shadow-sm text-gray-900'
                : 'text-gray-500 hover:text-gray-700'}`}
          >
            <Eye className="w-3.5 h-3.5" />
            All
          </button>
          <button
            type="button"
            onClick={() => onActivityChange('unseen')}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition-all duration-200
              ${activityFilter === 'unseen'
                ? 'bg-white shadow-sm text-blue-600'
                : 'text-gray-500 hover:text-gray-700'}`}
          >
            <EyeOff className="w-3.5 h-3.5" />
            Unseen
          </button>
        </div>

        {/* Status select — styled as a premium dropdown */}
        <div className="relative flex items-center">
          <Filter className="absolute left-3 w-3.5 h-3.5 text-gray-400 pointer-events-none" />
          <select
            className="appearance-none bg-white border border-gray-200 text-gray-700 text-xs font-semibold 
              rounded-xl pl-8 pr-8 py-2 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30 
              focus:border-blue-400 cursor-pointer hover:border-gray-300 transition-colors"
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
          <svg className="absolute right-2.5 w-3 h-3 text-gray-400 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" />
          </svg>
        </div>

        {/* Auto-pass & Weightages Unified row */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 bg-white border border-gray-200 rounded-xl p-2 shadow-sm w-fit transition-shadow hover:shadow-md">
          <div className="flex flex-col px-3 border-b sm:border-b-0 sm:border-r border-gray-200 pb-2 sm:pb-0 shrink-0">
             <span className="text-[10px] uppercase font-bold text-gray-400 tracking-wider mb-1">Auto-Pass</span>
             <div className="flex items-center">
               <input
                 type="number" min={0} max={100}
                 value={localThreshold}
                 onChange={(e) => setLocalThreshold(Number(e.target.value))}
                 className="w-10 text-sm font-extrabold text-orange-500 focus:outline-none bg-transparent"
               />
               <span className="text-sm font-bold text-orange-400/70">%</span>
             </div>
          </div>

          <div className="flex items-center px-1 shrink-0 gap-3">
            <div className="flex flex-col">
              <span className="text-[10px] uppercase font-bold text-gray-500 mb-1">CV Match</span>
              <div className="flex items-center">
                <input type="number" min={0} max={100} value={localCv} onChange={(e) => setLocalCv(Number(e.target.value))} className="w-9 text-xs font-bold focus:outline-none text-center bg-gray-50 rounded border border-transparent focus:border-blue-300" />
                <span className="text-xs text-gray-400 ml-0.5">%</span>
              </div>
            </div>
            <div className="flex flex-col">
              <span className="text-[10px] uppercase font-bold text-gray-500 mb-1">Skills</span>
               <div className="flex items-center">
                <input type="number" min={0} max={100} value={localSkills} onChange={(e) => setLocalSkills(Number(e.target.value))} className="w-9 text-xs font-bold focus:outline-none text-center bg-gray-50 rounded border border-transparent focus:border-blue-300" />
                <span className="text-xs text-gray-400 ml-0.5">%</span>
              </div>
            </div>
            <div className="flex flex-col">
              <span className="text-[10px] uppercase font-bold text-gray-500 mb-1">Interview</span>
               <div className="flex items-center">
                <input type="number" min={0} max={100} value={localInterview} onChange={(e) => setLocalInterview(Number(e.target.value))} className="w-9 text-xs font-bold focus:outline-none text-center bg-gray-50 rounded border border-transparent focus:border-blue-300" />
                <span className="text-xs text-gray-400 ml-0.5">%</span>
              </div>
            </div>
          </div>
          
          <div className="flex items-center border-t sm:border-t-0 sm:border-l border-gray-200 pt-2 sm:pt-0 pl-0 sm:pl-3 gap-3">
             <div className={`text-[10px] font-bold ${isWeightValid ? 'text-gray-400' : 'text-red-500'}`}>
                Sum: {totalWeight}%
             </div>
             <button
               onClick={handleApply}
               disabled={!isWeightValid || (localThreshold === threshold && localCv === cvWeight && localSkills === skillsWeight && localInterview === interviewWeight)}
               className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-900 border border-transparent text-white text-xs font-bold rounded-lg hover:bg-black disabled:opacity-30 disabled:cursor-not-allowed transition-all"
             >
               <Calculator className="w-3.5 h-3.5" /> Calculate
             </button>
          </div>
        </div>
      </div>
    </div>
  );
}
