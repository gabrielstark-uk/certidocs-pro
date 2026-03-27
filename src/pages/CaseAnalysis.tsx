import { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Scale, Sparkles, AlertCircle, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Logo } from '@/components/Logo';
import { Footer } from '@/components/Footer';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

interface AnalysisResult {
  probability: number;
  assessment: string;
  strengths: string[];
  weaknesses: string[];
  recommendations: string[];
}

export default function CaseAnalysis() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [error, setError] = useState('');
  const [form, setForm] = useState({
    caseType: '',
    description: '',
    evidence: '',
    opposingArguments: '',
  });

  const handleAnalyse = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.caseType.trim() || !form.description.trim()) return;

    setLoading(true);
    setError('');
    setResult(null);

    try {
      const { data, error: fnError } = await supabase.functions.invoke('analyse-case', {
        body: {
          caseType: form.caseType,
          description: form.description,
          evidence: form.evidence,
          opposingArguments: form.opposingArguments,
        },
      });

      if (fnError) throw fnError;
      if (data?.error) throw new Error(data.error);

      setResult(data);
    } catch (err: any) {
      setError(err.message || 'Failed to analyse case. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const getProbabilityColor = (p: number) => {
    if (p >= 70) return 'text-green-500';
    if (p >= 40) return 'text-yellow-500';
    return 'text-red-500';
  };

  const getProbabilityIcon = (p: number) => {
    if (p >= 70) return TrendingUp;
    if (p >= 40) return Minus;
    return TrendingDown;
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <header className="border-b border-border bg-card">
        <div className="container flex items-center justify-between py-4">
          <Link to="/"><Logo size="md" /></Link>
          <div className="flex gap-3">
            {user && (
              <Button variant="outline" size="sm" asChild>
                <Link to="/dashboard">Dashboard</Link>
              </Button>
            )}
          </div>
        </div>
      </header>

      <main className="flex-1 container py-8">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="max-w-4xl mx-auto">
          <div className="text-center mb-8">
            <div className="w-16 h-16 rounded-2xl bg-accent/10 text-accent flex items-center justify-center mx-auto mb-4">
              <Scale className="w-8 h-8" />
            </div>
            <h1 className="font-display text-3xl md:text-4xl font-bold text-foreground mb-2">
              AI Case Analysis
            </h1>
            <p className="text-muted-foreground">
              Get an AI-powered assessment of your case's probability of success
            </p>
          </div>

          <div className="grid gap-8 lg:grid-cols-2">
            {/* Input Form */}
            <form onSubmit={handleAnalyse} className="space-y-5">
              <div>
                <label className="text-sm font-medium text-foreground">Case Type *</label>
                <Input
                  value={form.caseType}
                  onChange={(e) => setForm({ ...form, caseType: e.target.value })}
                  placeholder="e.g., Employment Tribunal, Contract Dispute, Personal Injury"
                />
              </div>

              <div>
                <label className="text-sm font-medium text-foreground">Case Description *</label>
                <Textarea
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  placeholder="Describe the facts of your case, the dispute, and what outcome you seek..."
                  rows={5}
                />
              </div>

              <div>
                <label className="text-sm font-medium text-foreground">Evidence Summary</label>
                <Textarea
                  value={form.evidence}
                  onChange={(e) => setForm({ ...form, evidence: e.target.value })}
                  placeholder="List the evidence you have to support your case..."
                  rows={3}
                />
              </div>

              <div>
                <label className="text-sm font-medium text-foreground">Opposing Arguments</label>
                <Textarea
                  value={form.opposingArguments}
                  onChange={(e) => setForm({ ...form, opposingArguments: e.target.value })}
                  placeholder="Any known arguments from the opposing party..."
                  rows={3}
                />
              </div>

              <Button type="submit" className="w-full" disabled={loading || !form.caseType.trim() || !form.description.trim()}>
                {loading ? (
                  <>Analysing...</>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 mr-2" />
                    Analyse Case
                  </>
                )}
              </Button>
            </form>

            {/* Results */}
            <div>
              {error && (
                <div className="p-4 rounded-xl bg-destructive/10 border border-destructive/30">
                  <div className="flex items-center gap-2">
                    <AlertCircle className="w-5 h-5 text-destructive" />
                    <p className="text-sm text-foreground">{error}</p>
                  </div>
                </div>
              )}

              {result && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
                  {/* Probability Score */}
                  <div className="p-6 rounded-xl bg-card border-2 border-accent/20 text-center">
                    {(() => {
                      const Icon = getProbabilityIcon(result.probability);
                      return <Icon className={`w-10 h-10 mx-auto mb-2 ${getProbabilityColor(result.probability)}`} />;
                    })()}
                    <p className={`text-5xl font-display font-bold ${getProbabilityColor(result.probability)}`}>
                      {result.probability}%
                    </p>
                    <p className="text-sm text-muted-foreground mt-1">Estimated Probability of Success</p>
                  </div>

                  {/* Assessment */}
                  <div className="p-5 rounded-xl bg-card border border-border">
                    <h3 className="font-display font-semibold text-foreground mb-2">Assessment</h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">{result.assessment}</p>
                  </div>

                  {/* Strengths */}
                  {result.strengths.length > 0 && (
                    <div className="p-5 rounded-xl bg-card border border-border">
                      <h3 className="font-display font-semibold text-green-500 mb-3">Strengths</h3>
                      <ul className="space-y-2">
                        {result.strengths.map((s, i) => (
                          <li key={i} className="text-sm text-muted-foreground flex items-start gap-2">
                            <TrendingUp className="w-4 h-4 text-green-500 flex-shrink-0 mt-0.5" />
                            {s}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Weaknesses */}
                  {result.weaknesses.length > 0 && (
                    <div className="p-5 rounded-xl bg-card border border-border">
                      <h3 className="font-display font-semibold text-red-500 mb-3">Weaknesses</h3>
                      <ul className="space-y-2">
                        {result.weaknesses.map((w, i) => (
                          <li key={i} className="text-sm text-muted-foreground flex items-start gap-2">
                            <TrendingDown className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
                            {w}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Recommendations */}
                  {result.recommendations.length > 0 && (
                    <div className="p-5 rounded-xl bg-card border border-border">
                      <h3 className="font-display font-semibold text-accent mb-3">Recommendations</h3>
                      <ul className="space-y-2">
                        {result.recommendations.map((r, i) => (
                          <li key={i} className="text-sm text-muted-foreground flex items-start gap-2">
                            <Sparkles className="w-4 h-4 text-accent flex-shrink-0 mt-0.5" />
                            {r}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  <p className="text-xs text-muted-foreground text-center">
                    This analysis is AI-generated guidance and should be used alongside professional legal advice.
                  </p>
                </motion.div>
              )}

              {!result && !error && (
                <div className="flex items-center justify-center h-full min-h-[300px] rounded-xl border-2 border-dashed border-border">
                  <div className="text-center text-muted-foreground">
                    <Scale className="w-12 h-12 mx-auto mb-3 opacity-30" />
                    <p className="text-sm">Fill in the form and click Analyse to get your case assessment</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </motion.div>
      </main>

      <Footer />
    </div>
  );
}
