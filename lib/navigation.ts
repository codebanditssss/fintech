export function navigateWithToken(url: string, router: any) {
  if (typeof window === 'undefined') {
    router.replace(url);
    return;
  }
  
  sessionStorage.setItem('nav-token', 'valid');
  sessionStorage.setItem('nav-time', Date.now().toString());
  document.cookie = `nav-token=valid; path=/; max-age=5; SameSite=Lax`;
  
  router.replace(url);

  window.history.replaceState({ nav: true }, '', url);
}

export function setupNavigationGuard(router: any) {
  if (typeof window === 'undefined') return () => {};

  const handlePopState = (event: PopStateEvent) => {
    event.preventDefault();
    
    sessionStorage.removeItem('nav-token');
    sessionStorage.removeItem('nav-time');
    document.cookie = 'nav-token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
    
    window.history.pushState({ nav: true }, '', window.location.href);
    
    router.replace('/');
  };

  const handleBeforeUnload = (event: BeforeUnloadEvent) => {
    if (event.target instanceof Window) {
      sessionStorage.removeItem('nav-token');
      sessionStorage.removeItem('nav-time');
    }
  };

  window.history.pushState({ nav: true }, '', window.location.href);
  
  window.addEventListener('popstate', handlePopState);
  window.addEventListener('beforeunload', handleBeforeUnload);

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

export function isValidNavigation(): boolean {
  if (typeof window === 'undefined') return true;
  
  const navToken = sessionStorage.getItem('nav-token');
  const navTime = sessionStorage.getItem('nav-time');
  
  if (!navToken || !navTime) return false;
  
  const timeElapsed = Date.now() - parseInt(navTime);
  if (timeElapsed > 5000) {
    sessionStorage.removeItem('nav-token');
    sessionStorage.removeItem('nav-time');
    return false;
  }
  
  return true;
}
