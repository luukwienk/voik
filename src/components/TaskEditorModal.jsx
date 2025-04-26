import React from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Link from '@tiptap/extension-link';
import Image from '@tiptap/extension-image';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faBold, faItalic, faList, faLink, faImage, faCheck, faTimes } from '@fortawesome/free-solid-svg-icons';

const TaskEditorModal = ({ task, onClose, updateTaskList }) => {
  const [showURLInput, setShowURLInput] = React.useState(false);
  const [urlValue, setURLValue] = React.useState('');

  const editor = useEditor({
    extensions: [
      StarterKit,
      Link.configure({ openOnClick: true, linkOnPaste: true }),
      Image.configure({ inline: true, allowBase64: true }),
    ],
    content: typeof task.text === 'string' && task.text.includes('"blocks":') 
      ? convertDraftToHTML(task.text) 
      : task.text,
  });

  if (!editor) return null;

  const handleSave = () => {
    const html = editor.getHTML();
    const updatedTask = {
      ...task,
      text: html,
      list: task.list
    };
    console.log('Task in handleSave:', task);
    console.log('UpdatedTask in handleSave:', updatedTask);
    updateTaskList(updatedTask);
    onClose();
  };

  const addLink = (e) => {
    e.preventDefault();
    let url = urlValue;
    if (!/^https?:\/\//i.test(url)) {
      url = `https://${url}`;
    }
    if (editor.view.state.selection.empty) {
      const linkText = prompt("Voer de tekst in voor de link:", url);
      if (linkText) {
        editor.chain().focus().insertContent(`<a href=\"${url}\">${linkText}</a>`).run();
      }
    } else {
      editor.chain().focus().extendMarkRange('link').setLink({ href: url }).run();
    }
    setShowURLInput(false);
    setURLValue('');
  };

  const addImage = async () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.onchange = async () => {
      if (input.files?.length) {
        const file = input.files[0];
        const reader = new FileReader();
        reader.onload = () => {
          const result = reader.result;
          editor.chain().focus().setImage({ src: result }).run();
        };
        reader.readAsDataURL(file);
      }
    };
    input.click();
  };

  return (
    <div className="editor-modal-overlay">
      <div className="editor-modal">
        <div className="editor-toolbar">
          <button onClick={() => editor.chain().focus().toggleBold().run()} className="toolbar-button" title="Vet">
            <FontAwesomeIcon icon={faBold} />
          </button>
          <button onClick={() => editor.chain().focus().toggleItalic().run()} className="toolbar-button" title="Cursief">
            <FontAwesomeIcon icon={faItalic} />
          </button>
          <button onClick={() => editor.chain().focus().toggleBulletList().run()} className="toolbar-button" title="Opsomming">
            <FontAwesomeIcon icon={faList} />
          </button>
          <button onClick={() => setShowURLInput(!showURLInput)} className="toolbar-button" title="Link">
            <FontAwesomeIcon icon={faLink} />
          </button>
          <button onClick={addImage} className="toolbar-button" title="Afbeelding">
            <FontAwesomeIcon icon={faImage} />
          </button>
        </div>
        
        {showURLInput && (
          <div className="url-input-container">
            <input
              type="text"
              value={urlValue}
              onChange={(e) => setURLValue(e.target.value)}
              placeholder="Voer URL in..."
              className="url-input"
            />
            <button onClick={addLink} className="add-link-button">
              Link Toevoegen
            </button>
          </div>
        )}
        
        <div className="editor-content-container">
          <EditorContent editor={editor} className="editor-content" />
        </div>
        
        <div className="editor-actions">
          <button onClick={onClose} className="action-button cancel" title="Annuleren">
            <FontAwesomeIcon icon={faTimes} />
          </button>
          <button onClick={handleSave} className="action-button save" title="Opslaan">
            <FontAwesomeIcon icon={faCheck} />
          </button>
        </div>
      </div>
      
      <style jsx>{`
        .editor-modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background-color: rgba(0, 0, 0, 0.5);
          display: flex;
          justify-content: center;
          align-items: center;
          z-index: 1000;
        }
        
        .editor-modal {
          background-color: white;
          border-radius: 8px;
          max-width: 600px;
          width: 95%;
          max-height: 80vh;
          display: flex;
          flex-direction: column;
          box-shadow: 0 5px 20px rgba(0, 0, 0, 0.2);
          overflow: hidden;
        }
        
        .editor-toolbar {
          display: flex;
          gap: 5px;
          padding: 12px 16px;
          background-color: white;
          border-bottom: 1px solid #eee;
        }
        
        .toolbar-button {
          padding: 6px 10px;
          border: 1px solid #ddd;
          border-radius: 4px;
          background-color: white;
          cursor: pointer;
          transition: all 0.2s;
        }
        
        .toolbar-button:hover {
          background-color: #f0f0f0;
        }
        
        .url-input-container {
          padding: 8px 16px;
          background-color: white;
          border-bottom: 1px solid #eee;
          display: flex;
          flex-direction: column;
          gap: 8px;
        }
        
        .url-input {
          padding: 8px;
          border-radius: 4px;
          border: 1px solid #ddd;
          width: 100%;
        }
        
        .add-link-button {
          padding: 6px 12px;
          background-color: #4CAF50;
          color: white;
          border: none;
          border-radius: 4px;
          cursor: pointer;
          align-self: flex-start;
        }
        
        .editor-content-container {
          flex-grow: 1;
          min-height: 200px;
          overflow: auto;
          background-color: white;
        }
        
        .editor-content {
          height: 100%;
          outline: none;
        }
        
        .editor-content .ProseMirror {
          height: 100%;
          min-height: 200px;
          outline: none;
          padding: 16px;
        }
        
        .editor-actions {
          display: flex;
          justify-content: flex-end;
          gap: 10px;
          padding: 12px 16px;
          background-color: white;
          border-top: 1px solid #eee;
        }
        
        .action-button {
          background: none;
          border: none;
          font-size: 18px;
          padding: 8px;
          border-radius: 50%;
          cursor: pointer;
          width: 40px;
          height: 40px;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: background 0.2s;
        }
        
        .action-button:hover {
          background-color: #f0f0f0;
        }
        
        .action-button.cancel {
          color: #888;
        }
        
        .action-button.save {
          color: #2196F3;
        }
        
        /* Aanpassing voor dark mode */
        @media (prefers-color-scheme: dark) {
          .editor-modal {
            background-color: #1e1e1e;
            color: #fff;
          }
          
          .editor-toolbar {
            background-color: #1e1e1e;
            border-bottom: 1px solid #444;
          }
          
          .toolbar-button {
            background-color: #333;
            border-color: #555;
            color: #fff;
          }
          
          .toolbar-button:hover {
            background-color: #444;
          }
          
          .url-input-container {
            background-color: #1e1e1e;
            border-bottom: 1px solid #444;
          }
          
          .url-input {
            background-color: #333;
            border-color: #555;
            color: #fff;
          }
          
          .editor-content-container {
            background-color: #1e1e1e;
          }
          
          .editor-content .ProseMirror {
            color: #fff;
          }
          
          .editor-actions {
            background-color: #1e1e1e;
            border-top: 1px solid #444;
          }
          
          .action-button:hover {
            background-color: #444;
          }
          
          .action-button.cancel {
            color: #bbb;
          }
        }
      `}</style>
    </div>
  );
};

function convertDraftToHTML(draftString) {
  try {
    const draft = JSON.parse(draftString);
    if (draft.blocks && Array.isArray(draft.blocks)) {
      return draft.blocks.map(block => block.text).join('<br>');
    }
    return '';
  } catch (e) {
    return draftString;
  }
}

export default TaskEditorModal;