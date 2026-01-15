// CreateListModal.jsx - Beautiful modal for creating new lists
import { useState, useEffect, useRef } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPlus, faTimes, faListUl } from '@fortawesome/free-solid-svg-icons';

function CreateListModal({ isOpen, onClose, onCreate, existingLists = [] }) {
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const inputRef = useRef(null);

  useEffect(() => {
    if (isOpen) {
      setName('');
      setError('');
      // Focus input after animation
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen]);

  const handleSubmit = (e) => {
    e.preventDefault();
    const trimmed = name.trim();

    if (!trimmed) {
      setError('Please enter a name');
      return;
    }

    if (existingLists.includes(trimmed)) {
      setError('A list with this name already exists');
      return;
    }

    onCreate(trimmed);
    onClose();
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Escape') {
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="create-list-overlay" onClick={onClose} onKeyDown={handleKeyDown}>
      <div className="create-list-modal" onClick={e => e.stopPropagation()}>
        <div className="create-list-header">
          <div className="create-list-icon">
            <FontAwesomeIcon icon={faListUl} />
          </div>
          <h2>Create New List</h2>
          <button className="create-list-close" onClick={onClose}>
            <FontAwesomeIcon icon={faTimes} />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="create-list-body">
            <label htmlFor="list-name">List name</label>
            <input
              ref={inputRef}
              id="list-name"
              type="text"
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                setError('');
              }}
              placeholder="e.g. Work, Shopping, Ideas..."
              autoComplete="off"
            />
            {error && <div className="create-list-error">{error}</div>}
          </div>

          <div className="create-list-footer">
            <button type="button" className="create-list-btn secondary" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="create-list-btn primary">
              <FontAwesomeIcon icon={faPlus} />
              Create List
            </button>
          </div>
        </form>
      </div>

      <style jsx>{`
        .create-list-overlay {
          position: fixed;
          inset: 0;
          background: rgba(0, 0, 0, 0.4);
          backdrop-filter: blur(4px);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 2000;
          padding: 20px;
          animation: fadeIn 0.15s ease;
        }

        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }

        .create-list-modal {
          background: white;
          border-radius: 20px;
          width: 100%;
          max-width: 400px;
          box-shadow: 0 20px 60px rgba(0, 0, 0, 0.2);
          animation: slideUp 0.2s ease;
          overflow: hidden;
        }

        @keyframes slideUp {
          from {
            opacity: 0;
            transform: translateY(20px) scale(0.95);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }

        .create-list-header {
          display: flex;
          align-items: center;
          gap: 14px;
          padding: 24px 24px 20px;
          border-bottom: 1px solid #f0f0f0;
        }

        .create-list-icon {
          width: 44px;
          height: 44px;
          border-radius: 12px;
          background: linear-gradient(135deg, #2196F3 0%, #1976d2 100%);
          color: white;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 1.1rem;
        }

        .create-list-header h2 {
          flex: 1;
          margin: 0;
          font-size: 1.25rem;
          font-weight: 600;
          color: #1f2937;
        }

        .create-list-close {
          width: 36px;
          height: 36px;
          border-radius: 10px;
          border: none;
          background: #f3f4f6;
          color: #6b7280;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.15s;
        }

        .create-list-close:hover {
          background: #e5e7eb;
          color: #374151;
        }

        .create-list-body {
          padding: 24px;
        }

        .create-list-body label {
          display: block;
          font-size: 0.875rem;
          font-weight: 500;
          color: #374151;
          margin-bottom: 8px;
        }

        .create-list-body input {
          width: 100%;
          padding: 14px 16px;
          border: 2px solid #e5e7eb;
          border-radius: 12px;
          font-size: 1rem;
          transition: all 0.15s;
          box-sizing: border-box;
        }

        .create-list-body input:focus {
          outline: none;
          border-color: #2196F3;
          box-shadow: 0 0 0 4px rgba(33, 150, 243, 0.1);
        }

        .create-list-body input::placeholder {
          color: #9ca3af;
        }

        .create-list-error {
          margin-top: 10px;
          padding: 10px 12px;
          background: #fef2f2;
          color: #dc2626;
          border-radius: 8px;
          font-size: 0.875rem;
        }

        .create-list-footer {
          display: flex;
          gap: 12px;
          padding: 20px 24px 24px;
          background: #f9fafb;
        }

        .create-list-btn {
          flex: 1;
          padding: 14px 20px;
          border-radius: 12px;
          font-size: 0.95rem;
          font-weight: 600;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          transition: all 0.15s;
          border: none;
        }

        .create-list-btn.primary {
          background: linear-gradient(135deg, #2196F3 0%, #1976d2 100%);
          color: white;
        }

        .create-list-btn.primary:hover {
          transform: translateY(-1px);
          box-shadow: 0 4px 12px rgba(33, 150, 243, 0.4);
        }

        .create-list-btn.secondary {
          background: white;
          color: #374151;
          border: 1px solid #e5e7eb;
        }

        .create-list-btn.secondary:hover {
          background: #f9fafb;
          border-color: #d1d5db;
        }

        /* Dark mode */
        @media (prefers-color-scheme: dark) {
          .create-list-modal {
            background: #1e1e1e;
          }

          .create-list-header {
            border-bottom-color: #2a2f3a;
          }

          .create-list-header h2 {
            color: #e5e7eb;
          }

          .create-list-close {
            background: #2a2f3a;
            color: #9ca3af;
          }

          .create-list-close:hover {
            background: #3a3f4a;
            color: #d1d5db;
          }

          .create-list-body label {
            color: #d1d5db;
          }

          .create-list-body input {
            background: #2a2f3a;
            border-color: #3a3f4a;
            color: #e5e7eb;
          }

          .create-list-body input:focus {
            border-color: #2196F3;
          }

          .create-list-footer {
            background: #161921;
          }

          .create-list-btn.secondary {
            background: #2a2f3a;
            color: #d1d5db;
            border-color: #3a3f4a;
          }

          .create-list-btn.secondary:hover {
            background: #3a3f4a;
          }

          .create-list-error {
            background: #451a1a;
          }
        }
      `}</style>
    </div>
  );
}

export default CreateListModal;
