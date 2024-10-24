import React, { useState } from 'react';

const MoveTaskModal = ({ lists, currentList, onMove, onClose }) => {
  const [selectedList, setSelectedList] = useState('');
  
  return (
    <div className="modal-overlay" style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      zIndex: 1000
    }}>
      <div className="modal-content" style={{
        backgroundColor: 'white',
        padding: '20px',
        borderRadius: '8px',
        minWidth: '300px'
      }}>
        <h3>Move Task To:</h3>
        <select 
          value={selectedList} 
          onChange={(e) => setSelectedList(e.target.value)}
          style={{
            width: '100%',
            padding: '8px',
            marginBottom: '15px',
            borderRadius: '4px',
            border: '1px solid #ddd'
          }}
        >
          <option value="">Select a list...</option>
          {Object.keys(lists)
            .filter(list => list !== currentList)
            .map(list => (
              <option key={list} value={list}>{list}</option>
            ))
          }
        </select>
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
          <button
            onClick={onClose}
            style={{
              padding: '8px 16px',
              border: '1px solid #ddd',
              borderRadius: '4px',
              backgroundColor: 'white',
              cursor: 'pointer'
            }}
          >
            Cancel
          </button>
          <button
            onClick={() => {
              if (selectedList) {
                onMove(selectedList);
                onClose();
              }
            }}
            disabled={!selectedList}
            style={{
              padding: '8px 16px',
              backgroundColor: '#2196F3',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: selectedList ? 'pointer' : 'not-allowed',
              opacity: selectedList ? 1 : 0.6
            }}
          >
            Move
          </button>
        </div>
      </div>
    </div>
  );
};

export default MoveTaskModal;