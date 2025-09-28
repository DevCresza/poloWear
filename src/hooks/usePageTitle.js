import { useEffect } from 'react';

/**
 * Hook customizado para gerenciar títulos das páginas
 * @param {string} title - Título específico da página
 * @param {string} description - Descrição opcional para a meta tag
 */
export const usePageTitle = (title, description = null) => {
  useEffect(() => {
    const baseTitle = 'POLO B2B';
    const fullTitle = title ? `${title} | ${baseTitle}` : baseTitle;

    // Atualizar título da página
    document.title = fullTitle;

    // Atualizar meta description se fornecida
    if (description) {
      const metaDescription = document.querySelector('meta[name="description"]');
      if (metaDescription) {
        metaDescription.setAttribute('content', description);
      }
    }
  }, [title, description]);
};

export default usePageTitle;