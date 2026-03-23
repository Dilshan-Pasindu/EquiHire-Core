import { useEffect, useState } from 'react';
import { getTranscript } from '@/lib/api';
import type { TranscriptResponse, TranscriptItem } from '@/types';
import { LoadingScreen } from '@/components/ui/loading-screen';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { FileText, AlertTriangle, User } from 'lucide-react';
import { EquiHireLogo } from '@/components/ui/Icons';

export default function CandidateTranscript() {
  const [data, setData] = useState<TranscriptResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const urlParams = new URLSearchParams(window.location.search);
  const candidateId = urlParams.get('candidateId');

  useEffect(() => {
    if (!candidateId) {
      setError('No candidate ID provided');
      setLoading(false);
      return;
    }

    const fetchTranscript = async () => {
      try {
        const result = await getTranscript(candidateId);
        setData(result);
      } catch (err) {
        console.error('Failed to fetch transcript:', err);
        setError('Failed to load transcript. Please ensure the candidate has completed the interview.');
      } finally {
        setLoading(false);
      }
    };

    fetchTranscript();
  }, [candidateId]);

  if (loading) return <LoadingScreen message="Loading Transcript..." />;

  if (error || !data) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-8">
        <AlertTriangle className="h-12 w-12 text-red-500 mb-4" />
        <h1 className="text-xl font-semibold text-gray-900 mb-2">Error Loading Transcript</h1>
        <p className="text-gray-600 mb-6">{error}</p>
        <Button onClick={() => window.close()}>Close Window</Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8F9FA] text-[#1D1D1D] font-sans pb-20">
      <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-8 sticky top-0 z-10 shadow-sm">
        <div className="flex items-center space-x-4">
          <EquiHireLogo className="h-8 w-auto text-primary" />
          <div className="h-6 w-px bg-gray-200" />
          <div className="flex items-center space-x-2">
            <User className="h-4 w-4 text-gray-400" />
            <span className="font-semibold text-gray-900">{data.candidateName}</span>
          </div>
        </div>
        <div className="flex items-center space-x-3">
          <Badge variant="outline" className="bg-primary/5 text-primary border-primary/20">
            Interview Transcript
          </Badge>
          <Button variant="ghost" size="sm" onClick={() => window.print()} className="text-gray-500">
            Print
          </Button>
        </div>
      </header>

      <main className="max-w-4xl mx-auto py-12 px-6">
        <div className="mb-10 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-gray-900">Full Interview Transcript</h1>
            <p className="text-gray-500 mt-2">Detailed breakdown of each question, answer, and AI evaluation.</p>
          </div>
          <div className="text-right">
            <p className="text-xs text-gray-400 uppercase tracking-wider font-semibold">Candidate ID</p>
            <p className="font-mono text-sm text-gray-600">{data.candidateId}</p>
          </div>
        </div>

        <div className="space-y-8">
          {data.transcript.map((item, idx) => (
            <TranscriptCard key={idx} item={item} index={idx + 1} />
          ))}

          {data.transcript.length === 0 && (
            <div className="text-center py-20 bg-white rounded-xl border border-dashed border-gray-200">
              <FileText className="h-12 w-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">No interview data found for this candidate.</p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

function TranscriptCard({ item, index }: { item: TranscriptItem; index: number }) {
  const getScoreColor = (score: number) => {
    if (score >= 8) return 'bg-green-500';
    if (score >= 6) return 'bg-blue-500';
    if (score >= 4) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  return (
    <Card className="overflow-hidden border-none shadow-premium-subtle hover:shadow-premium transition-all duration-300">
      <div className={`h-1.5 ${getScoreColor(item.score)}`} />
      <CardHeader className="bg-white pb-4">
        <div className="flex items-start justify-between">
          <div className="flex space-x-4">
            <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-gray-50 text-gray-500 font-bold text-sm border border-gray-100 flex-shrink-0">
              {index}
            </div>
            <div>
              <CardDescription className="uppercase tracking-widest text-[10px] font-bold text-gray-400 mb-1">
                {item.questionType} Question
              </CardDescription>
              <CardTitle className="text-lg font-semibold text-gray-900 leading-tight">
                {item.questionText}
              </CardTitle>
            </div>
          </div>
          <div className="flex flex-col items-end">
            <div className="flex items-baseline space-x-1">
              <span className="text-2xl font-bold text-gray-900">{item.score}</span>
              <span className="text-sm text-gray-400">/ 10</span>
            </div>
            <p className="text-[10px] text-gray-400 font-medium uppercase mt-1">AI Grade</p>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6 pt-2">
        <section>
          <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2 flex items-center">
            Candidate's Answer
            {item.wasFlagged && (
              <Badge variant="destructive" className="ml-2 h-4 px-1.5 text-[9px]">
                <AlertTriangle className="h-2 w-2 mr-1" /> Flagged
              </Badge>
            )}
            {!item.hfGatePassed && (
              <Badge variant="outline" className="ml-2 h-4 px-1.5 text-[9px] text-orange-600 border-orange-200 bg-orange-50">
                Low Relevance
              </Badge>
            )}
          </h4>
          <div className="p-4 bg-gray-50 rounded-lg border border-gray-100 text-gray-700 leading-relaxed whitespace-pre-wrap text-sm italic">
            "{item.redactedAnswer}"
          </div>
        </section>

        <section>
          <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">AI Evaluation & Feedback</h4>
          <div className="p-4 bg-primary/[0.03] rounded-lg border border-primary/10 text-gray-800 text-sm leading-relaxed">
            {item.feedback}
          </div>
        </section>

        {item.sampleAnswer && (
          <section>
            <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Expected/Sample Answer</h4>
            <div className="p-4 bg-green-50/30 rounded-lg border border-green-100/50 text-gray-600 text-sm leading-relaxed">
              {item.sampleAnswer}
            </div>
          </section>
        )}
      </CardContent>
    </Card>
  );
}
