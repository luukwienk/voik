import { useState, useEffect } from 'react';

/**
 * Custom hook for responsive design
 * @param {string} query - CSS media query string (e.g. '(min-width: 768px)')
 * @returns {boolean} - Whether the media query matches
 */
const useMediaQuery = (query) => {
  const [matches, setMatches] = useState(false);

  useEffect(() => {
    // Create a media query list
    const media = window.matchMedia(query);
    
    // Set initial state
    if (media.matches !== matches) {
      setMatches(media.matches);
    }

    // Define callback function
    const listener = () => setMatches(media.matches);
    
    // Add listener for changes - using the standardized API
    if (media.addEventListener) {
      media.addEventListener('change', listener);
    } else {
      // Fallback for older browsers
      media.addListener(listener);
    }
    
    // Clean up function
    return () => {
      if (media.removeEventListener) {
        media.removeEventListener('change', listener);
      } else {
        // Fallback for older browsers
        media.removeListener(listener);
      }
    };
  }, [matches, query]);

  return matches;
};

export default useMediaQuery;