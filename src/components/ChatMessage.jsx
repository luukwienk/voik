import React, { useEffect, useState, useMemo } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Link from '@tiptap/extension-link';
import { marked } from 'marked';

// Maak een gecachte versie van marked
const cachedMarked = (() => {
  const cache = new Map();
  
  return (text) => {
    if (!text) return '';
    if (cache.has(text)) return cache.get(text);
    
    const result = marked(text);
    cache.set(text, result);
    return result;
  };
})();

const ChatMessage = ({ message, isUser }) => {
  // Gebruik een memo voor het HTML-resultaat om onnodige herberekeningen te voorkomen
  const htmlContent = useMemo(() => 
    !isUser ? cachedMarked(message) : null
  , [message, isUser]);
  
  // Configureer editor extensies één keer
  const extensions = useMemo(() => [
    StarterKit.configure({
      codeBlock: {
        HTMLAttributes: {
          class: 'chat-code-block',
        },
      },
    }),
    Link.configure({
      openOnClick: true,
      HTMLAttributes: {
        class: 'chat-message-link',
      },
    }),
  ], []);
  
  // Alleen voor AI-berichten een editor maken
  const editor = useEditor({
    extensions,
    content: isUser ? '' : htmlContent,
    editable: false,
  }, [isUser, message]);
  
  // Update de editor inhoud alleen wanneer nodig
  useEffect(() => {
    if (editor && !isUser && htmlContent) {
      editor.commands.setContent(htmlContent);
    }
  }, [editor, htmlContent, isUser]);

  return (
    <div className={`chat-message ${isUser ? 'user-message' : 'ai-message'}`}>
      <div className="message-avatar">
        {isUser ? 
          <div className="user-avatar">U</div> : 
          <div className="ai-avatar" style={{ color: '#222', fontSize: '22px', background: 'none', backgroundColor: 'transparent' }}>•</div>
        }
      </div>
      <div className="message-content">
        {isUser ? (
          // Voor gebruikersberichten gewoon tekst tonen
          <div className="message-text">{message}</div>
        ) : (
          // Voor AI-berichten TipTap gebruiken
          <div className="tiptap-message-container">
            {editor && <EditorContent editor={editor} />}
          </div>
        )}
      </div>
      
      <style jsx>{`
        .chat-message {
          display: flex;
          margin-bottom: 16px;
          align-items: flex-start;
        }
        
        .user-message {
          flex-direction: row-reverse;
        }
        
        .message-avatar {
          flex-shrink: 0;
          width: 36px;
          height: 36px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: bold;
          margin: 0 8px;
        }
        
        .user-avatar {
          background-color: #f0f0f0;
          color: #333;
        }
        
        .ai-avatar {
          background-color: #222;
          color: white;
        }
        
        .message-content {
          max-width: 70%;
          padding: 12px 16px;
          border-radius: 18px;
          box-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
        }
        
        .user-message .message-content {
          background-color: #222;
          color: white;
          border-top-right-radius: 4px;
        }
        
        .ai-message .message-content {
          background-color: #f0f0f0;
          color: #222;
          border-top-left-radius: 4px;
        }
        
        .message-text {
          font-size: 14px;
          line-height: 1.4;
          white-space: pre-wrap;
          word-break: break-word;
        }
        
        /* TipTap-specifieke stijlen */
        :global(.tiptap-message-container .ProseMirror) {
          outline: none;
          font-size: 14px;
          line-height: 1.4;
          white-space: pre-wrap;
          word-break: break-word;
        }
        
        :global(.tiptap-message-container .ProseMirror p) {
          margin: 0 0 8px 0;
        }
        
        :global(.tiptap-message-container .ProseMirror h1) {
          font-size: 1.5em;
          margin: 12px 0 8px 0;
          font-weight: bold;
        }
        
        :global(.tiptap-message-container .ProseMirror h2) {
          font-size: 1.3em;
          margin: 10px 0 6px 0;
          font-weight: bold;
        }
        
        :global(.tiptap-message-container .ProseMirror h3) {
          font-size: 1.1em;
          margin: 8px 0 4px 0;
          font-weight: bold;
        }
        
        :global(.tiptap-message-container .ProseMirror ul),
        :global(.tiptap-message-container .ProseMirror ol) {
          margin: 8px 0;
          padding-left: 20px;
        }
        
        :global(.tiptap-message-container .ProseMirror blockquote) {
          border-left: 3px solid #ddd;
          padding-left: 10px;
          margin: 8px 0 8px 10px;
          color: #555;
          font-style: italic;
        }
        
        :global(.tiptap-message-container .ProseMirror code) {
          background-color: #f0f0f0;
          padding: 2px 4px;
          border-radius: 3px;
          font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', 'Consolas', 'source-code-pro', monospace;
          font-size: 0.9em;
        }
        
        :global(.tiptap-message-container .ProseMirror pre) {
          background-color: #f5f5f5;
          padding: 8px 12px;
          border-radius: 4px;
          overflow-x: auto;
          margin: 8px 0;
        }
        
        :global(.chat-code-block) {
          background-color: #f5f5f5;
          padding: 8px 12px;
          border-radius: 4px;
          overflow-x: auto;
          margin: 8px 0;
          font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', 'Consolas', 'source-code-pro', monospace;
          font-size: 0.9em;
        }
        
        :global(.chat-message-link) {
          color: #2196F3;
          text-decoration: none;
        }
        
        :global(.chat-message-link:hover) {
          text-decoration: underline;
        }
        
        /* Dark mode styling verbeteringen */
        @media (prefers-color-scheme: dark) {
          .user-avatar {
            background-color: #444;
            color: #fff;
          }
          
          .ai-avatar {
            background-color: #222;
            color: #fff;
          }
          
          .user-message .message-content {
            background-color: #444;
            color: #fff;
          }
          
          .ai-message .message-content {
            background-color: #222;
            color: #eee;
          }
          
          :global(.tiptap-message-container .ProseMirror code) {
            background-color: #333;
            color: #e0e0e0;
          }
          
          :global(.tiptap-message-container .ProseMirror pre) {
            background-color: #333;
            color: #e0e0e0;
          }
          
          :global(.chat-code-block) {
            background-color: #333;
            color: #e0e0e0;
            border: 1px solid #444;
          }
          
          :global(.tiptap-message-container .ProseMirror blockquote) {
            border-left-color: #555;
            color: #aaa;
          }
          
          :global(.chat-message-link) {
            color: #64b5f6;
          }
        }
      `}</style>
    </div>
  );
};

export default ChatMessage;