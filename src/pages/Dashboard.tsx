import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  FileCheck, 
  FileText, 
  Clock, 
  Download, 
  Plus,
  LogOut,
  User,
  Sparkles,
  ChevronRight
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Logo } from '@/components/Logo';
import { Footer } from '@/components/Footer';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { formatDistanceToNow } from 'date-fns';

interface Certification {
  id: string;
  document_id: string;
  document_type: string;
  status: string;
  created_at: string;
  certified_at: string | null;
  total_files: number;
}

export default function Dashboard() {
  const { user, signOut, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [certifications, setCertifications] = useState<Certification[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/auth');
      return;
    }

    if (user) {
      fetchCertifications();
    }
  }, [user, authLoading, navigate]);

  const fetchCertifications = async () => {
    try {
      const { data, error } = await supabase
        .from('certifications')
        .select('*')
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setCertifications(data || []);
    } catch (error) {
      console.error('Error fetching certifications:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'paid':
        return 'bg-success/10 text-success';
      case 'pending':
        return 'bg-warning/10 text-warning';
      case 'processing':
        return 'bg-primary/10 text-primary';
      default:
        return 'bg-muted text-muted-foreground';
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
      {/* Header */}
      <header className="border-b border-border bg-card">
        <div className="container flex items-center justify-between py-4">
          <Link to="/">
            <Logo size="md" />
          </Link>

          <div className="flex items-center gap-4">
            <div className="hidden md:flex items-center gap-2 text-sm text-muted-foreground">
              <User className="w-4 h-4" />
              <span>{user?.email}</span>
            </div>
            <Button variant="ghost" size="sm" onClick={handleSignOut}>
              <LogOut className="w-4 h-4 mr-2" />
              Sign Out
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 container py-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          {/* Welcome Section */}
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
            <div>
              <h1 className="font-display text-3xl font-bold text-foreground mb-2">
                Welcome back
              </h1>
              <p className="text-muted-foreground">
                Manage your certifications and documents
              </p>
            </div>

            <div className="flex gap-3">
              <Button asChild>
                <Link to="/upload">
                  <Plus className="w-4 h-4 mr-2" />
                  New Certification
                </Link>
              </Button>
              <Button variant="outline" asChild>
                <Link to="/draft-document">
                  <Sparkles className="w-4 h-4 mr-2" />
                  Draft Document
                </Link>
              </Button>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid gap-4 md:grid-cols-3 mb-8">
            <div className="p-6 rounded-xl bg-card border border-border">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
                  <FileCheck className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Total Certifications</p>
                  <p className="text-2xl font-bold text-foreground">{certifications.length}</p>
                </div>
              </div>
            </div>

            <div className="p-6 rounded-xl bg-card border border-border">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-success/10 text-success flex items-center justify-center">
                  <Download className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Completed</p>
                  <p className="text-2xl font-bold text-foreground">
                    {certifications.filter((c) => c.status === 'paid').length}
                  </p>
                </div>
              </div>
            </div>

            <div className="p-6 rounded-xl bg-card border border-border">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-warning/10 text-warning flex items-center justify-center">
                  <Clock className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Pending</p>
                  <p className="text-2xl font-bold text-foreground">
                    {certifications.filter((c) => c.status === 'pending').length}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Certifications List */}
          <div className="rounded-xl border border-border overflow-hidden">
            <div className="p-4 bg-card border-b border-border">
              <h2 className="font-display text-lg font-semibold text-foreground">
                Your Certifications
              </h2>
            </div>

            {loading ? (
              <div className="p-8 text-center text-muted-foreground">
                Loading certifications...
              </div>
            ) : certifications.length === 0 ? (
              <div className="p-12 text-center">
                <FileText className="w-12 h-12 text-muted-foreground/50 mx-auto mb-4" />
                <h3 className="font-display text-lg font-semibold text-foreground mb-2">
                  No certifications yet
                </h3>
                <p className="text-muted-foreground mb-6">
                  Get started by uploading your first document
                </p>
                <Button asChild>
                  <Link to="/upload">
                    <Plus className="w-4 h-4 mr-2" />
                    Create Certification
                  </Link>
                </Button>
              </div>
            ) : (
              <div className="divide-y divide-border">
                {certifications.map((cert) => (
                  <div
                    key={cert.id}
                    className="p-4 flex items-center justify-between hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center">
                        <FileText className="w-5 h-5 text-muted-foreground" />
                      </div>
                      <div>
                        <p className="font-medium text-foreground">
                          {cert.document_type.charAt(0).toUpperCase() + cert.document_type.slice(1)} Certificate
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {cert.total_files} file{cert.total_files !== 1 ? 's' : ''} •{' '}
                          {formatDistanceToNow(new Date(cert.created_at), { addSuffix: true })}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-4">
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(cert.status)}`}>
                        {cert.status.charAt(0).toUpperCase() + cert.status.slice(1)}
                      </span>
                      {cert.status === 'paid' && (
                        <Button variant="ghost" size="sm" asChild>
                          <Link to={`/success?session_id=${cert.id}`}>
                            <ChevronRight className="w-4 h-4" />
                          </Link>
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </motion.div>
      </main>

      <Footer />
    </div>
  );
}