/**
 * Candidate interview: timed questions, answer submission, lockdown (copy/paste/tab/fullscreen) detection and violation reporting.
 */
import { useState, useEffect, useCallback, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { EquiHireLogo } from "@/components/ui/Icons";
import { Textarea } from "@/components/ui/textarea";
import { API } from "@/lib/api";
import type { CheatEventItem, AnswerSubmission, SubmitAssessmentPayload } from '@/types';
import {
    Loader2, AlertCircle, ShieldAlert, Eye, 
    Copy, ClipboardPaste, MousePointer, MonitorX, Terminal, CheckCircle
} from "lucide-react";

export default function CandidateInterview() {

    const [timeLeft, setTimeLeft] = useState(45 * 60);
    const [answers, setAnswers] = useState<Record<string, string>>({});
    const [isSubmitted, setIsSubmitted] = useState(false);

    interface Question {
        id: string;
        questionText: string;
        type?: 'text' | 'code';
    }

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [questions, setQuestions] = useState<Question[]>([]);
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);

    // --- Assessment Pipeline State ---
    const [sessionId, setSessionId] = useState<string | null>(null);
    const [cheatEvents, setCheatEvents] = useState<CheatEventItem[]>([]);
    const timeSpentPerQuestion = useRef<Record<string, number>>({});
    
    // UI Warning State
    const [showWarning, setShowWarning] = useState(false);
    const [warningMessage, setWarningMessage] = useState("");
    const [warningIcon, setWarningIcon] = useState<"copy" | "paste" | "rightclick" | "tabswitch" | "fullscreen">("tabswitch");
    
    // Stable ref for submit
    const cheatEventsRef = useRef(cheatEvents);
    useEffect(() => {
        cheatEventsRef.current = cheatEvents;
    }, [cheatEvents]);

    const totalViolations = cheatEvents.length;

    const flashWarning = useCallback((msg: string, icon: "copy" | "paste" | "rightclick" | "tabswitch" | "fullscreen") => {
        setWarningMessage(msg);
        setWarningIcon(icon);
        setShowWarning(true);
        setTimeout(() => setShowWarning(false), 3000);
    }, []);

    const addCheatEvent = useCallback((type: CheatEventItem['eventType'], msg: string, icon: typeof warningIcon) => {
        setCheatEvents(prev => [...prev, {
            eventType: type,
            occurredAt: new Date().toISOString()
        }]);
        flashWarning(msg, icon);
    }, [flashWarning]);

    // Initialize session and questions
    useEffect(() => {
        const initializeInterview = async () => {
            try {
                const storedDataStr = sessionStorage.getItem('candidateData');
                const candidateIdStr = sessionStorage.getItem('candidateId');
                
                if (!storedDataStr || !candidateIdStr) {
                    setError("No invitation session found. Please use the link provided in your email.");
                    setLoading(false);
                    return;
                }
                const storedData = JSON.parse(storedDataStr);
                if (!storedData.jobId) {
                    setError("Invalid session data. Job ID is missing.");
                    setLoading(false);
                    return;
                }

                // Call API to start session
                if (storedData.invitationId) {
                    try {
                        const sessionRes = await API.startExamSession(candidateIdStr, {
                            jobId: storedData.jobId,
                            invitationId: storedData.invitationId
                        });
                        setSessionId(sessionRes.sessionId);
                    } catch (e) {
                        console.error("Failed to start exam session", e);
                        // We continue, but ideally the API handles it
                    }
                }

                const jobQuestions = await API.getJobQuestions(storedData.jobId);
                setQuestions(jobQuestions);

                // Request Fullscreen
                if (document.documentElement.requestFullscreen) {
                    document.documentElement.requestFullscreen().catch(() => {
                        console.warn("Fullscreen request blocked automatically.");
                    });
                }

                setLoading(false);
            } catch (err: unknown) {
                console.error("Initialization error:", err);
                setError("Failed to initialize interview. Please try again.");
                setLoading(false);
            }
        };
        initializeInterview();
    }, []);

    // --- Lockdown event listeners ---
    useEffect(() => {
        if (loading || error || isSubmitted) return;

        const handleCopy = (e: ClipboardEvent) => {
            e.preventDefault();
            addCheatEvent('copy_attempt', "Copy is disabled. This violation has been recorded.", "copy");
        };

        const handlePaste = (e: ClipboardEvent) => {
            e.preventDefault();
            addCheatEvent('paste_attempt', "Paste is disabled. This violation has been recorded.", "paste");
        };

        const handleCut = (e: ClipboardEvent) => {
            e.preventDefault();
            addCheatEvent('copy_attempt', "Cut is disabled. This violation has been recorded.", "copy");
        };

        const handleContextMenu = (e: MouseEvent) => {
            e.preventDefault();
            addCheatEvent('right_click', "Right-click is disabled. This violation has been recorded.", "rightclick");
        };

        const handleVisibilityChange = () => {
            if (document.hidden) {
                addCheatEvent('tab_switch', "Leaving the assessment window is not allowed.", "tabswitch");
            }
        };

        const handleBlur = () => {
            addCheatEvent('tab_switch', "Window focus lost is not allowed.", "tabswitch");
        };

        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.ctrlKey || e.metaKey) {
                if (['c', 'v', 'x'].includes(e.key.toLowerCase())) {
                    e.preventDefault();
                    if (e.key.toLowerCase() === 'v') {
                        addCheatEvent('paste_attempt', "Paste shortcut disabled.", "paste");
                    } else {
                        addCheatEvent('copy_attempt', "Copy/Cut shortcut disabled.", "copy");
                    }
                }
            }
        };

        const handleFullscreenChange = () => {
            if (!document.fullscreenElement) {
                addCheatEvent('fullscreen_exit', "You exited fullscreen mode. Please return to fullscreen.", "fullscreen");
            }
        };

        document.addEventListener('copy', handleCopy);
        document.addEventListener('paste', handlePaste);
        document.addEventListener('cut', handleCut);
        document.addEventListener('contextmenu', handleContextMenu);
        document.addEventListener('visibilitychange', handleVisibilityChange);
        document.addEventListener('keydown', handleKeyDown);
        document.addEventListener('fullscreenchange', handleFullscreenChange);
        window.addEventListener('blur', handleBlur);

        return () => {
            document.removeEventListener('copy', handleCopy);
            document.removeEventListener('paste', handlePaste);
            document.removeEventListener('cut', handleCut);
            document.removeEventListener('contextmenu', handleContextMenu);
            document.removeEventListener('visibilitychange', handleVisibilityChange);
            document.removeEventListener('keydown', handleKeyDown);
            document.removeEventListener('fullscreenchange', handleFullscreenChange);
            window.removeEventListener('blur', handleBlur);
        };
    }, [loading, error, isSubmitted, addCheatEvent]);

    const submitPayload = useCallback(async (isAutoSubmit: boolean) => {
        setIsSubmitted(true);
        try {
            const candidateId = sessionStorage.getItem('candidateId');
            const candidateDataStr = sessionStorage.getItem('candidateData');
            
            if (!candidateId || !candidateDataStr) {
                setError("Missing session data. Cannot submit assessment.");
                return;
            }

            const candidateData = JSON.parse(candidateDataStr);

            // Construct answer array
            const formattedAnswers: AnswerSubmission[] = questions.map((q) => ({
                questionId: q.id,
                answerText: answers[q.id] || "",
                timeSpentSeconds: timeSpentPerQuestion.current[q.id] || 0
            }));

            const payload: SubmitAssessmentPayload = {
                jobId: candidateData.jobId,
                sessionId: sessionId || "UNKNOWN_SESSION",
                invitationId: candidateData.invitationId,
                submissionType: isAutoSubmit ? 'timer_expired' : 'manual',
                answers: formattedAnswers,
                cheatEvents: cheatEventsRef.current
            };

            await API.submitCandidateAnswers(candidateId, payload);

            // Clean up
            sessionStorage.removeItem('invite_token');
            sessionStorage.removeItem('candidateData');
            sessionStorage.removeItem('candidateId');
            
            if (document.fullscreenElement) {
                document.exitFullscreen().catch(() => {});
            }

        } catch (err) {
            console.error(err);
            setError("Failed to submit assessment.");
        }
    }, [answers, questions, sessionId]);

    const handleSubmitClick = () => submitPayload(false);

    // Timer & Question time tracker
    useEffect(() => {
        if (loading || error || isSubmitted || questions.length === 0) return;
        
        const currentQId = questions[currentQuestionIndex]?.id;

        const timer = setInterval(() => {
            setTimeLeft((prev) => {
                if (prev <= 1) { 
                    clearInterval(timer); 
                    submitPayload(true); 
                    return 0; 
                }
                return prev - 1;
            });

            // Track time spent per question
            if (currentQId) {
                timeSpentPerQuestion.current[currentQId] = (timeSpentPerQuestion.current[currentQId] || 0) + 1;
            }

        }, 1000);
        return () => clearInterval(timer);
    }, [loading, error, isSubmitted, questions, currentQuestionIndex, submitPayload]);

    const formatTime = (seconds: number) => {
        const m = Math.floor(seconds / 60);
        const s = seconds % 60;
        return `${m}:${s < 10 ? '0' : ''}${s}`;
    };

    const handleAnswerChange = (val: string) => {
        if (questions.length === 0) return;
        const currentQId = questions[currentQuestionIndex].id;
        setAnswers(prev => ({ ...prev, [currentQId]: val }));
    };

    const handleNext = () => {
        if (currentQuestionIndex < questions.length - 1) setCurrentQuestionIndex(prev => prev + 1);
    };

    const handlePrev = () => {
        if (currentQuestionIndex > 0) setCurrentQuestionIndex(prev => prev - 1);
    };

    // --- Warning Icon Selector ---
    const getWarningIcon = () => {
        switch (warningIcon) {
            case "copy": return <Copy className="w-12 h-12 text-red-500 mx-auto mb-4" />;
            case "paste": return <ClipboardPaste className="w-12 h-12 text-red-500 mx-auto mb-4" />;
            case "rightclick": return <MousePointer className="w-12 h-12 text-red-500 mx-auto mb-4" />;
            case "tabswitch": return <MonitorX className="w-12 h-12 text-red-500 mx-auto mb-4" />;
            case "fullscreen": return <MonitorX className="w-12 h-12 text-red-500 mx-auto mb-4" />;
        }
    };

    const getLineNumbers = (text: string) => {
        const lines = (text || "").split("\n");
        return lines.map((_, i) => i + 1);
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-[#111827] flex items-center justify-center font-sans text-white">
                <div className="flex flex-col items-center gap-4">
                    <Loader2 className="w-8 h-8 animate-spin text-[#FF7300]" />
                    <p className="text-gray-400">Loading your assessment...</p>
                </div>
            </div>
        );
    }

    if (error && !isSubmitted) {
        return (
            <div className="min-h-screen bg-[#111827] flex items-center justify-center font-sans text-white p-6">
                <div className="bg-gray-900/80 border border-red-500/30 p-8 rounded-lg max-w-md w-full text-center space-y-4 shadow-2xl">
                    <AlertCircle className="w-12 h-12 text-red-500 mx-auto" />
                    <h2 className="text-xl font-semibold">Assessment Error</h2>
                    <p className="text-gray-400">{error}</p>
                    <Button onClick={() => window.location.href = '/candidate/welcome'} className="mt-4 bg-gray-800 hover:bg-gray-700 w-full">
                        Return Home
                    </Button>
                </div>
            </div>
        );
    }

    if (isSubmitted && !error) {
        return (
            <div className="min-h-screen bg-[#111827] flex flex-col items-center justify-center p-6 text-white font-sans overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0 pointer-events-none">
                    <div className="absolute top-[10%] left-[20%] w-[30%] h-[30%] rounded-full bg-blue-900/10 blur-[100px]"></div>
                    <div className="absolute bottom-[10%] right-[20%] w-[30%] h-[30%] rounded-full bg-[#FF7300]/10 blur-[100px]"></div>
                </div>
                
                <div className="bg-gray-900/50 backdrop-blur-md border border-white/10 p-10 rounded-2xl max-w-md w-full text-center space-y-6 shadow-2xl z-10 animate-in zoom-in-95 duration-500">
                    <div className="bg-green-500/20 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4 mt-2 shadow-[0_0_30px_rgba(34,197,94,0.2)]">
                        <CheckCircle className="w-10 h-10 text-green-400" />
                    </div>
                    
                    <h2 className="text-2xl font-bold tracking-tight">Assessment Completed</h2>
                    
                    <p className="text-gray-400 text-sm leading-relaxed">
                        Your answers have been securely evaluated and recorded. 
                        We will reach out to you directly regarding the next steps in the hiring process.
                    </p>
                    
                    <Button 
                        onClick={() => window.location.href = '/candidate/welcome'} 
                        className="w-full h-12 mt-6 bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 text-white font-medium shadow-lg shadow-blue-500/20"
                    >
                        Return to Portal
                    </Button>
                </div>
            </div>
        );
    }

    const currentQuestion = questions[currentQuestionIndex];
    const currentAnswer = currentQuestion ? (answers[currentQuestion.id] || "") : "";
    const isLastQuestion = currentQuestionIndex === questions.length - 1;
    const isCodeQuestion = currentQuestion?.type === 'code';

    return (
        <div className="min-h-screen bg-[#111827] flex flex-col font-sans text-white overflow-hidden relative select-none" style={{ userSelect: 'none' }}>
            {/* Lockdown Warning Overlay */}
            {showWarning && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="bg-red-950/90 border-2 border-red-500 rounded-xl p-8 max-w-md w-full mx-4 text-center shadow-[0_0_50px_rgba(239,68,68,0.3)] animate-in zoom-in-95 duration-300">
                        {getWarningIcon()}
                        <h3 className="text-xl font-bold text-red-400 mb-2">Notice</h3>
                        <p className="text-gray-300 text-sm leading-relaxed">{warningMessage}</p>
                        <div className="mt-4 flex items-center justify-center gap-2 text-xs text-red-400">
                            <Eye className="w-3 h-3" />
                            <span>Total infractions logged: {totalViolations}</span>
                        </div>
                    </div>
                </div>
            )}

            {/* Background */}
            <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0 pointer-events-none">
                <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full bg-blue-900/20 blur-[100px]"></div>
                <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full bg-[#FF7300]/10 blur-[100px]"></div>
            </div>

            {/* Header */}
            <header className="h-16 flex items-center justify-between px-6 lg:px-12 z-10 border-b border-gray-800/50 backdrop-blur-sm">
                <div className="flex items-center">
                    <EquiHireLogo className="mr-3 w-8 h-8 text-white" />
                    <span className="font-semibold text-lg tracking-tight">EquiHire</span>
                    <span className="ml-3 px-2 py-0.5 rounded text-[10px] font-bold bg-blue-500/20 text-blue-400 uppercase tracking-wider hidden sm:inline-block">
                        Lockdown Assessment
                    </span>
                </div>
                <div className="flex items-center space-x-4">
                    {!document.fullscreenElement && (
                        <Button 
                            variant="destructive" 
                            size="sm" 
                            className="text-xs h-7 hidden sm:flex"
                            onClick={() => document.documentElement.requestFullscreen()}
                        >
                            Return to Fullscreen
                        </Button>
                    )}
                    {totalViolations > 0 && (
                        <span className="flex items-center gap-1.5 px-2 py-1 rounded-full text-[10px] font-bold bg-red-500/20 text-red-400 border border-red-500/30">
                            <ShieldAlert className="w-3 h-3" />
                            {totalViolations}
                        </span>
                    )}
                    <span className="text-sm text-gray-400">
                        <span className="hidden sm:inline">Time Remaining: </span>
                        <span className={`font-mono font-medium ${timeLeft < 300 ? 'text-red-400' : 'text-white'}`}>{formatTime(timeLeft)}</span>
                    </span>
                </div>
            </header>

            <main className="flex-1 flex flex-col items-center justify-start p-6 z-10 relative w-full max-w-4xl mx-auto mt-4 sm:mt-8">
                <div className="w-full space-y-6">
                    {/* Progress */}
                    <div className="w-full bg-gray-800 rounded-full h-1.5 mb-6 overflow-hidden">
                        <div
                            className="bg-gradient-to-r from-[#FF7300] to-yellow-500 h-1.5 rounded-full transition-all duration-300 ease-out"
                            style={{ width: `${((currentQuestionIndex + 1) / Math.max(questions.length, 1)) * 100}%` }}
                        ></div>
                    </div>

                    {questions.length === 0 ? (
                        <div className="bg-gray-900/50 backdrop-blur-md border border-white/10 p-12 rounded-lg text-center">
                            <p className="text-gray-400">No questions have been configured for this role yet.</p>
                        </div>
                    ) : (
                        <>
                            {/* Question Card */}
                            <div className="bg-gray-900/50 backdrop-blur-md border border-white/10 p-5 sm:p-6 rounded-xl shadow-lg">
                                <div className="flex justify-between items-start mb-4">
                                    <h2 className="text-lg sm:text-xl font-semibold text-gray-100 flex items-center gap-2">
                                        <span className="flex items-center justify-center w-6 h-6 rounded bg-gray-800 text-xs text-gray-400 border border-gray-700">{currentQuestionIndex + 1}</span>
                                        <span className="text-gray-500">of {questions.length}</span>
                                    </h2>
                                    <span className={`inline-flex items-center gap-1.5 text-[10px] uppercase font-bold tracking-wider px-2 py-1 rounded ${isCodeQuestion ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'text-gray-400 bg-gray-800 border border-gray-700'}`}>
                                        {isCodeQuestion && <Terminal className="w-3 h-3" />}
                                        {currentQuestion.type || "Text Answer"}
                                    </span>
                                </div>
                                <div className="text-gray-200 leading-relaxed whitespace-pre-wrap font-medium text-base sm:text-lg">
                                    {currentQuestion.questionText}
                                </div>
                            </div>

                            {/* Answer Area */}
                            <div className="space-y-4">
                                {isCodeQuestion ? (
                                    /* Code Editor */
                                    <div className="rounded-xl overflow-hidden border border-gray-700/60 shadow-xl bg-[#1e1e1e]">
                                        {/* Editor Header */}
                                        <div className="bg-[#1e1e1e] px-4 py-2.5 border-b border-gray-800 flex items-center justify-between">
                                            <div className="flex items-center gap-2">
                                                <div className="flex gap-1.5">
                                                    <div className="w-2.5 h-2.5 rounded-full bg-red-500/80"></div>
                                                    <div className="w-2.5 h-2.5 rounded-full bg-yellow-500/80"></div>
                                                    <div className="w-2.5 h-2.5 rounded-full bg-green-500/80"></div>
                                                </div>
                                                <span className="text-gray-400 text-xs ml-3 flex items-center gap-1.5 font-mono">
                                                    <Terminal className="w-3.5 h-3.5 text-emerald-400" />
                                                    solution.py
                                                </span>
                                            </div>
                                            <span className="text-[10px] text-emerald-500/70 font-mono tracking-wider">SECURE EDITOR</span>
                                        </div>
                                        {/* Editor Body with Line Numbers */}
                                        <div className="flex min-h-[350px]">
                                            {/* Line Numbers */}
                                            <div className="bg-[#1e1e1e] border-r border-gray-800/80 px-3 py-3 text-right select-none pointer-events-none min-w-[48px]">
                                                {getLineNumbers(currentAnswer).map(num => (
                                                    <div key={num} className="text-gray-600/70 text-xs font-mono leading-[1.65rem] tracking-tighter">
                                                        {num}
                                                    </div>
                                                ))}
                                            </div>
                                            {/* Code Input */}
                                            <textarea
                                                className="flex-1 bg-[#1e1e1e] text-emerald-400/90 font-mono text-sm p-3 resize-none border-0 outline-none focus:ring-0 leading-[1.65rem] placeholder:text-gray-700 min-h-[350px] w-full selection:bg-emerald-900/40"
                                                placeholder="# Write your secure solution here..."
                                                value={currentAnswer}
                                                onChange={(e) => handleAnswerChange(e.target.value)}
                                                disabled={isSubmitted}
                                                onPaste={(e) => e.preventDefault()}
                                                onCopy={(e) => e.preventDefault()}
                                                onCut={(e) => e.preventDefault()}
                                                spellCheck={false}
                                                wrap="off"
                                            />
                                        </div>
                                    </div>
                                ) : (
                                    /* Standard Text Answer */
                                    <Textarea
                                        placeholder="Type your answer comprehensively..."
                                        className="min-h-[300px] bg-gray-900/60 border-gray-700/60 text-gray-200 text-base focus-visible:ring-[#FF7300] focus-visible:ring-offset-0 focus-visible:border-[#FF7300] leading-relaxed resize-y rounded-xl shadow-inner p-4 placeholder:text-gray-600"
                                        value={currentAnswer}
                                        onChange={(e) => handleAnswerChange(e.target.value)}
                                        disabled={isSubmitted}
                                        onPaste={(e) => e.preventDefault()}
                                        onCopy={(e) => e.preventDefault()}
                                        onCut={(e) => e.preventDefault()}
                                    />
                                )}

                                <div className="flex justify-between items-center pt-2 sm:pt-4">
                                    <Button
                                        variant="outline"
                                        onClick={handlePrev}
                                        disabled={currentQuestionIndex === 0 || isSubmitted}
                                        className="border-gray-700 text-gray-400 hover:text-white hover:bg-gray-800 w-24 sm:w-28 h-11"
                                    >
                                        Previous
                                    </Button>

                                    {isLastQuestion ? (
                                        <Button
                                            onClick={handleSubmitClick}
                                            disabled={isSubmitted || Object.keys(answers).length === 0}
                                            className="bg-gradient-to-r from-[#FF7300] to-[#E56700] hover:from-[#E56700] hover:to-[#CC5A00] text-white px-8 h-11 shadow-lg shadow-[#FF7300]/20 font-medium"
                                        >
                                            {isSubmitted ? "Submitting..." : "Submit Assessment"}
                                        </Button>
                                    ) : (
                                        <Button
                                            onClick={handleNext}
                                            disabled={isSubmitted || !currentAnswer.trim()}
                                            className="bg-blue-600 hover:bg-blue-500 text-white w-24 sm:w-32 h-11 shadow-lg shadow-blue-500/20"
                                        >
                                            Next Question
                                        </Button>
                                    )}
                                </div>
                            </div>
                        </>
                    )}
                </div>
            </main>
        </div>
    );
}
