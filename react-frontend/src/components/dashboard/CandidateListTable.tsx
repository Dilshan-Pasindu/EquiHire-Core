import { Lock, Unlock, ChevronRight } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { getCandidateStatusClasses } from '@/lib/utils';
import type { ExtendedCandidate } from '@/types';

export interface CandidateListTableProps {
  candidates: ExtendedCandidate[];
  selectedId: string | null;
  isLoading: boolean;
  onSelectCandidate: (candidate: ExtendedCandidate) => void;
}

function ScoreBadge({ score }: { score: number }) {
  if (score <= 0) {
    return <span className="text-gray-400 text-xs text-center">—</span>;
  }
  const style =
    score >= 80 ? 'bg-green-100 text-green-800' : score >= 60 ? 'bg-yellow-100 text-yellow-800' : 'bg-red-100 text-red-800';
  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold ${style}`}
    >
      {score}/100
    </span>
  );
}

export function CandidateListTable({
  candidates,
  selectedId,
  isLoading,
  onSelectCandidate,
}: CandidateListTableProps) {
  return (
    <Card className="flex-1 overflow-hidden border-gray-200 shadow-sm flex flex-col">
      <div className="overflow-auto flex-1">
        <table className="w-full text-sm text-left">
          <thead className="bg-gray-50 text-gray-500 font-medium border-b border-gray-100 sticky top-0">
            <tr>
              <th className="px-6 py-3">Candidate</th>
              <th className="px-6 py-3">Role</th>
              <th className="px-6 py-3">Score</th>
              <th className="px-6 py-3">Status</th>
              <th className="px-6 py-3" aria-label="Actions" />
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {isLoading ? (
              [1, 2, 3, 4, 5, 6].map((i) => (
                <tr key={i}>
                  <td className="px-6 py-4">
                    <div className="flex items-center">
                      <Skeleton className="w-8 h-8 rounded-full mr-3" />
                      <div className="flex flex-col gap-1">
                        <Skeleton className="h-4 w-24" />
                        <Skeleton className="h-2 w-16" />
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4"><Skeleton className="h-4 w-20" /></td>
                  <td className="px-6 py-4"><Skeleton className="h-4 w-12" /></td>
                  <td className="px-6 py-4"><Skeleton className="h-5 w-16 rounded-full" /></td>
                  <td className="px-6 py-4 text-right"><Skeleton className="h-4 w-4 ml-auto" /></td>
                </tr>
              ))
            ) : candidates.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-6 py-10 text-center text-gray-400">
                  No candidates found.
                </td>
              </tr>
            ) : (
              candidates.map((c) => (
                <tr
                  key={c.candidateId}
                  className={`hover:bg-gray-50/80 transition-colors cursor-pointer ${selectedId === c.candidateId ? 'bg-blue-50/50' : ''}`}
                  onClick={() => onSelectCandidate(c)}
                >
                  <td className="px-6 py-4">
                    <div className="flex items-center">
                      <div
                        className={`w-8 h-8 rounded-full flex items-center justify-center mr-3 ${c.status === 'accepted' ? 'bg-green-100 text-green-700' : 'bg-gray-200 text-gray-600'}`}
                      >
                        {c.status === 'accepted' ? (
                          <Unlock className="w-4 h-4" aria-hidden />
                        ) : (
                          <Lock className="w-4 h-4" aria-hidden />
                        )}
                      </div>
                      <div className="flex flex-col">
                        <span
                          className={`${c.status === 'accepted' ? 'text-gray-900' : 'text-gray-500 font-mono tracking-wider'} ${!c.seen ? 'font-bold text-gray-900' : ''}`}
                        >
                          {c.candidateName}
                        </span>
                        {!c.seen && (
                          <span className="text-[10px] text-blue-600 font-bold uppercase tracking-wide">
                            New Update
                          </span>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-gray-600">{c.jobTitle}</td>
                  <td className="px-6 py-4">
                    <ScoreBadge score={c.score} />
                  </td>
                  <td className="px-6 py-4">
                    <span
                      className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium border ${getCandidateStatusClasses(c.status)}`}
                    >
                      {c.status.charAt(0).toUpperCase() + c.status.slice(1)}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right text-gray-400">
                    <ChevronRight className="w-4 h-4" aria-hidden />
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </Card>
  );
}
