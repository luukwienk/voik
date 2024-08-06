import React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPlus, faTrash } from '@fortawesome/free-solid-svg-icons';

const ListSelector = ({ lists, currentList, setCurrentList, addList, deleteList, currentTab }) => {
  const listNames = Object.keys(lists);

  return (
    <div className="list-selector">
      <select
        value={currentList}
        onChange={(e) => setCurrentList(e.target.value)}
      >
        {listNames.map((listName) => (
          <option key={listName} value={listName}>
            {listName}
          </option>
        ))}
        <option value="add-new-list">+ Add New List</option>
      </select>
      {currentList !== 'Today' && (
        <button onClick={() => deleteList(currentList)}>
          <FontAwesomeIcon icon={faTrash} />
        </button>
      )}
    </div>
  );
};

export default ListSelector;
