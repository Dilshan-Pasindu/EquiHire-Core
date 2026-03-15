/**
 * Invite candidate form: send magic-link invitations. Used by the Scheduler view.
 * Uses useInviteCandidate for jobs, send action, and success state.
 */

import { useState } from 'react';
import { useAuthContext } from '@asgardeo/auth-react';
import { useInviteCandidate } from '@/hooks';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Mail, Send, CheckCircle, Copy, AlertCircle } from 'lucide-react';
import type { Job } from '@/types';

export interface InviteCandidateProps {
  organizationId?: string;
}

export default function InviteCandidate({ organizationId }: InviteCandidateProps) {
  const { state } = useAuthContext();
  const userId = state.sub;

  const {
    jobs,
    isSending,
    error,
    magicLink,
    sendInvitation,
    clearMagicLink,
    clearError,
  } = useInviteCandidate({ userId, organizationId });

  const [candidateName, setCandidateName] = useState('');
  const [candidateEmail, setCandidateEmail] = useState('');
  const [selectedJobId, setSelectedJobId] = useState('');
  const [interviewDate, setInterviewDate] = useState('');
  const [copied, setCopied] = useState(false);
  const [validationError, setValidationError] = useState('');

  const handleSendInvitation = async () => {
    clearError();
    setValidationError('');
    if (!candidateEmail || !candidateName || !selectedJobId) {
      setValidationError('Please fill in all required fields and select a job');
      return;
    }
    const jobTitle = jobs.find((j) => j.id === selectedJobId)?.title ?? 'Unknown Role';
    const ok = await sendInvitation({
      candidateName,
      candidateEmail,
      jobId: selectedJobId,
      jobTitle,
      interviewDate: interviewDate || undefined,
    });
    if (ok) {
      setCandidateName('');
      setCandidateEmail('');
      setSelectedJobId('');
      setInterviewDate('');
    }
  };

  const copyToClipboard = () => {
    if (!magicLink) return;
    navigator.clipboard.writeText(magicLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Card className="shadow-lg">
      <CardHeader>
        <div className="flex items-center">
          <Mail className="h-6 w-6 mr-2 text-[#FF7300]" aria-hidden />
          <CardTitle>Invite Candidate</CardTitle>
        </div>
        <CardDescription>Enter candidate details to schedule an interview.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {magicLink ? (
          <div className="space-y-4">
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <div className="flex items-start">
                <CheckCircle className="h-6 w-6 text-green-600 mr-3 flex-shrink-0 mt-0.5" aria-hidden />
                <div className="flex-1">
                  <h3 className="font-semibold text-green-900 mb-1">Invitation Sent Successfully!</h3>
                  <p className="text-sm text-green-700 mb-3">
                    An email has been sent to the candidate. You can also share the link directly:
                  </p>
                  <div className="bg-white border border-green-300 rounded p-3 mb-3">
                    <p className="text-xs font-mono text-gray-600 break-all">{magicLink}</p>
                  </div>
                  <Button onClick={copyToClipboard} variant="outline" size="sm" className="w-full">
                    <Copy className="h-4 w-4 mr-2" aria-hidden />
                    {copied ? 'Copied!' : 'Copy Link'}
                  </Button>
                </div>
              </div>
            </div>
            <Button onClick={clearMagicLink} className="w-full bg-gray-900 hover:bg-gray-800">
              Send Another Invitation
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            {(error || validationError) && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3 flex items-start" role="alert">
                <AlertCircle className="h-5 w-5 text-red-600 mr-2 flex-shrink-0 mt-0.5" aria-hidden />
                <p className="text-sm text-red-700">{error || validationError}</p>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="candidateName">Candidate Name *</Label>
              <Input
                id="candidateName"
                placeholder="John Doe"
                value={candidateName}
                onChange={(e) => setCandidateName(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="candidateEmail">Candidate Email *</Label>
              <Input
                id="candidateEmail"
                type="email"
                placeholder="candidate@example.com"
                value={candidateEmail}
                onChange={(e) => setCandidateEmail(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="jobSelect">Job Role *</Label>
              <Select value={selectedJobId} onValueChange={setSelectedJobId}>
                <SelectTrigger id="jobSelect">
                  <SelectValue placeholder="Select a job role" />
                </SelectTrigger>
                <SelectContent>
                  {jobs.map((job: Job) => (
                    <SelectItem key={job.id ?? 'default'} value={job.id ?? ''}>
                      {job.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-gray-500">Create new jobs in the Jobs section.</p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="interviewDate">Interview Date (Optional)</Label>
              <Input
                id="interviewDate"
                type="datetime-local"
                value={interviewDate}
                onChange={(e) => setInterviewDate(e.target.value)}
              />
            </div>
            <Button
              onClick={handleSendInvitation}
              disabled={isSending || !candidateName || !candidateEmail || !selectedJobId}
              className="w-full bg-gray-900 hover:bg-gray-800 text-white h-12"
            >
              <Send className="h-4 w-4 mr-2" aria-hidden />
              {isSending ? 'Sending...' : 'Send Invitation'}
            </Button>
            <p className="text-xs text-gray-500 text-center">
              The candidate will receive an email with a secure magic link valid for 7 days.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
