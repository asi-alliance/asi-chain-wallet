import { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

export const useDeepLink = () => {
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    // Check URL parameters on mount and location change
    const params = new URLSearchParams(location.search);
    
    // Handle custom actions
    const action = params.get('action');
    if (action) {
      handleCustomAction(action);
      
      // Clean up URL
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, [location, navigate]);

  const handleCustomAction = (action: string) => {
    // Parse action string (e.g., "send?to=address&amount=100")
    const [actionType, actionParams] = action.split('?');
    const params = new URLSearchParams(actionParams || '');
    
    switch (actionType) {
      case 'send':
        navigate('/send', { 
          state: { 
            to: params.get('to'), 
            amount: params.get('amount') 
          } 
        });
        break;
      default:
        console.log('Unknown action:', actionType);
    }
  };
};