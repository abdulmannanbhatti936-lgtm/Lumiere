import { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { MessageCircle, X, Send, Sparkles } from 'lucide-react';
import { TRPCClientError } from '@trpc/client';
import { trpc } from '@/lib/trpc';

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

const GREETING: ChatMessage = {
  role: 'assistant',
  content: "Hi, I'm the Lumière Concierge. Ask me about destinations, hotels, tours, or how to book a stay — I'm happy to point you in the right direction.",
};

const QUICK_PROMPTS = [
  'Help me find a hotel',
  'What tours do you offer?',
  'How do I book a room?',
  'How do I contact support?',
];

export default function ChatWidget() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([GREETING]);
  const [input, setInput] = useState('');
  const [configError, setConfigError] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const sendMessage = trpc.chat.send.useMutation();

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages, sendMessage.isPending]);

  const submit = async (text: string) => {
    const trimmed = text.trim();
    if (!trimmed || sendMessage.isPending) return;

    const nextMessages: ChatMessage[] = [...messages, { role: 'user', content: trimmed }];
    setMessages(nextMessages);
    setInput('');

    try {
      const { reply } = await sendMessage.mutateAsync({
        messages: nextMessages.slice(-12).map(({ role, content }) => ({ role, content })),
      });
      setMessages((prev) => [...prev, { role: 'assistant', content: reply }]);
    } catch (err) {
      const isConfigIssue = err instanceof TRPCClientError && err.data?.code === 'PRECONDITION_FAILED';
      if (isConfigIssue) setConfigError(true);
      const message =
        err instanceof TRPCClientError
          ? err.message
          : "Sorry, I couldn't reach the concierge desk just now. Please try again in a moment.";
      setMessages((prev) => [...prev, { role: 'assistant', content: message }]);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    void submit(input);
  };

  return (
    <div className="fixed bottom-24 md:bottom-6 right-5 md:right-6 z-50">
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 16, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 16, scale: 0.96 }}
            transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
            className="absolute bottom-[calc(100%+12px)] right-0 w-[min(92vw,380px)] h-[min(70vh,560px)] glass-panel shadow-2xl flex flex-col overflow-hidden"
          >
            {/* Header */}
            <div className="flex items-center gap-3 px-4 py-3.5 border-b border-border shrink-0">
              <div className="nav-pill-active w-9 h-9 rounded-full flex items-center justify-center shrink-0">
                <Sparkles size={16} className="text-white" />
              </div>
              <div className="min-w-0">
                <p className="font-serif text-[15px] font-semibold leading-tight">Lumière Concierge</p>
                <p className="text-xs text-muted-foreground">Here to help you plan your stay</p>
              </div>
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label="Close chat"
                className="ml-auto w-8 h-8 rounded-full flex items-center justify-center text-muted-foreground hover:bg-muted transition-colors shrink-0"
              >
                <X size={16} />
              </button>
            </div>

            {/* Messages */}
            <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
              {messages.map((m, i) => (
                <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div
                    className={`max-w-[85%] rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed ${
                      m.role === 'user' ? 'nav-pill-active text-white rounded-br-sm' : 'bg-muted text-foreground rounded-bl-sm'
                    }`}
                  >
                    {m.content}
                  </div>
                </div>
              ))}
              {sendMessage.isPending && (
                <div className="flex justify-start">
                  <div className="bg-muted rounded-2xl rounded-bl-sm px-3.5 py-2.5 flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground/50 animate-bounce [animation-delay:-0.3s]" />
                    <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground/50 animate-bounce [animation-delay:-0.15s]" />
                    <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground/50 animate-bounce" />
                  </div>
                </div>
              )}

              {messages.length === 1 && !configError && (
                <div className="flex flex-wrap gap-2 pt-1">
                  {QUICK_PROMPTS.map((prompt) => (
                    <button
                      key={prompt}
                      type="button"
                      onClick={() => void submit(prompt)}
                      className="text-xs font-semibold px-3 py-1.5 rounded-full border border-border text-foreground hover:border-primary/40 hover:bg-muted/50 transition-colors"
                    >
                      {prompt}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Input */}
            <form onSubmit={handleSubmit} className="flex items-center gap-2 p-3 border-t border-border shrink-0">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder={configError ? 'Assistant unavailable right now' : 'Ask me anything...'}
                disabled={configError || sendMessage.isPending}
                className="flex-1 bg-muted rounded-full px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-accent/30 disabled:opacity-60"
              />
              <button
                type="submit"
                disabled={configError || sendMessage.isPending || !input.trim()}
                aria-label="Send message"
                className="btn-primary !p-0 w-10 h-10 !rounded-full shrink-0 disabled:opacity-40"
              >
                <Send size={15} />
              </button>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      <motion.button
        type="button"
        onClick={() => setOpen((v) => !v)}
        whileHover={{ scale: 1.06 }}
        whileTap={{ scale: 0.94 }}
        aria-label={open ? 'Close concierge chat' : 'Open concierge chat'}
        className="nav-pill-active w-14 h-14 rounded-full flex items-center justify-center text-white shadow-xl"
      >
        <AnimatePresence mode="wait" initial={false}>
          <motion.span
            key={open ? 'close' : 'open'}
            initial={{ opacity: 0, rotate: -45 }}
            animate={{ opacity: 1, rotate: 0 }}
            exit={{ opacity: 0, rotate: 45 }}
            transition={{ duration: 0.15 }}
          >
            {open ? <X size={22} /> : <MessageCircle size={22} />}
          </motion.span>
        </AnimatePresence>
      </motion.button>
    </div>
  );
}
