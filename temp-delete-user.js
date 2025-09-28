const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://dzipfqluxwofnsyakeyq.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImR6aXBmcWx1eHdvZm5zeWFrZXlxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTg5MjE3MzgsImV4cCI6MjA3NDQ5NzczOH0.EUBslc__B5QNDEeHNqNZwziAquwJVb0KdVNUJKRrTR0';

const supabase = createClient(supabaseUrl, supabaseKey);

async function deleteFromAuth() {
  try {
    console.log('🔐 Fazendo login como admin...');

    const { data: adminData, error: adminError } = await supabase.auth.signInWithPassword({
      email: 'admin@polob2b.com',
      password: 'password123'
    });

    if (adminError) {
      console.error('❌ Erro ao fazer login como admin:', adminError.message);
      return;
    }

    console.log('✅ Login admin realizado:', adminData.user.email);

    // Tentar listar usuários (vai falhar mas é esperado)
    const { data: listData, error: listError } = await supabase.auth.admin.listUsers();

    if (listError) {
      console.log('❌ Como esperado, não temos permissões admin:', listError.message);
      console.log('');
      console.log('📝 INSTRUÇÕES PARA EXCLUIR MANUALMENTE:');
      console.log('');
      console.log('1. Acesse: https://supabase.com/dashboard/project/dzipfqluxwofnsyakeyq/auth/users');
      console.log('2. Faça login na sua conta Supabase');
      console.log('3. Procure por: fornecedor@fornecedor.com');
      console.log('4. Clique nos 3 pontos (⋮) ao lado do usuário');
      console.log('5. Selecione "Delete user"');
      console.log('6. Confirme a exclusão');
      console.log('');
      console.log('⚠️ Isso removerá o usuário completamente do Supabase Auth');
      console.log('✅ Depois disso, você poderá criar o usuário normalmente na aplicação');
    } else {
      // Se por acaso funcionou, tentar excluir
      const targetUser = listData.users.find(user => user.email === 'fornecedor@fornecedor.com');

      if (targetUser) {
        console.log('📋 Usuário encontrado:', targetUser.id);

        const { error: deleteError } = await supabase.auth.admin.deleteUser(targetUser.id);

        if (deleteError) {
          console.error('❌ Erro ao excluir:', deleteError.message);
        } else {
          console.log('✅ Usuário excluído do Auth!');
        }
      } else {
        console.log('❌ Usuário não encontrado');
      }
    }

    await supabase.auth.signOut();

  } catch (err) {
    console.error('❌ Erro:', err.message);
  }
}

deleteFromAuth();