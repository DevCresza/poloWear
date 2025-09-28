// Importar serviços reais do Supabase
import {
  Contact,
  WhatsappTemplate,
  Produto,
  Pedido,
  Fornecedor,
  Recurso,
  Capsula,
  PendingUser,
  MovimentacaoEstoque,
  Carrinho,
  LeadArquivado,
  User
} from '@/services/entities'
// Import dinâmico para evitar problemas de hoisting

// Adapter para manter compatibilidade com a interface existente (não usado mas mantido para compatibilidade futura)
// eslint-disable-next-line no-unused-vars
const createCompatibleEntity = (service) => ({
  find: async (options = {}) => {
    const result = await service.find(options)
    return result.success ? result.data : []
  },

  create: async (data) => {
    const result = await service.create(data)
    if (result.success) {
      return { id: result.data.id, ...result.data }
    }
    throw new Error(result.error)
  },

  update: async (id, data) => {
    const result = await service.update(id, data)
    if (result.success) {
      return { id, ...result.data }
    }
    throw new Error(result.error)
  },

  delete: async (id) => {
    const result = await service.delete(id)
    if (result.success) {
      return { id }
    }
    throw new Error(result.error)
  }
})

// Adapter especial para User (auth + CRUD)
const createAuthAdapter = (authService) => ({
  // Operações CRUD usando o novo UserService
  find: async (options = {}) => {
    const result = await User.find(options)
    return result.success ? result.data : []
  },

  create: async (data) => {
    console.log('🔄 UserCompat.create chamado com:', data);
    const result = await User.create(data)
    if (result.success) {
      console.log('✅ UserCompat.create sucesso:', result.data);
      return {
        id: result.data.id,
        ...result.data,
        tempPassword: result.data.tempPassword // Incluir senha temporária
      }
    }
    console.error('❌ UserCompat.create erro:', result.error);
    throw new Error(result.error)
  },

  update: async (id, data) => {
    const result = await User.update(id, data)
    if (result.success) {
      return { id, ...result.data }
    }
    throw new Error(result.error)
  },

  delete: async (id) => {
    const result = await User.delete(id)
    if (result.success) {
      return { id }
    }
    throw new Error(result.error)
  },

  // Operações de autenticação
  me: async () => {
    console.log('🟢 UserCompat.me() called - using real Supabase auth');
    try {
      // Import dinâmico do authService
      const { authService } = await import('@/services/auth');
      console.log('🔄 Calling authService.me()...');

      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Timeout after 5 seconds')), 5000)
      );

      const result = await Promise.race([
        authService.me(),
        timeoutPromise
      ]);

      console.log('📊 authService.me() result:', { success: result.success, hasData: !!result.data, error: result.error });

      if (result.success) {
        console.log('🟢 Real user authenticated:', result.data);
        return result.data;
      } else {
        console.log('🟡 authService.me() failed:', result.error);
        return null;
      }
    } catch (error) {
      console.error('🔴 UserCompat.me() error:', error);
      return null; // Retornar null em vez de throw para evitar loops
    }
  },

  login: async (credentials) => {
    console.log('🔄 UserCompat.login chamado com:', credentials);

    try {
      // Import dinâmico do authService
      const { authService } = await import('@/services/auth');
      console.log('🔍 authService importado:', typeof authService, !!authService?.login);

      if (!authService || typeof authService.login !== 'function') {
        throw new Error('authService ou authService.login não está disponível');
      }

      const result = await authService.login(credentials.email, credentials.password)
      if (result.success) {
        return {
          user: result.data.user,
          token: result.data.session?.access_token || 'supabase-session'
        }
      }
      throw new Error(result.error)
    } catch (importError) {
      console.error('❌ Erro ao importar authService:', importError);
      throw new Error(`Erro ao importar authService: ${importError.message}`);
    }
  },

  logout: async () => {
    const { authService } = await import('@/services/auth');
    const result = await authService.logout()
    if (!result.success) {
      throw new Error(result.error)
    }
  },

  register: async (data) => {
    const { authService } = await import('@/services/auth');
    const result = await authService.register(data)
    if (result.success) {
      return {
        user: result.data.user,
        token: result.data.session?.access_token || 'supabase-session'
      }
    }
    throw new Error(result.error)
  }
})

// Exportar entidades compatíveis
export {
  Contact,
  WhatsappTemplate,
  Produto,
  Pedido,
  Fornecedor,
  Recurso,
  Capsula,
  PendingUser,
  MovimentacaoEstoque,
  Carrinho,
  LeadArquivado
}

// Exportar User com adapter para compatibilidade
export const UserCompat = createAuthAdapter(User)

// Manter export do User original também
export { User }