// RichTextViewer.jsx
import React from 'react';
import { 
  Editor, 
  EditorState, 
  convertFromRaw, 
  ContentState,
  RichUtils,
  CompositeDecorator 
} from 'draft-js';
import 'draft-js/dist/Draft.css';

// Link decorator component
const Link = (props) => {
  const {url} = props.contentState.getEntity(props.entityKey).getData();
  return (
    <a href={url} style={{
      color: '#2563eb',
      textDecoration: 'underline',
      cursor: 'pointer'
    }}>
      {props.children}
    </a>
  );
};

// Configureer de decorator voor links
const decorator = new CompositeDecorator([
  {
    strategy: (contentBlock, callback, contentState) => {
      contentBlock.findEntityRanges(
        (character) => {
          const entityKey = character.getEntity();
          return (
            entityKey !== null &&
            contentState.getEntity(entityKey).getType() === 'LINK'
          );
        },
        callback
      );
    },
    component: Link,
  },
]);

const RichTextViewer = ({ content }) => {
  const editorState = React.useMemo(() => {
    try {
      const contentState = convertFromRaw(JSON.parse(content));
      return EditorState.createWithContent(contentState, decorator);
    } catch {
      return EditorState.createWithContent(
        ContentState.createFromText(content),
        decorator
      );
    }
  }, [content]);

  const blockStyleFn = (contentBlock) => {
    const type = contentBlock.getType();
    if (type === 'unordered-list-item') {
      return 'list-item-style';
    }
    return '';
  };

  return (
    <div style={{ padding: '5px', minHeight: '24px' }}>
      <style>
        {`
          .list-item-style {
            margin-left: 20px;
            list-style-type: disc;
          }
          .DraftEditor-root {
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
          }
          .public-DraftStyleDefault-ul {
            list-style-type: disc;
            margin-left: 20px;
          }
          .public-DraftStyleDefault-unorderedListItem {
            margin: 4px 0;
          }
          a {
            color: #2563eb;
            text-decoration: underline;
            cursor: pointer;
          }
        `}
      </style>
      <Editor
        editorState={editorState}
        readOnly={true}
        onChange={() => {}}
        blockStyleFn={blockStyleFn}
      />
    </div>
  );
};

export default RichTextViewer;