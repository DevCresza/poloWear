import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { PendingUser } from '@/api/entities';
import { supabase } from '@/lib/supabase';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Eye, EyeOff, Users, AlertTriangle } from 'lucide-react';
import { useNotification } from '@/hooks/useNotification';
import { Notification } from '@/components/ui/notification';

export default function ClientForm({ user, onSuccess, onCancel, clientMode = false }) {
  const [formData, setFormData] = useState({
    full_name: '',
    email: '',
    password: '',
    role: clientMode ? 'multimarca' : 'multimarca'
  });
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [useAlternativeMethod, setUseAlternativeMethod] = useState(false);
  const notification = useNotification();

  useEffect(() => {
    if (user) {
      setFormData({
        full_name: user.full_name || '',
        email: user.email || '',
        password: '',
        role: user.role || 'multimarca'
      });
    }
  }, [user]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (!user) {
        // Criar novo usuário diretamente
        const userData = {
          full_name: formData.full_name,
          email: formData.email,
          password_hash: formData.password || 'user_default_password',
          role: formData.role,
          tipo_negocio: formData.role === 'admin' ? 'admin' :
                       formData.role === 'fornecedor' ? 'fornecedor' : 'multimarca',
          telefone: '',
          ativo: true
        };

        const { data, error } = await supabase
          .from('users')
          .insert([userData])
          .select();

        if (error) throw error;

        notification.showSuccess(`Cliente "${formData.full_name}" foi criado com sucesso!`);

      } else if (useAlternativeMethod) {
        // Usar método alternativo - salvar como usuário pendente
        const pendingUserData = {
          full_name: formData.full_name,
          email: formData.email,
          role: formData.role,
          tipo_negocio: formData.role === 'admin' ? 'admin' :
                       formData.role === 'fornecedor' ? 'fornecedor' : 'multimarca',
          status: 'pendente',
          password_temporaria: formData.password,
          data_criacao: new Date().toISOString()
        };

        await PendingUser.create(pendingUserData);

        notification.showInfo(`Usuário "${formData.full_name}" foi salvo como pendente.`);

      } else {
        // Tentar método tradicional apenas para edição
        const dataToSubmit = {
          full_name: formData.full_name,
          email: formData.email,
          role: formData.role
        };

        if (formData.password && formData.password.trim() !== '') {
          dataToSubmit.password_hash = formData.password;
        }

        const { error } = await supabase
          .from('users')
          .update(dataToSubmit)
          .eq('id', user.id);

        if (error) throw error;

        notification.showSuccess('Usuário atualizado com sucesso!');
      }
      
      onSuccess();

    } catch (error) {
      console.error('Erro detalhado ao salvar usuário:', error);

      if (!useAlternativeMethod && !user && !clientMode) {
        setUseAlternativeMethod(true);
        notification.showInfo('Tentando método alternativo...');
        return;
      }

      notification.showError('Falha ao salvar usuário. Verifique os dados e tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="w-5 h-5" />
          {user ? 'Editar Usuário' : 'Novo Usuário'}
        </CardTitle>
        <CardDescription>
          {user ? 'Editando usuário existente' :
           clientMode ? 'Cadastrando novo cliente' : 'Sistema alternativo para contornar problemas técnicos'}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {!user && !clientMode && (
          <Alert className="mb-6 border-blue-200 bg-blue-50">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription className="text-blue-800">
              <strong>Método Alternativo:</strong> Este usuário será salvo como "pendente" e você precisará convidá-lo manualmente pelo painel administrativo.
            </AlertDescription>
          </Alert>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="full_name">Nome Completo *</Label>
              <Input
                id="full_name"
                value={formData.full_name}
                onChange={e => setFormData({...formData, full_name: e.target.value})}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email *</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={e => setFormData({...formData, email: e.target.value})}
                required
              />
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="password">Senha {!user && '*'}</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={formData.password}
                  onChange={e => setFormData({...formData, password: e.target.value})}
                  required={!user}
                  placeholder={user ? "Deixe em branco para manter a atual" : "Senha temporária"}
                />
                <button
                  type="button"
                  className="absolute right-3 top-1/2 transform -translate-y-1/2"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <EyeOff className="w-4 h-4 text-gray-500" /> : <Eye className="w-4 h-4 text-gray-500" />}
                </button>
              </div>
            </div>
            {!clientMode && (
              <div className="space-y-2">
                <Label htmlFor="role">Função no Sistema *</Label>
                <Select value={formData.role} onValueChange={value => setFormData({...formData, role: value})}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="multimarca">Multimarca</SelectItem>
                    <SelectItem value="fornecedor">Fornecedor</SelectItem>
                    <SelectItem value="admin">Administrador</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>
          
          <div className="flex justify-end gap-4 pt-6">
            <Button type="button" variant="outline" onClick={onCancel}>
              Cancelar
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Salvando...' : (user ? 'Atualizar Usuário' :
               clientMode ? 'Criar Cliente' : 'Criar Usuário Pendente')}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>

    <Notification
      show={notification.showNotification}
      message={notification.notificationMessage}
      type={notification.notificationType}
      onClose={notification.hideNotification}
    />
    </>
  );
}