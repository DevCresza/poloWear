
import React, { useState, useEffect } from 'react';
import { UserCompat } from '@/api/entities';
import { User } from '@/services/entities'; // UserService com deleteComplete
import { PendingUser } from '@/api/entities';
import { Fornecedor } from '@/api/entities';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Shield, LogIn, Users as UsersIcon, Plus, Edit, ExternalLink, Copy, CheckCircle, Clock, UserCheck, Eye, Settings, Trash2, X } from 'lucide-react';
import NewUserForm from '../components/admin/NewUserForm';
import PendingUserDetails from '../components/admin/PendingUserDetails';
import ClientForm from '../components/admin/ClientForm'; // New import for editing users
import DeleteConfirmModal from '@/components/ui/DeleteConfirmModal';
import { useNotification } from '@/hooks/useNotification';
import { Notification } from '@/components/ui/notification';

export default function UserManagement() {
  const [users, setUsers] = useState([]);
  const [pendingUsers, setPendingUsers] = useState([]);
  const [fornecedores, setFornecedores] = useState([]);
  const [fornecedorMap, setFornecedorMap] = useState(new Map());
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState(false);
  const [updatingUserId, setUpdatingUserId] = useState(null);
  const [showNewUserForm, setShowNewUserForm] = useState(false);
  const [showPendingDetails, setShowPendingDetails] = useState(false);
  const [selectedPendingUser, setSelectedPendingUser] = useState(null);
  const [editingUser, setEditingUser] = useState(null); // New state for user being edited
  const [showEditForm, setShowEditForm] = useState(false); // New state to control edit form visibility
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [userToDelete, setUserToDelete] = useState(null);
  const [showNotification, setShowNotification] = useState(false);
  const [notificationMessage, setNotificationMessage] = useState('');
  const [notificationType, setNotificationType] = useState('success');

  const showSuccessNotification = (message) => {
    setNotificationMessage(message);
    setNotificationType('success');
    setShowNotification(true);
    setTimeout(() => {
      setShowNotification(false);
    }, 4000);
  };

  const showErrorNotification = (message) => {
    setNotificationMessage(message);
    setNotificationType('error');
    setShowNotification(true);
    setTimeout(() => {
      setShowNotification(false);
    }, 4000);
  };

  const getStatusBadge = (status) => {
    const statusMap = {
      pendente: { label: 'Aguardando Convite', color: 'bg-yellow-100 text-yellow-800', icon: Clock },
      convidado: { label: 'Convite Enviado', color: 'bg-blue-100 text-blue-800', icon: UserCheck },
      ativo: { label: 'Ativo', color: 'bg-green-100 text-green-800', icon: CheckCircle }
    };
    const info = statusMap[status] || statusMap.pendente;
    return (
      <Badge className={info.color}>
        <info.icon className="w-3 h-3 mr-1" />
        {info.label}
      </Badge>
    );
  };

  const loadData = async () => {
    setLoading(true);
    try {
      const [userResult, pendingResult, fornecedoresResult] = await Promise.all([
        // Buscar usuários diretamente do Supabase
        supabase
          .from('users')
          .select('*')
          .order('created_at', { ascending: false }),
        PendingUser.find({ order: { column: 'created_at', ascending: false } }),
        Fornecedor.find()
      ]);

      const users = userResult?.data || [];
      const pending = pendingResult?.success ? pendingResult.data : [];
      const fornecedores = fornecedoresResult?.success ? fornecedoresResult.data : [];

      setUsers(users);
      setPendingUsers(pending);
      setFornecedores(fornecedores);
      setFornecedorMap(new Map(fornecedores.map(f => [f.id, f.nome_marca])));
    } catch(error) {
      // Error handled silently
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const user = await UserCompat.me();
        if (user.role !== 'admin') {
          setAuthError(true);
          setLoading(false);
          return;
        }
        setCurrentUser(user);
        await loadData();
      } catch (error) {
        setAuthError(true);
      } finally {
        setLoading(false);
      }
    };
    checkAuth();
  }, []);

  const handleLogin = async () => {
    // Redirecionar para página de login
    window.location.href = '/login';
  };

  const handleRoleChange = async (userId, newRole) => {
    setUpdatingUserId(userId);
    try {
      const { error } = await supabase
        .from('users')
        .update({ role: newRole })
        .eq('id', userId);

      if (error) throw error;
      await loadData();
    } catch (error) {
      // Error handled silently
    } finally {
      setUpdatingUserId(null);
    }
  };

  const handleViewPendingDetails = (pendingUser) => {
    setSelectedPendingUser(pendingUser);
    setShowPendingDetails(true);
  };

  const openDashboard = () => {
    // Dashboard functionality placeholder
  };

  const copyInviteInfo = (pendingUser) => {
    const inviteText = `Email: ${pendingUser.email}\nNome: ${pendingUser.full_name}\nTipo: ${pendingUser.tipo_negocio}\nFunção: ${pendingUser.role}`;
    navigator.clipboard.writeText(inviteText);
    
    const toast = document.createElement('div');
    toast.className = 'fixed top-4 right-4 bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded z-50';
    toast.textContent = 'Informações copiadas para a área de transferência!';
    document.body.appendChild(toast);
    setTimeout(() => document.body.removeChild(toast), 3000);
  };

  const handleEdit = (user) => {
    setEditingUser(user);
    setShowEditForm(true);
  };

  const handleDelete = (userId, userName) => {
    if (currentUser.id === userId) {
      showErrorNotification("Você não pode excluir a si mesmo.");
      return;
    }

    const user = users.find(u => u.id === userId);
    setUserToDelete({ userId, userName, user });
    setShowDeleteModal(true);
  };

  const confirmDelete = async () => {
    const { userId, userName, user } = userToDelete;
    try {

      // Usar o novo método deleteComplete do UserService
      const result = await User.deleteComplete(userId);

      if (result.success) {

        // Verificar se houve warnings
        if (result.data.warnings && result.data.warnings.length > 0) {

          // Verificar se o aviso é sobre Auth
          const hasAuthWarning = result.data.warnings.some(w => w.includes('Auth:'));

          if (hasAuthWarning) {
            showSuccessNotification(`Usuário "${userName}" foi excluído com sucesso da plataforma. O usuário não conseguirá mais fazer login.`);
          } else {
            showSuccessNotification(`Usuário "${userName}" foi excluído com sucesso. Alguns dados relacionados podem ter permanecido por questões de segurança.`);
          }
        } else {
          showSuccessNotification(`Usuário "${userName}" foi excluído completamente do sistema.`);
        }

        loadData();
      } else {
        throw new Error(result.error);
      }
    } catch (error) {
      showErrorNotification(`Falha ao excluir o usuário "${userName}". ${error.message}`);
    } finally {
      setShowDeleteModal(false);
      setUserToDelete(null);
    }
  };

  if (loading && !users.length) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (authError) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-gray-100 flex items-center justify-center p-4">
        <Card className="w-full max-w-md shadow-xl">
          <CardHeader className="text-center">
            <Shield className="w-12 h-12 text-blue-600 mx-auto mb-4" />
            <CardTitle className="text-2xl">Acesso Restrito</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <Alert className="border-red-200 bg-red-50">
              <Shield className="h-4 w-4" />
              <AlertDescription className="text-red-800">
                Você precisa ser um administrador para gerenciar usuários.
              </AlertDescription>
            </Alert>
            <Button onClick={handleLogin} className="w-full h-12 bg-blue-600 hover:bg-blue-700">
              <LogIn className="w-5 h-5 mr-2" />
              Fazer Login como Administrador
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (showNewUserForm) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="bg-white shadow-sm border-b">
          <div className="container mx-auto px-6 py-4">
            <h1 className="text-2xl font-bold text-gray-900">Registrar Novo Usuário</h1>
            <p className="text-gray-600">Complete os dados para registrar um usuário para posterior convite</p>
          </div>
        </div>
        <div className="container mx-auto p-6">
          <NewUserForm
            onSuccess={(userName) => {
              setShowNewUserForm(false);
              showSuccessNotification(`Usuário "${userName}" foi criado com sucesso! O usuário já pode fazer login no sistema.`);
              // Adicionar um delay para evitar condições de corrida
              setTimeout(() => {
                loadData();
              }, 1000);
            }}
            onError={(error) => {
              showErrorNotification('Erro ao criar usuário. Verifique se o email já não está cadastrado.');
            }}
            onCancel={() => setShowNewUserForm(false)}
          />
        </div>
      </div>
    );
  }
  
  if (showEditForm) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="bg-white shadow-sm border-b">
          <div className="container mx-auto px-6 py-4">
            <h1 className="text-2xl font-bold text-gray-900">Editar Usuário</h1>
            <p className="text-gray-600">Altere os dados do usuário abaixo.</p>
          </div>
        </div>
        <div className="container mx-auto p-6">
          <ClientForm
            user={editingUser}
            onSuccess={() => {
              setShowEditForm(false);
              setEditingUser(null);
              loadData();
            }}
            onCancel={() => {
              setShowEditForm(false);
              setEditingUser(null);
            }}
            fornecedorMap={fornecedorMap} // Pass fornecedorMap to ClientForm if needed for selection
            fornecedores={fornecedores} // Pass fornecedores array to ClientForm if needed for selection
          />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white shadow-sm border-b">
        <div className="container mx-auto px-6 py-4 flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Gerenciamento de Usuários</h1>
            <p className="text-gray-600">Olá, {currentUser?.full_name}. Gerencie usuários do sistema.</p>
          </div>
          <div className="flex gap-2">
            <Button onClick={() => setShowNewUserForm(true)} className="bg-blue-600 hover:bg-blue-700">
              <Plus className="w-4 h-4 mr-2" />
              Registrar Usuário
            </Button>
          </div>
        </div>
      </div>

      <div className="container mx-auto p-6">
        <Tabs defaultValue="active" className="space-y-6">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="active">Usuários Ativos ({users.length})</TabsTrigger>
            <TabsTrigger value="pending">Aguardando Convite ({pendingUsers.length})</TabsTrigger>
          </TabsList>

          <TabsContent value="active">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <UsersIcon className="w-5 h-5" />
                  <span>Usuários Ativos no Sistema</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Nome</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Empresa / Fornecedor</TableHead>
                      <TableHead>Tipo</TableHead>
                      <TableHead>Função</TableHead>
                      <TableHead>Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {users.map(user => (
                      <TableRow key={user.id}>
                        <TableCell>{user.full_name}</TableCell>
                        <TableCell>{user.email}</TableCell>
                        <TableCell>
                          {user.tipo_negocio === 'fornecedor'
                            ? `Fornecedor: ${fornecedorMap.get(user.fornecedor_id) || user.empresa || user.nome_empresa || 'N/A'}`
                            : user.nome_empresa || user.empresa || 'Pessoa Física'}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">
                            {user.tipo_negocio === 'multimarca' ? 'Multimarca' : 
                             user.tipo_negocio === 'fornecedor' ? 'Fornecedor' : 'Admin'}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Select
                            value={user.role}
                            onValueChange={(newRole) => handleRoleChange(user.id, newRole)}
                            disabled={updatingUserId === user.id || currentUser.id === user.id}
                          >
                            <SelectTrigger className="w-[120px]">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="admin">Admin</SelectItem>
                              <SelectItem value="multimarca">Multimarca</SelectItem>
                              <SelectItem value="fornecedor">Fornecedor</SelectItem>
                            </SelectContent>
                          </Select>
                          {currentUser.id === user.id && (
                            <p className="text-xs text-gray-500 mt-1">Você não pode alterar sua própria função.</p>
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            <Button variant="outline" size="sm" onClick={() => handleEdit(user)}>
                              <Edit className="w-4 h-4 mr-1" />
                              Editar
                            </Button>
                            <Button
                              variant="destructive"
                              size="sm"
                              onClick={() => handleDelete(user.id, user.full_name)}
                              disabled={currentUser.id === user.id}
                            >
                              <Trash2 className="w-4 h-4 mr-1" />
                              Excluir
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="pending">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="w-5 h-5" />
                  <span>Usuários Aguardando Convite</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {pendingUsers.length === 0 ? (
                  <div className="text-center py-12">
                    <UserCheck className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">Nenhum usuário pendente</h3>
                    <p className="text-gray-600">Registre novos usuários para aparecerem aqui.</p>
                  </div>
                ) : (
                  <div className="space-y-4">

                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Nome</TableHead>
                          <TableHead>Email</TableHead>
                          <TableHead>Tipo</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Criado em</TableHead>
                          <TableHead>Ações</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {pendingUsers.map(pendingUser => (
                          <TableRow key={pendingUser.id}>
                            <TableCell className="font-medium">{pendingUser.full_name}</TableCell>
                            <TableCell>{pendingUser.email}</TableCell>
                            <TableCell>
                              <Badge variant="outline">
                                {pendingUser.tipo_negocio === 'multimarca' ? 'Multimarca' : 
                                 pendingUser.tipo_negocio === 'fornecedor' ? 'Fornecedor' : 'Admin'}
                              </Badge>
                            </TableCell>
                            <TableCell>{getStatusBadge(pendingUser.status)}</TableCell>
                            <TableCell>{new Date(pendingUser.data_criacao).toLocaleDateString('pt-BR')}</TableCell>
                            <TableCell>
                              <div className="flex gap-2">
                                <Button 
                                  variant="outline" 
                                  size="sm"
                                  onClick={() => handleViewPendingDetails(pendingUser)}
                                >
                                  <Eye className="w-4 h-4 mr-1" />
                                  Ver Detalhes
                                </Button>
                                <Button 
                                  variant="outline" 
                                  size="sm"
                                  onClick={() => copyInviteInfo(pendingUser)}
                                >
                                  <Copy className="w-4 h-4 mr-1" />
                                  Copiar
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* Modal de Detalhes do Usuário Pendente */}
      {showPendingDetails && selectedPendingUser && (
        <PendingUserDetails
          pendingUser={selectedPendingUser}
          onClose={() => {
            setShowPendingDetails(false);
            setSelectedPendingUser(null);
          }}
          onUpdate={loadData}
          fornecedorMap={fornecedorMap}
        />
      )}

      {/* Notification */}
      {showNotification && (
        <div className="fixed top-4 right-4 z-50">
          <Alert className={`w-96 shadow-lg ${
            notificationType === 'success'
              ? 'bg-green-50 border-green-200'
              : 'bg-red-50 border-red-200'
          }`}>
            <div className="flex items-center justify-between">
              <AlertDescription className={`font-medium ${
                notificationType === 'success' ? 'text-green-800' : 'text-red-800'
              }`}>
                {notificationMessage}
              </AlertDescription>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowNotification(false)}
                className={`h-6 w-6 p-0 ${
                  notificationType === 'success'
                    ? 'text-green-600 hover:bg-green-100'
                    : 'text-red-600 hover:bg-red-100'
                }`}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </Alert>
        </div>
      )}

      <DeleteConfirmModal
        open={showDeleteModal}
        onClose={() => {
          setShowDeleteModal(false);
          setUserToDelete(null);
        }}
        onConfirm={confirmDelete}
        title="Confirmar Exclusão Completa de Usuário"
        itemName={userToDelete?.userName || ''}
        itemType="o usuário"
      >
        <div className="space-y-2">
          <p className="text-sm text-red-600">
            <strong>⚠️ Atenção:</strong> Esta ação removerá o usuário completamente do sistema, incluindo:
          </p>
          <ul className="text-sm text-red-600 list-disc list-inside ml-4">
            <li>Dados do usuário na plataforma</li>
            <li>Itens do carrinho de compras</li>
            <li>Histórico de movimentações de estoque</li>
            <li>Pedidos como comprador</li>
            {userToDelete?.user?.tipo_negocio === 'fornecedor' && (
              <li>Dados do fornecedor associado</li>
            )}
            <li>Conta de autenticação</li>
          </ul>
          <p className="text-sm text-red-700 font-semibold">
            Esta ação é <strong>irreversível</strong>!
          </p>
        </div>
      </DeleteConfirmModal>
    </div>
  );
}
