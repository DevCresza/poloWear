import React, { useState, useEffect, useCallback } from 'react';
import { Pedido, Fornecedor } from '@/api/entities';
import { UserCompat as User } from '@/api/entities';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import {
  Package, Clock, CheckCircle, Truck, X, Download, Eye, Edit, FileText, DollarSign,
  Calendar, Shield, LogIn, Search, Filter, List, Columns
} from 'lucide-react';
import PedidoCard from '../components/pedidos/PedidoCard';
import PedidoDetailsModal from '../components/pedidos/PedidoDetailsModal';
import { exportPedidosFornecedor } from '@/api/functions';
import { useNotification } from '@/hooks/useNotification';
import { Notification } from '@/components/ui/notification';

export default function PedidosFornecedor() {
  const [pedidos, setPedidos] = useState([]);
  const [users, setUsers] = useState([]);
  const [fornecedores, setFornecedores] = useState([]);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState(false);
  const [viewMode, setViewMode] = useState('list'); // 'kanban' ou 'list'
  const [selectedPedido, setSelectedPedido] = useState(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState({
    status_pagamento: 'all',
    periodo: 'all'
  });
  const notification = useNotification();

  const loadData = async () => {
    setLoading(true);
    try {
      // Primeiro obter o usuário atual
      const currentUser = await User.me();

      if (currentUser.role !== 'fornecedor' && currentUser.role !== 'admin') {
        setAuthError(true);
        return;
      }

      setUser(currentUser);

      // Carregar pedidos (apenas do fornecedor logado)
      let pedidosResult;
      if (currentUser.role === 'fornecedor' && currentUser.fornecedor_id) {
        // Fornecedor vê apenas pedidos do seu fornecedor
        pedidosResult = await Pedido.find({
          filters: { fornecedor_id: currentUser.fornecedor_id },
          order: { column: 'created_date', ascending: false }
        });
      } else if (currentUser.role === 'admin') {
        // Admin pode ver todos (mas geralmente não deveria estar nesta página)
        pedidosResult = await Pedido.find({
          order: { column: 'created_date', ascending: false }
        });
      } else {
        pedidosResult = { success: true, data: [] };
      }

      const pedidosData = pedidosResult.success ? pedidosResult.data : [];
      setPedidos(pedidosData);

      // Carregar users e fornecedores separadamente para não afetar o carregamento principal
      try {
        const usersResult = await User.find();
        // UserCompat.find() retorna diretamente um array, não um objeto com success/data
        const usersData = Array.isArray(usersResult) ? usersResult : [];
        setUsers(usersData);
      } catch (userError) {
        setUsers([]); // Define como array vazio se falhar
      }

      // Carregar fornecedores
      try {
        const fornecedoresResult = await Fornecedor.find();
        const fornecedoresData = fornecedoresResult.success ? fornecedoresResult.data : [];
        setFornecedores(fornecedoresData);
      } catch (fornecedorError) {
        setFornecedores([]);
      }

    } catch (error) {
      setAuthError(true);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleViewDetails = (pedido) => {
    setSelectedPedido(pedido);
    setShowDetailsModal(true);
  };

  const handleLogin = async () => {
    await User.loginWithRedirect(window.location.href);
  };

  const getStatusInfo = (status) => {
    const statusMap = {
      novo_pedido: { label: 'Novo Pedido', color: 'bg-blue-100 text-blue-800', icon: Clock },
      em_producao: { label: 'Em Produção', color: 'bg-yellow-100 text-yellow-800', icon: Package },
      faturado: { label: 'Faturado', color: 'bg-purple-100 text-purple-800', icon: FileText },
      em_transporte: { label: 'Em Transporte', color: 'bg-orange-100 text-orange-800', icon: Truck },
      finalizado: { label: 'Finalizado', color: 'bg-green-100 text-green-800', icon: CheckCircle },
      cancelado: { label: 'Cancelado', color: 'bg-red-100 text-red-800', icon: X }
    };
    return statusMap[status] || statusMap.novo_pedido;
  };

  const getPaymentStatusInfo = (status) => {
    const statusMap = {
      pendente: { label: 'Pendente', color: 'bg-yellow-100 text-yellow-800', icon: Clock },
      pago: { label: 'Pago', color: 'bg-green-100 text-green-800', icon: CheckCircle },
      atrasado: { label: 'Atrasado', color: 'bg-orange-100 text-orange-800', icon: Clock },
      cancelado: { label: 'Cancelado', color: 'bg-red-100 text-red-800', icon: X }
    };
    return statusMap[status] || statusMap.pendente;
  };

  // Filtrar pedidos
  const filteredPedidos = React.useMemo(() => {
    let filtered = pedidos || [];

    // Aplicar filtros de período
    if (filters.periodo !== 'all') {
      const hoje = new Date();
      let dataLimite;

      switch (filters.periodo) {
        case '7_dias':
          dataLimite = new Date(hoje.getTime() - 7 * 24 * 60 * 60 * 1000);
          break;
        case '30_dias':
          dataLimite = new Date(hoje.getTime() - 30 * 24 * 60 * 60 * 1000);
          break;
        case '90_dias':
          dataLimite = new Date(hoje.getTime() - 90 * 24 * 60 * 60 * 1000);
          break;
        default:
          dataLimite = null;
      }

      if (dataLimite) {
        filtered = filtered.filter(pedido => {
          const dataPedido = new Date(pedido.created_date);
          return dataPedido >= dataLimite;
        });
      }
    }

    // Filtro de busca melhorado
    if (searchTerm && searchTerm.trim()) {
      const searchLower = searchTerm.toLowerCase().trim();
      filtered = filtered.filter(pedido => {
        // Busca por ID do pedido (full ID ou últimos 6/8 caracteres)
        const idMatch = pedido.id?.toLowerCase().includes(searchLower) ||
                       pedido.id?.slice(-6).toLowerCase().includes(searchLower) ||
                       pedido.id?.slice(-8).toLowerCase().includes(searchLower);

        // Busca por nome do comprador
        const compradorNome = users.find(u => u.id === pedido.comprador_user_id)?.full_name;
        const compradorMatch = compradorNome?.toLowerCase().includes(searchLower);

        // Busca por empresa do comprador
        const compradorEmpresa = users.find(u => u.id === pedido.comprador_user_id)?.empresa;
        const empresaMatch = compradorEmpresa?.toLowerCase().includes(searchLower);

        // Busca por status
        const statusInfo = getStatusInfo(pedido.status);
        const statusMatch = statusInfo?.label?.toLowerCase().includes(searchLower);

        // Busca por valor (convertido para string)
        const valorMatch = pedido.valor_total?.toString().includes(searchLower) ||
                          pedido.valor_final?.toString().includes(searchLower);

        // Busca por observações
        const observacoesMatch = pedido.observacoes?.toLowerCase().includes(searchLower) ||
                                pedido.observacoes_comprador?.toLowerCase().includes(searchLower);

        // Busca por status de pagamento
        const paymentStatusInfo = getPaymentStatusInfo(pedido.status_pagamento);
        const paymentStatusMatch = paymentStatusInfo?.label?.toLowerCase().includes(searchLower);

        return idMatch || compradorMatch || empresaMatch || statusMatch || valorMatch || observacoesMatch || paymentStatusMatch;
      });
    }

    // Filtro por status de pagamento
    if (filters.status_pagamento !== 'all') {
      filtered = filtered.filter(pedido => pedido.status_pagamento === filters.status_pagamento);
    }

    return filtered;
  }, [pedidos, searchTerm, filters, users]);

  const statusColumns = [
    { key: 'novo_pedido', title: 'Novos Pedidos', color: 'border-blue-500' },
    { key: 'em_producao', title: 'Em Produção', color: 'border-yellow-500' },
    { key: 'faturado', title: 'Faturados', color: 'border-purple-500' },
    { key: 'em_transporte', title: 'Em Transporte', color: 'border-orange-500' },
    { key: 'finalizado', title: 'Finalizados', color: 'border-green-500' },
    { key: 'cancelado', title: 'Cancelados', color: 'border-red-500' }
  ];

  const userMap = new Map(users.map(u => [u.id, u.full_name]));
  const fornecedorMap = new Map(fornecedores.map(f => [f.id, f.nome_marca]));

  const handleExport = async (formato) => {
    if (!user) return;
    try {
      const exportData = await exportPedidosFornecedor(
        user.tipo_negocio === 'fornecedor' ? user.fornecedor_id : 'all',
        { formato }
      );

      if (formato === 'excel') {
        const blob = new Blob([exportData], { type: 'text/csv;charset=utf-8;' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `pedidos-fornecedor-${new Date().toISOString().split('T')[0]}.csv`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        a.remove();
      } else {
        // Para PDF (HTML), baixar e abrir em nova aba
        const blob = new Blob([exportData], { type: 'text/html' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `pedidos-fornecedor-${new Date().toISOString().split('T')[0]}.html`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        a.remove();

        // Abrir em nova aba para visualização/impressão
        const newWindow = window.open();
        newWindow.document.write(exportData);
        newWindow.document.close();
      }
    } catch (error) {
      notification.showError('Erro ao exportar dados.');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
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
            <CardTitle className="text-2xl">Acesso para Fornecedores</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <Alert className="border-red-200 bg-red-50">
              <Shield className="h-4 w-4" />
              <AlertDescription className="text-red-800">
                Esta área é restrita a fornecedores cadastrados.
              </AlertDescription>
            </Alert>
            <Button onClick={handleLogin} className="w-full h-12 bg-blue-600 hover:bg-blue-700">
              <LogIn className="w-5 h-5 mr-2" />
              Fazer Login
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row gap-4 justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Meus Pedidos</h1>
          <p className="text-gray-600">Acompanhe e gerencie os pedidos da sua marca</p>
        </div>

        <div className="flex gap-2">
          <Button variant="outline" onClick={() => handleExport('pdf')}>
            <Download className="w-4 h-4 mr-2" />
            PDF
          </Button>
          <Button variant="outline" onClick={() => handleExport('excel')}>
            <Download className="w-4 h-4 mr-2" />
            Excel
          </Button>
        </div>
      </div>

      {/* Filters and Search */}
      <Card className="bg-slate-100 rounded-2xl shadow-neumorphic">
        <CardContent className="p-4">
          <div className="flex flex-col lg:flex-row gap-4 items-center">
            {/* Search */}
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                placeholder="Buscar por ID, cliente, status, valor ou observações..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>

            {/* Filters */}
            <div className="flex gap-2">
              <Select value={filters.status_pagamento} onValueChange={(value) => setFilters({...filters, status_pagamento: value})}>
                <SelectTrigger className="w-32">
                  <SelectValue placeholder="Pagamento" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="pendente">Pendente</SelectItem>
                  <SelectItem value="pago">Pago</SelectItem>
                  <SelectItem value="atrasado">Atrasado</SelectItem>
                </SelectContent>
              </Select>

              <Select value={filters.periodo} onValueChange={(value) => setFilters({...filters, periodo: value})}>
                <SelectTrigger className="w-32">
                  <SelectValue placeholder="Período" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="7_dias">7 dias</SelectItem>
                  <SelectItem value="30_dias">30 dias</SelectItem>
                  <SelectItem value="90_dias">90 dias</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* View Mode Toggle */}
            <div className="flex gap-1 bg-gray-200 rounded-lg p-1">
              <Button
                variant={viewMode === 'kanban' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('kanban')}
              >
                <Columns className="w-4 h-4" />
              </Button>
              <Button
                variant={viewMode === 'list' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('list')}
              >
                <List className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Content */}
      <div className="flex-1 overflow-hidden">
        {viewMode === 'kanban' ? (
          // Kanban View
          <div className="h-full flex gap-4 overflow-x-auto pb-4">
            {statusColumns.map((column) => {
              const columnPedidos = filteredPedidos.filter(pedido => pedido.status === column.key);

              return (
                <div key={column.key} className={`flex-shrink-0 w-80 border-t-4 ${column.color}`}>
                  <Card className="h-full">
                    <CardHeader className="pb-3">
                      <CardTitle className="flex items-center justify-between text-sm">
                        <span>{column.title}</span>
                        <Badge variant="outline">{columnPedidos.length}</Badge>
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3 max-h-[calc(100vh-300px)] overflow-y-auto">
                      {columnPedidos.map((pedido) => (
                        <PedidoCard
                          key={pedido.id}
                          pedido={pedido}
                          userMap={userMap}
                          fornecedorMap={fornecedorMap}
                          onViewDetails={handleViewDetails}
                          onEdit={() => {}}
                          onStatusChange={() => {}}
                          onPaymentStatusChange={() => {}}
                          getStatusInfo={getStatusInfo}
                          getPaymentStatusInfo={getPaymentStatusInfo}
                          showEditButton={false}
                          updatingPedidoId={null}
                        />
                      ))}
                      {columnPedidos.length === 0 && (
                        <p className="text-gray-500 text-center py-8">
                          Nenhum pedido neste status
                        </p>
                      )}
                    </CardContent>
                  </Card>
                </div>
              );
            })}
          </div>
        ) : (
          // List View
          <Card>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="text-left p-4">Pedido</th>
                      <th className="text-left p-4">Cliente</th>
                      <th className="text-left p-4">Valor</th>
                      <th className="text-left p-4">Status</th>
                      <th className="text-left p-4">Pagamento</th>
                      <th className="text-left p-4">Ações</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredPedidos.map((pedido) => {
                      const statusInfo = getStatusInfo(pedido.status);
                      const paymentStatusInfo = getPaymentStatusInfo(pedido.status_pagamento);

                      return (
                        <tr key={pedido.id} className="border-b hover:bg-gray-50">
                          <td className="p-4">
                            <div>
                              <div className="font-medium">#{pedido.id.slice(-6).toUpperCase()}</div>
                              <div className="text-sm text-gray-500">{new Date(pedido.created_date).toLocaleDateString()}</div>
                            </div>
                          </td>
                          <td className="p-4">{userMap.get(pedido.comprador_user_id) || 'N/A'}</td>
                          <td className="p-4">
                            <span className="font-semibold text-green-600">
                              R$ {pedido.valor_total?.toFixed(2)}
                            </span>
                          </td>
                          <td className="p-4">
                            <Badge className={statusInfo.color}>{statusInfo.label}</Badge>
                          </td>
                          <td className="p-4">
                            <Badge className={paymentStatusInfo.color}>{paymentStatusInfo.label}</Badge>
                          </td>
                          <td className="p-4">
                            <div className="flex gap-2">
                              <Button variant="outline" size="sm" onClick={() => handleViewDetails(pedido)}>
                                <Eye className="w-4 h-4" />
                              </Button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {filteredPedidos.length === 0 && (
                <div className="text-center py-12">
                  <Package className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Nenhum pedido encontrado</h3>
                  <p className="text-gray-600">Tente ajustar os filtros de busca.</p>
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>

      {/* Modals */}
      {showDetailsModal && selectedPedido && (
        <PedidoDetailsModal
          pedido={selectedPedido}
          userMap={userMap}
          users={users}
          fornecedorMap={fornecedorMap}
          onClose={() => {
            setShowDetailsModal(false);
            setSelectedPedido(null);
          }}
          getStatusInfo={getStatusInfo}
          getPaymentStatusInfo={getPaymentStatusInfo}
        />
      )}

      <Notification
        show={notification.showNotification}
        message={notification.notificationMessage}
        type={notification.notificationType}
        onClose={notification.hideNotification}
      />
    </div>
  );
}