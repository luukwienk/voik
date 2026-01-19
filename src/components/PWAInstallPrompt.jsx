import React, { useState, useEffect } from 'react';
import { debugLog } from '../utils/debug';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faDownload, faTimes } from '@fortawesome/free-solid-svg-icons';

const PWAInstallPrompt = () => {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [showPrompt, setShowPrompt] = useState(false);
  const [isIOS, setIsIOS] = useState(false);

  useEffect(() => {
    // Detect iOS device
    const ios = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
    setIsIOS(ios);
    
    // Check if user has already dismissed or installed
    const installPromptDismissed = localStorage.getItem('pwaInstallPromptDismissed');
    if (installPromptDismissed) {
      const dismissedTime = parseInt(installPromptDismissed, 10);
      // Show prompt again after 30 days
      if (Date.now() - dismissedTime > 30 * 24 * 60 * 60 * 1000) {
        localStorage.removeItem('pwaInstallPromptDismissed');
      } else {
        return; // Don't show prompt
      }
    }

    const handleBeforeInstallPrompt = (e) => {
      // Prevent the default browser install prompt
      e.preventDefault();
      // Store the event for later use
      setDeferredPrompt(e);
      // Show our custom prompt
      setShowPrompt(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    // Check if app is already installed
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setShowPrompt(false);
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;
    
    // Show the browser install prompt
    deferredPrompt.prompt();
    
    // Wait for the user to respond
    const choiceResult = await deferredPrompt.userChoice;
    
    // Reset the deferredPrompt variable
    setDeferredPrompt(null);
    setShowPrompt(false);
    
    // Track the outcome
    if (choiceResult.outcome === 'accepted') {
      debugLog('User accepted the install prompt');
    } else {
      debugLog('User dismissed the install prompt');
      localStorage.setItem('pwaInstallPromptDismissed', Date.now().toString());
    }
  };

  const handleDismiss = () => {
    setShowPrompt(false);
    localStorage.setItem('pwaInstallPromptDismissed', Date.now().toString());
  };

  if (!showPrompt) return null;

  return (
    <div className="pwa-prompt" style={{
      position: 'fixed',
      bottom: '20px',
      left: '50%',
      transform: 'translateX(-50%)',
      backgroundColor: 'white',
      borderRadius: '8px',
      boxShadow: '0 2px 10px rgba(0,0,0,0.2)',
      padding: '16px',
      width: '90%',
      maxWidth: '400px',
      zIndex: 1000,
      animation: 'slideUp 0.3s forwards',
    }}>
      <button 
        onClick={handleDismiss}
        style={{
          position: 'absolute',
          top: '8px',
          right: '8px',
          background: 'none',
          border: 'none',
          fontSize: '16px',
          cursor: 'pointer',
          padding: '4px',
          color: '#666',
        }}
        aria-label="Close"
      >
        <FontAwesomeIcon icon={faTimes} />
      </button>
      
      <h3 style={{ margin: '0 0 8px', fontSize: '18px' }}>
        Install TaskBuddy App
      </h3>
      
      <p style={{ margin: '0 0 16px', fontSize: '14px', color: '#555' }}>
        {isIOS 
          ? 'Add to Home Screen using the share button and then "Add to Home Screen"' 
          : 'Install this app on your device for quick access even when offline.'}
      </p>
      
      {!isIOS && (
        <button
          onClick={handleInstallClick}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '100%',
            padding: '10px',
            backgroundColor: '#2196F3',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            fontSize: '16px',
            cursor: 'pointer',
            gap: '8px',
          }}
        >
          <FontAwesomeIcon icon={faDownload} />
          Install App
        </button>
      )}
      
      {isIOS && (
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '10px',
          backgroundColor: '#f5f5f5',
          borderRadius: '4px',
          fontSize: '14px',
          gap: '8px',
        }}>
          <span>Tap <FontAwesomeIcon icon={faDownload} /> and "Add to Home Screen"</span>
        </div>
      )}

      <style jsx>{`
        @keyframes slideUp {
          from {
            opacity: 0;
            transform: translate(-50%, 20px);
          }
          to {
            opacity: 1;
            transform: translate(-50%, 0);
          }
        }
        
        @media (prefers-color-scheme: dark) {
          .pwa-prompt {
            background-color: #333;
            color: white;
          }
          
          .pwa-prompt h3 {
            color: white;
          }
          
          .pwa-prompt p {
            color: #ddd;
          }
          
          .pwa-prompt button:last-child {
            background-color: #1976d2;
          }
        }
      `}</style>
    </div>
  );
};

export default PWAInstallPrompt;