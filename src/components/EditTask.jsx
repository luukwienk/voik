import React, { useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCheck, faTimes } from '@fortawesome/free-solid-svg-icons';

const EditTask = ({ task, onSave, onCancel }) => {
  const [newText, setNewText] = useState(task.text);

  const handleSave = () => {
    onSave(newText);
  };

  return (
    <div>
      <input
        className="edit-task-input"
        type="text"
        value={newText}
        onChange={(e) => setNewText(e.target.value)}
      />
      <button onClick={handleSave}>
        <FontAwesomeIcon icon={faCheck} />
      </button>
      <button onClick={onCancel}>
        <FontAwesomeIcon icon={faTimes} />
      </button>
    </div>
  );
};

export default EditTask;
