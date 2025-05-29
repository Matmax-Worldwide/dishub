'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { RichTextEditorProps, EditorState } from './types';
import { TOOLBAR_CONFIGS, KEYBOARD_SHORTCUTS, DEFAULT_STYLES } from './constants';
import { EditorUtils } from './utils';
import { Toolbar } from './Toolbar';

export const RichTextEditor: React.FC<RichTextEditorProps> = ({
  value,
  onChange,
  placeholder = 'Escribe aquí...',
  className,
  disabled = false,
  maxLength,
  showWordCount = false,
  toolbar = 'full',
  height = '300px',
  autoFocus = false,
  onFocus,
  onBlur
}) => {
  const [editorState, setEditorState] = useState<EditorState>({
    canUndo: false,
    canRedo: false,
    isBold: false,
    isItalic: false,
    isUnderline: false,
    isStrikethrough: false,
    fontSize: '3',
    fontColor: '#000000',
    backgroundColor: 'transparent',
    alignment: 'left',
    currentTag: 'p',
  });

  const [showCodeView, setShowCodeView] = useState(false);
  const [codeValue, setCodeValue] = useState(value);
  const [isFocused, setIsFocused] = useState(false);
  const [wordCount, setWordCount] = useState(0);
  const [charCount, setCharCount] = useState(0);

  const editorRef = useRef<HTMLDivElement>(null);
  const codeEditorRef = useRef<HTMLTextAreaElement>(null);
  const updateTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const savedSelectionRef = useRef<Range | null>(null);

  // Configuración de la barra de herramientas
  const toolbarConfig = TOOLBAR_CONFIGS[toolbar] || TOOLBAR_CONFIGS.full;

  // Actualizar el estado del editor
  const updateEditorState = useCallback(() => {
    if (showCodeView || !editorRef.current) return;
    
    try {
      // Solo actualizar estado si hay una selección activa o el editor tiene foco
      const selection = window.getSelection();
      if (!selection || selection.rangeCount === 0) {
        return; // No actualizar estado si no hay selección
      }
      
      const newState = EditorUtils.getEditorState();
      setEditorState(newState);
    } catch (error) {
      console.warn('Error updating editor state:', error);
    }
  }, [showCodeView]);

  // Manejar cambios en el contenido
  const handleContentChange = useCallback(() => {
    if (!editorRef.current || showCodeView) return;

    const content = editorRef.current.innerHTML;
    const sanitizedContent = EditorUtils.sanitizeHTML(content);
    
    // Actualizar contadores
    const textContent = EditorUtils.htmlToText(sanitizedContent);
    setWordCount(EditorUtils.countWords(textContent));
    setCharCount(EditorUtils.countCharacters(textContent));

    // Verificar límite de caracteres
    if (maxLength && textContent.length > maxLength) {
      return;
    }

    // Debounce más largo para evitar actualizaciones excesivas
    if (updateTimeoutRef.current) {
      clearTimeout(updateTimeoutRef.current);
    }

    updateTimeoutRef.current = setTimeout(() => {
      onChange(sanitizedContent);
    }, 800); // Aumentado de 500ms a 800ms
  }, [onChange, maxLength, showCodeView]);

  // Manejar comandos de la barra de herramientas
  const handleCommand = useCallback((command: string, value?: string) => {
    if (showCodeView || !editorRef.current) return;

    // Asegurar que el editor tenga foco
    editorRef.current.focus();

    // Restaurar selección si existe
    if (savedSelectionRef.current) {
      EditorUtils.restoreSelection(savedSelectionRef.current);
    }

    // Verificar que hay una selección válida para comandos de formato
    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0) {
      // Para comandos que no requieren selección (como headings), crear una selección al final
      if (['formatBlock'].includes(command)) {
        const range = document.createRange();
        range.selectNodeContents(editorRef.current);
        range.collapse(false);
        if (selection) {
          selection.removeAllRanges();
          selection.addRange(range);
        }
      } else {
        return; // No ejecutar comandos de formato sin selección
      }
    }

    // Ejecutar comando
    try {
      switch (command) {
        case 'formatBlock':
          EditorUtils.formatHeading(value || 'p');
          break;
        case 'fontSize':
          EditorUtils.applyFontSize(value || '3');
          break;
        case 'foreColor':
          EditorUtils.applyTextColor(value || '#000000');
          break;
        case 'backColor':
          EditorUtils.applyBackgroundColor(value || 'transparent');
          break;
        case 'removeFormat':
          EditorUtils.clearFormatting();
          break;
        default:
          EditorUtils.executeCommand({ command, value });
      }
    } catch (error) {
      console.warn('Error executing command:', command, error);
    }

    // Actualizar estado y contenido inmediatamente para comandos de toolbar
    setTimeout(() => {
      updateEditorState();
      // Forzar guardado inmediato para comandos de toolbar
      const content = editorRef.current?.innerHTML || '';
      const sanitizedContent = EditorUtils.sanitizeHTML(content);
      onChange(sanitizedContent);
    }, 100); // Reducido de 50ms a 100ms para mejor estabilidad
  }, [showCodeView, updateEditorState, onChange]);

  // Manejar atajos de teclado
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    const key = `${e.ctrlKey ? 'Ctrl+' : ''}${e.shiftKey ? 'Shift+' : ''}${e.key}`;
    const command = KEYBOARD_SHORTCUTS[key as keyof typeof KEYBOARD_SHORTCUTS];
    
    if (command) {
      e.preventDefault();
      handleCommand(command);
    }

    // Verificar límite de caracteres
    if (maxLength && !e.ctrlKey && !e.metaKey) {
      const textContent = EditorUtils.htmlToText(editorRef.current?.innerHTML || '');
      if (textContent.length >= maxLength && !['Backspace', 'Delete', 'ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].includes(e.key)) {
        e.preventDefault();
      }
    }
  }, [handleCommand, maxLength]);

  // Manejar pegado
  const handlePaste = useCallback((e: React.ClipboardEvent) => {
    e.preventDefault();
    
    const clipboardData = e.clipboardData;
    const htmlData = clipboardData.getData('text/html');
    const textData = clipboardData.getData('text/plain');
    
    let content = htmlData || EditorUtils.textToHTML(textData);
    content = EditorUtils.sanitizeHTML(content);
    
    // Verificar límite de caracteres
    if (maxLength) {
      const currentText = EditorUtils.htmlToText(editorRef.current?.innerHTML || '');
      const pasteText = EditorUtils.htmlToText(content);
      
      if (currentText.length + pasteText.length > maxLength) {
        const remainingChars = maxLength - currentText.length;
        const truncatedText = pasteText.substring(0, remainingChars);
        content = EditorUtils.textToHTML(truncatedText);
      }
    }
    
    EditorUtils.insertHTML(content);
    handleContentChange();
  }, [maxLength, handleContentChange]);

  // Manejar foco
  const handleFocus = useCallback(() => {
    setIsFocused(true);
    // No actualizar estado inmediatamente al hacer foco
    onFocus?.();
  }, [onFocus]);

  // Manejar pérdida de foco
  const handleBlur = useCallback(() => {
    setIsFocused(false);
    savedSelectionRef.current = EditorUtils.saveSelection();
    onBlur?.();
  }, [onBlur]);

  // Manejar selección de texto - simplificado
  const handleSelectionChange = useCallback(() => {
    if (showCodeView || !editorRef.current || !isFocused) return;
    
    // Solo actualizar estado, no contenido
    updateEditorState();
  }, [showCodeView, isFocused, updateEditorState]);

  // Event listener para cambios de selección
  useEffect(() => {
    const handleDocumentSelectionChange = () => {
      if (isFocused && editorRef.current && document.activeElement === editorRef.current) {
        handleSelectionChange();
      }
    };

    document.addEventListener('selectionchange', handleDocumentSelectionChange);
    
    return () => {
      document.removeEventListener('selectionchange', handleDocumentSelectionChange);
    };
  }, [handleSelectionChange, isFocused]);

  // Alternar vista de código
  const toggleCodeView = useCallback(() => {
    if (showCodeView) {
      // Cambiar de código a visual
      const sanitizedHTML = EditorUtils.sanitizeHTML(codeValue);
      if (editorRef.current) {
        editorRef.current.innerHTML = sanitizedHTML;
      }
      onChange(sanitizedHTML);
      setShowCodeView(false);
      
      // Enfocar el editor visual
      setTimeout(() => {
        if (editorRef.current) {
          editorRef.current.focus();
        }
      }, 100);
    } else {
      // Cambiar de visual a código
      const currentHTML = editorRef.current?.innerHTML || '';
      setCodeValue(currentHTML);
      setShowCodeView(true);
      
      // Enfocar el editor de código
      setTimeout(() => {
        if (codeEditorRef.current) {
          codeEditorRef.current.focus();
        }
      }, 100);
    }
  }, [showCodeView, codeValue, onChange]);

  // Manejar cambios en el editor de código
  const handleCodeChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newValue = e.target.value;
    setCodeValue(newValue);
    
    // Debounce para evitar actualizaciones excesivas
    if (updateTimeoutRef.current) {
      clearTimeout(updateTimeoutRef.current);
    }

    updateTimeoutRef.current = setTimeout(() => {
      onChange(newValue);
    }, 500);
  }, [onChange]);

  // Inicializar contenido
  useEffect(() => {
    if (editorRef.current && !showCodeView) {
      editorRef.current.innerHTML = value;
      
      // Actualizar contadores
      const textContent = EditorUtils.htmlToText(value);
      setWordCount(EditorUtils.countWords(textContent));
      setCharCount(EditorUtils.countCharacters(textContent));
    }
  }, [value, showCodeView]);

  // Auto-focus
  useEffect(() => {
    if (autoFocus && editorRef.current && !showCodeView) {
      editorRef.current.focus();
    }
  }, [autoFocus, showCodeView]);

  // Limpiar timeouts
  useEffect(() => {
    return () => {
      if (updateTimeoutRef.current) {
        clearTimeout(updateTimeoutRef.current);
      }
    };
  }, []);

  // Inyectar estilos CSS
  useEffect(() => {
    const styleId = 'rich-text-editor-styles';
    let styleElement = document.getElementById(styleId) as HTMLStyleElement;
    
    if (!styleElement) {
      styleElement = document.createElement('style');
      styleElement.id = styleId;
      styleElement.textContent = DEFAULT_STYLES;
      document.head.appendChild(styleElement);
    }
    
    return () => {
      // No remover estilos al desmontar para evitar parpadeos
    };
  }, []);

  return (
    <div className={cn("rich-text-editor border border-gray-300 rounded-lg overflow-hidden bg-white", className)}>
      {/* Barra de herramientas */}
      <Toolbar
        config={toolbarConfig}
        editorState={editorState}
        onCommand={handleCommand}
        onStateChange={updateEditorState}
        disabled={disabled}
      />

      {/* Área de edición */}
      <div className="relative">
        <AnimatePresence mode="wait">
          {showCodeView ? (
            // Editor de código HTML
            <motion.div
              key="code-editor"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
            >
              <textarea
                ref={codeEditorRef}
                value={codeValue}
                onChange={handleCodeChange}
                disabled={disabled}
                placeholder="Código HTML..."
                className={cn(
                  "w-full p-3 font-mono text-sm border-0 resize-none focus:outline-none",
                  "bg-gray-50 text-gray-800"
                )}
                style={{ height }}
                spellCheck={false}
              />
            </motion.div>
          ) : (
            // Editor visual
            <motion.div
              key="visual-editor"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
            >
              <div
                ref={editorRef}
                contentEditable={!disabled}
                suppressContentEditableWarning
                onInput={handleContentChange}
                onKeyDown={handleKeyDown}
                onPaste={handlePaste}
                onFocus={handleFocus}
                onBlur={handleBlur}
                className={cn(
                  "rich-text-editor-content focus:outline-none",
                  disabled && "opacity-50 cursor-not-allowed",
                  isFocused && "ring-2 ring-blue-500 ring-opacity-20"
                )}
                style={{ 
                  height,
                  minHeight: height 
                }}
                data-placeholder={placeholder}
              />
              
              {/* Placeholder personalizado */}
              {!value && !isFocused && (
                <div 
                  className="absolute top-3 left-3 text-gray-400 pointer-events-none select-none"
                  style={{ fontSize: '16px' }}
                >
                  {placeholder}
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Barra de estado */}
      {(showWordCount || maxLength) && (
        <div className="flex justify-between items-center px-3 py-2 bg-gray-50 border-t border-gray-200 text-xs text-gray-600">
          <div className="flex space-x-4">
            {showWordCount && (
              <>
                <span>{wordCount} palabras</span>
                <span>{charCount} caracteres</span>
              </>
            )}
          </div>
          
          {maxLength && (
            <div className={cn(
              "font-medium",
              charCount > maxLength * 0.9 && "text-orange-600",
              charCount >= maxLength && "text-red-600"
            )}>
              {charCount}/{maxLength}
            </div>
          )}
        </div>
      )}

      {/* Botón para alternar vista de código */}
      {toolbarConfig.advanced && (
        <button
          onClick={toggleCodeView}
          disabled={disabled}
          className={cn(
            "absolute top-2 right-2 p-1 rounded text-xs bg-white border border-gray-300 hover:bg-gray-50 transition-colors",
            showCodeView && "bg-blue-100 text-blue-600 border-blue-300"
          )}
          title={showCodeView ? "Vista visual" : "Vista código"}
        >
          {showCodeView ? "Visual" : "HTML"}
        </button>
      )}
    </div>
  );
};

export default RichTextEditor; 