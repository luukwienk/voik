import React, { useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCheck, faTimes } from '@fortawesome/free-solid-svg-icons';

const EditTask = ({ task, onSave, onCancel }) => {
  const [newText, setNewText] = useState(task.text);

  const handleSave = () => {
    onSave(newText);
  };

  return (
    <div className="edit-task-container">
      <textarea
        className="edit-task-textarea"
        value={newText}
        onChange={(e) => setNewText(e.target.value)}
        rows={3}
      />
      <div className="edit-task-buttons">
        <button onClick={handleSave} className="save-task-btn">
          <FontAwesomeIcon icon={faCheck} />
        </button>
        <button onClick={onCancel} className="cancel-task-btn">
          <FontAwesomeIcon icon={faTimes} />
        </button>
      </div>
    </div>
  );
};

export default EditTask;
