import BaseService from './baseService'
import { supabase, handleSupabaseError, handleSupabaseSuccess } from '@/lib/supabase'

// Serviço para Contatos (CRM)
class ContactService extends BaseService {
  constructor() {
    super('contacts')
  }

  // Buscar contatos por status
  async findByStatus(status) {
    return this.find({ filters: { status } })
  }

  // Buscar contatos por empresa
  async findByCompany(empresa) {
    return this.search('empresa', empresa)
  }
}

// Serviço para Templates do WhatsApp
class WhatsappTemplateService extends BaseService {
  constructor() {
    super('whatsapp_templates')
  }

  // Buscar templates ativos
  async findActive() {
    return this.find({ filters: { ativo: true } })
  }
}

// Serviço para Produtos
class ProductService extends BaseService {
  constructor() {
    super('produtos')
  }

  // Buscar produtos por fornecedor
  async findByFornecedor(fornecedorId) {
    return this.find({
      filters: { fornecedor_id: fornecedorId, ativo: true },
      order: { column: 'nome', ascending: true }
    })
  }

  // Buscar produtos por marca
  async findByMarca(marca) {
    return this.find({
      filters: { marca, ativo: true },
      order: { column: 'nome', ascending: true }
    })
  }

  // Buscar produtos em destaque
  async findDestaque() {
    return this.find({
      filters: { is_destaque: true, ativo: true },
      order: { column: 'nome', ascending: true }
    })
  }

  // Buscar produtos com estoque baixo
  async findEstoqueBaixo() {
    try {
      const { data, error } = await supabase
        .from('vw_produtos_estoque_baixo')
        .select('*')

      if (error) throw error
      return handleSupabaseSuccess(data)
    } catch (error) {
      return handleSupabaseError(error)
    }
  }

  // Atualizar estoque
  async updateEstoque(produtoId, novoEstoque, userId, motivo = 'ajuste') {
    try {
      // Buscar estoque atual
      const { data: produto } = await supabase
        .from('produtos')
        .select('estoque_atual_grades')
        .eq('id', produtoId)
        .single()

      if (!produto) throw new Error('Produto não encontrado')

      const estoqueAnterior = produto.estoque_atual_grades

      // Atualizar estoque do produto
      const { error: updateError } = await supabase
        .from('produtos')
        .update({ estoque_atual_grades: novoEstoque })
        .eq('id', produtoId)

      if (updateError) throw updateError

      // Registrar movimentação
      const { error: movError } = await supabase
        .from('movimentacoes_estoque')
        .insert([{
          produto_id: produtoId,
          tipo: 'ajuste',
          quantidade_grades: novoEstoque - estoqueAnterior,
          quantidade_anterior: estoqueAnterior,
          quantidade_atual: novoEstoque,
          motivo,
          user_id: userId
        }])

      if (movError) throw movError

      return handleSupabaseSuccess({
        produtoId,
        estoqueAnterior,
        novoEstoque
      })
    } catch (error) {
      return handleSupabaseError(error)
    }
  }
}

// Serviço para Pedidos
class PedidoService extends BaseService {
  constructor() {
    super('pedidos')
  }

  // Buscar pedidos por comprador
  async findByComprador(compradorId) {
    return this.find({
      filters: { comprador_user_id: compradorId },
      order: { column: 'created_date', ascending: false }
    })
  }

  // Buscar pedidos por fornecedor
  async findByFornecedor(fornecedorId) {
    return this.find({
      filters: { fornecedor_id: fornecedorId },
      order: { column: 'created_date', ascending: false }
    })
  }

  // Buscar pedidos completos (com join)
  async findCompletos(options = {}) {
    try {
      let query = supabase.from('vw_pedidos_completos').select('*')

      // Aplicar filtros
      if (options.filters) {
        Object.entries(options.filters).forEach(([key, value]) => {
          if (value !== undefined && value !== null) {
            query = query.eq(key, value)
          }
        })
      }

      // Aplicar ordenação
      query = query.order('created_date', { ascending: false })

      const { data, error } = await query

      if (error) throw error
      return handleSupabaseSuccess(data)
    } catch (error) {
      return handleSupabaseError(error)
    }
  }

  // Atualizar status do pedido
  async updateStatus(pedidoId, novoStatus) {
    return this.update(pedidoId, { status: novoStatus })
  }
}

// Serviço para Fornecedores
class FornecedorService extends BaseService {
  constructor() {
    super('fornecedores')
  }

  // Buscar fornecedores ativos
  async findAtivos() {
    return this.find({
      filters: { ativo_fornecedor: true },
      order: { column: 'nome_marca', ascending: true }
    })
  }

  // Buscar por marca
  async findByMarca(nomeMarca) {
    return this.find({
      filters: { nome_marca: nomeMarca },
      select: '*'
    })
  }
}

// Serviço para Recursos
class RecursoService extends BaseService {
  constructor() {
    super('recursos')
  }

  // Buscar recursos ativos
  async findAtivos() {
    return this.find({ filters: { ativo: true } })
  }

  // Buscar por tipo
  async findByTipo(tipo) {
    return this.find({ filters: { tipo } })
  }
}

// Serviço para Cápsulas
class CapsulaService extends BaseService {
  constructor() {
    super('capsulas')
  }

  // Buscar cápsulas ativas
  async findAtivas() {
    return this.find({
      filters: { ativa: true },
      order: { column: 'nome', ascending: true }
    })
  }
}

// Serviço para Usuários
class UserService extends BaseService {
  constructor() {
    super('users')
  }

  // Criar usuário com integração ao Supabase Auth
  async create(userData) {
    try {
      // Gerar senha temporária se não fornecida
      const tempPassword = userData.password || `temp_${userData.email.split('@')[0]}_123`;

      let authData;

      // 1. Tentar criar no Supabase Auth
      console.log('🔐 Verificando/criando usuário no Supabase Auth:', userData.email);

      const { data: signUpData, error: authError } = await supabase.auth.signUp({
        email: userData.email,
        password: tempPassword,
        options: {
          data: {
            full_name: userData.full_name,
            role: userData.role,
            tipo_negocio: userData.tipo_negocio
          }
        }
      });

      if (authError) {
        if (authError.message === 'User already registered') {
          console.log('🔄 Usuário já existe no Auth, não é possível criar...');

          // Se o usuário já existe no Auth, não podemos criar um novo
          // O admin precisa excluir do Auth primeiro ou usar email diferente
          throw new Error(`O email "${userData.email}" já está registrado no Supabase Auth. Para criar este usuário, primeiro exclua-o do Auth através do painel do Supabase ou use um email diferente.`);
        } else {
          console.error('❌ Erro ao criar usuário no Auth:', authError);
          throw authError;
        }
      } else {
        authData = signUpData;
        console.log('✅ Usuário criado no Auth:', authData.user.id);
      }

      // 2. Depois criar na tabela users usando o ID do Auth
      const userRecord = {
        id: authData.user.id, // Usar ID do Supabase Auth
        full_name: userData.full_name,
        email: userData.email,
        role: userData.role || 'multimarca',
        tipo_negocio: userData.tipo_negocio || 'multimarca',
        telefone: userData.telefone,
        empresa: userData.empresa,
        cnpj: userData.cnpj,
        cidade: userData.cidade,
        estado: userData.estado,
        endereco_completo: userData.endereco_completo,
        cep: userData.cep,
        tem_loja_fisica: userData.tem_loja_fisica,
        faixa_faturamento: userData.faixa_faturamento,
        razao_social: userData.razao_social,
        nome_marca: userData.nome_marca,
        limite_credito: userData.limite_credito || 0,
        password_hash: 'managed_by_supabase_auth',
        auth_synced: true,
        temp_password: tempPassword,
        ativo: true
      };

      let result;

      // Verificar se o usuário já existe na tabela users (por email ou ID)
      console.log('🔍 Verificando se usuário já existe na tabela users...');

      // Verificar por email
      const existingUserByEmail = await super.find({ filters: { email: userData.email } });
      if (existingUserByEmail.success && existingUserByEmail.data.length > 0) {
        console.log('⚠️ Usuário já existe na tabela users (por email):', existingUserByEmail.data[0]);
        return handleSupabaseError(new Error('Usuário com este email já existe no sistema'));
      }

      // Verificar por ID (se temos o authData)
      if (authData?.user?.id) {
        const existingUserById = await super.find({ filters: { id: authData.user.id } });
        if (existingUserById.success && existingUserById.data.length > 0) {
          console.log('⚠️ Usuário já existe na tabela users (por ID):', existingUserById.data[0]);
          return handleSupabaseError(new Error(`Usuário com ID ${authData.user.id} já existe no sistema`));
        }
      }

      console.log('✅ Criando novo registro na tabela users...');
      result = await super.create(userRecord);

      if (result.success) {
        return handleSupabaseSuccess({
          ...result.data,
          tempPassword: tempPassword
        });
      } else {
        throw new Error(result.error);
      }

    } catch (error) {
      console.error('❌ Erro ao criar usuário:', error);
      return handleSupabaseError(error);
    }
  }

  // Buscar usuários por role
  async findByRole(role) {
    return this.find({
      filters: { role, ativo: true },
      order: { column: 'full_name', ascending: true }
    });
  }

  // Buscar usuários por tipo de negócio
  async findByTipoNegocio(tipoNegocio) {
    return this.find({
      filters: { tipo_negocio: tipoNegocio, ativo: true },
      order: { column: 'full_name', ascending: true }
    });
  }

  // Exclusão completa do usuário (usando Edge Function)
  async deleteComplete(userId) {
    try {
      console.log('🗑️ Iniciando exclusão completa do usuário via Edge Function:', userId);

      // Chamar a Edge Function para exclusão completa
      const { data, error } = await supabase.functions.invoke('delete-user-complete', {
        body: { userId }
      });

      if (error) {
        console.error('❌ Erro na Edge Function:', error);
        return handleSupabaseError(error);
      }

      if (!data.success) {
        console.error('❌ Edge Function retornou erro:', data.error);
        return handleSupabaseError(new Error(data.error));
      }

      console.log('✅ Exclusão completa finalizada via Edge Function:', data);
      return handleSupabaseSuccess(data);

    } catch (error) {
      console.error('❌ Erro na exclusão completa:', error);
      return handleSupabaseError(error);
    }
  }
}

// Serviço para Usuários Pendentes
class PendingUserService extends BaseService {
  constructor() {
    super('pending_users')
  }

  // Buscar por status
  async findByStatus(status) {
    return this.find({
      filters: { status },
      order: { column: 'created_at', ascending: false }
    })
  }

  // Aprovar usuário
  async approveUser(pendingUserId, approvedBy) {
    return this.update(pendingUserId, {
      status: 'aprovado',
      approved_by: approvedBy,
      approved_at: new Date().toISOString()
    })
  }

  // Rejeitar usuário
  async rejectUser(pendingUserId, approvedBy, observacoes) {
    return this.update(pendingUserId, {
      status: 'rejeitado',
      approved_by: approvedBy,
      approved_at: new Date().toISOString(),
      observacoes
    })
  }
}

// Serviço para Movimentações de Estoque
class MovimentacaoEstoqueService extends BaseService {
  constructor() {
    super('movimentacoes_estoque')
  }

  // Buscar por produto
  async findByProduto(produtoId) {
    return this.find({
      filters: { produto_id: produtoId },
      order: { column: 'created_at', ascending: false }
    })
  }

  // Buscar por tipo
  async findByTipo(tipo) {
    return this.find({
      filters: { tipo },
      order: { column: 'created_at', ascending: false }
    })
  }
}

// Serviço para Carrinho
class CarrinhoService extends BaseService {
  constructor() {
    super('carrinho_itens')
  }

  // Buscar itens do carrinho por usuário
  async findByUser(userId) {
    try {
      const { data, error } = await supabase
        .from('carrinho_itens')
        .select(`
          *,
          produtos:produto_id (
            id,
            nome,
            marca,
            preco_por_peca,
            fotos,
            estoque_atual_grades
          )
        `)
        .eq('user_id', userId)
        .order('created_at', { ascending: false })

      if (error) throw error
      return handleSupabaseSuccess(data)
    } catch (error) {
      return handleSupabaseError(error)
    }
  }

  // Adicionar item ao carrinho
  async addItem(userId, produtoId, quantidadeGrades, precoUnitario, observacoes = '') {
    try {
      const { data, error } = await supabase
        .from('carrinho_itens')
        .upsert([{
          user_id: userId,
          produto_id: produtoId,
          quantidade_grades: quantidadeGrades,
          preco_unitario: precoUnitario,
          observacoes
        }])
        .select()
        .single()

      if (error) throw error
      return handleSupabaseSuccess(data)
    } catch (error) {
      return handleSupabaseError(error)
    }
  }

  // Limpar carrinho do usuário
  async clearCart(userId) {
    try {
      const { error } = await supabase
        .from('carrinho_itens')
        .delete()
        .eq('user_id', userId)

      if (error) throw error
      return handleSupabaseSuccess(true)
    } catch (error) {
      return handleSupabaseError(error)
    }
  }
}

// Serviço para Leads Arquivados
class LeadArquivadoService extends BaseService {
  constructor() {
    super('leads_arquivados')
  }

  // Arquivar um lead
  async arquivarLead(contact, statusFinal, arquivadoPor, motivo = '') {
    try {
      const leadArquivado = {
        contact_id: contact.id,
        nome: contact.nome,
        email: contact.email,
        telefone: contact.telefone,
        empresa: contact.empresa,
        cidade: contact.cidade,
        estado: contact.estado,
        status_final: statusFinal,
        tem_loja_fisica: contact.tem_loja_fisica,
        faixa_faturamento: contact.faixa_faturamento,
        fonte_lead: contact.fonte_lead,
        observacoes: contact.observacoes,
        data_criacao_original: contact.created_date || contact.created_at,
        arquivado_por: arquivadoPor,
        motivo_arquivamento: motivo
      }

      const result = await this.create(leadArquivado)
      return result
    } catch (error) {
      return handleSupabaseError(error)
    }
  }

  // Buscar leads arquivados por status
  async findByStatus(statusFinal) {
    return this.find({
      filters: { status_final: statusFinal },
      order: { column: 'data_arquivamento', ascending: false }
    })
  }

  // Buscar leads arquivados por período
  async findByPeriodo(dataInicio, dataFim) {
    try {
      const { data, error } = await supabase
        .from(this.tableName)
        .select('*')
        .gte('data_arquivamento', dataInicio)
        .lte('data_arquivamento', dataFim)
        .order('data_arquivamento', { ascending: false })

      if (error) throw error
      return handleSupabaseSuccess(data)
    } catch (error) {
      return handleSupabaseError(error)
    }
  }
}

// Instanciar e exportar os serviços
export const Contact = new ContactService()
export const WhatsappTemplate = new WhatsappTemplateService()
export const Produto = new ProductService()
export const Pedido = new PedidoService()
export const Fornecedor = new FornecedorService()
export const Recurso = new RecursoService()
export const Capsula = new CapsulaService()
export const User = new UserService()
export const PendingUser = new PendingUserService()
export const MovimentacaoEstoque = new MovimentacaoEstoqueService()
export const Carrinho = new CarrinhoService()
export const LeadArquivado = new LeadArquivadoService()

// Sistema de auth integrado com UserService