import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar as CalendarPicker } from '@/components/ui/calendar';
import { useNotification } from '@/hooks/useNotification';
import { Notification } from '@/components/ui/notification';
import { Contact } from '@/api/entities';
import { PendingUser } from '@/api/entities';
import { User } from '@/api/entities';
import { SendEmail } from '@/api/integrations';
import { 
  Building, MapPin, Phone, Mail, MessageSquare, Calendar, DollarSign,
  Store, Save, X, Info, Bell, Calendar as CalendarIcon, UserPlus, CheckCircle, AlertCircle
} from 'lucide-react';
import { format } from 'date-fns';

export default function ContactDetailsModal({ contact, onClose, onUpdate }) {
  const [observacoes, setObservacoes] = useState(contact?.observacoes || '');
  const [status, setStatus] = useState(contact?.status || 'novo');
  const [proximaAcaoData, setProximaAcaoData] = useState(contact?.proxima_acao_data ? new Date(contact.proxima_acao_data) : null);
  const [proximaAcaoDescricao, setProximaAcaoDescricao] = useState(contact?.proxima_acao_descricao || '');
  const [saving, setSaving] = useState(false);
  const [converting, setConverting] = useState(false);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const { showSuccess, showError, showNotification, notificationMessage, notificationType, hideNotification } = useNotification();

  // Helper para formatar data de forma segura
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return 'N/A';
      return format(date, 'dd/MM/yyyy HH:mm');
    } catch (error) {
      console.warn('Erro ao formatar data:', dateString, error);
      return 'N/A';
    }
  };

  const statusOptions = [
    { value: 'novo', label: 'Novo Lead', color: 'bg-blue-500' },
    { value: 'em_contato', label: 'Em Contato', color: 'bg-yellow-500' },
    { value: 'negociacao', label: 'Negociação', color: 'bg-orange-500' },
    { value: 'convertido', label: 'Convertido em Cliente', color: 'bg-green-500' },
    { value: 'finalizado', label: 'Finalizado', color: 'bg-gray-500' },
    { value: 'cancelado', label: 'Cancelado', color: 'bg-red-500' }
  ];

  // Função para gerar código do cliente
  const generateClientCode = async () => {
    try {
      // Buscar o maior código existente
      const users = await User.list();
      const existingCodes = users
        .filter(u => u.codigo_cliente && u.codigo_cliente.startsWith('33'))
        .map(u => parseInt(u.codigo_cliente.substring(2)))
        .filter(num => !isNaN(num));
      
      const nextNumber = existingCodes.length > 0 ? Math.max(...existingCodes) + 1 : 1;
      return `33${nextNumber.toString().padStart(4, '0')}`;
    } catch (error) {
      console.error('Erro ao gerar código do cliente:', error);
      return `33${Date.now().toString().slice(-4)}`;
    }
  };

  const formatPhone = (phone) => {
    if (!phone) return '';
    const cleaned = phone.replace(/\D/g, '');
    if (cleaned.length === 11) {
      return `(${cleaned.slice(0,2)}) ${cleaned.slice(2,7)}-${cleaned.slice(7)}`;
    }
    return phone;
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await Contact.update(contact.id, {
        observacoes,
        status,
        proxima_acao_data: proximaAcaoData ? proximaAcaoData.toISOString() : null,
        proxima_acao_descricao: proximaAcaoDescricao,
        ultimo_contato: new Date().toISOString()
      });
      onUpdate();
      onClose();
    } catch (error) {
      console.error('Erro ao salvar:', error);
      showError('Erro ao salvar alterações');
    } finally {
      setSaving(false);
    }
  };

  const handleConvertToClient = () => {
    setShowConfirmDialog(true);
  };

  const confirmConversion = async () => {
    setShowConfirmDialog(false);

    setConverting(true);
    try {
      // 1. Gerar código do cliente
      const codigoCliente = await generateClientCode();
      
      // 2. Gerar senha temporária
      const passwordTemp = Math.random().toString(36).slice(-8);
      
      // 3. Criar usuário pendente
      const userData = {
        full_name: contact.nome,
        email: contact.email,
        password_temporaria: passwordTemp,
        role: 'multimarca',
        tipo_negocio: 'multimarca',
        nome_empresa: contact.empresa,
        telefone: contact.telefone,
        cidade: contact.cidade,
        estado: contact.estado,
        permissoes: {
          ver_dashboard: true,
          ver_catalogo: true,
          ver_capsulas: true,
          ver_pronta_entrega: true,
          fazer_pedidos: true,
          ver_meus_pedidos: true
        },
        status: 'pendente',
        data_criacao: new Date().toISOString(),
        observacoes: `Cliente convertido do lead ${contact.id}. Código: ${codigoCliente}`
      };

      await PendingUser.create(userData);

      // 4. Enviar email de boas-vindas
      await SendEmail({
        to: contact.email,
        subject: `🎉 Bem-vindo ao Portal B2B POLO Wear! - Cliente ${codigoCliente}`,
        body: `Olá ${contact.nome}!

🎉 Parabéns! Seu cadastro no Portal B2B da POLO Wear foi aprovado!

📋 SEUS DADOS:
• Código Cliente: ${codigoCliente}
• Email: ${contact.email}
• Empresa: ${contact.empresa}

🔐 PRÓXIMOS PASSOS:
Em breve você receberá um convite por email para ativar sua conta e definir sua senha.

🛍️ COM SEU ACESSO VOCÊ PODERÁ:
✅ Navegar por todo o catálogo
✅ Ver preços especiais B2B
✅ Fazer pedidos online
✅ Acompanhar status dos pedidos
✅ Acessar cápsulas exclusivas

📞 DÚVIDAS?
Entre em contato conosco ou aguarde nosso contato para orientações.

Bem-vindo à família POLO Wear!

Atenciosamente,
Equipe POLO Wear B2B`
      });

      // 5. Atualizar o lead como convertido
      await Contact.update(contact.id, {
        status: 'convertido',
        convertido_em_cliente: true,
        data_conversao: new Date().toISOString(),
        codigo_cliente_gerado: codigoCliente,
        observacoes: (contact.observacoes || '') + `\n\n[${new Date().toLocaleString()}] CONVERTIDO EM CLIENTE\n• Código: ${codigoCliente}\n• Email de boas-vindas enviado\n• Usuário criado no sistema`
      });

      showSuccess(`Lead convertido com sucesso! Cliente: ${contact.nome} - Código: ${codigoCliente}. Email enviado com sucesso.`);

      setTimeout(() => {
        onUpdate();
        onClose();
      }, 2000);

    } catch (error) {
      console.error('Erro ao converter lead:', error);
      showError('Erro ao converter lead em cliente. Verifique se o email já não está cadastrado no sistema.');
    } finally {
      setConverting(false);
    }
  };

  const openWhatsApp = () => {
    const phone = contact.telefone.replace(/\D/g, '');
    const message = `Olá ${contact.nome}! Somos da POLO Wear e recebemos seu interesse em se tornar uma multimarca. Gostaria de conversar sobre as oportunidades?`;
    const url = `https://wa.me/55${phone}?text=${encodeURIComponent(message)}`;
    window.open(url, '_blank');
  };

  if (!contact) return null;

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <span className="flex items-center gap-2">
              Detalhes do Lead
              {contact.convertido_em_cliente && (
                <Badge className="bg-green-100 text-green-800">
                  <CheckCircle className="w-3 h-3 mr-1" />
                  Cliente {contact.codigo_cliente_gerado}
                </Badge>
              )}
            </span>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="w-4 h-4" />
            </Button>
          </DialogTitle>
        </DialogHeader>
        
        <div className="grid md:grid-cols-2 gap-x-8 gap-y-6 pt-4">
          {/* Coluna Esquerda: Informações e Ações */}
          <div className="space-y-6">
            {/* Informações Pessoais */}
            <div>
              <h3 className="font-semibold text-lg mb-3">{contact.nome}</h3>
              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-2"><Mail className="w-4 h-4 text-gray-500" /><span>{contact.email}</span></div>
                <div className="flex items-center gap-2"><Phone className="w-4 h-4 text-gray-500" /><span>{formatPhone(contact.telefone)}</span></div>
                <div className="flex items-center gap-2"><Building className="w-4 h-4 text-gray-500" /><span>{contact.empresa}</span></div>
                <div className="flex items-center gap-2"><MapPin className="w-4 h-4 text-gray-500" /><span>{contact.cidade}, {contact.estado}</span></div>
              </div>
            </div>

            {/* Próxima Ação */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                <Bell className="w-4 h-4" /> Próxima Ação
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="justify-start text-left font-normal h-10">
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {proximaAcaoData ? format(proximaAcaoData, 'dd/MM/yyyy') : <span>Escolha a data</span>}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <CalendarPicker mode="single" selected={proximaAcaoData} onSelect={setProximaAcaoData} initialFocus />
                  </PopoverContent>
                </Popover>
                <Input
                  value={proximaAcaoDescricao}
                  onChange={(e) => setProximaAcaoDescricao(e.target.value)}
                  placeholder="Descrição da ação"
                  className="h-10"
                />
              </div>
            </div>
            
            {/* Ações */}
            <div className="space-y-3">
              {!contact.convertido_em_cliente && (
                <Button 
                  onClick={handleConvertToClient}
                  disabled={converting}
                  className="w-full bg-green-600 hover:bg-green-700 text-white"
                >
                  {converting ? (
                    'Convertendo...'
                  ) : (
                    <>
                      <UserPlus className="w-4 h-4 mr-2" />
                      Converter em Cliente
                    </>
                  )}
                </Button>
              )}
              
              <div className="flex gap-3">
                <Button onClick={openWhatsApp} className="flex-1 bg-green-600 hover:bg-green-700">
                  <MessageSquare className="w-4 h-4 mr-2" /> WhatsApp
                </Button>
                <Button onClick={handleSave} disabled={saving} className="flex-1 bg-blue-600 hover:bg-blue-700">
                  {saving ? 'Salvando...' : <><Save className="w-4 h-4 mr-2" /> Salvar</>}
                </Button>
              </div>
            </div>

            {/* Aviso se já convertido */}
            {contact.convertido_em_cliente && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                  <span className="font-semibold text-green-800">Lead Convertido!</span>
                </div>
                <div className="mt-2 text-sm text-green-700">
                  <p>Código Cliente: <strong>{contact.codigo_cliente_gerado}</strong></p>
                  <p>Convertido em: {new Date(contact.data_conversao).toLocaleDateString()}</p>
                </div>
              </div>
            )}
          </div>
          
          {/* Coluna Direita: Status e Observações */}
          <div className="space-y-6">
            {/* Detalhes do Lead */}
            <div className="space-y-3 bg-gray-50 p-4 rounded-lg">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium text-gray-700">Status</label>
                <Select 
                  value={status} 
                  onValueChange={setStatus}
                  disabled={contact.convertido_em_cliente}
                >
                  <SelectTrigger className="w-[180px] h-9">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {statusOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        <div className="flex items-center gap-2">
                          <div className={`w-2 h-2 rounded-full ${option.color}`} />
                          {option.label}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center gap-2 text-sm">
                <Info className="w-4 h-4 text-gray-500" /> 
                Fonte: <Badge variant="secondary">{contact.fonte_lead}</Badge>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <DollarSign className="w-4 h-4 text-gray-500" /> 
                Faturamento: <Badge className="bg-blue-100 text-blue-800">{contact.faixa_faturamento}</Badge>
              </div>
              {contact.tem_loja_fisica === 'sim' && (
                <div className="flex items-center gap-2 text-sm">
                  <Store className="w-4 h-4 text-gray-500" /> Possui Loja Física
                </div>
              )}
              
              <div className="text-xs text-gray-500 pt-2 border-t">
                <div className="flex items-center gap-1">
                  <Calendar className="w-3 h-3" />
                  Cadastrado em: {formatDate(contact.created_date)}
                </div>
                {contact.ultimo_contato && (
                  <div className="flex items-center gap-1 mt-1">
                    <Calendar className="w-3 h-3" />
                    Último contato: {formatDate(contact.ultimo_contato)}
                  </div>
                )}
              </div>
            </div>

            {/* Observações */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Observações e Anotações</label>
              <Textarea
                value={observacoes}
                onChange={(e) => setObservacoes(e.target.value)}
                placeholder="Adicione observações sobre este lead..."
                className="h-32"
              />
            </div>
          </div>
        </div>

        <Notification
          show={showNotification}
          message={notificationMessage}
          type={notificationType}
          onClose={hideNotification}
        />

        {/* Diálogo de Confirmação */}
        <Dialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Confirmar Conversão</DialogTitle>
            </DialogHeader>
            <div className="py-4">
              <p className="text-sm text-gray-700 mb-4">
                Tem certeza que deseja converter <strong>{contact?.nome}</strong> em cliente?
              </p>
              <div className="text-sm text-gray-600 space-y-1">
                <p>• Criar um usuário no sistema</p>
                <p>• Gerar código de cliente</p>
                <p>• Liberar acesso ao catálogo</p>
                <p>• Enviar credenciais por email</p>
              </div>
            </div>
            <div className="flex justify-end gap-3">
              <Button
                variant="outline"
                onClick={() => setShowConfirmDialog(false)}
              >
                Cancelar
              </Button>
              <Button
                onClick={confirmConversion}
                disabled={converting}
                className="bg-green-600 hover:bg-green-700"
              >
                {converting ? 'Convertendo...' : 'Confirmar'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </DialogContent>
    </Dialog>
  );
}