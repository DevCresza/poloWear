import React, { useState, useEffect } from 'react';
import { Pedido } from '@/api/entities';
import { UserCompat as User } from '@/api/entities';
import { Fornecedor } from '@/api/entities';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Package, Clock, CheckCircle, Truck, X, Eye, Edit, FileText, DollarSign, Download, 
  CreditCard, Calendar, MapPin, Receipt, Search, Filter, List, Columns
} from 'lucide-react';
import PedidoCard from '../components/pedidos/PedidoCard';
import PedidoDetailsModal from '../components/pedidos/PedidoDetailsModal';
import PedidoEditModal from '../components/pedidos/PedidoEditModal';
import { exportPedidosPDF } from '@/api/functions';
import { exportPedidosExcel } from '@/api/functions';
import { useNotification } from '@/hooks/useNotification';
import { Notification } from '@/components/ui/notification';

export default function PedidosAdmin() {
  const [pedidos, setPedidos] = useState([]);
  const [users, setUsers] = useState([]);
  const [fornecedores, setFornecedores] = useState([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState('kanban'); // 'kanban' ou 'list'
  const [selectedPedido, setSelectedPedido] = useState(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [updatingPedidoId, setUpdatingPedidoId] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState({
    fornecedor: 'all',
    status_pagamento: 'all',
    periodo: 'all'
  });
  const notification = useNotification();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      // Carregar pedidos e fornecedores (principais)
      const [pedidosResult, fornecedoresResult] = await Promise.all([
        Pedido.find({ order: { column: 'created_date', ascending: false } }),
        Fornecedor.find()
      ]);


      const pedidosData = pedidosResult.success ? pedidosResult.data : [];
      const fornecedoresData = fornecedoresResult.success ? fornecedoresResult.data : [];

      setPedidos(pedidosData);
      setFornecedores(fornecedoresData);

      // Carregar users separadamente para não afetar o carregamento principal
      try {
        const usersResult = await User.find();
        // UserCompat.find() retorna diretamente um array, não um objeto com success/data
        const usersData = Array.isArray(usersResult) ? usersResult : [];
        setUsers(usersData);
      } catch (userError) {
        console.warn('Erro ao carregar usuários (não crítico):', userError);
        setUsers([]); // Define como array vazio se falhar
      }


    } catch (error) {
      console.error('Erro ao carregar dados principais:', error);
      notification.showError('Erro ao carregar dados dos pedidos');
    } finally {
      setLoading(false);
    }
  };

  const handleExport = async (format) => {
    try {
      if (format === 'pdf') {
        const htmlData = await exportPedidosPDF();
        const blob = new Blob([htmlData], { type: 'text/html' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `pedidos-${new Date().toISOString().split('T')[0]}.html`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        a.remove();

        // Opcional: Abrir em nova aba para impressão
        const newWindow = window.open();
        newWindow.document.write(htmlData);
        newWindow.document.close();
      } else if (format === 'excel') {
        const csvData = await exportPedidosExcel();
        const blob = new Blob([csvData], { type: 'text/csv;charset=utf-8;' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `pedidos-${new Date().toISOString().split('T')[0]}.csv`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        a.remove();
      }
    } catch (error) {
      console.error('Erro no export:', error);
      notification.showError('Erro ao exportar dados.');
    }
  };


  const handleStatusChange = async (pedidoId, newStatus) => {
    setUpdatingPedidoId(pedidoId);
    try {
      await Pedido.update(pedidoId, { status: newStatus });
      await loadData();
      notification.showSuccess('Status do pedido atualizado com sucesso!');
    } catch (error) {
      console.error('Erro ao atualizar status:', error);
      notification.showError('Falha ao atualizar status.');
    } finally {
      setUpdatingPedidoId(null);
    }
  };

  const handlePaymentStatusChange = async (pedidoId, newStatus) => {
    setUpdatingPedidoId(pedidoId);
    try {
      const updateData = {
        status_pagamento: newStatus
      };
      await Pedido.update(pedidoId, updateData);
      await loadData();
    } catch (error) {
      console.error('Erro ao atualizar status do pagamento:', error);
      notification.showError('Falha ao atualizar status do pagamento.');
    } finally {
      setUpdatingPedidoId(null);
    }
  };

  const handleEditPedido = (pedido) => {
    setSelectedPedido(pedido);
    setShowEditModal(true);
  };

  const handleViewDetails = (pedido) => {
    setSelectedPedido(pedido);
    setShowDetailsModal(true);
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

        // Busca por nome/marca do fornecedor
        const fornecedor = fornecedores.find(f => f.id === pedido.fornecedor_id);
        const fornecedorNomeMatch = fornecedor?.nome_marca?.toLowerCase().includes(searchLower);
        const fornecedorRazaoMatch = fornecedor?.razao_social?.toLowerCase().includes(searchLower);

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

        return idMatch || compradorMatch || empresaMatch || fornecedorNomeMatch ||
               fornecedorRazaoMatch || statusMatch || valorMatch || observacoesMatch || paymentStatusMatch;
      });
    }

    // Filtro por fornecedor
    if (filters.fornecedor !== 'all') {
      filtered = filtered.filter(pedido => pedido.fornecedor_id === filters.fornecedor);
    }

    // Filtro por status de pagamento
    if (filters.status_pagamento !== 'all') {
      filtered = filtered.filter(pedido => pedido.status_pagamento === filters.status_pagamento);
    }

    return filtered;
  }, [pedidos, searchTerm, filters, users, fornecedores]);

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

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row gap-4 justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Gestão de Pedidos</h1>
          <p className="text-gray-600">Acompanhe e gerencie todos os pedidos do sistema</p>
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
                placeholder="Buscar por ID, cliente, fornecedor, status, valor ou observações..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            
            {/* Filters */}
            <div className="flex gap-2">
              <Select value={filters.fornecedor} onValueChange={(value) => setFilters({...filters, fornecedor: value})}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Fornecedor" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos Fornecedores</SelectItem>
                  {fornecedores.map(f => (
                    <SelectItem key={f.id} value={f.id}>{f.nome_marca}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              
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
                          onEdit={handleEditPedido}
                          onStatusChange={handleStatusChange}
                          onPaymentStatusChange={handlePaymentStatusChange}
                          getStatusInfo={getStatusInfo}
                          getPaymentStatusInfo={getPaymentStatusInfo}
                          updatingPedidoId={updatingPedidoId}
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
                      <th className="text-left p-4">Fornecedor</th>
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
                          <td className="p-4">{fornecedorMap.get(pedido.fornecedor_id) || 'N/A'}</td>
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
                              <Button variant="outline" size="sm" onClick={() => handleEditPedido(pedido)}>
                                <Edit className="w-4 h-4" />
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
          fornecedorMap={fornecedorMap}
          onClose={() => {
            setShowDetailsModal(false);
            setSelectedPedido(null);
          }}
          getStatusInfo={getStatusInfo}
          getPaymentStatusInfo={getPaymentStatusInfo}
        />
      )}

      {showEditModal && selectedPedido && (
        <PedidoEditModal
          pedido={selectedPedido}
          onClose={() => {
            setShowEditModal(false);
            setSelectedPedido(null);
          }}
          onUpdate={loadData}
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