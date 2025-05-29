import { EditorCommand, EditorState } from './types';

export class EditorUtils {
  /**
   * Ejecuta un comando del editor
   */
  static executeCommand(command: EditorCommand): boolean {
    try {
      return document.execCommand(command.command, command.showUI || false, command.value);
    } catch (error) {
      console.error('Error executing editor command:', error);
      return false;
    }
  }

  /**
   * Obtiene el estado actual del editor
   */
  static getEditorState(): EditorState {
    return {
      canUndo: document.queryCommandEnabled('undo'),
      canRedo: document.queryCommandEnabled('redo'),
      isBold: document.queryCommandState('bold'),
      isItalic: document.queryCommandState('italic'),
      isUnderline: document.queryCommandState('underline'),
      isStrikethrough: document.queryCommandState('strikethrough'),
      fontSize: document.queryCommandValue('fontSize') || '3',
      fontColor: document.queryCommandValue('foreColor') || '#000000',
      backgroundColor: document.queryCommandValue('backColor') || 'transparent',
      alignment: this.getCurrentAlignment(),
      currentTag: this.getCurrentTag(),
    };
  }

  /**
   * Obtiene la alineación actual
   */
  private static getCurrentAlignment(): string {
    if (document.queryCommandState('justifyLeft')) return 'left';
    if (document.queryCommandState('justifyCenter')) return 'center';
    if (document.queryCommandState('justifyRight')) return 'right';
    if (document.queryCommandState('justifyFull')) return 'justify';
    return 'left';
  }

  /**
   * Obtiene el tag actual del elemento seleccionado
   */
  private static getCurrentTag(): string {
    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0) return 'p';
    
    const range = selection.getRangeAt(0);
    let element = range.commonAncestorContainer;
    
    if (element.nodeType === Node.TEXT_NODE) {
      element = element.parentElement!;
    }
    
    // Buscar el elemento de bloque más cercano
    while (element && element !== document.body) {
      const tagName = (element as Element).tagName?.toLowerCase();
      if (['h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'p', 'div'].includes(tagName)) {
        return tagName === 'div' ? 'p' : tagName;
      }
      element = element.parentElement!;
    }
    
    return 'p';
  }

  /**
   * Inserta HTML en la posición del cursor
   */
  static insertHTML(html: string): void {
    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0) return;

    const range = selection.getRangeAt(0);
    range.deleteContents();

    const div = document.createElement('div');
    div.innerHTML = html;
    
    const fragment = document.createDocumentFragment();
    let node;
    while ((node = div.firstChild)) {
      fragment.appendChild(node);
    }
    
    range.insertNode(fragment);
    
    // Mover el cursor al final del contenido insertado
    range.collapse(false);
    selection.removeAllRanges();
    selection.addRange(range);
  }

  /**
   * Obtiene el texto seleccionado
   */
  static getSelectedText(): string {
    const selection = window.getSelection();
    return selection ? selection.toString() : '';
  }

  /**
   * Selecciona todo el contenido del editor
   */
  static selectAll(element: HTMLElement): void {
    const range = document.createRange();
    range.selectNodeContents(element);
    const selection = window.getSelection();
    if (selection) {
      selection.removeAllRanges();
      selection.addRange(range);
    }
  }

  /**
   * Limpia el formato del texto seleccionado
   */
  static clearFormatting(): void {
    this.executeCommand({ command: 'removeFormat' });
    this.executeCommand({ command: 'unlink' });
  }

  /**
   * Inserta un enlace
   */
  static insertLink(url: string, text?: string): void {
    const selectedText = this.getSelectedText();
    const linkText = text || selectedText || url;
    
    if (selectedText) {
      this.executeCommand({ command: 'createLink', value: url });
    } else {
      const linkHTML = `<a href="${url}" target="_blank">${linkText}</a>`;
      this.insertHTML(linkHTML);
    }
  }

  /**
   * Elimina un enlace
   */
  static removeLink(): void {
    this.executeCommand({ command: 'unlink' });
  }

  /**
   * Cambia el formato de encabezado
   */
  static formatHeading(tag: string): void {
    this.executeCommand({ command: 'formatBlock', value: tag });
  }

  /**
   * Aplica color de texto
   */
  static applyTextColor(color: string): void {
    this.executeCommand({ command: 'foreColor', value: color });
  }

  /**
   * Aplica color de fondo
   */
  static applyBackgroundColor(color: string): void {
    if (color === 'transparent') {
      // Para color transparente, removemos el color de fondo
      this.executeCommand({ command: 'removeFormat' });
    } else {
      this.executeCommand({ command: 'backColor', value: color });
    }
  }

  /**
   * Aplica tamaño de fuente
   */
  static applyFontSize(size: string): void {
    this.executeCommand({ command: 'fontSize', value: size });
  }

  /**
   * Cuenta palabras en el texto
   */
  static countWords(text: string): number {
    return text.trim().split(/\s+/).filter(word => word.length > 0).length;
  }

  /**
   * Cuenta caracteres en el texto
   */
  static countCharacters(text: string): number {
    return text.length;
  }

  /**
   * Limpia HTML manteniendo solo tags seguros
   */
  static sanitizeHTML(html: string): string {
    const allowedTags = [
      'p', 'br', 'strong', 'b', 'em', 'i', 'u', 's', 'strike',
      'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
      'ul', 'ol', 'li',
      'a', 'span', 'div',
      'blockquote', 'code', 'pre'
    ];
    
    const allowedAttributes = ['href', 'target', 'style', 'class'];
    
    // Crear un elemento temporal para parsear el HTML
    const temp = document.createElement('div');
    temp.innerHTML = html;
    
    // Función recursiva para limpiar elementos
    const cleanElement = (element: Element): void => {
      const tagName = element.tagName.toLowerCase();
      
      // Si el tag no está permitido, reemplazar con span
      if (!allowedTags.includes(tagName)) {
        const span = document.createElement('span');
        span.innerHTML = element.innerHTML;
        element.parentNode?.replaceChild(span, element);
        return;
      }
      
      // Limpiar atributos
      const attributes = Array.from(element.attributes);
      attributes.forEach(attr => {
        if (!allowedAttributes.includes(attr.name)) {
          element.removeAttribute(attr.name);
        }
      });
      
      // Limpiar hijos recursivamente
      Array.from(element.children).forEach(child => {
        cleanElement(child);
      });
    };
    
    Array.from(temp.children).forEach(child => {
      cleanElement(child);
    });
    
    return temp.innerHTML;
  }

  /**
   * Convierte texto plano a HTML
   */
  static textToHTML(text: string): string {
    return text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;')
      .replace(/\n/g, '<br>');
  }

  /**
   * Convierte HTML a texto plano
   */
  static htmlToText(html: string): string {
    const temp = document.createElement('div');
    temp.innerHTML = html;
    return temp.textContent || temp.innerText || '';
  }

  /**
   * Verifica si el navegador soporta contentEditable
   */
  static isContentEditableSupported(): boolean {
    return 'contentEditable' in document.createElement('div');
  }

  /**
   * Verifica si el navegador soporta execCommand
   */
  static isExecCommandSupported(command: string): boolean {
    return document.queryCommandSupported(command);
  }

  /**
   * Restaura la selección guardada
   */
  static saveSelection(): Range | null {
    const selection = window.getSelection();
    if (selection && selection.rangeCount > 0) {
      return selection.getRangeAt(0).cloneRange();
    }
    return null;
  }

  /**
   * Restaura una selección guardada
   */
  static restoreSelection(range: Range): void {
    const selection = window.getSelection();
    if (selection) {
      selection.removeAllRanges();
      selection.addRange(range);
    }
  }
} 