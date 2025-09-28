import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { 
  Calendar, MapPin, CreditCard, Receipt, Truck, Package, 
  DollarSign, User, Building, Phone, Mail, FileText
} from 'lucide-react';

export default function PedidoDetailsModal({
  pedido,
  userMap,
  users = [],
  fornecedorMap,
  onClose,
  getStatusInfo,
  getPaymentStatusInfo
}) {
  const statusInfo = getStatusInfo(pedido.status);
  const paymentStatusInfo = getPaymentStatusInfo(pedido.status_pagamento);
  const StatusIcon = statusInfo.icon;
  const PaymentIcon = paymentStatusInfo.icon;

  const formatPaymentMethod = (method) => {
    const methods = {
      pix: 'PIX',
      boleto: 'Boleto Bancário',
      cartao_credito: 'Cartão de Crédito',
      transferencia: 'Transferência Bancária'
    };
    return methods[method] || method;
  };

  // Parse dos itens do pedido
  let itens = [];
  try {
    itens = typeof pedido.itens === 'string' ? JSON.parse(pedido.itens) : pedido.itens || [];
  } catch (error) {
    console.error('Erro ao parsear itens do pedido:', error);
  }

  // Buscar dados completos do cliente
  const clienteCompleto = users.find(u => u.id === pedido.comprador_user_id);

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Package className="w-5 h-5" />
            Detalhes do Pedido #{pedido.id.slice(-8).toUpperCase()}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Status Cards */}
          <div className="grid md:grid-cols-2 gap-4">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm flex items-center gap-2">
                  <StatusIcon className="w-4 h-4" />
                  Status do Pedido
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Badge className={statusInfo.color} size="lg">
                  {statusInfo.label}
                </Badge>
                <p className="text-sm text-gray-600 mt-2">
                  Pedido criado em {new Date(pedido.created_date).toLocaleDateString('pt-BR')} às {new Date(pedido.created_date).toLocaleTimeString('pt-BR')}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm flex items-center gap-2">
                  <PaymentIcon className="w-4 h-4" />
                  Status do Pagamento
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Badge className={paymentStatusInfo.color} size="lg">
                  {paymentStatusInfo.label}
                </Badge>
                {pedido.data_pagamento && (
                  <p className="text-sm text-gray-600 mt-2">
                    Confirmado em {new Date(pedido.data_pagamento).toLocaleDateString('pt-BR')}
                  </p>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Informações Principais */}
          <div className="grid md:grid-cols-2 gap-6">
            {/* Cliente */}
            <Card>
              <CardHeader>
                <CardTitle className="text-sm flex items-center gap-2">
                  <User className="w-4 h-4" />
                  Informações do Cliente
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <span className="font-medium">Nome:</span>
                  <p className="text-gray-700">{clienteCompleto?.full_name || userMap.get(pedido.comprador_user_id) || 'N/A'}</p>
                </div>
                {clienteCompleto?.email && (
                  <div>
                    <span className="font-medium flex items-center gap-1">
                      <Mail className="w-3 h-3" />
                      Email:
                    </span>
                    <p className="text-gray-700">{clienteCompleto.email}</p>
                  </div>
                )}
                {clienteCompleto?.telefone && (
                  <div>
                    <span className="font-medium flex items-center gap-1">
                      <Phone className="w-3 h-3" />
                      Telefone:
                    </span>
                    <p className="text-gray-700">{clienteCompleto.telefone}</p>
                  </div>
                )}
                {(clienteCompleto?.empresa || clienteCompleto?.nome_empresa) && (
                  <div>
                    <span className="font-medium flex items-center gap-1">
                      <Building className="w-3 h-3" />
                      Empresa:
                    </span>
                    <p className="text-gray-700">{clienteCompleto.empresa || clienteCompleto.nome_empresa}</p>
                  </div>
                )}
                {clienteCompleto?.cnpj && (
                  <div>
                    <span className="font-medium">CNPJ:</span>
                    <p className="text-gray-700">{clienteCompleto.cnpj}</p>
                  </div>
                )}
                {(clienteCompleto?.endereco_completo || clienteCompleto?.cidade) && (
                  <div>
                    <span className="font-medium flex items-center gap-1">
                      <MapPin className="w-3 h-3" />
                      Endereço:
                    </span>
                    <div className="text-gray-700">
                      {clienteCompleto.endereco_completo && (
                        <p>{clienteCompleto.endereco_completo}</p>
                      )}
                      {clienteCompleto.cidade && clienteCompleto.estado && (
                        <p>{clienteCompleto.cidade} - {clienteCompleto.estado}</p>
                      )}
                      {clienteCompleto.cep && (
                        <p>CEP: {clienteCompleto.cep}</p>
                      )}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Fornecedor */}
            <Card>
              <CardHeader>
                <CardTitle className="text-sm flex items-center gap-2">
                  <Building className="w-4 h-4" />
                  Informações do Fornecedor
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <span className="font-medium">Marca:</span>
                  <p className="text-gray-700">{fornecedorMap.get(pedido.fornecedor_id) || 'N/A'}</p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Informações Financeiras */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm flex items-center gap-2">
                <DollarSign className="w-4 h-4" />
                Informações Financeiras
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-3 gap-6">
                <div>
                  <span className="font-medium">Valor Total:</span>
                  <p className="text-2xl font-bold text-green-600 mt-1">
                    R$ {pedido.valor_total?.toFixed(2)}
                  </p>
                </div>
                {pedido.metodo_pagamento && (
                  <div>
                    <span className="font-medium">Método de Pagamento:</span>
                    <p className="text-gray-700 mt-1">{formatPaymentMethod(pedido.metodo_pagamento)}</p>
                  </div>
                )}
                {pedido.data_pagamento && (
                  <div>
                    <span className="font-medium">Data do Pagamento:</span>
                    <p className="text-gray-700 mt-1">{new Date(pedido.data_pagamento).toLocaleDateString('pt-BR')}</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Informações de Entrega */}
          {(pedido.data_prevista_envio || pedido.data_prevista_entrega || pedido.transportadora || pedido.codigo_rastreio) && (
            <Card>
              <CardHeader>
                <CardTitle className="text-sm flex items-center gap-2">
                  <Truck className="w-4 h-4" />
                  Informações de Entrega
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-2 gap-6">
                  {pedido.data_prevista_envio && (
                    <div>
                      <span className="font-medium flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        Previsão de Envio:
                      </span>
                      <p className="text-gray-700">{new Date(pedido.data_prevista_envio).toLocaleDateString('pt-BR')}</p>
                    </div>
                  )}
                  {pedido.data_prevista_entrega && (
                    <div>
                      <span className="font-medium flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        Previsão de Entrega:
                      </span>
                      <p className="text-gray-700">{new Date(pedido.data_prevista_entrega).toLocaleDateString('pt-BR')}</p>
                    </div>
                  )}
                  {pedido.transportadora && (
                    <div>
                      <span className="font-medium flex items-center gap-1">
                        <MapPin className="w-3 h-3" />
                        Transportadora:
                      </span>
                      <p className="text-gray-700">{pedido.transportadora}</p>
                    </div>
                  )}
                  {pedido.codigo_rastreio && (
                    <div>
                      <span className="font-medium flex items-center gap-1">
                        <Truck className="w-3 h-3" />
                        Código de Rastreio:
                      </span>
                      <code className="bg-gray-100 px-2 py-1 rounded font-mono text-sm">
                        {pedido.codigo_rastreio}
                      </code>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Nota Fiscal */}
          {pedido.nf_numero && (
            <Card>
              <CardHeader>
                <CardTitle className="text-sm flex items-center gap-2">
                  <Receipt className="w-4 h-4" />
                  Nota Fiscal
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div>
                  <span className="font-medium">Número:</span>
                  <code className="ml-2 bg-gray-100 px-2 py-1 rounded font-mono text-sm">
                    {pedido.nf_numero}
                  </code>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Itens do Pedido */}
          {itens.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-sm flex items-center gap-2">
                  <Package className="w-4 h-4" />
                  Itens do Pedido ({itens.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {itens.map((item, index) => (
                    <div key={index} className="bg-gray-50 p-3 rounded-lg">
                      <div className="flex justify-between items-start">
                        <div>
                          <h4 className="font-medium">{item.nome || `Item ${index + 1}`}</h4>
                          {item.grade && (
                            <p className="text-sm text-gray-600">Grade: {JSON.stringify(item.grade)}</p>
                          )}
                          {item.quantidade && (
                            <p className="text-sm text-gray-600">Quantidade: {item.quantidade}</p>
                          )}
                        </div>
                        {item.preco && (
                          <div className="text-right">
                            <p className="font-semibold text-green-600">
                              R$ {item.preco.toFixed(2)}
                            </p>
                            {item.quantidade && (
                              <p className="text-sm text-gray-600">
                                Total: R$ {(item.preco * item.quantidade).toFixed(2)}
                              </p>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Observações */}
          {(pedido.observacoes_comprador || pedido.observacoes_fornecedor || pedido.observacoes_entrega) && (
            <div className="space-y-4">
              {pedido.observacoes_comprador && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm">Observações do Cliente</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-gray-700">{pedido.observacoes_comprador}</p>
                  </CardContent>
                </Card>
              )}
              
              {pedido.observacoes_fornecedor && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm">Observações do Fornecedor</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-gray-700">{pedido.observacoes_fornecedor}</p>
                  </CardContent>
                </Card>
              )}
              
              {pedido.observacoes_entrega && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm">Instruções de Entrega</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-gray-700">{pedido.observacoes_entrega}</p>
                  </CardContent>
                </Card>
              )}
            </div>
          )}
        </div>

        <div className="flex justify-end pt-4 border-t">
          <Button onClick={onClose} variant="outline">
            Fechar
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}