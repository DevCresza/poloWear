
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch'; // Import Switch component
import { Fornecedor } from '@/api/entities';
import { useNotification } from '@/hooks/useNotification';
import { Notification } from '@/components/ui/notification';
import { Building, DollarSign, Mail, Phone, User as UserIcon, Shield } from 'lucide-react'; // Import Shield icon

export default function FornecedorForm({ fornecedor, onSuccess, onCancel }) {
  const [formData, setFormData] = useState({
    nome_marca: '',
    razao_social: '',
    cnpj: '',
    pedido_minimo_valor: 0,
    email_fornecedor: '', // New field
    senha_fornecedor: '', // New field
    ativo_fornecedor: true, // New field, default to true
    contato_envio_nome: '',
    contato_envio_email: '',
    contato_envio_telefone: '',
    contato_financeiro_nome: '',
    contato_financeiro_email: '',
    contato_financeiro_telefone: ''
  });
  const [loading, setLoading] = useState(false);

  const {
    showSuccess,
    showError,
    showNotification,
    notificationMessage,
    notificationType
  } = useNotification();

  useEffect(() => {
    if (fornecedor) {
      setFormData({
        ...fornecedor,
        pedido_minimo_valor: fornecedor.pedido_minimo_valor || 0,
        email_fornecedor: fornecedor.email_fornecedor || '', // Initialize new field
        senha_fornecedor: fornecedor.senha_fornecedor || '', // Initialize new field
        ativo_fornecedor: fornecedor.ativo_fornecedor !== undefined ? fornecedor.ativo_fornecedor : true, // Initialize new field
        contato_envio_nome: fornecedor.contato_envio_nome || '',
        contato_envio_email: fornecedor.contato_envio_email || '',
        contato_envio_telefone: fornecedor.contato_envio_telefone || '',
        contato_financeiro_nome: fornecedor.contato_financeiro_nome || '',
        contato_financeiro_email: fornecedor.contato_financeiro_email || '',
        contato_financeiro_telefone: fornecedor.contato_financeiro_telefone || ''
      });
    }
  }, [fornecedor]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const dataToSave = {
        ...formData,
        pedido_minimo_valor: parseFloat(formData.pedido_minimo_valor) || 0
      };

      let result;
      if (fornecedor) {
        result = await Fornecedor.update(fornecedor.id, dataToSave);
      } else {
        result = await Fornecedor.create(dataToSave);
      }

      // Verificar se a operação foi bem-sucedida
      if (!result || !result.success) {
        throw new Error(result?.error || 'Falha ao salvar fornecedor no banco de dados');
      }

      showSuccess(fornecedor ? 'Fornecedor atualizado com sucesso!' : 'Fornecedor criado com sucesso!');
      setTimeout(() => {
        onSuccess();
      }, 1500);
    } catch (error) {
      console.error('Erro ao salvar fornecedor:', error);

      let errorMessage = 'Falha ao salvar fornecedor. Verifique os campos.';

      if (error.message) {
        if (error.message.includes('duplicate key') || error.message.includes('unique')) {
          errorMessage = 'Já existe um fornecedor com este CNPJ ou email.';
        } else if (error.message.includes('violates check constraint')) {
          errorMessage = 'Dados inválidos. Verifique os campos preenchidos.';
        } else {
          errorMessage = `Erro: ${error.message}`;
        }
      }

      showError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>{fornecedor ? 'Editar Fornecedor' : 'Novo Fornecedor'}</CardTitle>
        <CardDescription>Gerencie as informações, acesso e contatos do fornecedor.</CardDescription> {/* Updated description */}
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Informações Principais */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-gray-800 border-b pb-2 flex items-center gap-2"><Building className="w-5 h-5"/>Informações Principais</h3>
            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="nome_marca">Nome da Marca</Label>
                <Input
                  id="nome_marca"
                  value={formData.nome_marca}
                  onChange={e => setFormData({...formData, nome_marca: e.target.value})}
                  placeholder="Digite o nome da marca"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="razao_social">Razão Social *</Label>
                <Input id="razao_social" value={formData.razao_social} onChange={e => setFormData({...formData, razao_social: e.target.value})} required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="cnpj">CNPJ</Label>
                <Input id="cnpj" value={formData.cnpj} onChange={e => setFormData({...formData, cnpj: e.target.value})} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="pedido_minimo_valor">Valor Mínimo do Pedido (R$) *</Label> {/* Label updated */}
                <Input id="pedido_minimo_valor" type="number" step="0.01" min="0" value={formData.pedido_minimo_valor} onChange={e => setFormData({...formData, pedido_minimo_valor: e.target.value})} placeholder="0.00" required /> {/* min="0" added */}
                <p className="text-xs text-gray-600">Valor mínimo que o cliente deve comprar deste fornecedor</p> {/* Helper text added */}
              </div>
            </div>
          </div>

          {/* Acesso do Fornecedor */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-gray-800 border-b pb-2 flex items-center gap-2"><Shield className="w-5 h-5"/>Acesso ao Sistema</h3> {/* New section with Shield icon */}
            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="email_fornecedor">Email de Acesso</Label>
                <Input 
                  id="email_fornecedor" 
                  type="email" 
                  value={formData.email_fornecedor} 
                  onChange={e => setFormData({...formData, email_fornecedor: e.target.value})} 
                  placeholder="fornecedor@exemplo.com"
                />
                <p className="text-xs text-gray-600">Email que o fornecedor usará para acessar seus pedidos</p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="senha_fornecedor">Senha de Acesso</Label>
                <Input 
                  id="senha_fornecedor" 
                  type="password" 
                  value={formData.senha_fornecedor} 
                  onChange={e => setFormData({...formData, senha_fornecedor: e.target.value})} 
                  placeholder="Digite uma senha"
                />
                <p className="text-xs text-gray-600">Senha para acesso do fornecedor ao sistema</p>
              </div>
              <div className="flex items-center space-x-2">
                <Switch
                  id="ativo_fornecedor"
                  checked={formData.ativo_fornecedor}
                  onCheckedChange={(checked) => setFormData({...formData, ativo_fornecedor: checked})}
                />
                <Label htmlFor="ativo_fornecedor">Fornecedor ativo no sistema</Label>
              </div>
            </div>
          </div>

          {/* Contato de Envio */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-gray-800 border-b pb-2 flex items-center gap-2"><UserIcon className="w-5 h-5"/>Contato de Envio</h3>
            <div className="grid md:grid-cols-3 gap-6">
              <div className="space-y-2">
                <Label htmlFor="contato_envio_nome">Nome</Label>
                <Input id="contato_envio_nome" value={formData.contato_envio_nome} onChange={e => setFormData({...formData, contato_envio_nome: e.target.value})} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="contato_envio_email">Email</Label>
                <Input id="contato_envio_email" type="email" value={formData.contato_envio_email} onChange={e => setFormData({...formData, contato_envio_email: e.target.value})} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="contato_envio_telefone">Telefone</Label>
                <Input id="contato_envio_telefone" value={formData.contato_envio_telefone} onChange={e => setFormData({...formData, contato_envio_telefone: e.target.value})} />
              </div>
            </div>
          </div>

          {/* Contato Financeiro */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-gray-800 border-b pb-2 flex items-center gap-2"><DollarSign className="w-5 h-5"/>Contato Financeiro</h3>
            <div className="grid md:grid-cols-3 gap-6">
              <div className="space-y-2">
                <Label htmlFor="contato_financeiro_nome">Nome</Label>
                <Input id="contato_financeiro_nome" value={formData.contato_financeiro_nome} onChange={e => setFormData({...formData, contato_financeiro_nome: e.target.value})} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="contato_financeiro_email">Email</Label>
                <Input id="contato_financeiro_email" type="email" value={formData.contato_financeiro_email} onChange={e => setFormData({...formData, contato_financeiro_email: e.target.value})} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="contato_financeiro_telefone">Telefone</Label>
                <Input id="contato_financeiro_telefone" value={formData.contato_financeiro_telefone} onChange={e => setFormData({...formData, contato_financeiro_telefone: e.target.value})} />
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-4 pt-4">
            <Button type="button" variant="outline" onClick={onCancel}>Cancelar</Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Salvando...' : 'Salvar Fornecedor'}
            </Button>
          </div>
        </form>
      </CardContent>

      <Notification
        show={showNotification}
        message={notificationMessage}
        type={notificationType}
      />
    </Card>
  );
}
