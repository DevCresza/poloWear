
import React, { useState, useEffect } from 'react';
import { Contact, LeadArquivado } from '@/api/entities';
import { UserCompat as User } from '@/api/entities';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { SendEmail } from '@/api/integrations';
import ContactCard from '../components/crm/ContactCard';
import ContactDetailsModal from '../components/crm/ContactDetailsModal';
import WhatsappModal from '../components/crm/WhatsappModal';
import ArchivedLeadsModal from '../components/crm/ArchivedLeadsModal';
import ArchiveConfirmModal from '../components/crm/ArchiveConfirmModal';
import CrmHeader from '../components/crm/CrmHeader';
import { useNotification } from '@/hooks/useNotification';
import { Notification } from '@/components/ui/notification';
import { Users, Clock, MessageCircle, CheckCircle, X, Archive } from 'lucide-react';

export default function CrmDashboard() {
  const [contacts, setContacts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedContact, setSelectedContact] = useState(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showWhatsappModal, setShowWhatsappModal] = useState(false);
  const [showArchivedModal, setShowArchivedModal] = useState(false);
  const [showArchiveConfirmModal, setShowArchiveConfirmModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState({ fonte_lead: 'all', estado: 'all' });
  const [currentUser, setCurrentUser] = useState(null);

  const {
    showSuccess,
    showError,
    showInfo,
    showNotification,
    notificationMessage,
    notificationType
  } = useNotification();

  useEffect(() => {
    loadContacts();
  }, []);

  useEffect(() => {
    const loadCurrentUser = async () => {
      try {
        const userData = await User.me();
        setCurrentUser(userData);
      } catch (error) {
        console.error('Erro ao carregar usuário:', error);
        setCurrentUser({ full_name: 'Usuário' }); // Fallback
      }
    };

    loadCurrentUser();
  }, []);

  const loadContacts = async () => {
    try {
      const contactsResult = await Contact.find({ order: { column: 'created_at', ascending: false } });
      const contacts = contactsResult?.success ? contactsResult.data : [];
      setContacts(contacts);
    } catch (error) {
      console.error('Erro ao carregar contatos:', error);
      setContacts([]); // Definir array vazio em caso de erro
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (filterType, value) => {
    setFilters(prev => ({ ...prev, [filterType]: value }));
  };

  const filteredContacts = React.useMemo(() => {
    let filtered = contacts || [];
    
    if (searchTerm) {
      filtered = filtered.filter(contact =>
        contact.nome?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        contact.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        contact.empresa?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    if (filters.fonte_lead !== 'all') {
      filtered = filtered.filter(contact => contact.fonte_lead === filters.fonte_lead);
    }
    
    if (filters.estado !== 'all') {
      filtered = filtered.filter(contact => contact.estado === filters.estado);
    }
    
    return filtered;
  }, [contacts, searchTerm, filters]);

  const handleStatusChange = async (contactId, newStatus) => {
    try {
      await Contact.update(contactId, {
        status: newStatus
      });
      loadContacts();
    } catch (error) {
      console.error('Erro ao atualizar status:', error);
    }
  };

  const handleCreateUser = async (contact) => {
    if (!confirm(`Tem certeza que deseja converter "${contact.nome}" em um cliente e liberar o acesso ao catálogo?`)) {
      return;
    }

    try {
      // 1. Criar usuário no sistema com permissões básicas
      const userData = {
        email: contact.email,
        full_name: contact.nome,
        nome_empresa: contact.empresa,
        telefone: contact.telefone,
        cidade: contact.cidade,
        estado: contact.estado,
        tipo_negocio: 'multimarca',
        role: 'multimarca',
        total_compras_realizadas: 0,
        permissoes: {
          ver_capsulas: true,
          ver_pronta_entrega: true,
          ver_programacao: true,
          ver_relatorios: false,
          ver_precos_custo: false
        }
      };

      await User.create(userData);

      // 2. Enviar email de boas-vindas com credenciais (simulado)
      await SendEmail({
        to: contact.email,
        subject: 'Bem-vindo ao Portal B2B POLO Wear!',
        body: `Olá ${contact.nome},\n\nSeu acesso ao Portal B2B da POLO Wear foi liberado!\n\nUse seu email (${contact.email}) para fazer o login. Você será solicitado a criar uma senha no primeiro acesso.\n\nAcesse o portal e explore nosso catálogo completo.\n\nAtenciosamente,\nEquipe POLO Wear`
      });

      // 3. Atualizar status do contato para 'convertido'
      await Contact.update(contact.id, { 
        status: 'convertido', // Change status to 'convertido'
        ultimo_contato: new Date().toISOString(),
        observacoes: (contact.observacoes || '') + '\n[Sistema] Usuário criado e email de boas-vindas enviado.'
      });

      showSuccess('Cliente criado com sucesso! Um email de boas-vindas foi enviado.');
      loadContacts();

    } catch (error) {
      console.error('Erro ao criar usuário:', error);
      showError('Erro ao criar cliente. Verifique se o email já não está cadastrado no sistema.');
    }
  };

  const handleArchive = (contact) => {
    setSelectedContact(contact);
    setShowArchiveConfirmModal(true);
  };

  const handleConfirmArchive = async (motivo) => {
    try {
      // Arquivar o lead
      const result = await LeadArquivado.arquivarLead(
        selectedContact,
        selectedContact.status,
        currentUser?.full_name || 'Usuário',
        motivo
      );

      if (result.success) {
        // Remover o lead da lista ativa
        await Contact.delete(selectedContact.id);

        showSuccess(`Lead "${selectedContact.nome}" arquivado com sucesso!`);
        await loadContacts();
      } else {
        throw new Error(result.error || 'Erro ao arquivar lead');
      }
    } catch (error) {
      console.error('Erro ao arquivar lead:', error);
      showError('Erro ao arquivar lead. Tente novamente.');
    } finally {
      setShowArchiveConfirmModal(false);
      setSelectedContact(null);
    }
  };

  const handleExportArchived = async (format) => {
    try {
      const result = await LeadArquivado.find({
        order: { column: 'data_arquivamento', ascending: false }
      });

      if (!result.success) {
        showError('Erro ao buscar leads arquivados para exportação');
        return;
      }

      const leads = result.data;

      if (format === 'csv') {
        const headers = [
          'Nome',
          'Email',
          'Telefone',
          'Empresa',
          'Cidade',
          'Estado',
          'Status Final',
          'Fonte Lead',
          'Faixa Faturamento',
          'Data Criação Original',
          'Data Arquivamento',
          'Arquivado Por',
          'Motivo Arquivamento',
          'Observações'
        ];

        const csvContent = [
          headers.join(','),
          ...leads.map(lead => [
            lead.nome || '',
            lead.email || '',
            lead.telefone || '',
            lead.empresa || '',
            lead.cidade || '',
            lead.estado || '',
            lead.status_final || '',
            lead.fonte_lead || '',
            lead.faixa_faturamento || '',
            lead.data_criacao_original || '',
            lead.data_arquivamento || '',
            lead.arquivado_por || '',
            lead.motivo_arquivamento || '',
            (lead.observacoes || '').replace(/,/g, ';')
          ].map(field => `"${field}"`).join(','))
        ].join('\n');

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `leads-arquivados-${new Date().toISOString().split('T')[0]}.csv`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        a.remove();

        showSuccess('Arquivo CSV exportado com sucesso!');
      } else if (format === 'pdf') {
        const htmlContent = `
          <!DOCTYPE html>
          <html>
          <head>
            <meta charset="UTF-8">
            <title>Leads Arquivados - POLO B2B</title>
            <style>
              body { font-family: Arial, sans-serif; margin: 20px; }
              h1 { color: #2563eb; text-align: center; margin-bottom: 30px; }
              table { width: 100%; border-collapse: collapse; margin-top: 20px; }
              th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
              th { background-color: #f8fafc; font-weight: bold; }
              tr:nth-child(even) { background-color: #f9f9f9; }
              .header-info { margin-bottom: 20px; }
              .status-convertido { background-color: #dcfce7; color: #166534; padding: 2px 6px; border-radius: 4px; }
              .status-cancelado { background-color: #fef2f2; color: #dc2626; padding: 2px 6px; border-radius: 4px; }
            </style>
          </head>
          <body>
            <h1>📋 Relatório de Leads Arquivados</h1>
            <div class="header-info">
              <p><strong>Data do Relatório:</strong> ${new Date().toLocaleDateString('pt-BR')}</p>
              <p><strong>Total de Leads:</strong> ${leads.length}</p>
            </div>
            <table>
              <thead>
                <tr>
                  <th>Nome</th>
                  <th>Empresa</th>
                  <th>Email</th>
                  <th>Status Final</th>
                  <th>Data Arquivamento</th>
                  <th>Arquivado Por</th>
                </tr>
              </thead>
              <tbody>
                ${leads.map(lead => `
                  <tr>
                    <td>${lead.nome || 'N/A'}</td>
                    <td>${lead.empresa || 'N/A'}</td>
                    <td>${lead.email || 'N/A'}</td>
                    <td><span class="status-${lead.status_final}">${lead.status_final || 'N/A'}</span></td>
                    <td>${lead.data_arquivamento ? new Date(lead.data_arquivamento).toLocaleDateString('pt-BR') : 'N/A'}</td>
                    <td>${lead.arquivado_por || 'N/A'}</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </body>
          </html>
        `;

        const blob = new Blob([htmlContent], { type: 'text/html' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `leads-arquivados-${new Date().toISOString().split('T')[0]}.html`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        a.remove();

        // Abrir em nova aba para visualização/impressão
        const newWindow = window.open();
        newWindow.document.write(htmlContent);
        newWindow.document.close();

        showSuccess('Relatório PDF gerado com sucesso!');
      }
    } catch (error) {
      console.error('Erro ao exportar leads arquivados:', error);
      showError('Erro ao exportar dados dos leads arquivados');
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      novo: 'bg-blue-500',
      em_contato: 'bg-yellow-500',
      negociacao: 'bg-purple-500',
      convertido: 'bg-green-500',
      cancelado: 'bg-red-500'
    };
    return colors[status] || 'bg-gray-500';
  };

  const getStatusIcon = (status) => {
    const icons = {
      novo: Clock,
      em_contato: MessageCircle,
      negociacao: Users,
      convertido: CheckCircle,
      cancelado: X
    };
    return icons[status] || Clock;
  };

  const statusColumns = [
    { key: 'novo', title: 'Novos Leads', color: 'border-blue-500' },
    { key: 'em_contato', title: 'Em Contato', color: 'border-yellow-500' },
    { key: 'negociacao', title: 'Em Negociação', color: 'border-purple-500' },
    { key: 'convertido', title: 'Convertidos', color: 'border-green-500' },
    { key: 'cancelado', title: 'Cancelados', color: 'border-red-500' }
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      <CrmHeader
        contacts={contacts}
        onSearchChange={setSearchTerm}
        onFilterChange={handleFilterChange}
        filters={filters}
      />

      {/* Botão para Leads Arquivados */}
      <div className="px-6 py-3 border-b bg-gray-50">
        <Button
          variant="outline"
          onClick={() => setShowArchivedModal(true)}
          className="text-gray-600 hover:text-gray-900"
        >
          <Archive className="w-4 h-4 mr-2" />
          Ver Leads Arquivados
        </Button>
      </div>

      {/* Kanban Board */}
      <div className="flex-1 overflow-hidden">
        <div className="h-full flex gap-4 overflow-x-auto pb-4">
          {statusColumns.map((column) => {
            const columnContacts = (filteredContacts || []).filter(contact => contact.status === column.key);
            
            return (
              <div key={column.key} className={`flex-shrink-0 w-80 border-t-4 ${column.color}`}>
                <Card className="h-full">
                  <CardHeader className="pb-3">
                    <CardTitle className="flex items-center justify-between text-sm">
                      <span>{column.title}</span>
                      <Badge variant="outline">{columnContacts.length}</Badge>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3 max-h-[calc(100vh-200px)] overflow-y-auto">
                    {columnContacts.map((contact) => (
                      <ContactCard
                        key={contact.id}
                        contact={contact}
                        onViewDetails={(contact) => {
                          setSelectedContact(contact);
                          setShowDetailsModal(true);
                        }}
                        onSendWhatsapp={(contact) => {
                          setSelectedContact(contact);
                          setShowWhatsappModal(true);
                        }}
                        onStatusChange={handleStatusChange}
                        onCreateUser={handleCreateUser}
                        onArchive={handleArchive}
                        getStatusColor={getStatusColor}
                        getStatusIcon={getStatusIcon}
                      />
                    ))}
                    {columnContacts.length === 0 && (
                      <p className="text-gray-500 text-center py-8">
                        Nenhum lead nesta etapa
                      </p>
                    )}
                  </CardContent>
                </Card>
              </div>
            );
          })}
        </div>
      </div>

      {/* Modals */}
      {showDetailsModal && selectedContact && (
        <ContactDetailsModal
          contact={selectedContact}
          onClose={() => {
            setShowDetailsModal(false);
            setSelectedContact(null);
          }}
          onUpdate={() => {
            loadContacts();
            setShowDetailsModal(false);
            setSelectedContact(null);
          }}
        />
      )}

      {showWhatsappModal && selectedContact && (
        <WhatsappModal
          contacts={[selectedContact]}
          onClose={() => {
            setShowWhatsappModal(false);
            setSelectedContact(null);
          }}
        />
      )}

      <ArchivedLeadsModal
        open={showArchivedModal}
        onClose={() => setShowArchivedModal(false)}
        onExport={handleExportArchived}
      />

      <ArchiveConfirmModal
        open={showArchiveConfirmModal}
        onClose={() => setShowArchiveConfirmModal(false)}
        onConfirm={handleConfirmArchive}
        contact={selectedContact}
      />

      <Notification
        show={showNotification}
        message={notificationMessage}
        type={notificationType}
      />
    </div>
  );
}
