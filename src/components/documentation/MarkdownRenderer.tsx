'use client';

import { useState } from 'react';
import { CopyIcon, CheckIcon } from 'lucide-react';

interface MarkdownRendererProps {
  content: string;
}

export const MarkdownRenderer = ({ content }: MarkdownRendererProps) => {
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  const copyToClipboard = async (text: string, id: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedCode(id);
      setTimeout(() => setCopiedCode(null), 2000);
    } catch (err) {
      console.error('Failed to copy text: ', err);
    }
  };

  const renderMarkdown = (content: string) => {
    const lines = content.split('\n');
    const elements: JSX.Element[] = [];
    let inCodeBlock = false;
    let codeContent = '';
    let codeLanguage = '';
    let codeBlockId = '';

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];

      // Handle code blocks
      if (line.startsWith('```')) {
        if (!inCodeBlock) {
          // Start of code block
          inCodeBlock = true;
          codeLanguage = line.slice(3).trim();
          codeContent = '';
          codeBlockId = `code-${i}`;
        } else {
          // End of code block
          inCodeBlock = false;
          elements.push(
            <div key={i} className="relative group my-6">
              <div className="flex items-center justify-between bg-gray-800 text-gray-200 px-4 py-2 rounded-t-lg">
                <span className="text-sm font-medium">
                  {codeLanguage || 'Code'}
                </span>
                <button
                  onClick={() => copyToClipboard(codeContent, codeBlockId)}
                  className="flex items-center space-x-1 text-xs text-gray-400 hover:text-gray-200 transition-colors"
                >
                  {copiedCode === codeBlockId ? (
                    <>
                      <CheckIcon className="h-3 w-3" />
                      <span>Copiado</span>
                    </>
                  ) : (
                    <>
                      <CopyIcon className="h-3 w-3" />
                      <span>Copiar</span>
                    </>
                  )}
                </button>
              </div>
              <pre className="bg-gray-900 text-gray-100 p-4 rounded-b-lg overflow-x-auto">
                <code className="text-sm">{codeContent}</code>
              </pre>
            </div>
          );
        }
        continue;
      }

      if (inCodeBlock) {
        codeContent += (codeContent ? '\n' : '') + line;
        continue;
      }

      // Handle headers
      if (line.startsWith('# ')) {
        elements.push(
          <h1 key={i} className="text-3xl font-bold text-gray-900 mb-6 mt-8 first:mt-0 border-b border-gray-200 pb-3">
            {line.slice(2)}
          </h1>
        );
      } else if (line.startsWith('## ')) {
        elements.push(
          <h2 key={i} className="text-2xl font-semibold text-gray-800 mb-4 mt-8 border-b border-gray-100 pb-2">
            {line.slice(3)}
          </h2>
        );
      } else if (line.startsWith('### ')) {
        elements.push(
          <h3 key={i} className="text-xl font-medium text-gray-700 mb-3 mt-6">
            {line.slice(4)}
          </h3>
        );
      } else if (line.startsWith('#### ')) {
        elements.push(
          <h4 key={i} className="text-lg font-medium text-gray-700 mb-2 mt-4">
            {line.slice(5)}
          </h4>
        );
      }
      // Handle lists
      else if (line.startsWith('- ')) {
        const listContent = line.slice(2);
        elements.push(
          <div key={i} className="flex items-start space-x-3 mb-2">
            <div className="w-1.5 h-1.5 bg-blue-500 rounded-full mt-2 flex-shrink-0"></div>
            <span className="text-gray-700 leading-relaxed">{renderInlineMarkdown(listContent)}</span>
          </div>
        );
      }
      // Handle numbered lists
      else if (/^\d+\.\s/.test(line)) {
        const match = line.match(/^(\d+)\.\s(.+)$/);
        if (match) {
          const [, number, content] = match;
          elements.push(
            <div key={i} className="flex items-start space-x-3 mb-2">
              <span className="bg-blue-100 text-blue-800 text-xs font-medium px-2 py-1 rounded-full flex-shrink-0">
                {number}
              </span>
              <span className="text-gray-700 leading-relaxed">{renderInlineMarkdown(content)}</span>
            </div>
          );
        }
      }
      // Handle inline code
      else if (line.includes('`') && !line.startsWith('```')) {
        elements.push(
          <p key={i} className="text-gray-700 mb-4 leading-relaxed">
            {renderInlineMarkdown(line)}
          </p>
        );
      }
      // Handle bold text
      else if (line.includes('**')) {
        elements.push(
          <p key={i} className="text-gray-700 mb-4 leading-relaxed">
            {renderInlineMarkdown(line)}
          </p>
        );
      }
      // Handle empty lines
      else if (line.trim() === '') {
        elements.push(<div key={i} className="h-2"></div>);
      }
      // Handle regular paragraphs
      else if (line.trim()) {
        elements.push(
          <p key={i} className="text-gray-700 mb-4 leading-relaxed">
            {renderInlineMarkdown(line)}
          </p>
        );
      }
    }

    return elements;
  };

  const renderInlineMarkdown = (text: string): JSX.Element | string => {
    // Handle inline code
    if (text.includes('`')) {
      const parts = text.split('`');
      return (
        <>
          {parts.map((part, index) => 
            index % 2 === 0 ? (
              <span key={index}>{renderBoldText(part)}</span>
            ) : (
              <code key={index} className="bg-gray-100 text-gray-800 px-1.5 py-0.5 rounded text-sm font-mono">
                {part}
              </code>
            )
          )}
        </>
      );
    }

    return renderBoldText(text);
  };

  const renderBoldText = (text: string): JSX.Element | string => {
    if (text.includes('**')) {
      const parts = text.split('**');
      return (
        <>
          {parts.map((part, index) => 
            index % 2 === 0 ? (
              <span key={index}>{part}</span>
            ) : (
              <strong key={index} className="font-semibold text-gray-900">
                {part}
              </strong>
            )
          )}
        </>
      );
    }

    return text;
  };

  return (
    <div className="prose prose-blue max-w-none">
      {renderMarkdown(content)}
    </div>
  );
}; 