import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, Plus, Pencil, Trash2, GripVertical, ListChecks } from 'lucide-react';
import {
  collection,
  query,
  orderBy,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  serverTimestamp,
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import LoadingSpinner from '@/components/LoadingSpinner';
import { useToast } from '@/hooks/use-toast';
import { useEvent } from '@/hooks/useEvents';

type QuestionType = 'single' | 'multiple' | 'text';

interface SurveyQuestion {
  id: string;
  text: string;
  type: QuestionType;
  options: string[];
  order: number;
}

const typeLabels: Record<QuestionType, string> = {
  single: 'Single choice',
  multiple: 'Multiple choice',
  text: 'Free text',
};

const emptyForm = { text: '', type: 'single' as QuestionType, optionsText: '' };

const EventSurvey = () => {
  const { eventId } = useParams<{ eventId: string }>();
  const { event } = useEvent(eventId || '');
  const { toast } = useToast();

  const [questions, setQuestions] = useState<SurveyQuestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<SurveyQuestion | null>(null);
  const [form, setForm] = useState(emptyForm);

  const [deleteTarget, setDeleteTarget] = useState<SurveyQuestion | null>(null);

  const fetchQuestions = async () => {
    if (!eventId) return;
    setLoading(true);
    try {
      const snap = await getDocs(
        query(collection(db, 'events', eventId, 'survey'), orderBy('order', 'asc'))
      );
      setQuestions(
        snap.docs.map((d) => {
          const data = d.data() as Partial<SurveyQuestion>;
          return {
            id: d.id,
            text: data.text || '',
            type: (data.type as QuestionType) || 'single',
            options: Array.isArray(data.options) ? data.options : [],
            order: typeof data.order === 'number' ? data.order : 0,
          };
        })
      );
    } catch (err) {
      console.error('Failed to load survey questions', err);
      toast({ title: 'Failed to load questions', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchQuestions();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [eventId]);

  const openCreate = () => {
    setEditing(null);
    setForm(emptyForm);
    setDialogOpen(true);
  };

  const openEdit = (q: SurveyQuestion) => {
    setEditing(q);
    setForm({
      text: q.text,
      type: q.type,
      optionsText: (q.options || []).join('\n'),
    });
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!eventId) return;
    const text = form.text.trim();
    if (!text) {
      toast({ title: 'Question text is required', variant: 'destructive' });
      return;
    }
    const options =
      form.type === 'text'
        ? []
        : form.optionsText
            .split('\n')
            .map((o) => o.trim())
            .filter(Boolean);
    if (form.type !== 'text' && options.length < 2) {
      toast({
        title: 'Add at least 2 options',
        description: 'Choice questions need two or more options.',
        variant: 'destructive',
      });
      return;
    }

    setSaving(true);
    try {
      if (editing) {
        await updateDoc(doc(db, 'events', eventId, 'survey', editing.id), {
          text,
          type: form.type,
          options,
          updatedAt: serverTimestamp(),
        });
        toast({ title: 'Question updated' });
      } else {
        const nextOrder = questions.length
          ? Math.max(...questions.map((q) => q.order)) + 1
          : 0;
        await addDoc(collection(db, 'events', eventId, 'survey'), {
          text,
          type: form.type,
          options,
          order: nextOrder,
          createdAt: serverTimestamp(),
        });
        toast({ title: 'Question added' });
      }
      setDialogOpen(false);
      await fetchQuestions();
    } catch (err) {
      console.error('Failed to save question', err);
      toast({ title: 'Failed to save question', variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!eventId || !deleteTarget) return;
    try {
      await deleteDoc(doc(db, 'events', eventId, 'survey', deleteTarget.id));
      toast({ title: 'Question deleted' });
      setDeleteTarget(null);
      await fetchQuestions();
    } catch (err) {
      console.error('Failed to delete question', err);
      toast({ title: 'Failed to delete', variant: 'destructive' });
    }
  };

  const move = async (index: number, dir: -1 | 1) => {
    const target = index + dir;
    if (!eventId || target < 0 || target >= questions.length) return;
    const a = questions[index];
    const b = questions[target];
    try {
      await Promise.all([
        updateDoc(doc(db, 'events', eventId, 'survey', a.id), { order: b.order }),
        updateDoc(doc(db, 'events', eventId, 'survey', b.id), { order: a.order }),
      ]);
      await fetchQuestions();
    } catch (err) {
      console.error('Failed to reorder', err);
      toast({ title: 'Failed to reorder', variant: 'destructive' });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link to={eventId ? `/admin/events/${eventId}` : '/admin/events'}>
            <ArrowLeft className="h-5 w-5" />
          </Link>
        </Button>
        <div className="flex-1">
          <h1 className="text-2xl sm:text-3xl font-display font-bold text-foreground">
            Enhance my Grid — Questions
          </h1>
          <p className="text-sm text-muted-foreground">
            {event?.title ? `For: ${event.title}` : 'Manage the survey shown to attendees.'}
          </p>
        </div>
        <Button onClick={openCreate}>
          <Plus className="h-4 w-4 mr-2" />
          Add question
        </Button>
      </div>

      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg font-semibold">
            <ListChecks className="h-5 w-5 text-primary" />
            Survey questions
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center py-10">
              <LoadingSpinner size="md" text="Loading questions..." />
            </div>
          ) : questions.length === 0 ? (
            <div className="text-center py-10 text-muted-foreground">
              <p className="mb-3">No questions yet.</p>
              <Button variant="outline" onClick={openCreate}>
                <Plus className="h-4 w-4 mr-2" />
                Add your first question
              </Button>
            </div>
          ) : (
            <ul className="space-y-3">
              {questions.map((q, index) => (
                <li
                  key={q.id}
                  className="p-4 rounded-lg border border-border bg-muted/30 flex gap-3"
                >
                  <div className="flex flex-col items-center gap-1 pt-1">
                    <button
                      type="button"
                      onClick={() => move(index, -1)}
                      disabled={index === 0}
                      className="text-muted-foreground hover:text-foreground disabled:opacity-30"
                      aria-label="Move up"
                    >
                      ▲
                    </button>
                    <GripVertical className="h-4 w-4 text-muted-foreground" />
                    <button
                      type="button"
                      onClick={() => move(index, 1)}
                      disabled={index === questions.length - 1}
                      className="text-muted-foreground hover:text-foreground disabled:opacity-30"
                      aria-label="Move down"
                    >
                      ▼
                    </button>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2 mb-1">
                      <span className="text-xs text-muted-foreground">#{index + 1}</span>
                      <Badge variant="outline">{typeLabels[q.type]}</Badge>
                    </div>
                    <p className="font-medium text-foreground break-words">{q.text}</p>
                    {q.options.length > 0 && (
                      <ul className="mt-2 flex flex-wrap gap-1.5">
                        {q.options.map((o, i) => (
                          <li
                            key={i}
                            className="text-xs px-2 py-0.5 rounded-md bg-background border border-border text-muted-foreground"
                          >
                            {o}
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                  <div className="flex flex-col gap-2 shrink-0">
                    <Button variant="ghost" size="icon" onClick={() => openEdit(q)} aria-label="Edit">
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setDeleteTarget(q)}
                      aria-label="Delete"
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editing ? 'Edit question' : 'Add question'}</DialogTitle>
            <DialogDescription>
              Questions shown in the "Enhance my Grid" survey for this event.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="q-text">Question</Label>
              <Textarea
                id="q-text"
                value={form.text}
                onChange={(e) => setForm((f) => ({ ...f, text: e.target.value }))}
                placeholder="e.g. What kind of vibe are you looking for tonight?"
                rows={3}
              />
            </div>
            <div className="space-y-2">
              <Label>Type</Label>
              <Select
                value={form.type}
                onValueChange={(v: QuestionType) => setForm((f) => ({ ...f, type: v }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="single">Single choice</SelectItem>
                  <SelectItem value="multiple">Multiple choice</SelectItem>
                  <SelectItem value="text">Free text</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {form.type !== 'text' && (
              <div className="space-y-2">
                <Label htmlFor="q-options">Options (one per line)</Label>
                <Textarea
                  id="q-options"
                  value={form.optionsText}
                  onChange={(e) => setForm((f) => ({ ...f, optionsText: e.target.value }))}
                  placeholder={'Chill\nDance floor\nDeep convos'}
                  rows={5}
                />
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setDialogOpen(false)} disabled={saving}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving ? 'Saving...' : editing ? 'Save changes' : 'Add question'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleteTarget} onOpenChange={(o) => !o && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this question?</AlertDialogTitle>
            <AlertDialogDescription>
              This will remove it from the survey. Existing submissions are kept but will no longer
              match against this question.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete}>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default EventSurvey;
