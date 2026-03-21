import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Upload, FileText, CheckCircle, ArrowRight, ShieldCheck, AlertCircle, EyeOff, FileQuestion, Ban, Lightbulb, BookOpen, Clock, Loader2 } from "lucide-react";
import { EquiHireLogo } from "@/components/ui/Icons";
import { API } from "@/lib/api";
import type { ParsedCv } from '@/types';

interface CandidateData {
    email: string;
    name: string;
    jobTitle: string;
    organizationId: string;
    jobId: string;
}

export default function CandidateWelcome() {
    const [file, setFile] = useState<File | null>(null);
    const [isUploading, setIsUploading] = useState(false);
    const [uploadStep, setUploadStep] = useState<string>('');
    const [uploadComplete, setUploadComplete] = useState(false);
    const [uploadError, setUploadError] = useState<string | null>(null);
    const [parsedCv, setParsedCv] = useState<ParsedCv | null>(null);
    const [previewOpen, setPreviewOpen] = useState(false);
    const [candidateData, setCandidateData] = useState<CandidateData | null>(null);
    const [hasStarted, setHasStarted] = useState(false);
    const [hasAgreed, setHasAgreed] = useState(false);
    
    const uploadSectionRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const storedData = sessionStorage.getItem('candidateData');
        if (storedData) {
            setCandidateData(JSON.parse(storedData));
        }
    }, []);

    const handleStartSetup = () => {
        setHasStarted(true);
        setTimeout(() => {
            uploadSectionRef.current?.scrollIntoView({ behavior: 'smooth' });
        }, 100);
    };

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const selectedFile = e.target.files[0];

            if (selectedFile.type !== 'application/pdf') {
                setUploadError('Only PDF files are accepted. Please upload a valid PDF.');
                return;
            }

            setFile(selectedFile);
            setUploadError(null);
            setIsUploading(true);

            try {
                if (!candidateData?.jobId) {
                    throw new Error('Missing Job ID. Please re-open the invitation link.');
                }

                setUploadStep('Extracting text from your CV…');

                const formData = new FormData();
                formData.append('file', selectedFile);
                formData.append('jobId', candidateData.jobId);

                await new Promise(r => setTimeout(r, 300));
                setUploadStep('Uploading to secure storage…');

                const response = await API.uploadCv(formData);

                setUploadStep('AI analysis complete.');

                sessionStorage.setItem('candidateId', response.candidateId);

                if (response.r2Key) {
                    console.info('[EquiHire] CV stored in R2:', response.r2Key);
                }

                setUploadComplete(true);
                setParsedCv(response.parsed ?? null);
                if (response.parsed) {
                    setPreviewOpen(true);
                }

            } catch (err) {
                const message = err instanceof Error ? err.message : 'Unknown upload error';
                console.error('[EquiHire] CV upload failed:', message);
                setUploadError('Upload failed — ' + message + '. Please try again with a valid PDF.');
                setFile(null);
                setUploadStep('');
            } finally {
                setIsUploading(false);
            }
        }
    };

    const handleJoin = () => {
        window.location.href = '/candidate/interview';
    };

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col font-sans text-gray-900">
            {/* Minimal Header */}
            <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-6 lg:px-12 sticky top-0 z-10 shadow-sm">
                <div className="flex items-center">
                    <EquiHireLogo className="mr-3 h-8 w-auto text-blue-600" />
                    <span className="font-semibold text-lg tracking-tight text-gray-900">EquiHire</span>
                </div>
                <div className="text-sm font-medium text-gray-500 uppercase tracking-wider">
                    Candidate Portal
                </div>
            </header>

            <main className="flex-1 flex flex-col items-center justify-start p-6 lg:p-12 pb-24 overflow-y-auto">
                <div className="max-w-4xl w-full space-y-12">
                    {/* Welcome Header */}
                    <div className="text-center space-y-4 animate-in slide-in-from-top-4 duration-700">
                        <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-blue-50 border border-blue-100 shadow-sm mb-2">
                            <ShieldCheck className="h-10 w-10 text-blue-600" />
                        </div>
                        <h1 className="text-4xl font-extrabold tracking-tight text-gray-900">
                            Welcome to your Assessment{candidateData?.name && `, ${candidateData.name}`}
                        </h1>
                        {candidateData?.jobTitle && (
                            <p className="text-xl font-bold text-[#FF7300]">
                                Position: {candidateData.jobTitle}
                            </p>
                        )}
                        <p className="text-lg text-gray-500 max-w-2xl mx-auto">
                            EquiHire ensures a fair process. Your identity will be protected until the final stage.
                        </p>
                    </div>

                    {!hasStarted && (
                        <div className="space-y-10 animate-in fade-in duration-1000 delay-150 fill-mode-both">
                            {/* Onboarding Cards Grid */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <Card className="border border-gray-100 shadow-md hover:shadow-lg transition-shadow">
                                    <CardContent className="p-6 flex gap-4">
                                        <div className="bg-blue-50 p-3 rounded-lg h-fit">
                                            <EyeOff className="w-6 h-6 text-blue-600" />
                                        </div>
                                        <div className="space-y-1">
                                            <h3 className="font-bold text-gray-900">Blind Evaluation</h3>
                                            <p className="text-sm text-gray-600 leading-relaxed">
                                                Your PII (Personally Identifiable Information) such as name and email are anonymized during evaluation to remove unconscious bias.
                                            </p>
                                        </div>
                                    </CardContent>
                                </Card>

                                <Card className="border border-gray-100 shadow-md hover:shadow-lg transition-shadow">
                                    <CardContent className="p-6 flex gap-4">
                                        <div className="bg-green-50 p-3 rounded-lg h-fit">
                                            <ShieldCheck className="w-6 h-6 text-green-600" />
                                        </div>
                                        <div className="space-y-1">
                                            <h3 className="font-bold text-gray-900">Data Privacy (GDPR)</h3>
                                            <p className="text-sm text-gray-600 leading-relaxed">
                                                Your data is protected and stored securely complying with GDPR guidelines. It is only used for the purpose of this evaluation.
                                            </p>
                                        </div>
                                    </CardContent>
                                </Card>

                                <Card className="border border-gray-100 shadow-md hover:shadow-lg transition-shadow">
                                    <CardContent className="p-6 flex gap-4">
                                        <div className="bg-purple-50 p-3 rounded-lg h-fit">
                                            <FileQuestion className="w-6 h-6 text-purple-600" />
                                        </div>
                                        <div className="space-y-1">
                                            <h3 className="font-bold text-gray-900">The Questionnaire</h3>
                                            <p className="text-sm text-gray-600 leading-relaxed">
                                                The assessment contains structured questions tailored to the position. Some answers may require coding or deep technical explanations.
                                            </p>
                                        </div>
                                    </CardContent>
                                </Card>

                                <Card className="border border-red-50 bg-red-50/10 shadow-md hover:shadow-lg transition-shadow">
                                    <CardContent className="p-6 flex gap-4">
                                        <div className="bg-red-100 p-3 rounded-lg h-fit">
                                            <Ban className="w-6 h-6 text-red-600" />
                                        </div>
                                        <div className="space-y-1">
                                            <h3 className="font-bold text-red-900">Integrity & Violations</h3>
                                            <p className="text-sm text-red-700/80 leading-relaxed">
                                                Tab switching, exiting fullscreen, or pasting answers is actively monitored and flagged as a violation by the platform.
                                            </p>
                                        </div>
                                    </CardContent>
                                </Card>

                                <Card className="border border-gray-100 shadow-md hover:shadow-lg transition-shadow md:col-span-2">
                                    <CardContent className="p-6 flex flex-col sm:flex-row gap-6">
                                        <div className="bg-amber-50 p-3 rounded-lg h-fit shrink-0">
                                            <Lightbulb className="w-6 h-6 text-amber-600" />
                                        </div>
                                        <div className="space-y-2 flex-1">
                                            <h3 className="font-bold text-gray-900">How to Prepare</h3>
                                            <ul className="text-sm text-gray-600 space-y-2 list-disc pl-4 marker:text-amber-400">
                                                <li>Ensure you have a stable internet connection and uninterrupted time.</li>
                                                <li>Your first step will be uploading your CV so our AI can parse your background.</li>
                                                <li>The timer cannot be paused once the assessment begins.</li>
                                                <li>Provide comprehensive answers to demonstrate your expertise fully.</li>
                                            </ul>
                                        </div>
                                    </CardContent>
                                </Card>
                            </div>

                            <div className="text-center pt-8 space-y-6 flex flex-col items-center">
                                <div className="flex items-center justify-center gap-3 bg-white p-4 rounded-xl border border-gray-200 shadow-sm w-fit">
                                    <input 
                                        type="checkbox" 
                                        id="agreeCheckbox" 
                                        checked={hasAgreed}
                                        onChange={(e) => setHasAgreed(e.target.checked)}
                                        className="w-5 h-5 accent-[#FF7300] rounded cursor-pointer ring-offset-2 focus:ring-2 focus:ring-[#FF7300]"
                                    />
                                    <label htmlFor="agreeCheckbox" className="text-gray-800 font-bold cursor-pointer select-none">
                                        I have read and agree to the instructions and data compliance rules
                                    </label>
                                </div>
                                <Button 
                                    onClick={handleStartSetup} 
                                    disabled={!hasAgreed}
                                    size="lg" 
                                    className="bg-[#FF7300] hover:bg-[#E56700] text-white font-bold text-lg px-10 h-14 rounded-xl shadow-lg hover:shadow-xl transition-all hover:-translate-y-1 disabled:opacity-50 disabled:hover:translate-y-0 disabled:cursor-not-allowed disabled:shadow-none"
                                >
                                    Start Interview Setup <ArrowRight className="ml-3 h-5 w-5" />
                                </Button>
                            </div>
                        </div>
                    )}

                    <div ref={uploadSectionRef} className={`transition-all duration-700 ease-in-out origin-top ${hasStarted ? 'opacity-100 translate-y-0 scale-100 pb-16' : 'opacity-0 translate-y-20 scale-95 pointer-events-none hidden'}`}>
                        <div className="flex items-center justify-center gap-3 mb-8">
                            <BookOpen className="w-6 h-6 text-gray-400" />
                            <h2 className="text-2xl font-bold text-gray-900">Setup Step 1: Document Upload</h2>
                        </div>
                        <Card className="shadow-xl border-gray-200 bg-white max-w-2xl mx-auto border-t-4 border-t-blue-600 rounded-2xl">
                            <CardContent className="pt-8 pb-8 px-10 space-y-8">
                                <div className="space-y-4">
                                    <h3 className="font-bold text-gray-900 flex items-center text-lg">
                                        <span className="flex items-center justify-center w-7 h-7 rounded-full bg-blue-100 text-blue-700 text-sm mr-3 font-extrabold">1</span>
                                        Provide your latest CV
                                    </h3>

                                    {!uploadComplete ? (
                                        <>
                                            <div className="border-2 border-dashed border-gray-300 rounded-xl p-10 text-center hover:bg-gray-50 transition-colors relative group">
                                                <Input
                                                    type="file"
                                                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                                                    onChange={handleFileChange}
                                                    accept=".pdf"
                                                    disabled={isUploading}
                                                />
                                                <div className="flex flex-col items-center justify-center pointer-events-none">
                                                    <div className={`p-4 rounded-full bg-gray-100 mb-4 group-hover:bg-blue-50 group-hover:text-blue-600 transition-colors ${isUploading ? 'animate-bounce text-blue-600 bg-blue-50' : 'text-gray-400'}`}>
                                                        <Upload className="h-8 w-8" />
                                                    </div>
                                                    <p className="text-base font-semibold text-gray-900 mb-1">
                                                        {isUploading
                                                            ? uploadStep || 'Uploading…'
                                                            : 'Click to upload or drag and drop'}
                                                    </p>
                                                    <p className="text-sm text-gray-500">PDF only • Max 10 MB</p>
                                                </div>
                                            </div>

                                            {/* Inline error message */}
                                            {uploadError && (
                                                <div className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700 shadow-sm animate-in slide-in-from-top-2">
                                                    <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 font-bold" />
                                                    <span className="font-medium">{uploadError}</span>
                                                </div>
                                            )}
                                        </>
                                    ) : (
                                        <div className="bg-green-50 border border-green-200 rounded-xl p-5 space-y-4 animate-in zoom-in-95">
                                            <div className="flex items-start justify-between">
                                                <div className="flex items-center">
                                                    <div className="bg-green-100 p-2.5 rounded-full mr-4 border border-green-200 shadow-sm">
                                                        <FileText className="h-6 w-6 text-green-700" />
                                                    </div>
                                                    <div>
                                                        <p className="text-base font-bold text-green-900">{file?.name ?? 'Your CV file'}</p>
                                                        <p className="text-xs font-semibold uppercase tracking-wider text-green-600 mt-1">Upload & Parsing Complete</p>
                                                    </div>
                                                </div>
                                                <CheckCircle className="h-6 w-6 text-green-600" />
                                            </div>

                                            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pt-3 border-t border-green-200/50">
                                                <Button
                                                    variant="outline"
                                                    className="w-full sm:w-auto bg-white border-green-200 text-green-700 hover:bg-green-100 font-semibold"
                                                    onClick={() => setPreviewOpen(true)}
                                                    disabled={!parsedCv}
                                                >
                                                    View extracted profile
                                                </Button>
                                                <p className="text-xs font-medium text-gray-500">
                                                    If incorrect, refresh the page to try another file.
                                                </p>
                                            </div>
                                        </div>
                                    )}
                                </div>

                                <div className={`space-y-4 transition-all duration-500 ${uploadComplete ? 'opacity-100 translate-y-0' : 'opacity-30 translate-y-4 pointer-events-none'}`}>
                                    <h3 className="font-bold text-gray-900 flex items-center text-lg pt-4 border-t border-gray-100">
                                        <span className={`flex items-center justify-center w-7 h-7 rounded-full text-sm mr-3 font-extrabold ${uploadComplete ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-400'}`}>2</span>
                                        Join Session
                                    </h3>
                                    <p className="text-sm text-gray-500 ml-10 leading-relaxed max-w-lg">
                                        You are about to enter the secure Lockdown Assessment. Complete silence and focus are required.
                                    </p>
                                    <div className="pl-10 pt-2">
                                        <Button
                                            className="w-full sm:w-auto bg-[#FF7300] hover:bg-[#E56700] text-white h-12 px-8 font-bold shadow-md hover:shadow-lg transition-all hover:scale-105 group"
                                            onClick={handleJoin}
                                            disabled={!uploadComplete}
                                        >
                                            Enter Assessment Area <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                                        </Button>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
                        <DialogContent className="sm:max-w-[800px] max-h-[90vh]">
                            <DialogHeader className="pb-4 border-b border-gray-100">
                                <DialogTitle className="text-2xl font-bold flex items-center text-gray-900">
                                    <ShieldCheck className="w-6 h-6 mr-2 text-blue-600" />
                                    Extracted Anonymous Profile
                                </DialogTitle>
                                <DialogDescription className="text-base mt-2">
                                    We have parsed and anonymized your CV correctly. This ensures entirely unbiased evaluation.
                                </DialogDescription>
                            </DialogHeader>

                            <div className="mt-2 space-y-6 max-h-[60vh] overflow-y-auto pr-2 pb-6 fancy-scrollbar">
                                {parsedCv ? (
                                    <>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <Card className="bg-gray-50 shadow-sm border-gray-200">
                                                <CardContent className="p-4">
                                                    <h4 className="flex items-center text-xs font-bold uppercase tracking-widest text-gray-500 mb-2">
                                                        <Clock className="w-3.5 h-3.5 mr-1" /> Experience Level
                                                    </h4>
                                                    <p className="text-lg font-bold text-gray-900 capitalize">
                                                        {parsedCv.experienceLevel || <span className="text-gray-400 italic">Not detected</span>}
                                                    </p>
                                                </CardContent>
                                            </Card>

                                            <Card className="bg-gray-50 shadow-sm border-gray-200">
                                                <CardContent className="p-4">
                                                    <h4 className="flex items-center text-xs font-bold uppercase tracking-widest text-gray-500 mb-2">
                                                        <Lightbulb className="w-3.5 h-3.5 mr-1" /> Core Skills Detected
                                                    </h4>
                                                    <div className="flex flex-wrap gap-1.5 mt-2">
                                                        {parsedCv.detectedStack && parsedCv.detectedStack.length > 0 ? (
                                                            parsedCv.detectedStack.map((skill: string) => (
                                                                <span
                                                                    key={skill}
                                                                    className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-bold bg-blue-100 text-blue-800 border border-blue-200"
                                                                >
                                                                    {skill}
                                                                </span>
                                                            ))
                                                        ) : (
                                                            <span className="text-gray-400 text-sm italic">No specific tech skills detected.</span>
                                                        )}
                                                    </div>
                                                </CardContent>
                                            </Card>
                                        </div>

                                        <div className="space-y-4">
                                            {parsedCv.sections && Object.keys(parsedCv.sections).length > 0 ? (
                                                Object.entries(parsedCv.sections).map(([section, value]) => {
                                                    const normalizedTitle = section
                                                        .replace(/_/g, ' ')
                                                        .replace(/\b\w/g, (c) => c.toUpperCase());
                                                        
                                                    const isArray = Array.isArray(value);

                                                    return (
                                                        <Card key={section} className="shadow-sm border-gray-200 overflow-hidden relative group">
                                                            <div className="absolute left-0 top-0 bottom-0 w-1 bg-gray-300 group-hover:bg-blue-500 transition-colors" />
                                                            <CardContent className="p-4 pl-5">
                                                                <h4 className="text-xs font-bold uppercase tracking-widest text-gray-500 mb-3">
                                                                    {normalizedTitle}
                                                                </h4>
                                                                {isArray ? (
                                                                    <div className="space-y-3 relative before:absolute before:inset-0 before:ml-1.5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-gray-200 before:to-transparent">
                                                                        {(value as any[]).map((itm, idx) => (
                                                                            <div key={idx} className="relative flex items-start gap-4 text-sm text-gray-700 bg-white border border-gray-100 p-3 rounded-xl shadow-sm">
                                                                                <div className="w-3 h-3 rounded-full bg-blue-500 border-2 border-white absolute -left-[23px] top-4 ring-2 ring-gray-100 z-10 hidden md:block" />
                                                                                <div className="w-full">
                                                                                    {typeof itm === 'string' ? (
                                                                                        <p className="font-medium whitespace-pre-wrap">{itm}</p>
                                                                                    ) : (
                                                                                         <pre className="font-sans whitespace-pre-wrap">{JSON.stringify(itm, null, 2)}</pre>
                                                                                    )}
                                                                                </div>
                                                                            </div>
                                                                        ))}
                                                                    </div>
                                                                ) : (
                                                                    <div className="text-sm text-gray-700 bg-white border border-gray-100 p-4 rounded-xl shadow-sm whitespace-pre-line leading-relaxed">
                                                                        {typeof value === 'object' ? JSON.stringify(value, null, 2) : value || <span className="text-gray-400 italic font-normal">Component not explicitly extracted.</span>}
                                                                    </div>
                                                                )}
                                                            </CardContent>
                                                        </Card>
                                                    );
                                                })
                                            ) : (
                                                <div className="text-center p-8 bg-gray-50 rounded-xl border border-gray-200 border-dashed">
                                                    <p className="text-base font-medium text-gray-500">No structured sections extracted from the CV.</p>
                                                </div>
                                            )}
                                        </div>
                                    </>
                                ) : (
                                    <div className="flex flex-col items-center justify-center p-12">
                                        <Loader2 className="w-10 h-10 text-blue-600 animate-spin mb-4" />
                                        <p className="text-gray-500 font-medium tracking-wide animate-pulse">Analyzing document...</p>
                                    </div>
                                )}
                            </div>

                            <DialogFooter className="pt-4 border-t border-gray-100">
                                <Button className="w-full sm:w-auto h-12 px-8 bg-gray-900 hover:bg-black font-bold text-white tracking-wide" onClick={() => setPreviewOpen(false)}>
                                    Looks Good, Proceed
                                </Button>
                            </DialogFooter>
                        </DialogContent>
                    </Dialog>

                    <p className="text-center text-xs font-semibold uppercase tracking-widest text-gray-400 pt-8 pb-4">
                        Powered by EquiHire AI Framework
                    </p>
                </div>
            </main>
        </div>
    );
}
