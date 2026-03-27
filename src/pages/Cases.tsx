import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Plus, FolderOpen, ChevronRight, Trash2, Scale, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Logo } from '@/components/Logo';
import { Footer } from '@/components/Footer';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { formatDistanceToNow } from 'date-fns';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';

interface Case {
  id: string;
  name: string;
  description: string | null;
  case_reference: string | null;
  status: string;
  created_at: string;
  certification_count?: number;
}

export default function Cases() {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [cases, setCases] = useState<Case[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [newCase, setNewCase] = useState({ name: '', description: '', case_reference: '' });

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/auth');
      return;
    }
    if (user) fetchCases();
  }, [user, authLoading]);

  const fetchCases = async () => {
    try {
      const { data, error } = await supabase
        .from('cases')
        .select('*')
        .eq('user_id', user!.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Get certification counts per case
      const { data: certs } = await supabase
        .from('certifications')
        .select('case_id')
        .eq('user_id', user!.id)
        .not('case_id', 'is', null);

      const countMap: Record<string, number> = {};
      certs?.forEach((c: any) => {
        countMap[c.case_id] = (countMap[c.case_id] || 0) + 1;
      });

      setCases((data || []).map(c => ({ ...c, certification_count: countMap[c.id] || 0 })));
    } catch {
      toast({ title: 'Error', description: 'Failed to load cases', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async () => {
    if (!newCase.name.trim()) return;
    try {
      const { error } = await supabase.from('cases').insert({
        user_id: user!.id,
        name: newCase.name.trim(),
        description: newCase.description.trim() || null,
        case_reference: newCase.case_reference.trim() || null,
      });
      if (error) throw error;
      setNewCase({ name: '', description: '', case_reference: '' });
      setDialogOpen(false);
      fetchCases();
      toast({ title: 'Case created successfully' });
    } catch {
      toast({ title: 'Error', description: 'Failed to create case', variant: 'destructive' });
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const { error } = await supabase.from('cases').delete().eq('id', id);
      if (error) throw error;
      setCases(cases.filter(c => c.id !== id));
      toast({ title: 'Case deleted' });
    } catch {
      toast({ title: 'Error', description: 'Failed to delete case', variant: 'destructive' });
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-pulse text-muted-foreground">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <header className="border-b border-border bg-card">
        <div className="container flex items-center justify-between py-4">
          <Link to="/"><Logo size="md" /></Link>
          <div className="flex gap-3">
            <Button variant="outline" size="sm" asChild>
              <Link to="/dashboard">Dashboard</Link>
            </Button>
          </div>
        </div>
      </header>

      <main className="flex-1 container py-8">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="font-display text-3xl font-bold text-foreground mb-2">Case Management</h1>
              <p className="text-muted-foreground">Organise your certifications into cases and matters</p>
            </div>
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
              <DialogTrigger asChild>
                <Button><Plus className="w-4 h-4 mr-2" />New Case</Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Create New Case</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 mt-4">
                  <div>
                    <label className="text-sm font-medium text-foreground">Case Name *</label>
                    <Input
                      value={newCase.name}
                      onChange={(e) => setNewCase({ ...newCase, name: e.target.value })}
                      placeholder="e.g., Smith v Jones 2026"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-foreground">Reference Number</label>
                    <Input
                      value={newCase.case_reference}
                      onChange={(e) => setNewCase({ ...newCase, case_reference: e.target.value })}
                      placeholder="e.g., REF-2026-001"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-foreground">Description</label>
                    <Textarea
                      value={newCase.description}
                      onChange={(e) => setNewCase({ ...newCase, description: e.target.value })}
                      placeholder="Brief description of the case..."
                      rows={3}
                    />
                  </div>
                  <Button onClick={handleCreate} className="w-full" disabled={!newCase.name.trim()}>
                    Create Case
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          {loading ? (
            <div className="text-center py-12 text-muted-foreground">Loading cases...</div>
          ) : cases.length === 0 ? (
            <div className="text-center py-16">
              <FolderOpen className="w-16 h-16 text-muted-foreground/30 mx-auto mb-4" />
              <h3 className="font-display text-lg font-semibold text-foreground mb-2">No cases yet</h3>
              <p className="text-muted-foreground mb-6">Create a case to organise your certifications</p>
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {cases.map((c) => (
                <motion.div
                  key={c.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="p-6 rounded-xl bg-card border border-border hover:border-accent/30 transition-all group"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="w-10 h-10 rounded-lg bg-accent/10 text-accent flex items-center justify-center">
                      <Scale className="w-5 h-5" />
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDelete(c.id)}
                      className="opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-destructive"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>

                  <h3 className="font-display font-semibold text-foreground mb-1">{c.name}</h3>
                  {c.case_reference && (
                    <p className="text-xs font-mono text-muted-foreground mb-2">{c.case_reference}</p>
                  )}
                  {c.description && (
                    <p className="text-sm text-muted-foreground mb-4 line-clamp-2">{c.description}</p>
                  )}

                  <div className="flex items-center justify-between pt-4 border-t border-border">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <FileText className="w-4 h-4" />
                      <span>{c.certification_count} cert{c.certification_count !== 1 ? 's' : ''}</span>
                    </div>
                    <span className="text-xs text-muted-foreground">
                      {formatDistanceToNow(new Date(c.created_at), { addSuffix: true })}
                    </span>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </motion.div>
      </main>

      <Footer />
    </div>
  );
}
