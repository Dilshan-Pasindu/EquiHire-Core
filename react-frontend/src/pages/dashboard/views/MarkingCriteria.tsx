/**
 * Marking Criteria view: list evaluation templates, create/edit/delete with confirm dialogs.
 * Uses useEvaluationTemplates for data and CRUD.
 */

import { useState } from 'react';
import { useAuthContext } from '@asgardeo/auth-react';
import { useEvaluationTemplates } from '@/hooks';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { FileText, Plus, Trash2, Edit2, ShieldCheck, Loader2 } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { ConfirmDeleteDialog, ConfirmUpdateDialog } from '@/components/ui/alert-dialog';
import type { ExtendedEvaluationTemplate } from '@/types';

export default function MarkingCriteria() {
  const { state } = useAuthContext();
  const userId = state.sub;
  const {
    templates,
    orgId,
    isLoading,
    createTemplate,
    updateTemplate,
    deleteTemplate,
  } = useEvaluationTemplates({ userId });

  const [isOpen, setIsOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [currentTemplate, setCurrentTemplate] = useState<Partial<ExtendedEvaluationTemplate>>({});
  const [isSaving, setIsSaving] = useState(false);
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);
  const [confirmUpdateOpen, setConfirmUpdateOpen] = useState(false);
  const [deletingTemplateId, setDeletingTemplateId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleOpenDialog = (template?: ExtendedEvaluationTemplate) => {
    if (template) {
      setIsEditing(true);
      setCurrentTemplate(template);
    } else {
      setIsEditing(false);
      setCurrentTemplate({
        name: '',
        description: '',
        type: 'QUESTIONNAIRE',
        prompt_template: '',
        is_system_template: false,
      });
    }
    setIsOpen(true);
  };

  const doSave = async () => {
    if (!orgId) return;
    setIsSaving(true);
    try {
      const payload = {
        name: currentTemplate.name ?? '',
        description: currentTemplate.description ?? '',
        type: currentTemplate.type ?? 'QUESTIONNAIRE',
        prompt_template: currentTemplate.prompt_template ?? '',
        criteria: currentTemplate.criteria ?? [],
      };
      if (isEditing && currentTemplate.id) {
        await updateTemplate(currentTemplate.id, payload);
      } else {
        await createTemplate(payload);
      }
      setIsOpen(false);
    } catch (err) {
      console.error('Error saving template', err);
    } finally {
      setIsSaving(false);
    }
  };

  const handleSave = () => {
    if (isEditing) setConfirmUpdateOpen(true);
    else doSave();
  };

  const handleConfirmUpdate = () => {
    setConfirmUpdateOpen(false);
    doSave();
  };

  const requestDelete = (id: string) => {
    setDeletingTemplateId(id);
    setConfirmDeleteOpen(true);
  };

  const handleConfirmDelete = async () => {
    setConfirmDeleteOpen(false);
    if (!deletingTemplateId) return;
    setIsDeleting(true);
    try {
      await deleteTemplate(deletingTemplateId);
    } finally {
      setIsDeleting(false);
      setDeletingTemplateId(null);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Marking Criteria</h2>
          <p className="text-gray-500">
            Manage evaluation templates and AI prompts for candidate scoring.
          </p>
        </div>
        <Button className="bg-[#FF7300] hover:bg-[#E56700]" onClick={() => handleOpenDialog()}>
          <Plus className="mr-2 h-4 w-4" aria-hidden />
          New Template
        </Button>
      </div>

      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-16 text-gray-500">
          <Loader2 className="w-6 h-6 animate-spin mb-2 text-[#FF7300]" aria-hidden />
          Loading templates...
        </div>
      ) : templates.length === 0 ? (
        <div className="text-center p-12 bg-gray-50 rounded-lg border border-dashed border-gray-300">
          <FileText className="w-8 h-8 text-gray-400 mx-auto mb-3" aria-hidden />
          <p className="text-gray-500 text-sm">No evaluation templates created yet.</p>
          <p className="text-xs text-gray-400 mt-1">Create a template to define how candidates are scored.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {templates.map((template) => (
            <Card
              key={template.id}
              className={`shadow-sm border-gray-200 ${template.is_system_template ? 'border-blue-100 bg-blue-50/10' : ''}`}
            >
              <CardHeader className="pb-3">
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-lg flex items-center">
                      {template.name}
                      {template.is_system_template && (
                        <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800">
                          <ShieldCheck className="h-3 w-3 mr-1" aria-hidden /> System
                        </span>
                      )}
                    </CardTitle>
                    <CardDescription className="mt-1">{template.description}</CardDescription>
                  </div>
                  {!template.is_system_template && (
                    <div className="flex space-x-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-gray-500 hover:text-[#FF7300]"
                        onClick={() => template.id && handleOpenDialog(template)}
                      >
                        <Edit2 className="h-4 w-4" aria-hidden />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-gray-500 hover:text-red-600"
                        onClick={() => template.id && requestDelete(template.id)}
                      >
                        <Trash2 className="h-4 w-4" aria-hidden />
                      </Button>
                    </div>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                <div className="bg-gray-50 p-3 rounded-md border text-sm font-medium text-gray-700 font-mono whitespace-pre-wrap">
                  {template.prompt_template}
                </div>
                <div className="mt-4 flex items-center text-xs text-gray-500">
                  <FileText className="h-3.5 w-3.5 mr-1" aria-hidden />
                  Type: {template.type}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>{isEditing ? 'Edit Template' : 'Create New Template'}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <label className="text-sm font-medium">Template Name</label>
              <Input
                value={currentTemplate.name ?? ''}
                onChange={(e) => setCurrentTemplate((t) => ({ ...t, name: e.target.value }))}
                placeholder="e.g. Frontend Specialist Criteria"
              />
            </div>
            <div className="grid gap-2">
              <label className="text-sm font-medium">Brief Description</label>
              <Input
                value={currentTemplate.description ?? ''}
                onChange={(e) => setCurrentTemplate((t) => ({ ...t, description: e.target.value }))}
                placeholder="Describe when to use this template..."
              />
            </div>
            <div className="grid gap-2">
              <label className="text-sm font-medium">AI Prompt Instructions</label>
              <Textarea
                value={currentTemplate.prompt_template ?? ''}
                onChange={(e) => setCurrentTemplate((t) => ({ ...t, prompt_template: e.target.value }))}
                placeholder="You are an expert technical interviewer evaluating a candidate for..."
                className="h-32 font-mono text-sm"
              />
              <p className="text-xs text-gray-500">Provide specific weights and logic for the AI engine to evaluate answers.</p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsOpen(false)} disabled={isSaving}>
              Cancel
            </Button>
            <Button className="bg-[#FF7300] hover:bg-[#E56700]" onClick={handleSave} disabled={isSaving}>
              {isSaving ? 'Saving...' : isEditing ? 'Save Changes' : 'Create Template'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ConfirmUpdateDialog
        open={confirmUpdateOpen}
        onOpenChange={setConfirmUpdateOpen}
        onConfirm={handleConfirmUpdate}
        title="Update Template"
        description="Are you sure you want to update this evaluation template?"
        isLoading={isSaving}
      />
      <ConfirmDeleteDialog
        open={confirmDeleteOpen}
        onOpenChange={setConfirmDeleteOpen}
        onConfirm={handleConfirmDelete}
        title="Delete Template"
        description="Are you sure you want to delete this evaluation template?"
        isLoading={isDeleting}
      />
    </div>
  );
}
