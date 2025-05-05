import React, { useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCheck, faTimes } from '@fortawesome/free-solid-svg-icons';

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
              background: 'none',
              border: 'none',
              fontSize: '18px',
              padding: '8px',
              borderRadius: '50%',
              cursor: 'pointer',
              width: '40px',
              height: '40px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'background 0.2s'
            }}
            title="Annuleren"
          >
            <FontAwesomeIcon icon={faTimes} style={{ color: '#888' }} />
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
              background: 'none',
              border: 'none',
              fontSize: '18px',
              padding: '8px',
              borderRadius: '50%',
              cursor: selectedList ? 'pointer' : 'not-allowed',
              width: '40px',
              height: '40px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'background 0.2s',
              opacity: selectedList ? 1 : 0.6
            }}
            title="Verplaatsen"
          >
            <FontAwesomeIcon icon={faCheck} style={{ color: selectedList ? '#2196F3' : '#888' }} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default MoveTaskModal;