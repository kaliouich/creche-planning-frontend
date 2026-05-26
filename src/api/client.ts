import axios from 'axios';

/**
 * Client Axios configuré pour interagir de façon sécurisée avec l'API backend.
 * 
 * Sécurité (Secure Web Frontend) :
 * - `withCredentials: true` permet au navigateur d'inclure automatiquement 
 *   les cookies HttpOnly (comme le JWT __Host-session).
 * - L'intercepteur extrait le token CSRF du cookie non-HttpOnly et l'ajoute 
 *   aux en-têtes des requêtes mutantes.
 */
export const apiClient = axios.create({
  baseURL: '/api', // Vite proxy redirige ça vers http://127.0.0.1:3000
  withCredentials: true, 
  headers: {
    'Content-Type': 'application/json',
  },
});

// Intercepteur pour ajouter le X-CSRF-Token aux requêtes POST/PUT/PATCH/DELETE
apiClient.interceptors.request.use((config) => {
  const methodsRequiringCsrf = ['post', 'put', 'patch', 'delete'];
  
  if (config.method && methodsRequiringCsrf.includes(config.method.toLowerCase())) {
    // Extraire le token CSRF depuis le document.cookie
    // Note: En dev on utilise 'csrf-token', en prod '__Host-csrf-token'
    const cookies = document.cookie.split(';');
    let csrfToken = '';
    
    for (let cookie of cookies) {
      const [name, value] = cookie.trim().split('=');
      if (name === 'csrf-token' || name === '__Host-csrf-token') {
        csrfToken = value;
        break;
      }
    }
    
    if (csrfToken) {
      config.headers['X-CSRF-Token'] = csrfToken;
    }
  }
  
  return config;
});

// Gestion globale des erreurs (ex: session expirée)
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    // Si l'API retourne 401 (Non autorisé) et qu'on n'est pas déjà sur la page de login
    if (error.response?.status === 401 && window.location.pathname !== '/login') {
      // Nettoyer le localStorage pour éviter une boucle de redirection infinie
      localStorage.removeItem('userMeta');
      // Redirection dure vers le login pour nettoyer l'état client complet
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);
