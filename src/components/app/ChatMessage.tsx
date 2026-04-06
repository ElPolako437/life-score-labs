import ReactMarkdown from 'react-markdown';
import { User } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ChatMessageProps {
  role: 'user' | 'assistant';
  content: string;
}

export default function ChatMessage({ role, content }: ChatMessageProps) {
  const isUser = role === 'user';

  return (
    <div className={cn('flex gap-3', isUser && 'flex-row-reverse')}>
      <div className={cn(
        'w-7 h-7 rounded-lg flex items-center justify-center shrink-0 mt-0.5',
        isUser ? 'bg-primary/10 border border-primary/20' : 'bg-secondary border border-border/40 overflow-hidden'
      )}>
        {isUser ? (
          <User className="w-3.5 h-3.5 text-primary" />
        ) : (
          <img src="/images/caliness-logo-white.png" alt="CALI" className="w-4 h-4 object-contain" />
        )}
      </div>
      <div className={cn(
        'rounded-2xl px-4 py-3 max-w-[85%] text-sm',
        isUser
          ? 'bg-primary/10 border border-primary/20 text-foreground'
          : 'card-elegant text-foreground'
      )}>
        {isUser ? (
          <p>{content}</p>
        ) : (
          <div className="prose prose-sm prose-invert max-w-none prose-p:leading-relaxed prose-p:my-1 prose-ul:my-1 prose-li:my-0.5 prose-headings:text-foreground prose-headings:font-outfit prose-strong:text-primary">
            <ReactMarkdown>{content}</ReactMarkdown>
          </div>
        )}
      </div>
    </div>
  );
}