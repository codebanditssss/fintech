/**
 * Navigation utility to ensure navigation only happens through app buttons
 * and not through browser navigation
 */

export function navigateWithToken(url: string, router: any) {
  if (typeof window === 'undefined') {
    router.replace(url);
    return;
  }
  
  // Set navigation token in sessionStorage and cookie
  sessionStorage.setItem('nav-token', 'valid');
  sessionStorage.setItem('nav-time', Date.now().toString());
  document.cookie = `nav-token=valid; path=/; max-age=5; SameSite=Lax`;
  
  // Use replace to prevent back button access
  router.replace(url);
  
  // Also prevent browser history manipulation
  window.history.replaceState({ nav: true }, '', url);
}

export function setupNavigationGuard(router: any) {
  if (typeof window === 'undefined') return () => {};

  // Block popstate (back/forward buttons)
  const handlePopState = (event: PopStateEvent) => {
    event.preventDefault();
    
    // Clear any nav tokens
    sessionStorage.removeItem('nav-token');
    sessionStorage.removeItem('nav-time');
    document.cookie = 'nav-token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
    
    // Push current state again to stay on page
    window.history.pushState({ nav: true }, '', window.location.href);
    
    // Optionally redirect to home
    router.replace('/');
  };

  // Block beforeunload to prevent navigation away
  const handleBeforeUnload = (event: BeforeUnloadEvent) => {
    // Only block if trying to navigate to different origin
    if (event.target instanceof Window) {
      // Allow navigation but clear tokens
      sessionStorage.removeItem('nav-token');
      sessionStorage.removeItem('nav-time');
    }
  };

  // Push initial state to block back button
  window.history.pushState({ nav: true }, '', window.location.href);
  
  window.addEventListener('popstate', handlePopState);
  window.addEventListener('beforeunload', handleBeforeUnload);

  // Wrap router methods to always set token
  const originalPush = router.push;
  const originalReplace = router.replace;

  router.push = function(url: string, options?: any) {
    if (typeof window !== 'undefined') {
      sessionStorage.setItem('nav-token', 'valid');
      sessionStorage.setItem('nav-time', Date.now().toString());
      document.cookie = `nav-token=valid; path=/; max-age=5; SameSite=Lax`;
    }
    return originalPush.call(router, url, options);
  };

  router.replace = function(url: string, options?: any) {
    if (typeof window !== 'undefined') {
      sessionStorage.setItem('nav-token', 'valid');
      sessionStorage.setItem('nav-time', Date.now().toString());
      document.cookie = `nav-token=valid; path=/; max-age=5; SameSite=Lax`;
    }
    return originalReplace.call(router, url, options);
  };

  return () => {
    window.removeEventListener('popstate', handlePopState);
    window.removeEventListener('beforeunload', handleBeforeUnload);
    router.push = originalPush;
    router.replace = originalReplace;
  };
}

// Check if navigation is valid (client-side check)
export function isValidNavigation(): boolean {
  if (typeof window === 'undefined') return true;
  
  const navToken = sessionStorage.getItem('nav-token');
  const navTime = sessionStorage.getItem('nav-time');
  
  if (!navToken || !navTime) return false;
  
  // Token expires after 5 seconds
  const timeElapsed = Date.now() - parseInt(navTime);
  if (timeElapsed > 5000) {
    sessionStorage.removeItem('nav-token');
    sessionStorage.removeItem('nav-time');
    return false;
  }
  
  return true;
}
