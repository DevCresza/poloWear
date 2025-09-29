import { supabase, handleSupabaseError, handleSupabaseSuccess } from '@/lib/supabase'

class AuthService {
  // Login com email e senha
  async login(email, password) {
    try {

      // Primeiro, faz login com Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password
      })


      if (authError) throw authError

      // Verificar se a sessão foi realmente salva
      const savedSession = await supabase.auth.getSession()

      // Busca dados completos do usuário na tabela users
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('*')
        .eq('email', email)
        .single()

      if (userError) throw userError

      // Atualiza last_login
      await supabase
        .from('users')
        .update({ last_login: new Date().toISOString() })
        .eq('id', userData.id)

      return handleSupabaseSuccess({
        user: userData,
        session: authData.session
      })
    } catch (error) {
      return handleSupabaseError(error)
    }
  }

  // Registro de novo usuário
  async register(userData) {
    try {
      // Primeiro, cria usuário no Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: userData.email,
        password: userData.password
      })

      if (authError) throw authError

      // Depois, insere dados na tabela users
      const { data: userRecord, error: userError } = await supabase
        .from('users')
        .insert([{
          id: authData.user.id, // Usa o mesmo ID do Auth
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
          password_hash: 'managed_by_supabase_auth'
        }])
        .select()
        .single()

      if (userError) throw userError

      return handleSupabaseSuccess({
        user: userRecord,
        session: authData.session
      })
    } catch (error) {
      return handleSupabaseError(error)
    }
  }

  // Recuperar dados do usuário atual
  async me() {
    try {

      // Verificar se há sessão no localStorage primeiro
      const session = await supabase.auth.getSession()

      if (!session.data.session) {
        throw new Error('Usuário não autenticado - sem sessão')
      }


      // Adicionar timeout manual para getUser
      const getUserPromise = supabase.auth.getUser()
      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('getUser timeout')), 5000)
      )

      const { data: { user }, error: authError } = await Promise.race([getUserPromise, timeoutPromise])


      if (authError || !user) {
        throw new Error('Usuário não autenticado')
      }


      // Busca dados completos na tabela users
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('*')
        .eq('id', user.id)
        .single()


      if (userError) {
        // Se não encontrar o usuário na tabela, criar registro
        const newUserData = {
          id: user.id,
          full_name: user.user_metadata?.full_name || user.email,
          email: user.email,
          role: 'multimarca',
          tipo_negocio: 'multimarca',
          password_hash: 'managed_by_supabase_auth',
          ativo: true
        }

        const { data: createdUser, error: createError } = await supabase
          .from('users')
          .insert([newUserData])
          .select()
          .single()

        if (createError) throw createError
        return handleSupabaseSuccess(createdUser)
      }

      return handleSupabaseSuccess(userData)
    } catch (error) {
      return handleSupabaseError(error)
    }
  }

  // Logout
  async logout() {
    try {
      const { error } = await supabase.auth.signOut()
      if (error) throw error
      return handleSupabaseSuccess(true)
    } catch (error) {
      return handleSupabaseError(error)
    }
  }

  // Atualizar perfil do usuário
  async updateProfile(userId, updateData) {
    try {
      const { data, error } = await supabase
        .from('users')
        .update(updateData)
        .eq('id', userId)
        .select()
        .single()

      if (error) throw error
      return handleSupabaseSuccess(data)
    } catch (error) {
      return handleSupabaseError(error)
    }
  }

  // Verificar se email já existe
  async checkEmailExists(email) {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('email')
        .eq('email', email)
        .single()

      if (error && error.code !== 'PGRST116') { // PGRST116 = not found
        throw error
      }

      return handleSupabaseSuccess(!!data)
    } catch (error) {
      return handleSupabaseError(error)
    }
  }

  // Reset de senha
  async resetPassword(email) {
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`
      })

      if (error) throw error
      return handleSupabaseSuccess(true)
    } catch (error) {
      return handleSupabaseError(error)
    }
  }

  // Atualizar senha
  async updatePassword(newPassword) {
    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword
      })

      if (error) throw error
      return handleSupabaseSuccess(true)
    } catch (error) {
      return handleSupabaseError(error)
    }
  }

  // Listener para mudanças de autenticação
  onAuthStateChange(callback) {
    return supabase.auth.onAuthStateChange((event, session) => {
      callback(event, session)
    })
  }
}

export const authService = new AuthService()
export default authService