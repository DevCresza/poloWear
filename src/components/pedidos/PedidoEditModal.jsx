import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Pedido } from '@/api/entities';

export default function PedidoEditModal({ pedido, onClose, onUpdate }) {
  const [formData, setFormData] = useState({
    data_prevista_envio: pedido.data_prevista_envio || '',
    data_prevista_entrega: pedido.data_prevista_entrega || '',
    transportadora: pedido.transportadora || '',
    codigo_rastreio: pedido.codigo_rastreio || '',
    nf_numero: pedido.nf_numero || '',
    metodo_pagamento: pedido.metodo_pagamento || '',
    observacoes_fornecedor: pedido.observacoes_fornecedor || '',
    observacoes_entrega: pedido.observacoes_entrega || ''
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      await Pedido.update(pedido.id, formData);
      onUpdate();
      onClose();
    } catch (error) {
      console.error('Erro ao salvar alterações:', error);
      alert('Erro ao salvar alterações.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Editar Pedido #{pedido.id.slice(-6).toUpperCase()}</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-6 py-4">
          {/* Datas */}
          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="data_prevista_envio">Data Prevista de Envio</Label>
              <Input
                id="data_prevista_envio"
                type="date"
                value={formData.data_prevista_envio}
                onChange={e => setFormData({...formData, data_prevista_envio: e.target.value})}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="data_prevista_entrega">Data Prevista de Entrega</Label>
              <Input
                id="data_prevista_entrega"
                type="date"
                value={formData.data_prevista_entrega}
                onChange={e => setFormData({...formData, data_prevista_entrega: e.target.value})}
              />
            </div>
          </div>

          {/* Transporte */}
          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="transportadora">Transportadora</Label>
              <Input
                id="transportadora"
                value={formData.transportadora}
                onChange={e => setFormData({...formData, transportadora: e.target.value})}
                placeholder="Nome da transportadora"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="codigo_rastreio">Código de Rastreio</Label>
              <Input
                id="codigo_rastreio"
                value={formData.codigo_rastreio}
                onChange={e => setFormData({...formData, codigo_rastreio: e.target.value})}
                placeholder="Código de rastreamento"
              />
            </div>
          </div>

          {/* Pagamento e NF */}
          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="metodo_pagamento">Método de Pagamento</Label>
              <Select value={formData.metodo_pagamento} onValueChange={value => setFormData({...formData, metodo_pagamento: value})}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o método" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pix">PIX</SelectItem>
                  <SelectItem value="boleto">Boleto</SelectItem>
                  <SelectItem value="cartao_credito">Cartão de Crédito</SelectItem>
                  <SelectItem value="transferencia">Transferência Bancária</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="nf_numero">Número da Nota Fiscal</Label>
              <Input
                id="nf_numero"
                value={formData.nf_numero}
                onChange={e => setFormData({...formData, nf_numero: e.target.value})}
                placeholder="Número da NF"
              />
            </div>
          </div>

          {/* Observações */}
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="observacoes_fornecedor">Observações do Fornecedor</Label>
              <Textarea
                id="observacoes_fornecedor"
                value={formData.observacoes_fornecedor}
                onChange={e => setFormData({...formData, observacoes_fornecedor: e.target.value})}
                placeholder="Observações internas do fornecedor..."
                className="h-20"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="observacoes_entrega">Instruções de Entrega</Label>
              <Textarea
                id="observacoes_entrega"
                value={formData.observacoes_entrega}
                onChange={e => setFormData({...formData, observacoes_entrega: e.target.value})}
                placeholder="Instruções especiais para entrega..."
                className="h-20"
              />
            </div>
          </div>

          <div className="flex justify-end gap-4 pt-4 border-t">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancelar
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Salvando...' : 'Salvar Alterações'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}