"use client";

import ReactMarkdown from "react-markdown";
import { cn } from "@/lib/utils";

interface MarkdownProps {
  children: string;
  className?: string;
}

export function Markdown({ children, className }: MarkdownProps) {
  return (
    <div className={cn("markdown-content", className)}>
      <ReactMarkdown
        components={{
          // Custom heading styles
          h1: ({ children }) => (
            <h1 className="text-2xl font-bold text-foreground mt-8 mb-4 first:mt-0">
              {children}
            </h1>
          ),
          h2: ({ children }) => (
            <h2 className="text-xl font-semibold text-foreground mt-6 mb-3">
              {children}
            </h2>
          ),
          h3: ({ children }) => (
            <h3 className="text-lg font-semibold text-foreground mt-4 mb-2">
              {children}
            </h3>
          ),
          // Custom paragraph
          p: ({ children }) => (
            <p className="text-foreground/90 leading-relaxed mb-4 last:mb-0">
              {children}
            </p>
          ),
          // Strong/Bold
          strong: ({ children }) => (
            <strong className="font-semibold text-foreground">{children}</strong>
          ),
          // Custom list styles
          ul: ({ children }) => (
            <ul className="list-disc pl-6 mb-4 space-y-1 text-foreground/90">
              {children}
            </ul>
          ),
          ol: ({ children }) => (
            <ol className="list-decimal pl-6 mb-4 space-y-1 text-foreground/90">
              {children}
            </ol>
          ),
          li: ({ children }) => (
            <li className="text-foreground/90">{children}</li>
          ),
          // Custom link
          a: ({ href, children }) => (
            <a
              href={href}
              className="text-primary hover:underline"
              target={href?.startsWith("http") ? "_blank" : undefined}
              rel={href?.startsWith("http") ? "noopener noreferrer" : undefined}
            >
              {children}
            </a>
          ),
          // Custom code block
          code: ({ className, children, ...props }) => {
            const isInline = !className;
            if (isInline) {
              return (
                <code
                  className="bg-muted text-primary px-1.5 py-0.5 rounded text-sm"
                  {...props}
                >
                  {children}
                </code>
              );
            }
            return (
              <code className={className} {...props}>
                {children}
              </code>
            );
          },
          // Custom pre block
          pre: ({ children }) => (
            <pre className="bg-muted border border-border rounded-lg p-4 overflow-x-auto my-4">
              {children}
            </pre>
          ),
          // Custom blockquote
          blockquote: ({ children }) => (
            <blockquote className="border-l-4 border-primary pl-4 italic text-muted-foreground my-4">
              {children}
            </blockquote>
          ),
          // Custom horizontal rule
          hr: () => <hr className="border-border my-6" />,
        }}
      >
        {children}
      </ReactMarkdown>
    </div>
  );
}
