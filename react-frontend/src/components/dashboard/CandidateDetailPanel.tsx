/**
 * @fileoverview Side panel showing selected candidate details: scores, context, timeline, and actions.
 */

import {
  Lock,
  XCircle,
  Clock,
  FileText,
  Loader2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import type { ExtendedCandidate } from '@/types';

export interface CandidateDetailPanelProps {
  candidate: ExtendedCandidate;
  threshold: number;
  isProcessing: boolean;
  onClose: () => void;
  onApplyDecision: (candidateId: string) => Promise<void>;
}

const AVATAR_URL = 'https://api.dicebear.com/7.x/avataaars/svg';

export function CandidateDetailPanel({
  candidate,
  threshold,
  isProcessing,
  onClose,
  onApplyDecision,
}: CandidateDetailPanelProps) {
  const meetsThreshold = candidate.score >= threshold;

  return (
    <div className="w-[400px] flex flex-col space-y-4 animate-in slide-in-from-right-10 duration-300">
      <div className="flex justify-between items-center h-8">
        <h3 className="font-bold text-gray-900">Candidate Details</h3>
        <button
          type="button"
          onClick={onClose}
          className="text-gray-400 hover:text-gray-900"
          aria-label="Close panel"
        >
          <XCircle className="w-5 h-5" />
        </button>
      </div>

      <Card className="flex-1 shadow-lg border-gray-200 overflow-auto">
        <CardHeader className="bg-gray-50 border-b border-gray-100 pb-6">
          <div className="flex flex-col items-center">
            <div
              className={`w-20 h-20 rounded-full flex items-center justify-center mb-4 shadow-sm ${candidate.status === 'accepted' ? 'bg-white' : 'bg-gray-200'}`}
            >
              {candidate.status === 'accepted' ? (
                <img
                  src={`${AVATAR_URL}?seed=${encodeURIComponent(candidate.candidateName)}`}
                  alt=""
                  className="w-full h-full rounded-full"
                />
              ) : (
                <Lock className="w-8 h-8 text-gray-400" aria-hidden />
              )}
            </div>
            <CardTitle className="text-center">{candidate.candidateName}</CardTitle>
            <CardDescription className="text-center font-mono text-xs mt-1 text-gray-500">
              ID: {candidate.candidateId.split('-')[0]} • {candidate.jobTitle}
            </CardDescription>
          </div>
        </CardHeader>

        <CardContent className="pt-6 space-y-6">
          {/* Overall AI Match score */}
          <section className="p-4 bg-gray-50 rounded-lg border border-gray-100" aria-labelledby="score-heading">
            <div className="flex justify-between items-center mb-2">
              <span id="score-heading" className="text-xs font-semibold uppercase text-gray-500">Overall AI Match</span>
              {candidate.score > 0 && (
                <span className="font-bold text-lg text-gray-900">{candidate.score}%</span>
              )}
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2 mb-4">
              <div
                className={`h-2 rounded-full transition-all duration-500 ${candidate.score >= threshold ? 'bg-[#FF7300]' : 'bg-red-400'}`}
                style={{ width: `${candidate.score}%` }}
              />
            </div>
            {candidate.score > 0 ? (
              <div className="space-y-2 mt-2 pt-3 border-t border-gray-200 border-dashed">
                <div className="flex justify-between text-xs">
                  <span className="text-gray-500">CV / Resume</span>
                  <span className="font-medium text-gray-700">{candidate.cvScore}%</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-gray-500">Required Skills</span>
                  <span className="font-medium text-gray-700">{candidate.skillsScore}%</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-gray-500">Technical Interview</span>
                  <span className="font-medium text-gray-700">{candidate.interviewScore}%</span>
                </div>
              </div>
            ) : (
              <p className="text-xs text-gray-400 italic">Interview pending or not graded.</p>
            )}
          </section>

          {/* Candidate context (experience, stack) */}
          {candidate.experienceLevel && (
            <section aria-labelledby="context-heading">
              <h4 id="context-heading" className="text-sm font-bold text-gray-900 mb-2">
                Candidate Context
              </h4>
              <div className="bg-white border border-gray-200 p-3 rounded-lg shadow-sm space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-xs text-gray-500 font-medium">Estimated Experience</span>
                  <span className="text-xs font-bold text-blue-700 bg-blue-50 px-2 py-1 rounded capitalize">
                    {candidate.experienceLevel}
                  </span>
                </div>
                {candidate.detectedStack && candidate.detectedStack.length > 0 && (
                  <div>
                    <span className="text-[10px] text-gray-400 uppercase font-semibold mb-1 block">
                      Detected Tech Stack
                    </span>
                    <div className="flex gap-1.5 flex-wrap">
                      {candidate.detectedStack.map((tech, i) => (
                        <span
                          key={`${tech}-${i}`}
                          className="text-xs text-gray-600 bg-gray-100 border border-gray-200 px-2 py-0.5 rounded-sm font-medium"
                        >
                          {tech}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </section>
          )}

          {/* HF relevance / suspicious answers alert */}
          {candidate.hfRelevanceSkipped > 0 && (
            <div className="bg-red-50 border-l-4 border-red-500 p-3 rounded-r-lg" role="alert">
              <div className="flex gap-2">
                <XCircle className="w-5 h-5 text-red-500 shrink-0" aria-hidden />
                <div>
                  <p className="text-xs font-bold text-red-800">Suspicious Answers Detected</p>
                  <p className="text-[11px] text-red-600 mt-0.5">
                    {candidate.hfRelevanceSkipped} answer(s) failed the relevance check and were
                    flagged as gibberish or AI-generated bypass attempts. They received an automatic
                    score of 0.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Timeline */}
          <section aria-labelledby="timeline-heading">
            <h4 id="timeline-heading" className="text-sm font-bold text-gray-900 mb-4 flex items-center">
              <Clock className="w-4 h-4 mr-2 text-gray-500" aria-hidden /> Timeline
            </h4>
            <div className="relative pl-4 border-l-2 border-gray-100 space-y-6">
              <div className="relative">
                <div className="absolute -left-[21px] top-1 w-3 h-3 bg-green-500 rounded-full border-2 border-white ring-2 ring-gray-50" />
                <p className="text-sm font-medium text-gray-900">Application Received</p>
                <p className="text-xs text-gray-500">
                  {new Date(candidate.appliedDate).toLocaleDateString()}
                </p>
              </div>
              <div className="relative">
                <div
                  className={`absolute -left-[21px] top-1 w-3 h-3 rounded-full border-2 border-white ring-2 ring-gray-50 ${candidate.score > 0 ? 'bg-green-500' : 'bg-gray-300'}`}
                />
                <p className="text-sm font-medium text-gray-900">Interview Session</p>
                <p className="text-xs text-gray-500">
                  {candidate.score > 0 ? 'Completed' : 'Scheduled'}
                </p>
              </div>
              <div className="relative">
                <div
                  className={`absolute -left-[21px] top-1 w-3 h-3 rounded-full border-2 border-white ring-2 ring-gray-50 ${candidate.status !== 'pending' && candidate.status !== 'scheduled' ? 'bg-green-500' : 'bg-gray-300'}`}
                />
                <p className="text-sm font-medium text-gray-900">Final Decision</p>
                <p className="text-xs text-gray-500">
                  {candidate.status === 'pending'
                    ? 'Pending Review'
                    : candidate.status === 'accepted'
                      ? 'Accepted'
                      : candidate.status === 'rejected'
                        ? 'Rejected'
                        : 'Pending'}
                </p>
              </div>
            </div>
          </section>

          {/* Actions */}
          <div className="pt-4 border-t border-gray-100 flex flex-col gap-2">
            {candidate.status === 'pending' && candidate.score > 0 && (
              <Button
                className={`w-full ${meetsThreshold ? 'bg-green-600 hover:bg-green-700 text-white' : 'bg-red-600 hover:bg-red-700 text-white'}`}
                onClick={() => onApplyDecision(candidate.candidateId)}
                disabled={isProcessing}
              >
                {isProcessing ? (
                  <Loader2 className="w-4 h-4 animate-spin mr-2" aria-hidden />
                ) : (
                  <Lock className="w-4 h-4 mr-2" aria-hidden />
                )}
                {meetsThreshold ? 'Accept & Reveal Name' : 'Reject & Anonymize'} (Threshold {threshold}%)
              </Button>
            )}
            <Button type="button" className="w-full" variant="outline">
              <FileText className="w-4 h-4 mr-2" aria-hidden /> View Full Transcript
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
