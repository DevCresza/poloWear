import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://dzipfqluxwofnsyakeyq.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImR6aXBmcWx1eHdvZm5zeWFrZXlxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTg5MjE3MzgsImV4cCI6MjA3NDQ5NzczOH0.EUBslc__B5QNDEeHNqNZwziAquwJVb0KdVNUJKRrTR0'

const supabase = createClient(supabaseUrl, supabaseAnonKey)

async function testLogin() {
  try {
    console.log('🔄 Testando login direto...')

    const { data, error } = await supabase.auth.signInWithPassword({
      email: 'admin@polob2b.com',
      password: 'password123'
    })

    if (error) {
      console.error('❌ Erro no login:', error)
      return
    }

    console.log('✅ Login bem-sucedido!')
    console.log('User ID:', data.user?.id)
    console.log('Email:', data.user?.email)
    console.log('Session:', data.session ? 'Ativa' : 'Nenhuma')

    // Testar busca na tabela users
    console.log('\n🔄 Testando busca na tabela users...')

    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('*')
      .eq('id', data.user.id)
      .single()

    if (userError) {
      console.error('❌ Erro ao buscar usuário:', userError)
      return
    }

    console.log('✅ Usuário encontrado na tabela:')
    console.log('Nome:', userData.full_name)
    console.log('Role:', userData.role)
    console.log('Tipo:', userData.tipo_negocio)

  } catch (error) {
    console.error('❌ Erro geral:', error)
  }
}

testLogin()