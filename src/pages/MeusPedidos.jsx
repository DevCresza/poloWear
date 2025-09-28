import React, { useState, useEffect } from 'react';
import { UserCompat as User } from '@/api/entities';
import { Pedido } from '@/api/entities';
import { Fornecedor } from '@/api/entities';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Truck, Package, Clock, CheckCircle, X, Eye, Calendar, MapPin, CreditCard, Receipt } from 'lucide-react';

export default function MeusPedidos() {
  const [user, setUser] = useState(null);
  const [pedidos, setPedidos] = useState([]);
  const [fornecedores, setFornecedores] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedPedido, setSelectedPedido] = useState(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);

  useEffect(() => {
    loadUserAndPedidos();
  }, []);

  const loadUserAndPedidos = async () => {
    try {
      const currentUser = await User.me();
      setUser(currentUser);
      
      const [pedidosResult, fornecedoresResult] = await Promise.all([
        Pedido.find({ filters: { comprador_user_id: currentUser.id }, order: { column: 'created_date', ascending: false } }),
        Fornecedor.find()
      ]);

      const pedidos = pedidosResult.success ? pedidosResult.data : [];
      const fornecedores = fornecedoresResult.success ? fornecedoresResult.data : [];

      setPedidos(pedidos);
      setFornecedores(fornecedores);
    } catch (error) {
      console.error('Erro ao carregar pedidos:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusInfo = (status) => {
    const statusMap = {
      novo_pedido: { label: 'Novo Pedido', color: 'bg-blue-100 text-blue-800', icon: Clock, description: 'Seu pedido foi recebido e está sendo processado' },
      em_producao: { label: 'Em Produção', color: 'bg-yellow-100 text-yellow-800', icon: Package, description: 'Seu pedido está sendo produzido' },
      faturado: { label: 'Faturado', color: 'bg-purple-100 text-purple-800', icon: Receipt, description: 'Pedido faturado e pronto para envio' },
      em_transporte: { label: 'Em Transporte', color: 'bg-orange-100 text-orange-800', icon: Truck, description: 'Seu pedido está a caminho' },
      finalizado: { label: 'Entregue', color: 'bg-green-100 text-green-800', icon: CheckCircle, description: 'Pedido entregue com sucesso' },
      cancelado: { label: 'Cancelado', color: 'bg-red-100 text-red-800', icon: X, description: 'Pedido foi cancelado' }
    };
    return statusMap[status] || statusMap.novo_pedido;
  };

  const getPaymentStatusInfo = (status) => {
    const statusMap = {
      pendente: { label: 'Pagamento Pendente', color: 'bg-yellow-100 text-yellow-800' },
      pago: { label: 'Pagamento Confirmado', color: 'bg-green-100 text-green-800' },
      atrasado: { label: 'Pagamento Atrasado', color: 'bg-orange-100 text-orange-800' },
      cancelado: { label: 'Pagamento Cancelado', color: 'bg-red-100 text-red-800' }
    };
    return statusMap[status] || statusMap.pendente;
  };

  const formatPaymentMethod = (method) => {
    const methods = {
      pix: 'PIX',
      boleto: 'Boleto Bancário',
      cartao_credito: 'Cartão de Crédito',
      transferencia: 'Transferência Bancária'
    };
    return methods[method] || method;
  };

  const fornecedorMap = new Map(fornecedores.map(f => [f.id, f.nome_marca]));

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div>
      <style>{`
        .shadow-neumorphic { box-shadow: 8px 8px 16px #d1d9e6, -8px -8px 16px #ffffff; }
        .shadow-neumorphic-inset { box-shadow: inset 5px 5px 10px #d1d9e6, inset -5px -5px 10px #ffffff; }
      `}</style>

      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Meus Pedidos</h1>
        <p className="text-gray-600">Acompanhe o status e detalhes dos seus pedidos</p>
      </div>

      <div className="grid gap-6">
        {pedidos.map((pedido) => {
          const statusInfo = getStatusInfo(pedido.status);
          const paymentStatusInfo = getPaymentStatusInfo(pedido.status_pagamento);
          const StatusIcon = statusInfo.icon;
          
          return (
            <Card key={pedido.id} className="bg-slate-100 rounded-2xl shadow-neumorphic hover:-translate-y-1 transition-transform">
              <CardHeader className="pb-4">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <StatusIcon className="w-5 h-5 text-blue-600" />
                      Pedido #{pedido.id.slice(-8).toUpperCase()}
                    </CardTitle>
                    <p className="text-sm text-gray-600 mt-1">
                      {new Date(pedido.created_date).toLocaleDateString('pt-BR')} • {fornecedorMap.get(pedido.fornecedor_id) || 'Fornecedor'}
                    </p>
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <Badge className={statusInfo.color}>
                      <StatusIcon className="w-4 h-4 mr-1" />
                      {statusInfo.label}
                    </Badge>
                    <Badge className={paymentStatusInfo.color} variant="outline">
                      <CreditCard className="w-3 h-3 mr-1" />
                      {paymentStatusInfo.label}
                    </Badge>
                  </div>
                </div>
              </CardHeader>
              
              <CardContent>
                <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
                  <div className="bg-white p-3 rounded-lg shadow-neumorphic-inset">
                    <p className="text-sm text-gray-600 mb-1">Valor Total:</p>
                    <p className="text-xl font-bold text-green-600">
                      R$ {pedido.valor_total?.toFixed(2)}
                    </p>
                  </div>
                  
                  {pedido.metodo_pagamento && (
                    <div className="bg-white p-3 rounded-lg shadow-neumorphic-inset">
                      <p className="text-sm text-gray-600 mb-1">Pagamento:</p>
                      <p className="font-semibold">{formatPaymentMethod(pedido.metodo_pagamento)}</p>
                    </div>
                  )}

                  {pedido.data_prevista_entrega && (
                    <div className="bg-white p-3 rounded-lg shadow-neumorphic-inset">
                      <p className="text-sm text-gray-600 mb-1 flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        Previsão Entrega:
                      </p>
                      <p className="font-semibold">{new Date(pedido.data_prevista_entrega).toLocaleDateString('pt-BR')}</p>
                    </div>
                  )}

                  {pedido.codigo_rastreio && (
                    <div className="bg-white p-3 rounded-lg shadow-neumorphic-inset">
                      <p className="text-sm text-gray-600 mb-1 flex items-center gap-1">
                        <Truck className="w-3 h-3" />
                        Rastreamento:
                      </p>
                      <p className="font-mono text-sm bg-gray-100 px-2 py-1 rounded">
                        {pedido.codigo_rastreio}
                      </p>
                    </div>
                  )}
                </div>

                <div className="flex items-center justify-between">
                  <div className="text-sm text-gray-600">
                    <p>{statusInfo.description}</p>
                    {pedido.transportadora && (
                      <p className="flex items-center gap-1 mt-1">
                        <MapPin className="w-3 h-3" />
                        Transportadora: {pedido.transportadora}
                      </p>
                    )}
                  </div>
                  
                  <Button 
                    variant="outline" 
                    onClick={() => { setSelectedPedido(pedido); setShowDetailsModal(true); }}
                    className="bg-slate-200 rounded-lg shadow-neumorphic-button active:shadow-neumorphic-button-inset"
                  >
                    <Eye className="w-4 h-4 mr-2" />
                    Ver Detalhes
                  </Button>
                </div>
                
                {pedido.observacoes_comprador && (
                  <div className="mt-4 bg-white p-3 rounded-lg shadow-neumorphic-inset">
                    <p className="text-sm text-gray-600 mb-1">Suas Observações:</p>
                    <p className="text-sm">{pedido.observacoes_comprador}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
        
        {pedidos.length === 0 && (
          <Card className="bg-slate-100 rounded-2xl shadow-neumorphic">
            <CardContent className="text-center py-12">
              <Package className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Nenhum pedido encontrado
              </h3>
              <p className="text-gray-600">
                Seus pedidos aparecerão aqui após a primeira compra.
              </p>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Modal de Detalhes */}
      {selectedPedido && (
        <Dialog open={showDetailsModal} onOpenChange={setShowDetailsModal}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Detalhes do Pedido #{selectedPedido.id.slice(-8).toUpperCase()}</DialogTitle>
            </DialogHeader>
            
            <div className="space-y-6 py-4">
              {/* Status e Informações Gerais */}
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <h4 className="font-semibold mb-2">Status do Pedido</h4>
                  <Badge className={getStatusInfo(selectedPedido.status).color} size="lg">
                    {getStatusInfo(selectedPedido.status).label}
                  </Badge>
                  <p className="text-sm text-gray-600 mt-2">{getStatusInfo(selectedPedido.status).description}</p>
                </div>
                <div>
                  <h4 className="font-semibold mb-2">Status do Pagamento</h4>
                  <Badge className={getPaymentStatusInfo(selectedPedido.status_pagamento).color} size="lg">
                    {getPaymentStatusInfo(selectedPedido.status_pagamento).label}
                  </Badge>
                  {selectedPedido.data_pagamento && (
                    <p className="text-sm text-gray-600 mt-2">
                      Confirmado em {new Date(selectedPedido.data_pagamento).toLocaleDateString('pt-BR')}
                    </p>
                  )}
                </div>
              </div>

              {/* Informações Financeiras */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <h4 className="font-semibold mb-3">Informações Financeiras</h4>
                <div className="grid md:grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="font-medium">Valor Total:</span>
                    <span className="ml-2 text-green-600 font-bold text-lg">R$ {selectedPedido.valor_total?.toFixed(2)}</span>
                  </div>
                  {selectedPedido.metodo_pagamento && (
                    <div>
                      <span className="font-medium">Método de Pagamento:</span>
                      <span className="ml-2">{formatPaymentMethod(selectedPedido.metodo_pagamento)}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Informações de Entrega */}
              {(selectedPedido.data_prevista_envio || selectedPedido.data_prevista_entrega || selectedPedido.transportadora || selectedPedido.codigo_rastreio) && (
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h4 className="font-semibold mb-3 flex items-center gap-2">
                    <Truck className="w-4 h-4" />
                    Informações de Entrega
                  </h4>
                  <div className="grid md:grid-cols-2 gap-4 text-sm">
                    {selectedPedido.data_prevista_envio && (
                      <div>
                        <span className="font-medium">Previsão de Envio:</span>
                        <span className="ml-2">{new Date(selectedPedido.data_prevista_envio).toLocaleDateString('pt-BR')}</span>
                      </div>
                    )}
                    {selectedPedido.data_prevista_entrega && (
                      <div>
                        <span className="font-medium">Previsão de Entrega:</span>
                        <span className="ml-2">{new Date(selectedPedido.data_prevista_entrega).toLocaleDateString('pt-BR')}</span>
                      </div>
                    )}
                    {selectedPedido.transportadora && (
                      <div>
                        <span className="font-medium">Transportadora:</span>
                        <span className="ml-2">{selectedPedido.transportadora}</span>
                      </div>
                    )}
                    {selectedPedido.codigo_rastreio && (
                      <div>
                        <span className="font-medium">Código de Rastreio:</span>
                        <code className="ml-2 bg-white px-2 py-1 rounded border text-xs">{selectedPedido.codigo_rastreio}</code>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Nota Fiscal */}
              {selectedPedido.nf_numero && (
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h4 className="font-semibold mb-2 flex items-center gap-2">
                    <Receipt className="w-4 h-4" />
                    Nota Fiscal
                  </h4>
                  <p className="text-sm">Número: <span className="font-mono bg-white px-2 py-1 rounded border">{selectedPedido.nf_numero}</span></p>
                </div>
              )}

              {/* Observações */}
              {(selectedPedido.observacoes_comprador || selectedPedido.observacoes_entrega) && (
                <div className="space-y-4">
                  {selectedPedido.observacoes_comprador && (
                    <div>
                      <h4 className="font-semibold mb-2">Suas Observações</h4>
                      <p className="text-sm bg-gray-50 p-3 rounded">{selectedPedido.observacoes_comprador}</p>
                    </div>
                  )}
                  {selectedPedido.observacoes_entrega && (
                    <div>
                      <h4 className="font-semibold mb-2">Instruções de Entrega</h4>
                      <p className="text-sm bg-gray-50 p-3 rounded">{selectedPedido.observacoes_entrega}</p>
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="flex justify-end pt-4 border-t">
              <Button onClick={() => setShowDetailsModal(false)} variant="outline">
                Fechar
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}