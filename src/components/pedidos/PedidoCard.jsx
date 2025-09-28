import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Eye, Edit, Calendar, CreditCard, Truck, MapPin, Package, DollarSign 
} from 'lucide-react';

export default function PedidoCard({
  pedido,
  userMap,
  fornecedorMap,
  onViewDetails,
  onEdit,
  onStatusChange,
  onPaymentStatusChange,
  getStatusInfo,
  getPaymentStatusInfo,
  updatingPedidoId,
  showEditButton = true
}) {
  const statusInfo = getStatusInfo(pedido.status);
  const paymentStatusInfo = getPaymentStatusInfo(pedido.status_pagamento);
  const StatusIcon = statusInfo.icon;
  const PaymentIcon = paymentStatusInfo.icon;

  return (
    <Card className="bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow">
      <CardContent className="p-4 space-y-3">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div>
            <h3 className="font-semibold text-gray-900">
              #{pedido.id.slice(-6).toUpperCase()}
            </h3>
            <p className="text-xs text-gray-500">
              {new Date(pedido.created_date).toLocaleDateString()}
            </p>
          </div>
          <StatusIcon className="w-5 h-5 text-gray-400" />
        </div>

        {/* Cliente e Fornecedor */}
        <div className="space-y-1">
          <div className="text-sm">
            <span className="font-medium">Cliente:</span>
            <p className="text-gray-600 truncate">
              {userMap.get(pedido.comprador_user_id) || 'N/A'}
            </p>
          </div>
          <div className="text-sm">
            <span className="font-medium">Fornecedor:</span>
            <p className="text-gray-600 truncate">
              {fornecedorMap.get(pedido.fornecedor_id) || 'N/A'}
            </p>
          </div>
        </div>

        {/* Valor */}
        <div className="bg-green-50 p-2 rounded">
          <div className="flex items-center gap-2">
            <DollarSign className="w-4 h-4 text-green-600" />
            <span className="font-bold text-green-700">
              R$ {pedido.valor_total?.toFixed(2)}
            </span>
          </div>
        </div>

        {/* Status do Pedido */}
        <div>
          <label className="text-xs font-medium text-gray-600">Status do Pedido:</label>
          <Select
            value={pedido.status}
            onValueChange={(newStatus) => onStatusChange(pedido.id, newStatus)}
            disabled={updatingPedidoId === pedido.id}
          >
            <SelectTrigger className="w-full mt-1">
              <SelectValue>
                <Badge className={statusInfo.color} variant="outline">
                  <StatusIcon className="w-3 h-3 mr-1" />
                  {statusInfo.label}
                </Badge>
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="novo_pedido">Novo Pedido</SelectItem>
              <SelectItem value="em_producao">Em Produção</SelectItem>
              <SelectItem value="faturado">Faturado</SelectItem>
              <SelectItem value="em_transporte">Em Transporte</SelectItem>
              <SelectItem value="finalizado">Finalizado</SelectItem>
              <SelectItem value="cancelado">Cancelado</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Status do Pagamento */}
        <div>
          <label className="text-xs font-medium text-gray-600">Status Pagamento:</label>
          <Select
            value={pedido.status_pagamento || 'pendente'}
            onValueChange={(newStatus) => onPaymentStatusChange(pedido.id, newStatus)}
            disabled={updatingPedidoId === pedido.id}
          >
            <SelectTrigger className="w-full mt-1">
              <SelectValue>
                <Badge className={paymentStatusInfo.color} variant="outline">
                  <PaymentIcon className="w-3 h-3 mr-1" />
                  {paymentStatusInfo.label}
                </Badge>
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="pendente">Pendente</SelectItem>
              <SelectItem value="pago">Pago</SelectItem>
              <SelectItem value="atrasado">Atrasado</SelectItem>
              <SelectItem value="cancelado">Cancelado</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Informações Adicionais */}
        {(pedido.data_prevista_entrega || pedido.codigo_rastreio) && (
          <div className="space-y-1 text-xs">
            {pedido.data_prevista_entrega && (
              <div className="flex items-center gap-1 text-gray-600">
                <Calendar className="w-3 h-3" />
                <span>Entrega: {new Date(pedido.data_prevista_entrega).toLocaleDateString()}</span>
              </div>
            )}
            {pedido.codigo_rastreio && (
              <div className="flex items-center gap-1 text-gray-600">
                <Truck className="w-3 h-3" />
                <span className="truncate">Rastreio: {pedido.codigo_rastreio}</span>
              </div>
            )}
            {pedido.transportadora && (
              <div className="flex items-center gap-1 text-gray-600">
                <MapPin className="w-3 h-3" />
                <span className="truncate">{pedido.transportadora}</span>
              </div>
            )}
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-2 pt-2 border-t">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onViewDetails(pedido)}
            className={showEditButton ? "flex-1" : "w-full"}
          >
            <Eye className="w-3 h-3 mr-1" />
            Ver
          </Button>
          {showEditButton && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => onEdit(pedido)}
              className="flex-1"
            >
              <Edit className="w-3 h-3 mr-1" />
              Editar
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}