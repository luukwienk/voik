import React from 'react';

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
      </select>
      <button onClick={() => addList(prompt('Enter new list name'))}>
        + New {currentTab === 'tasks' ? 'Task' : 'Note'} List
      </button>
      {currentList !== 'Today' && (
        <button onClick={() => deleteList(currentList)}>
          Delete List
        </button>
      )}
    </div>
  );
};

export default ListSelector;
