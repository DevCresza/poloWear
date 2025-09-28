import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://dzipfqluxwofnsyakeyq.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImR6aXBmcWx1eHdvZm5zeWFrZXlxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTg5MjE3MzgsImV4cCI6MjA3NDQ5NzczOH0.EUBslc__B5QNDEeHNqNZwziAquwJVb0KdVNUJKRrTR0'

const supabase = createClient(supabaseUrl, supabaseAnonKey)

async function createAdminUser() {
  try {
    console.log('Criando usuário admin...')

    // Primeiro, tentar fazer login para ver se o usuário já existe
    const { data: loginData, error: loginError } = await supabase.auth.signInWithPassword({
      email: 'admin@polob2b.com',
      password: 'password123'
    })

    if (loginData.user) {
      console.log('Usuário já existe:', loginData.user.id)
      return
    }

    // Criar usuário no Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: 'admin@polob2b.com',
      password: 'password123',
      options: {
        data: {
          full_name: 'Administrador POLO'
        }
      }
    })

    if (authError) {
      console.error('Erro ao criar usuário auth:', authError)
      return
    }

    console.log('Usuário auth criado:', authData.user?.id)

    // Atualizar registro na tabela users com o ID correto do auth
    if (authData.user?.id) {
      const { data: updateData, error: updateError } = await supabase
        .from('users')
        .update({
          id: authData.user.id,
          email: 'admin@polob2b.com'
        })
        .eq('email', 'admin@polo-b2b.com')
        .select()

      if (updateError) {
        console.error('Erro ao atualizar usuário na tabela users:', updateError)
      } else {
        console.log('Usuário atualizado na tabela users:', updateData)
      }
    }

    console.log('✅ Usuário admin criado com sucesso!')
    console.log('Email: admin@polob2b.com')
    console.log('Senha: password123')

  } catch (error) {
    console.error('Erro geral:', error)
  }
}

createAdminUser()