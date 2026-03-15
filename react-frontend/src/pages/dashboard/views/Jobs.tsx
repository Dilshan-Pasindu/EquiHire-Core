/**
 * Jobs view: create job form, evaluation template selector, active roles sidebar, edit/delete dialogs.
 * Uses useJobs for data and CRUD; SKILL_CATEGORIES from constants.
 */

import { useState } from 'react';
import { useAuthContext } from '@asgardeo/auth-react';
import { useJobs } from '@/hooks';
import { SKILL_CATEGORIES } from '@/constants/skills';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Briefcase, Edit2, Trash2, Loader2, Plus, X, Check, FileText } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { ConfirmDeleteDialog, ConfirmUpdateDialog } from '@/components/ui/alert-dialog';
import { cn } from '@/lib/utils';
import type { Job } from '@/types';

export default function JobsManager() {
  const { state } = useAuthContext();
  const userId = state.sub;
  const {
    jobs,
    organization,
    evaluationTemplates,
    isLoading,
    isLoadingTemplates,
    createJob,
    updateJob,
    deleteJob,
  } = useJobs({ userId });

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [skills, setSkills] = useState<string[]>([]);
  const [currentSkill, setCurrentSkill] = useState('');
  const [activeCategory, setActiveCategory] = useState<string>('Languages');
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>('');

  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editingJob, setEditingJob] = useState<Job | null>(null);
  const [editForm, setEditForm] = useState({ title: '', description: '', requiredSkills: [] as string[] });
  const [editActiveCategory, setEditActiveCategory] = useState('Languages');
  const [editCustomSkill, setEditCustomSkill] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const [confirmUpdateOpen, setConfirmUpdateOpen] = useState(false);
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);
  const [deletingJobId, setDeletingJobId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const toggleSkill = (skill: string) => {
    setSkills((prev) =>
      prev.includes(skill) ? prev.filter((s) => s !== skill) : [...prev, skill]
    );
  };

  const handleAddCustomSkill = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && currentSkill.trim()) {
      e.preventDefault();
      toggleSkill(currentSkill.trim());
      setCurrentSkill('');
    }
  };

  const handleCreateJob = async () => {
    setError('');
    setSuccess('');
    if (!title || !description || skills.length === 0) {
      setError('Please fill in required fields and add at least one skill.');
      return;
    }
    if (!selectedTemplateId) {
      setError('Please select an evaluation criteria template.');
      return;
    }
    if (!organization?.id || !userId) {
      setError('Organization or recruiter information missing.');
      return;
    }
    setIsCreating(true);
    const result = await createJob({
      title,
      description,
      requiredSkills: skills,
      organizationId: organization.id,
      recruiterId: userId,
      evaluationTemplateId: selectedTemplateId,
    });
    setIsCreating(false);
    if (result.success) {
      setSuccess('Job role created successfully! You can now add interview questions in the Questions tab.');
      setTitle('');
      setDescription('');
      setSkills([]);
      setSelectedTemplateId('');
    } else {
      setError(result.error ?? 'Failed to create job.');
    }
  };

  const openEditDialog = (job: Job) => {
    setEditingJob(job);
    setEditForm({
      title: job.title ?? '',
      description: job.description ?? '',
      requiredSkills: job.requiredSkills ?? [],
    });
    setEditDialogOpen(true);
  };

  const toggleEditSkill = (skill: string) => {
    setEditForm((prev) => ({
      ...prev,
      requiredSkills: prev.requiredSkills.includes(skill)
        ? prev.requiredSkills.filter((s) => s !== skill)
        : [...prev.requiredSkills, skill],
    }));
  };

  const handleEditAddCustomSkill = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && editCustomSkill.trim()) {
      e.preventDefault();
      toggleEditSkill(editCustomSkill.trim());
      setEditCustomSkill('');
    }
  };

  const handleSaveEdit = async () => {
    setConfirmUpdateOpen(false);
    if (!editingJob?.id) return;
    setIsSaving(true);
    try {
      await updateJob(editingJob.id, {
        title: editForm.title,
        description: editForm.description,
        requiredSkills: editForm.requiredSkills,
      });
    } catch (err) {
      console.error('Failed to update job', err);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    setConfirmDeleteOpen(false);
    if (!deletingJobId) return;
    setIsDeleting(true);
    try {
      await deleteJob(deletingJobId);
    } catch (err) {
      console.error('Failed to delete job', err);
    } finally {
      setIsDeleting(false);
      setDeletingJobId(null);
    }
  };

  const selectedTemplate = evaluationTemplates.find((t) => t.id === selectedTemplateId);

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            <div>
                <h2 className="text-2xl font-bold text-gray-900">Job Management</h2>
                <p className="text-gray-500">Create and manage job roles/openings.</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* ═══ Create Job Form ═══ */}
                <div className="col-span-1 lg:col-span-2">
                    <Card className="shadow-lg mb-8 border-t-4 border-t-[#FF7300]">
                        <CardHeader>
                            <div className="flex items-center">
                                <Briefcase className="h-6 w-6 mr-2 text-[#FF7300]" />
                                <CardTitle>Create New Job Role</CardTitle>
                            </div>
                            <CardDescription>Define the role, required skills, and evaluation criteria to start filtering candidates.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            {error && <p className="text-red-500 text-sm bg-red-50 p-2 rounded">{error}</p>}
                            {success && <p className="text-green-600 text-sm bg-green-50 p-2 rounded">{success}</p>}

                            {/* Title & Description */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <Label htmlFor="title">Job Title</Label>
                                    <Input
                                        id="title"
                                        placeholder="e.g. Senior Frontend Engineer"
                                        value={title}
                                        onChange={(e) => setTitle(e.target.value)}
                                        className="bg-white"
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="description">Short Description</Label>
                                    <Input
                                        id="description"
                                        placeholder="Brief description of the role..."
                                        value={description}
                                        onChange={(e) => setDescription(e.target.value)}
                                        className="bg-white"
                                    />
                                </div>
                            </div>

                            {/* ── Skills Selector ── */}
                            <div className="space-y-3">
                                <div className="flex justify-between items-center">
                                    <Label>Required Skills</Label>
                                    <span className="text-xs text-gray-500">{skills.length} selected</span>
                                </div>

                                {skills.length > 0 && (
                                    <div className="flex flex-wrap gap-2 p-3 bg-gray-50 rounded-lg border border-gray-100 min-h-[50px]">
                                        {skills.map(skill => (
                                            <span key={skill} className="bg-[#FF7300]/10 text-[#FF7300] border border-[#FF7300]/20 text-xs px-2 py-1 rounded-full flex items-center shadow-sm animate-in fade-in zoom-in duration-200">
                                                {skill}
                                                <button onClick={() => toggleSkill(skill)} className="ml-1 text-[#FF7300] hover:text-[#d36000]">
                                                    <X className="w-3 h-3" />
                                                </button>
                                            </span>
                                        ))}
                                    </div>
                                )}

                                <div className="border rounded-lg overflow-hidden bg-white shadow-sm">
                                    <div className="flex overflow-x-auto border-b bg-gray-50 scrollbar-hide">
                                        {Object.keys(SKILL_CATEGORIES).map((category) => (
                                            <button
                                                key={category}
                                                onClick={() => setActiveCategory(category)}
                                                className={cn(
                                                    "px-4 py-3 text-sm font-medium whitespace-nowrap transition-colors border-b-2 hover:bg-gray-100",
                                                    activeCategory === category
                                                        ? "border-[#FF7300] text-[#FF7300] bg-white"
                                                        : "border-transparent text-gray-600"
                                                )}
                                            >
                                                {category}
                                            </button>
                                        ))}
                                    </div>

                                    <div className="p-4 bg-white min-h-[200px]">
                                        <div className="flex flex-wrap gap-2">
                                            {(SKILL_CATEGORIES[activeCategory] || []).map((skill) => {
                                                const isSelected = skills.includes(skill);
                                                return (
                                                    <button
                                                        key={skill}
                                                        onClick={() => toggleSkill(skill)}
                                                        className={cn(
                                                            "text-xs px-3 py-1.5 rounded-full border transition-all duration-200 flex items-center",
                                                            isSelected
                                                                ? "bg-[#FF7300] text-white border-[#FF7300] shadow-md transform scale-105"
                                                                : "bg-white text-gray-700 border-gray-200 hover:border-[#FF7300] hover:text-[#FF7300] hover:shadow-sm"
                                                        )}
                                                    >
                                                        {isSelected && <Check className="w-3 h-3 mr-1" />}
                                                        {skill}
                                                    </button>
                                                );
                                            })}
                                        </div>
                                    </div>

                                    <div className="p-3 bg-gray-50 border-t flex items-center gap-2">
                                        <Plus className="w-4 h-4 text-gray-400" />
                                        <Input
                                            placeholder="Add a custom skill..."
                                            value={currentSkill}
                                            onChange={(e) => setCurrentSkill(e.target.value)}
                                            onKeyDown={handleAddCustomSkill}
                                            className="border-0 bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0 h-8 text-sm"
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* ── Evaluation Criteria Selector ── */}
                            <div className="space-y-3">
                                <div className="flex justify-between items-center">
                                    <Label className="flex items-center gap-2">
                                        <FileText className="w-4 h-4 text-[#FF7300]" />
                                        Evaluation Criteria
                                    </Label>
                                    {isLoadingTemplates && <Loader2 className="w-3 h-3 animate-spin text-gray-400" />}
                                </div>

                                <Select value={selectedTemplateId} onValueChange={setSelectedTemplateId}>
                                    <SelectTrigger className="bg-white">
                                        <SelectValue placeholder="Select an evaluation template..." />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {evaluationTemplates.length === 0 ? (
                                            <div className="px-3 py-4 text-sm text-gray-500 text-center">
                                                No templates available. Create one in the Marking Criteria tab.
                                            </div>
                                        ) : (
                                            evaluationTemplates.map((template) => (
                                                <SelectItem key={template.id || 'default'} value={template.id || ''}>
                                                    <div className="flex items-center gap-2">
                                                        {template.is_system_template && (
                                                            <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-blue-100 text-blue-700">
                                                                System
                                                            </span>
                                                        )}
                                                        {template.name}
                                                    </div>
                                                </SelectItem>
                                            ))
                                        )}
                                    </SelectContent>
                                </Select>

                                {/* Preview selected template */}
                                {selectedTemplate && (
                                    <div className="bg-gray-50 border border-gray-200 rounded-lg p-3 animate-in fade-in duration-200">
                                        <p className="text-xs font-medium text-gray-700 mb-1">{selectedTemplate.name}</p>
                                        <p className="text-xs text-gray-500">{selectedTemplate.description}</p>
                                        <p className="text-[11px] text-gray-400 mt-2 font-mono line-clamp-2">{selectedTemplate.prompt_template}</p>
                                    </div>
                                )}
                            </div>

                            {/* ── Create Button ── */}
                            <Button
                                onClick={handleCreateJob}
                                disabled={isCreating}
                                className="w-full bg-gray-900 hover:bg-gray-800 h-11 text-base shadow-md transition-all active:scale-[0.99]"
                            >
                                {isCreating ? 'Creating Job...' : 'Create Job Role'} <Plus className="ml-2 h-4 w-4" />
                            </Button>
                        </CardContent>
                    </Card>
                </div>

                {/* ═══ Active Roles Sidebar ═══ */}
                <div className="space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-sm font-medium text-gray-500">Active Roles</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-4">
                                {isLoading ? (
                                    <div className="flex items-center justify-center py-6 text-gray-400">
                                        <Loader2 className="w-4 h-4 animate-spin mr-2" />
                                        <span className="text-sm">Loading...</span>
                                    </div>
                                ) : jobs.length === 0 ? (
                                    <p className="text-sm text-gray-400">No jobs created yet.</p>
                                ) : (
                                    jobs.map((job) => (
                                        <div key={job.id} className="group p-3 border rounded-lg bg-gray-50 flex items-center justify-between hover:border-gray-300 transition-all">
                                            <div className="flex items-center min-w-0">
                                                <Briefcase className="h-4 w-4 mr-3 text-gray-400 flex-shrink-0" />
                                                <div className="min-w-0">
                                                    <p className="font-medium text-sm text-gray-900 truncate">{job.title}</p>
                                                    <p className="text-xs text-gray-500">{job.id ? "Draft" : "Published"}</p>
                                                </div>
                                            </div>
                                            <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0 ml-2">
                                                <button
                                                    onClick={() => openEditDialog(job)}
                                                    className="p-1 rounded bg-white border border-gray-200 shadow-sm hover:bg-orange-50 hover:border-[#FF7300] hover:text-[#FF7300] text-gray-400 transition-all"
                                                >
                                                    <Edit2 className="w-3 h-3" />
                                                </button>
                                                 <button
                                                    onClick={() => { if (job.id) { setDeletingJobId(job.id); setConfirmDeleteOpen(true); } }}
                                                    className="p-1 rounded bg-white border border-gray-200 shadow-sm hover:bg-red-50 hover:border-red-400 hover:text-red-600 text-gray-400 transition-all"
                                                >
                                                    <Trash2 className="w-3 h-3" />
                                                </button>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>

            {/* ═══ Edit Job Dialog ═══ */}
            <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
                <DialogContent className="sm:max-w-[600px] max-h-[85vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <Edit2 className="w-5 h-5 text-[#FF7300]" />
                            Edit Job Role
                        </DialogTitle>
                    </DialogHeader>
                    <div className="grid gap-5 py-4">
                        <div className="grid gap-2">
                            <Label>Job Title</Label>
                            <Input
                                value={editForm.title}
                                onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
                                placeholder="e.g. Senior Frontend Engineer"
                            />
                        </div>
                        <div className="grid gap-2">
                            <Label>Description</Label>
                            <Input
                                value={editForm.description}
                                onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                                placeholder="Brief description of the role..."
                            />
                        </div>

                        {/* Skills Selector */}
                        <div className="space-y-3">
                            <div className="flex justify-between items-center">
                                <Label>Required Skills</Label>
                                <span className="text-xs text-gray-500">{editForm.requiredSkills.length} selected</span>
                            </div>

                            {editForm.requiredSkills.length > 0 && (
                                <div className="flex flex-wrap gap-2 p-3 bg-gray-50 rounded-lg border border-gray-100 min-h-[40px]">
                                    {editForm.requiredSkills.map(skill => (
                                        <span key={skill} className="bg-[#FF7300]/10 text-[#FF7300] border border-[#FF7300]/20 text-xs px-2 py-1 rounded-full flex items-center">
                                            {skill}
                                            <button onClick={() => toggleEditSkill(skill)} className="ml-1 hover:text-[#d36000]">
                                                <X className="w-3 h-3" />
                                            </button>
                                        </span>
                                    ))}
                                </div>
                            )}

                            <div className="border rounded-lg overflow-hidden bg-white shadow-sm">
                                <div className="flex overflow-x-auto border-b bg-gray-50 scrollbar-hide">
                                    {Object.keys(SKILL_CATEGORIES).map((category) => (
                                        <button
                                            key={category}
                                            onClick={() => setEditActiveCategory(category)}
                                            className={cn(
                                                "px-3 py-2 text-xs font-medium whitespace-nowrap transition-colors border-b-2",
                                                editActiveCategory === category
                                                    ? "border-[#FF7300] text-[#FF7300] bg-white"
                                                    : "border-transparent text-gray-600 hover:text-gray-900"
                                            )}
                                        >
                                            {category}
                                        </button>
                                    ))}
                                </div>
                                <div className="p-3 bg-white min-h-[120px]">
                                    <div className="flex flex-wrap gap-1.5">
                                        {(SKILL_CATEGORIES[editActiveCategory] || []).map((skill) => {
                                            const isSelected = editForm.requiredSkills.includes(skill);
                                            return (
                                                <button
                                                    key={skill}
                                                    onClick={() => toggleEditSkill(skill)}
                                                    className={cn(
                                                        "text-xs px-2.5 py-1 rounded-full border transition-all duration-200 flex items-center",
                                                        isSelected
                                                            ? "bg-[#FF7300] text-white border-[#FF7300]"
                                                            : "bg-white text-gray-700 border-gray-200 hover:border-[#FF7300] hover:text-[#FF7300]"
                                                    )}
                                                >
                                                    {isSelected && <Check className="w-3 h-3 mr-1" />}
                                                    {skill}
                                                </button>
                                            );
                                        })}
                                    </div>
                                </div>
                                <div className="p-2 bg-gray-50 border-t flex items-center gap-2">
                                    <Plus className="w-3 h-3 text-gray-400" />
                                    <Input
                                        placeholder="Add custom skill..."
                                        value={editCustomSkill}
                                        onChange={(e) => setEditCustomSkill(e.target.value)}
                                        onKeyDown={handleEditAddCustomSkill}
                                        className="border-0 bg-transparent focus-visible:ring-0 h-7 text-xs"
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setEditDialogOpen(false)}>Cancel</Button>
                        <Button
                            className="bg-[#FF7300] hover:bg-[#E56700]"
                            onClick={() => { setEditDialogOpen(false); setConfirmUpdateOpen(true); }}
                            disabled={isSaving}
                        >
                            {isSaving ? 'Saving...' : 'Save Changes'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* ═══ Confirmation Dialogs ═══ */}
            <ConfirmUpdateDialog
                open={confirmUpdateOpen}
                onOpenChange={setConfirmUpdateOpen}
                onConfirm={handleSaveEdit}
                title="Update Job Role"
                description="Are you sure you want to update this job role? This will modify the role details visible to candidates."
                isLoading={isSaving}
            />

            <ConfirmDeleteDialog
                open={confirmDeleteOpen}
                onOpenChange={setConfirmDeleteOpen}
                onConfirm={handleDelete}
                title="Delete Job Role"
                description="Are you sure you want to delete this job role? All associated questions and candidate data may be affected."
                isLoading={isDeleting}
            />
        </div>
    );
}
