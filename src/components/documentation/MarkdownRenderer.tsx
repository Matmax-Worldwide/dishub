'use client';

import React from 'react';
import ReactMarkdown from 'react-markdown';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { tomorrow } from 'react-syntax-highlighter/dist/esm/styles/prism';
import remarkGfm from 'remark-gfm';
import { 
  LinkIcon, 
  ClipboardIcon, 
  CheckIcon 
} from 'lucide-react';
import { useState } from 'react';

interface MarkdownRendererProps {
  content: string;
  className?: string;
}

export const MarkdownRenderer: React.FC<MarkdownRendererProps> = ({ 
  content, 
  className = '' 
}) => {
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedCode(text);
      setTimeout(() => setCopiedCode(null), 2000);
    } catch (err) {
      console.error('Failed to copy text: ', err);
    }
  };

  return (
    <div className={`prose prose-lg max-w-none ${className}`}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          // Custom heading renderer with anchor links
          h1: ({ children, ...props }) => (
            <h1 
              id={children?.toString().toLowerCase().replace(/\s+/g, '-')}
              className="text-3xl font-bold text-gray-900 mb-6 pb-2 border-b border-gray-200 flex items-center group"
              {...props}
            >
              {children}
              <LinkIcon className="h-5 w-5 ml-2 text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity" />
            </h1>
          ),
          h2: ({ children, ...props }) => (
            <h2 
              id={children?.toString().toLowerCase().replace(/\s+/g, '-')}
              className="text-2xl font-semibold text-gray-900 mt-8 mb-4 flex items-center group"
              {...props}
            >
              {children}
              <LinkIcon className="h-4 w-4 ml-2 text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity" />
            </h2>
          ),
          h3: ({ children, ...props }) => (
            <h3 
              id={children?.toString().toLowerCase().replace(/\s+/g, '-')}
              className="text-xl font-semibold text-gray-900 mt-6 mb-3 flex items-center group"
              {...props}
            >
              {children}
              <LinkIcon className="h-4 w-4 ml-2 text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity" />
            </h3>
          ),
          // Custom paragraph styling
          p: ({ children, ...props }) => (
            <p className="text-gray-700 leading-relaxed mb-4" {...props}>
              {children}
            </p>
          ),
          // Custom list styling
          ul: ({ children, ...props }) => (
            <ul className="list-disc list-inside space-y-2 mb-4 text-gray-700" {...props}>
              {children}
            </ul>
          ),
          ol: ({ children, ...props }) => (
            <ol className="list-decimal list-inside space-y-2 mb-4 text-gray-700" {...props}>
              {children}
            </ol>
          ),
          li: ({ children, ...props }) => (
            <li className="ml-4" {...props}>
              {children}
            </li>
          ),
          // Custom blockquote styling
          blockquote: ({ children, ...props }) => (
            <blockquote 
              className="border-l-4 border-blue-500 pl-4 py-2 my-4 bg-blue-50 text-gray-700 italic"
              {...props}
            >
              {children}
            </blockquote>
          ),
          // Custom table styling
          table: ({ children, ...props }) => (
            <div className="overflow-x-auto my-6">
              <table className="min-w-full divide-y divide-gray-200 border border-gray-200 rounded-lg" {...props}>
                {children}
              </table>
            </div>
          ),
          thead: ({ children, ...props }) => (
            <thead className="bg-gray-50" {...props}>
              {children}
            </thead>
          ),
          th: ({ children, ...props }) => (
            <th 
              className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
              {...props}
            >
              {children}
            </th>
          ),
          td: ({ children, ...props }) => (
            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 border-t border-gray-200" {...props}>
              {children}
            </td>
          ),
          // Custom link styling
          a: ({ children, href, ...props }) => (
            <a 
              href={href}
              className="text-blue-600 hover:text-blue-800 underline font-medium"
              target={href?.startsWith('http') ? '_blank' : undefined}
              rel={href?.startsWith('http') ? 'noopener noreferrer' : undefined}
              {...props}
            >
              {children}
            </a>
          ),
          // Custom code block with syntax highlighting and copy button
          code: ({ inline, className, children, ...props }) => {
            const match = /language-(\w+)/.exec(className || '');
            const codeString = String(children).replace(/\n$/, '');
            
            if (!inline && match) {
              return (
                <div className="relative group my-6">
                  <div className="flex items-center justify-between bg-gray-800 text-white px-4 py-2 rounded-t-lg">
                    <span className="text-sm font-medium">{match[1]}</span>
                    <button
                      onClick={() => copyToClipboard(codeString)}
                      className="flex items-center space-x-1 text-xs bg-gray-700 hover:bg-gray-600 px-2 py-1 rounded transition-colors"
                      title="Copy code"
                    >
                      {copiedCode === codeString ? (
                        <>
                          <CheckIcon className="h-3 w-3" />
                          <span>Copied!</span>
                        </>
                      ) : (
                        <>
                          <ClipboardIcon className="h-3 w-3" />
                          <span>Copy</span>
                        </>
                      )}
                    </button>
                  </div>
                  <SyntaxHighlighter
                    style={tomorrow}
                    language={match[1]}
                    PreTag="div"
                    className="rounded-t-none rounded-b-lg !mt-0"
                    {...props}
                  >
                    {codeString}
                  </SyntaxHighlighter>
                </div>
              );
            }
            
            // Inline code
            return (
              <code 
                className="bg-gray-100 text-gray-800 px-1.5 py-0.5 rounded text-sm font-mono"
                {...props}
              >
                {children}
              </code>
            );
          },
          // Custom horizontal rule
          hr: ({ ...props }) => (
            <hr className="my-8 border-t border-gray-300" {...props} />
          ),
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}; 