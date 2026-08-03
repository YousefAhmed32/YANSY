import { useState } from 'react';
import { Copy, Check, Info, AlertTriangle, Lightbulb, Quote } from 'lucide-react';

const CodeBlock = ({ code, language = 'javascript' }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    if (code) {
      navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="my-6 rounded-2xl overflow-hidden border border-slate-800 bg-slate-950 text-slate-100 shadow-xl font-mono text-xs md:text-sm">
      <div className="flex items-center justify-between px-4 py-2.5 bg-slate-900/90 border-b border-slate-800 text-slate-400">
        <span className="text-[11px] font-semibold uppercase tracking-wider">{language}</span>
        <button
          onClick={handleCopy}
          type="button"
          className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs transition-colors cursor-pointer"
        >
          {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
          <span>{copied ? 'Copied' : 'Copy'}</span>
        </button>
      </div>
      <pre className="p-4 md:p-5 overflow-x-auto leading-relaxed text-slate-200">
        <code>{code}</code>
      </pre>
    </div>
  );
};

const CalloutBox = ({ type = 'info', text }) => {
  const configs = {
    info: {
      bg: 'bg-blue-500/10 dark:bg-blue-950/30',
      border: 'border-blue-500/30',
      text: 'text-blue-900 dark:text-blue-200',
      icon: <Info className="w-5 h-5 text-blue-500 flex-shrink-0" />,
    },
    warning: {
      bg: 'bg-amber-500/10 dark:bg-amber-950/30',
      border: 'border-amber-500/30',
      text: 'text-amber-900 dark:text-amber-200',
      icon: <AlertTriangle className="w-5 h-5 text-amber-500 flex-shrink-0" />,
    },
    tip: {
      bg: 'bg-emerald-500/10 dark:bg-emerald-950/30',
      border: 'border-emerald-500/30',
      text: 'text-emerald-900 dark:text-emerald-200',
      icon: <Lightbulb className="w-5 h-5 text-emerald-500 flex-shrink-0" />,
    },
  };

  const config = configs[type] || configs.info;

  return (
    <div className={`my-6 p-4 md:p-5 rounded-2xl border ${config.bg} ${config.border} flex items-start gap-3.5`}>
      {config.icon}
      <div className={`text-sm md:text-base leading-relaxed ${config.text}`}>
        {text}
      </div>
    </div>
  );
};

const BlogContentRenderer = ({ content, isRTL }) => {
  if (!content || !Array.isArray(content)) return null;

  return (
    <div className={`space-y-6 text-[rgb(var(--text-primary))] ${isRTL ? 'text-right' : 'text-left'}`}>
      {content.map((block, idx) => {
        const blockId = block.id || `block-${idx}`;

        // Section / Legacy format: { heading, body, code, quote, list, image }
        if (block.type === 'section' || block.heading || block.body) {
          return (
            <section key={idx} id={blockId} className="space-y-4 my-8 scroll-mt-28">
              {block.heading && (
                <h2 className="text-xl md:text-2xl font-extrabold tracking-tight text-[rgb(var(--text-primary))] mt-8 mb-4 border-b border-[rgb(var(--border-light))] pb-3">
                  {block.heading}
                </h2>
              )}
              {block.body && (
                <p className="text-base md:text-lg leading-relaxed text-[rgb(var(--text-secondary))] font-normal">
                  {block.body}
                </p>
              )}
              {block.code && <CodeBlock code={block.code} language={block.language || 'javascript'} />}
              {block.quote && (
                <blockquote className="my-6 p-5 rounded-2xl bg-[rgb(var(--bg-elevated))] border-l-4 border-[rgb(var(--accent))] text-base md:text-lg font-medium italic text-[rgb(var(--text-primary))] flex gap-3">
                  <Quote className="w-6 h-6 text-[rgb(var(--accent))] flex-shrink-0 opacity-60" />
                  <div>
                    <p>{block.quote}</p>
                    {block.quoteAuthor && <cite className="block text-xs font-semibold not-italic mt-2 text-[rgb(var(--text-tertiary))]">— {block.quoteAuthor}</cite>}
                  </div>
                </blockquote>
              )}
              {block.list && Array.isArray(block.list) && (
                <ul className="space-y-2 my-4 list-disc list-inside text-base text-[rgb(var(--text-secondary))]">
                  {block.list.map((item, itemIdx) => (
                    <li key={itemIdx} className="leading-relaxed">{item}</li>
                  ))}
                </ul>
              )}
              {block.image && (
                <figure className="my-8 rounded-2xl overflow-hidden border border-[rgb(var(--border))] shadow-md">
                  <img
                    src={typeof block.image === 'string' ? block.image : block.image.url}
                    alt={block.image.alt || block.heading || 'Article visual'}
                    loading="lazy"
                    className="w-full h-auto object-cover max-h-[500px]"
                  />
                  {block.image.caption && (
                    <figcaption className="p-3 text-center text-xs text-[rgb(var(--text-tertiary))] bg-[rgb(var(--bg-elevated))] border-t border-[rgb(var(--border-light))]">
                      {block.image.caption}
                    </figcaption>
                  )}
                </figure>
              )}
            </section>
          );
        }

        // Direct block formats
        switch (block.type) {
          case 'heading':
          case 'h2':
            return (
              <h2 key={idx} id={blockId} className="text-xl md:text-2xl font-extrabold tracking-tight text-[rgb(var(--text-primary))] my-6 border-b border-[rgb(var(--border-light))] pb-2 scroll-mt-28">
                {block.text || block.heading}
              </h2>
            );

          case 'h3':
            return (
              <h3 key={idx} id={blockId} className="text-lg md:text-xl font-bold text-[rgb(var(--text-primary))] my-4 scroll-mt-28">
                {block.text || block.heading}
              </h3>
            );

          case 'paragraph':
            return (
              <p key={idx} className="text-base md:text-lg leading-relaxed text-[rgb(var(--text-secondary))] my-4">
                {block.text || block.body}
              </p>
            );

          case 'quote':
            return (
              <blockquote key={idx} className="my-6 p-5 rounded-2xl bg-[rgb(var(--bg-elevated))] border-l-4 border-[rgb(var(--accent))] text-base md:text-lg font-medium italic text-[rgb(var(--text-primary))] flex gap-3">
                <Quote className="w-6 h-6 text-[rgb(var(--accent))] flex-shrink-0 opacity-60" />
                <div>
                  <p>{block.text || block.quote}</p>
                  {block.author && <cite className="block text-xs font-semibold not-italic mt-2 text-[rgb(var(--text-tertiary))]">— {block.author}</cite>}
                </div>
              </blockquote>
            );

          case 'callout':
            return <CalloutBox key={idx} type={block.variant || 'info'} text={block.text} />;

          case 'code':
            return <CodeBlock key={idx} code={block.code || block.text} language={block.language || 'javascript'} />;

          case 'image':
            return (
              <figure key={idx} className="my-8 rounded-2xl overflow-hidden border border-[rgb(var(--border))] shadow-md">
                <img
                  src={block.url || block.src}
                  alt={block.alt || 'Article visual'}
                  loading="lazy"
                  className="w-full h-auto object-cover max-h-[500px]"
                />
                {block.caption && (
                  <figcaption className="p-3 text-center text-xs text-[rgb(var(--text-tertiary))] bg-[rgb(var(--bg-elevated))] border-t border-[rgb(var(--border-light))]">
                    {block.caption}
                  </figcaption>
                )}
              </figure>
            );

          case 'list':
            return (
              <ul key={idx} className="space-y-2.5 my-4 list-disc list-inside text-base text-[rgb(var(--text-secondary))]">
                {Array.isArray(block.items) && block.items.map((item, i) => (
                  <li key={i} className="leading-relaxed">{item}</li>
                ))}
              </ul>
            );

          default:
            return null;
        }
      })}
    </div>
  );
};

export default BlogContentRenderer;
