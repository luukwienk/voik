import React, { useState } from 'react';
import { 
  Editor, 
  EditorState, 
  RichUtils, 
  convertToRaw, 
  convertFromRaw, 
  ContentState,
  Modifier
} from 'draft-js';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faCheck, 
  faTimes, 
  faBold, 
  faItalic, 
  faUnderline, 
  faLink,
  faList
} from '@fortawesome/free-solid-svg-icons';
import 'draft-js/dist/Draft.css';

const EditTask = ({ task, onSave, onCancel }) => {
  const [editorState, setEditorState] = useState(() => {
    try {
      const contentState = convertFromRaw(JSON.parse(task.text));
      return EditorState.createWithContent(contentState);
    } catch {
      return EditorState.createWithContent(ContentState.createFromText(task.text));
    }
  });
  
  const [showURLInput, setShowURLInput] = useState(false);
  const [urlValue, setURLValue] = useState('');

  const handleKeyCommand = (command) => {
    const newState = RichUtils.handleKeyCommand(editorState, command);
    if (newState) {
      setEditorState(newState);
      return 'handled';
    }
    return 'not-handled';
  };

  const onBulletPointClick = () => {
    const newState = RichUtils.toggleBlockType(
      editorState,
      'unordered-list-item'
    );
    setEditorState(newState);
  };

  const handleSave = () => {
    const contentState = editorState.getCurrentContent();
    const rawContent = convertToRaw(contentState);
    onSave(JSON.stringify(rawContent));
  };

  const toggleInlineStyle = (style) => {
    setEditorState(RichUtils.toggleInlineStyle(editorState, style));
  };

  const addLink = (e) => {
    e.preventDefault();
    
    let url = urlValue;
    if (!/^https?:\/\//i.test(url)) {
      url = `https://${url}`;
    }

    const selection = editorState.getSelection();
    const contentState = editorState.getCurrentContent();
    
    if (selection.isCollapsed()) {
      const contentStateWithText = Modifier.insertText(
        contentState,
        selection,
        url
      );
      const newEditorState = EditorState.push(
        editorState,
        contentStateWithText,
        'insert-characters'
      );
      setEditorState(newEditorState);
      
      const newSelection = newEditorState.getSelection();
      const contentStateWithLink = contentStateWithText.createEntity(
        'LINK',
        'MUTABLE',
        { url }
      );
      const entityKey = contentStateWithLink.getLastCreatedEntityKey();
      
      const contentStateWithLinkApplied = Modifier.applyEntity(
        contentStateWithLink,
        newSelection.merge({
          anchorOffset: selection.getAnchorOffset(),
          focusOffset: selection.getAnchorOffset() + url.length,
        }),
        entityKey
      );
      
      setEditorState(
        EditorState.push(
          newEditorState,
          contentStateWithLinkApplied,
          'apply-entity'
        )
      );
    } else {
      const contentStateWithLink = contentState.createEntity(
        'LINK',
        'MUTABLE',
        { url }
      );
      const entityKey = contentStateWithLink.getLastCreatedEntityKey();
      setEditorState(RichUtils.toggleLink(editorState, selection, entityKey));
    }
    
    setShowURLInput(false);
    setURLValue('');
  };

  return (
    <div className="edit-task-container" style={{ padding: '10px', width: '100%' }}>
      <style>
        {`
          .DraftEditor-root {
            min-height: 120px;
            cursor: text !important;
          }
          .DraftEditor-editorContainer {
            min-height: 120px;
            padding: 8px;
          }
          .public-DraftEditor-content {
            min-height: 120px;
          }
          .custom-list-item {
            margin-left: 20px;
          }
          .public-DraftStyleDefault-unorderedListItem {
            margin: 4px 0;
          }
          .public-DraftStyleDefault-unorderedListItem:before {
            content: "•";
            position: absolute;
            left: -20px;
          }
        `}
      </style>
      
      <div className="toolbar" style={{ marginBottom: '10px', display: 'flex', gap: '5px' }}>
        <button onClick={() => toggleInlineStyle('BOLD')} style={toolbarButtonStyle}>
          <FontAwesomeIcon icon={faBold} />
        </button>
        <button onClick={() => toggleInlineStyle('ITALIC')} style={toolbarButtonStyle}>
          <FontAwesomeIcon icon={faItalic} />
        </button>
        <button onClick={() => toggleInlineStyle('UNDERLINE')} style={toolbarButtonStyle}>
          <FontAwesomeIcon icon={faUnderline} />
        </button>
        <button onClick={onBulletPointClick} style={toolbarButtonStyle}>
          <FontAwesomeIcon icon={faList} />
        </button>
        <button onClick={() => setShowURLInput(!showURLInput)} style={toolbarButtonStyle}>
          <FontAwesomeIcon icon={faLink} />
        </button>
      </div>

      {showURLInput && (
        <div style={{ marginBottom: '10px' }}>
          <input
            type="text"
            value={urlValue}
            onChange={(e) => setURLValue(e.target.value)}
            placeholder="Voer URL in..."
            style={urlInputStyle}
          />
          <button onClick={addLink} style={addLinkButtonStyle}>
            Link Toevoegen
          </button>
        </div>
      )}

      <div style={{ 
        border: '1px solid #ddd', 
        borderRadius: '4px', 
        padding: '10px', 
        marginBottom: '10px',
        backgroundColor: 'white',
        minHeight: '120px'
      }}>
        <Editor
          editorState={editorState}
          onChange={setEditorState}
          handleKeyCommand={handleKeyCommand}
        />
      </div>

      <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
        <button onClick={handleSave} style={saveButtonStyle}>
          <FontAwesomeIcon icon={faCheck} />
        </button>
        <button onClick={onCancel} style={cancelButtonStyle}>
          <FontAwesomeIcon icon={faTimes} />
        </button>
      </div>
    </div>
  );
};

const toolbarButtonStyle = {
  padding: '5px 10px',
  border: '1px solid #ddd',
  borderRadius: '4px',
  background: 'white',
  cursor: 'pointer'
};

const urlInputStyle = {
  width: '100%',
  padding: '5px',
  marginBottom: '5px',
  borderRadius: '4px',
  border: '1px solid #ddd'
};

const addLinkButtonStyle = {
  padding: '5px 10px',
  background: '#4CAF50',
  color: 'white',
  border: 'none',
  borderRadius: '4px',
  cursor: 'pointer'
};

const saveButtonStyle = {
  padding: '5px 10px',
  background: '#4CAF50',
  color: 'white',
  border: 'none',
  borderRadius: '4px',
  cursor: 'pointer'
};

const cancelButtonStyle = {
  padding: '5px 10px',
  background: 'black',
  color: 'white',
  border: 'none',
  borderRadius: '4px',
  cursor: 'pointer'
};

export default EditTask;