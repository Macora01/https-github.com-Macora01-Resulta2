import React from 'react';
import { Sparkles, TrendingUp, AlertCircle, Lightbulb, MessageSquare, Send, Loader2, ChevronRight, ChevronDown } from 'lucide-react';
import { getFinancialInsights, askFinancialQuestion } from '../services/geminiService';
import { cn, formatCurrency } from '../lib/utils';
import { motion, AnimatePresence } from 'motion/react';

interface AIInsightsProps {
  data: any[];
}

export const AIInsights: React.FC<AIInsightsProps> = ({ data }) => {
  const [insights, setInsights] = React.useState<any>(null);
  const [loading, setLoading] = React.useState(false);
  const [chatOpen, setChatOpen] = React.useState(false);
  const [question, setQuestion] = React.useState('');
  const [chatHistory, setChatHistory] = React.useState<{ role: 'user' | 'ai', content: string }[]>([]);
  const [chatLoading, setChatLoading] = React.useState(false);
  const [expanded, setExpanded] = React.useState(true);

  const fetchInsights = async () => {
    if (insights) return;
    setLoading(true);
    try {
      const result = await getFinancialInsights(data);
      setInsights(result);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => {
    if (data.length > 0) {
      fetchInsights();
    }
  }, [data]);

  const handleAsk = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!question.trim() || chatLoading) return;

    const userMsg = question;
    setQuestion('');
    setChatHistory(prev => [...prev, { role: 'user', content: userMsg }]);
    setChatLoading(true);

    try {
      const answer = await askFinancialQuestion(data, userMsg);
      setChatHistory(prev => [...prev, { role: 'ai', content: answer }]);
    } catch (error) {
      setChatHistory(prev => [...prev, { role: 'ai', content: "Lo siento, hubo un error al procesar tu pregunta." }]);
    } finally {
      setChatLoading(false);
    }
  };

  return (
    <div className="flex flex-col gap-6">
      {/* AI Insights Section */}
      <div className="glass-card overflow-hidden">
        <div 
          className="p-6 border-b border-accent/10 flex items-center justify-between cursor-pointer hover:bg-accent/5 transition-colors"
          onClick={() => setExpanded(!expanded)}
        >
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/10 text-primary rounded-lg">
              <Sparkles size={20} />
            </div>
            <div>
              <h3 className="font-bold text-text text-lg">Análisis Inteligente (AI)</h3>
              <p className="text-xs text-text-light font-medium">Insights generados por Gemini basados en tus datos reales.</p>
            </div>
          </div>
          {expanded ? <ChevronDown size={20} className="text-text-light" /> : <ChevronRight size={20} className="text-text-light" />}
        </div>

        <AnimatePresence>
          {expanded && (
            <motion.div 
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden"
            >
              <div className="p-6 flex flex-col gap-6">
                {loading ? (
                  <div className="flex flex-col items-center justify-center py-12 gap-4">
                    <Loader2 className="animate-spin text-primary" size={32} />
                    <p className="text-text-light font-medium animate-pulse">Analizando tendencias financieras...</p>
                  </div>
                ) : insights ? (
                  <>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      {insights.insights.map((insight: any, idx: number) => (
                        <div key={idx} className="p-4 rounded-xl bg-accent/5 border border-accent/10 flex flex-col gap-2">
                          <div className="flex items-center gap-2">
                            {insight.type === 'positive' && <TrendingUp className="text-success" size={18} />}
                            {insight.type === 'negative' && <AlertCircle className="text-danger" size={18} />}
                            {insight.type === 'neutral' && <Lightbulb className="text-secondary" size={18} />}
                            <span className="font-bold text-sm text-text">{insight.title}</span>
                          </div>
                          <p className="text-xs text-text-light leading-relaxed">{insight.description}</p>
                        </div>
                      ))}
                    </div>

                    <div className="p-4 rounded-xl bg-primary/5 border border-primary/10">
                      <h4 className="font-bold text-sm text-primary mb-2 flex items-center gap-2">
                        <Lightbulb size={16} />
                        Resumen Ejecutivo
                      </h4>
                      <p className="text-sm text-text leading-relaxed">{insights.summary}</p>
                    </div>

                    <div className="p-4 rounded-xl bg-secondary/5 border border-secondary/10">
                      <h4 className="font-bold text-sm text-secondary mb-2 flex items-center gap-2">
                        <TrendingUp size={16} />
                        Recomendación Estratégica
                      </h4>
                      <p className="text-sm text-text leading-relaxed italic">"{insights.recommendation}"</p>
                    </div>
                  </>
                ) : (
                  <div className="text-center py-8">
                    <button 
                      onClick={fetchInsights}
                      className="btn-primary px-6 py-2 flex items-center gap-2 mx-auto"
                    >
                      <Sparkles size={18} />
                      Generar Insights
                    </button>
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Floating Chat Button */}
      <div className="fixed bottom-8 right-8 z-50 flex flex-col items-end gap-4">
        <AnimatePresence>
          {chatOpen && (
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="w-[350px] h-[500px] glass-card shadow-2xl flex flex-col overflow-hidden border-primary/20"
            >
              <div className="p-4 bg-primary text-white flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Sparkles size={18} />
                  <span className="font-bold">Asistente Facore AI</span>
                </div>
                <button onClick={() => setChatOpen(false)} className="hover:bg-white/20 p-1 rounded">
                  <ChevronDown size={20} />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-4 bg-accent/5">
                {chatHistory.length === 0 && (
                  <div className="text-center py-12 flex flex-col items-center gap-4">
                    <div className="p-4 bg-primary/10 rounded-full text-primary">
                      <MessageSquare size={32} />
                    </div>
                    <p className="text-sm text-text-light font-medium px-8">
                      ¡Hola! Soy tu asistente financiero. Pregúntame cualquier cosa sobre los datos de Facore.
                    </p>
                    <div className="flex flex-wrap justify-center gap-2 px-4">
                      {['¿Cómo van las ventas?', '¿Cuál es el margen?', 'Resumen 2025'].map(q => (
                        <button 
                          key={q}
                          onClick={() => { setQuestion(q); }}
                          className="text-xs bg-white border border-accent/20 px-3 py-1.5 rounded-full hover:border-primary transition-colors"
                        >
                          {q}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
                {chatHistory.map((msg, idx) => (
                  <div 
                    key={idx} 
                    className={cn(
                      "max-w-[85%] p-3 rounded-2xl text-sm",
                      msg.role === 'user' 
                        ? "bg-primary text-white self-end rounded-tr-none" 
                        : "bg-white border border-accent/20 text-text self-start rounded-tl-none shadow-sm"
                    )}
                  >
                    {msg.content}
                  </div>
                ))}
                {chatLoading && (
                  <div className="bg-white border border-accent/20 text-text self-start rounded-2xl rounded-tl-none p-3 shadow-sm flex items-center gap-2">
                    <Loader2 className="animate-spin text-primary" size={16} />
                    <span className="text-xs font-medium animate-pulse">Pensando...</span>
                  </div>
                )}
              </div>

              <form onSubmit={handleAsk} className="p-4 bg-white border-t border-accent/10 flex gap-2">
                <input 
                  type="text"
                  value={question}
                  onChange={(e) => setQuestion(e.target.value)}
                  placeholder="Pregunta algo..."
                  className="flex-1 bg-accent/5 border border-accent/20 rounded-xl px-4 py-2 text-sm focus:outline-none focus:border-primary transition-colors"
                />
                <button 
                  type="submit"
                  disabled={!question.trim() || chatLoading}
                  className="p-2 bg-primary text-white rounded-xl disabled:opacity-50 hover:bg-primary/90 transition-colors"
                >
                  <Send size={18} />
                </button>
              </form>
            </motion.div>
          )}
        </AnimatePresence>

        <button 
          onClick={() => setChatOpen(!chatOpen)}
          className="w-14 h-14 rounded-full bg-primary text-white shadow-xl flex items-center justify-center hover:scale-110 transition-transform active:scale-95 group relative"
        >
          <Sparkles size={24} className="group-hover:animate-pulse" />
          {!chatOpen && (
            <span className="absolute -top-1 -right-1 w-4 h-4 bg-danger rounded-full border-2 border-white animate-bounce" />
          )}
        </button>
      </div>
    </div>
  );
};
