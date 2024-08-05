import React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTrash } from '@fortawesome/free-solid-svg-icons';

function ListSelector({ lists, currentList, setCurrentList, addList, deleteList, currentTab }) {
  const handleListChange = (e) => {
    const selectedValue = e.target.value;
    if (selectedValue === 'new-task' || selectedValue === 'new-note') {
      const listType = selectedValue === 'new-task' ? 'task' : 'note';
      const listName = prompt(`Enter the name for your new ${listType} list:`);
      if (listName && listName.trim() !== '') {
        addList(listName.trim(), listType);
      }
    } else {
      setCurrentList(selectedValue);
    }
  };

  const handleDeleteList = () => {
    const confirmDelete = window.confirm(`Are you sure you want to delete the list "${currentList}"? This action cannot be undone.`);
    if (confirmDelete) {
      deleteList(currentList);
    }
  };

  const filteredLists = Object.entries(lists).filter(([_, list]) => list.type === (currentTab === 0 ? 'task' : 'note'));

  return (
    <div className="list-selector">
      <select value={currentList} onChange={handleListChange}>
        {filteredLists.map(([listName, _]) => (
          <option key={listName} value={listName}>{listName}</option>
        ))}
        <option value={currentTab === 0 ? "new-task" : "new-note"}>
          + New {currentTab === 0 ? "Task" : "Note"} List
        </option>
      </select>
      {currentList !== 'Today' && currentList !== 'My Notes' && (
        <button className="remove-list-btn" onClick={handleDeleteList}>
          <FontAwesomeIcon icon={faTrash} />
        </button>
      )}
    </div>
  );
}

export default ListSelector;
  