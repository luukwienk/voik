import React, { useState, useEffect, useRef } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSearch, faPlus, faTrash, faTimes, faChevronDown } from '@fortawesome/free-solid-svg-icons';
import '../styles/listSelectorModal.css';

const ListSelectorModal = ({ 
  lists, 
  currentList, 
  setCurrentList, 
  addList, 
  deleteList 
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterLists, setFilterLists] = useState([]);
  const modalRef = useRef(null);
  const searchInputRef = useRef(null);

  useEffect(() => {
    // Bijwerken van gefilterde lijsten wanneer de zoekterm of de lijsten veranderen
    if (searchTerm.trim() === '') {
      setFilterLists(Object.keys(lists));
    } else {
      const filtered = Object.keys(lists).filter(listName =>
        listName.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilterLists(filtered);
    }
  }, [searchTerm, lists]);

  useEffect(() => {
    // Sluit de modal als er buiten wordt geklikt
    const handleClickOutside = (event) => {
      if (modalRef.current && !modalRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      // Focus op het zoekveld wanneer de modal opent
      setTimeout(() => {
        if (searchInputRef.current) {
          searchInputRef.current.focus();
        }
      }, 100);
    } else {
      setSearchTerm('');
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const handleSelectList = (listName) => {
    setCurrentList(listName);
    setIsOpen(false);
    setSearchTerm('');
  };

  const handleAddNewList = () => {
    const newListName = prompt('Voer naam in voor de nieuwe lijst:');
    if (newListName && newListName.trim() !== '') {
      addList(newListName.trim());
      setCurrentList(newListName.trim());
      setIsOpen(false);
      setSearchTerm('');
    }
  };

  const handleDeleteList = (e, listName) => {
    e.stopPropagation(); // Voorkom dat de lijst wordt geselecteerd
    if (window.confirm(`Weet je zeker dat je de lijst "${listName}" wilt verwijderen?`)) {
      deleteList(listName);
      // Als de huidige lijst is verwijderd, selecteer dan de eerste beschikbare lijst
      if (currentList === listName && Object.keys(lists).length > 0) {
        const availableLists = Object.keys(lists).filter(name => name !== listName);
        if (availableLists.length > 0) {
          setCurrentList(availableLists[0]);
        }
      }
    }
  };

  return (
    <div className="list-selector-container">
      {/* Toon de huidige lijst als klikbare titel */}
      <div 
        className="list-selector-title" 
        onClick={() => setIsOpen(true)}
      >
        <h2>
          {currentList}
          <FontAwesomeIcon 
            icon={faChevronDown} 
            style={{ 
              marginLeft: '8px', 
              fontSize: '0.7em', 
              opacity: 0.7,
              transition: 'transform 0.2s'
            }} 
          />
        </h2>
      </div>

      {/* Modal die opent wanneer er op de titel wordt geklikt */}
      {isOpen && (
        <div className="list-selector-modal-overlay">
          <div className="list-selector-modal" ref={modalRef}>
            <div className="list-selector-modal-header">
              <h3>Selecteer een lijst</h3>
              <button 
                className="list-selector-close-btn"
                onClick={() => setIsOpen(false)}
                aria-label="Sluiten"
              >
                <FontAwesomeIcon icon={faTimes} />
              </button>
            </div>
            
            <div className="list-selector-search">
              <FontAwesomeIcon icon={faSearch} className="search-icon" />
              <input
                ref={searchInputRef}
                type="text"
                placeholder="Zoek in lijsten..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="list-search-input"
              />
            </div>
            
            <div className="list-selector-options">
              {filterLists.length > 0 ? (
                filterLists.map((listName) => (
                  <div 
                    key={listName}
                    className={`list-option ${currentList === listName ? 'active' : ''}`}
                    onClick={() => handleSelectList(listName)}
                  >
                    {listName}
                    {listName !== 'Today' && listName !== 'My Notes' && (
                      <button 
                        className="list-delete-btn"
                        onClick={(e) => handleDeleteList(e, listName)}
                        title="Verwijder lijst"
                        aria-label="Verwijder lijst"
                      >
                        <FontAwesomeIcon icon={faTrash} />
                      </button>
                    )}
                  </div>
                ))
              ) : (
                <div className="no-results">Geen lijsten gevonden</div>
              )}
            </div>
            
            <div className="list-selector-footer">
              <button 
                className="add-list-btn"
                onClick={handleAddNewList}
              >
                <FontAwesomeIcon icon={faPlus} /> Nieuwe lijst
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ListSelectorModal; 