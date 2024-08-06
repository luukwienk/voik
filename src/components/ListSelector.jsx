import React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPlus, faTrash } from '@fortawesome/free-solid-svg-icons';

const ListSelector = ({ lists, currentList, setCurrentList, addList, deleteList, currentTab }) => {
  const listNames = Object.keys(lists);

  const handleChange = (e) => {
    const value = e.target.value;
    if (value === 'add-new-list') {
      const newListName = prompt('Enter new list name');
      if (newListName) {
        addList(newListName);
        setCurrentList(newListName);
      }
    } else {
      setCurrentList(value);
    }
  };

  return (
    <div className="list-selector">
      <select value={currentList} onChange={handleChange}>
        {listNames.map((listName) => (
          <option key={listName} value={listName}>
            {listName}
          </option>
        ))}
        <option value="add-new-list">+ Add New List</option>
      </select>
      {currentList !== 'Today' && currentList !== 'My Notes' && (
        <button onClick={() => deleteList(currentList)}>
          <FontAwesomeIcon icon={faTrash} />
        </button>
      )}
    </div>
  );
};

export default ListSelector;
