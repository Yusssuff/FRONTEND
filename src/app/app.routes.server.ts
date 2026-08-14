import { RenderMode, ServerRoute } from '@angular/ssr';

export const serverRoutes: ServerRoute[] = [

  // Login page can be prerendered
  {
    path: '',
    renderMode: RenderMode.Prerender
  },

  // Products is protected and depends on browser localStorage.
  // Render it on the client instead of prerendering it.
  {
    path: 'products',
    renderMode: RenderMode.Client
  },

  // Other routes
  {
    path: '**',
    renderMode: RenderMode.Client
  }

];
