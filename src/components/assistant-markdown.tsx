"use client";

import ReactMarkdown from "react-markdown";

/** Renders Gemini-style markdown (bold, lists, etc.) in chat bubbles. */
export function AssistantMarkdown({ text }: { text: string }) {
  return (
    <ReactMarkdown
      components={{
        p: ({ children }) => <p className="mb-2 last:mb-0 leading-relaxed">{children}</p>,
        strong: ({ children }) => <strong className="font-semibold text-zinc-900">{children}</strong>,
        em: ({ children }) => <em className="italic">{children}</em>,
        ul: ({ children }) => <ul className="list-disc pl-4 mb-2 last:mb-0 space-y-0.5">{children}</ul>,
        ol: ({ children }) => <ol className="list-decimal pl-4 mb-2 last:mb-0 space-y-0.5">{children}</ol>,
        li: ({ children }) => <li className="leading-relaxed">{children}</li>,
        code: ({ children, className }) => {
          const inline = !className;
          if (inline) {
            return (
              <code className="rounded bg-zinc-200/80 px-1 py-0.5 text-[0.85em] font-mono text-zinc-800">
                {children}
              </code>
            );
          }
          return <code className={className}>{children}</code>;
        },
        pre: ({ children }) => (
          <pre className="mb-2 overflow-x-auto rounded-lg bg-zinc-200/60 p-2 text-xs font-mono last:mb-0">{children}</pre>
        ),
        a: ({ href, children }) => (
          <a href={href} className="text-[#0d2f30] underline underline-offset-2 hover:opacity-80" target="_blank" rel="noreferrer">
            {children}
          </a>
        ),
      }}
    >
      {text}
    </ReactMarkdown>
  );
}
