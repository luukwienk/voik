// TabsNavigation.jsx - Simplified with Board + More menu
import { useState, useRef, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faTasks,
  faClock,
  faSearch,
  faHeartbeat,
  faMicrophone,
  faTrophy,
  faSignOutAlt,
  faColumns,
  faEllipsisH
} from '@fortawesome/free-solid-svg-icons';
import useMediaQuery from '../hooks/useMediaQuery';
import '../styles/tabs.css';

// More menu items - other features accessible via dropdown
const moreMenuItems = [
  { index: 2, icon: faTasks, label: 'Tasks' },
  { index: 3, icon: faClock, label: 'Calendar' },
  { index: 4, icon: faSearch, label: 'Search' },
  { index: 5, icon: faHeartbeat, label: 'Health' },
  { index: 6, icon: faTrophy, label: 'Success' },
];

const TabsNavigation = ({ currentTab, onTabChange, signOut }) => {
  const [value, setValue] = useState(currentTab || 0);
  const [isMoreOpen, setIsMoreOpen] = useState(false);
  const moreRef = useRef(null);
  const isMobile = useMediaQuery('(max-width: 767px)');

  const handleChange = (newValue) => {
    setValue(newValue);
    if (onTabChange) {
      onTabChange(newValue);
    }
  };

  const handleMoreItemClick = (index) => {
    handleChange(index);
    setIsMoreOpen(false);
  };

  // Close more menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (moreRef.current && !moreRef.current.contains(e.target)) {
        setIsMoreOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Check if current tab is in "more" menu
  const isMoreTabActive = moreMenuItems.some(item => item.index === currentTab);

  return (
    <div className="tabs-navigation" style={{
      position: isMobile ? 'fixed' : 'relative',
      bottom: isMobile ? 0 : 'auto',
      left: 0,
      right: 0,
      backgroundColor: 'white',
      boxShadow: isMobile ? '0 -2px 10px rgba(0, 0, 0, 0.1)' : 'none',
      zIndex: 1000,
      padding: isMobile ? '8px 0' : '0',
      transition: 'all 0.3s ease',
      paddingBottom: isMobile ? 'calc(8px + env(safe-area-inset-bottom))' : undefined
    }}>
      <div className="tabs-container" style={{
        maxWidth: isMobile ? '100%' : '1680px',
        margin: '0 auto',
        padding: isMobile ? '0 16px' : '0',
        justifyContent: 'center',
        gap: '8px'
      }}>
        {/* Board tab - main view */}
        <div
          className={`tab-item ${currentTab === 0 ? 'active' : ''}`}
          onClick={() => handleChange(0)}
          title="Board"
        >
          <FontAwesomeIcon icon={faColumns} />
          {!isMobile && <span className="tab-label">Board</span>}
        </div>

        {/* Transcriptions tab */}
        <div
          className={`tab-item ${currentTab === 1 ? 'active' : ''}`}
          onClick={() => handleChange(1)}
          title="Transcriptions"
        >
          <FontAwesomeIcon icon={faMicrophone} />
          {!isMobile && <span className="tab-label">Transcriptions</span>}
        </div>

        {/* More dropdown */}
        <div className="more-menu-container" ref={moreRef}>
          <div
            className={`tab-item ${isMoreTabActive ? 'active' : ''}`}
            onClick={() => setIsMoreOpen(!isMoreOpen)}
            title="More"
          >
            <FontAwesomeIcon icon={faEllipsisH} />
            {!isMobile && <span className="tab-label">More</span>}
          </div>

          {isMoreOpen && (
            <div className={`more-menu-dropdown ${isMobile ? 'mobile' : ''}`}>
              {moreMenuItems.map(item => (
                <div
                  key={item.index}
                  className={`more-menu-item ${currentTab === item.index ? 'active' : ''}`}
                  onClick={() => handleMoreItemClick(item.index)}
                >
                  <FontAwesomeIcon icon={item.icon} />
                  <span>{item.label}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Spacer */}
        <div style={{ flex: '0 0 16px' }} />

        {/* Logout button */}
        <div
          className="tab-item"
          onClick={signOut}
          title="Logout"
          aria-label="Logout"
          style={{ color: '#2196F3' }}
        >
          <FontAwesomeIcon icon={faSignOutAlt} />
        </div>
      </div>
    </div>
  );
};

export default TabsNavigation;
