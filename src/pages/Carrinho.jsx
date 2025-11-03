
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Produto } from '@/api/entities';
import { Fornecedor } from '@/api/entities';
import { Pedido } from '@/api/entities';
import { UserCompat as User } from '@/api/entities';
import { createPageUrl } from '@/utils';
import { useNotification } from '@/hooks/useNotification';
import { Notification } from '@/components/ui/notification';
import {
  ShoppingCart, Trash2, Plus, Minus, AlertTriangle,
  CreditCard, Building, Package, DollarSign, X
} from 'lucide-react';

export default function Carrinho() {
  const [carrinho, setCarrinho] = useState([]);
  const [fornecedores, setFornecedores] = useState([]);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(false);
  const [observacoes, setObservacoes] = useState('');
  const { showSuccess, showError, showNotification, notificationMessage, notificationType, hideNotification } = useNotification();

  useEffect(() => {
    loadData();
    loadCarrinho();
  }, []);

  const loadData = async () => {
    try {
      const [fornecedoresResult, currentUser] = await Promise.all([
        Fornecedor.find(),
        User.me()
      ]);
      const fornecedores = fornecedoresResult.success ? fornecedoresResult.data : [];
      setFornecedores(fornecedores);
      setUser(currentUser);
    } catch (error) {
    }
  };

  const loadCarrinho = () => {
    const carrinhoSalvo = localStorage.getItem('carrinho');
    if (carrinhoSalvo) {
      setCarrinho(JSON.parse(carrinhoSalvo));
    }
  };

  const salvarCarrinho = (novoCarrinho) => {
    setCarrinho(novoCarrinho);
    localStorage.setItem('carrinho', JSON.stringify(novoCarrinho));
  };

  const adicionarProduto = (produto, quantidade = 1) => {
    const itemExistente = carrinho.find(item => item.id === produto.id);
    
    if (itemExistente) {
      const novoCarrinho = carrinho.map(item =>
        item.id === produto.id 
          ? { ...item, quantidade: item.quantidade + quantidade }
          : item
      );
      salvarCarrinho(novoCarrinho);
    } else {
      const novoCarrinho = [...carrinho, { ...produto, quantidade }];
      salvarCarrinho(novoCarrinho);
    }
  };

  const removerProduto = (produtoId) => {
    const novoCarrinho = carrinho.filter(item => item.id !== produtoId);
    salvarCarrinho(novoCarrinho);
  };

  const alterarQuantidade = (produtoId, novaQuantidade) => {
    if (novaQuantidade <= 0) {
      removerProduto(produtoId);
      return;
    }
    
    const novoCarrinho = carrinho.map(item =>
      item.id === produtoId 
        ? { ...item, quantidade: novaQuantidade }
        : item
    );
    salvarCarrinho(novoCarrinho);
  };

  const produtosPorFornecedor = carrinho.reduce((acc, item) => {
    // Só processar se os fornecedores já foram carregados
    if (fornecedores.length === 0) {
      return acc;
    }

    const fornecedor = fornecedores.find(f => f.id === item.fornecedor_id);

    // Só processar se o fornecedor existir
    if (!fornecedor) {
      return acc;
    }

    if (!acc[item.fornecedor_id]) {
      acc[item.fornecedor_id] = {
        fornecedor: fornecedor,
        produtos: [],
        valorTotal: 0
      };
    }
    
    const precoItem = item.tipo_venda === 'grade' ? item.preco_grade_completa : item.preco_por_peca;
    const valorTotalItem = (precoItem || 0) * item.quantidade;
    
    acc[item.fornecedor_id].produtos.push(item);
    acc[item.fornecedor_id].valorTotal += valorTotalItem;
    
    return acc;
  }, {});

  const valorTotalGeral = Object.values(produtosPorFornecedor)
    .reduce((total, grupo) => total + grupo.valorTotal, 0);

  const validarPedidoMinimo = () => {
    return Object.values(produtosPorFornecedor).map(grupo => {
      const pedidoMinimo = grupo.fornecedor?.pedido_minimo_valor || 0;
      return {
        fornecedor: grupo.fornecedor,
        valorAtual: grupo.valorTotal,
        minimo: pedidoMinimo,
        atingiu: grupo.valorTotal >= pedidoMinimo,
        diferenca: Math.max(0, pedidoMinimo - grupo.valorTotal)
      };
    });
  };

  const finalizarPedido = async () => {
    const validacao = validarPedidoMinimo();
    const naoAtingidos = validacao.filter(v => !v.atingiu);
    
    if (naoAtingidos.length > 0) {
      const message = `Não é possível finalizar o pedido. Alguns fornecedores não atingiram o valor mínimo:\n\n${
        naoAtingidos.map(p =>
          `${p.fornecedor.nome_marca}: falta R$ ${p.diferenca.toFixed(2)}`
        ).join('\n')
      }`;
      showError(message);
      return;
    }
    
    setLoading(true);
    
    try {
      for (const [fornecedorId, grupo] of Object.entries(produtosPorFornecedor)) {
        const itensPedido = grupo.produtos.map(item => ({
          produto_id: item.id,
          nome: item.nome,
          quantidade: item.quantidade,
          preco_unitario: item.tipo_venda === 'grade' ? item.preco_grade_completa : item.preco_por_peca,
          tipo_venda: item.tipo_venda,
          grade_detalhada: item.grade_detalhada
        }));
        
        await Pedido.create({
          comprador_user_id: user.id,
          fornecedor_id: fornecedorId,
          itens: JSON.stringify(itensPedido),
          valor_total: grupo.valorTotal,
          valor_final: grupo.valorTotal,
          status: 'novo_pedido',
          status_pagamento: 'pendente',
          observacoes: observacoes
        });
      }
      
      salvarCarrinho([]);
      showSuccess('Pedido realizado com sucesso! Você será redirecionado para seus pedidos.');
      setTimeout(() => {
        window.location.href = createPageUrl('MeusPedidos');
      }, 3000);

    } catch (error) {
      showError('Erro ao finalizar pedido. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  const validacaoFornecedores = validarPedidoMinimo();
  const todosAtingidos = validacaoFornecedores.every(v => v.atingiu);

  if (carrinho.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="p-12 text-center">
            <ShoppingCart className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Carrinho Vazio</h3>
            <p className="text-gray-600 mb-6">Adicione produtos ao carrinho para continuar.</p>
            <Button onClick={() => window.location.href = createPageUrl('Catalogo')}>
              Voltar ao Catálogo
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-4xl mx-auto space-y-6">
        <h1 className="text-3xl font-bold text-gray-900">Carrinho de Compras</h1>
        
        <div className="space-y-6">
          {validacaoFornecedores.map(({ fornecedor, produtos, valorTotal, atingiu, minimo, diferenca }) => {
            // Verificar se fornecedor existe
            if (!fornecedor || !fornecedor.id) return null;

            const grupo = produtosPorFornecedor[fornecedor.id];
            if (!grupo) return null;

            return (
              <Card key={fornecedor.id} className={atingiu ? 'border-green-200' : 'border-yellow-300'}>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Building className="w-5 h-5" />
                      <span>{fornecedor.nome_marca}</span>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-bold text-green-600">
                        R$ {grupo.valorTotal.toFixed(2)}
                      </p>
                      <p className={`text-sm ${atingiu ? 'text-gray-600' : 'text-yellow-600 font-semibold'}`}>
                        Mínimo: R$ {minimo.toFixed(2)}
                        {!atingiu && ` (faltam R$ ${diferenca.toFixed(2)})`}
                      </p>
                    </div>
                  </CardTitle>
                </CardHeader>
                
                <CardContent>
                  <div className="space-y-4">
                    {grupo.produtos.map(item => {
                      const precoItem = item.tipo_venda === 'grade' ? item.preco_grade_completa : item.preco_por_peca;
                      
                      return (
                        <div key={item.id} className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg">
                          {item.fotos?.[0] && (
                            <img src={item.fotos[0]} alt={item.nome} className="w-16 h-16 object-cover rounded-lg" />
                          )}
                          
                          <div className="flex-1">
                            <h3 className="font-semibold">{item.nome}</h3>
                            <p className="text-sm text-gray-600">{item.marca}</p>
                            <p className="text-lg font-bold text-green-600">R$ {(precoItem || 0).toFixed(2)}</p>
                            {item.tipo_venda === 'grade' && (
                              <Badge variant="outline">Grade completa • {item.total_pecas_grade} peças</Badge>
                            )}
                          </div>
                          
                          <div className="flex items-center gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => alterarQuantidade(item.id, item.quantidade - 1)}
                            >
                              <Minus className="w-4 h-4" />
                            </Button>
                            
                            <Input
                              type="number"
                              min="1"
                              value={item.quantidade}
                              onChange={(e) => alterarQuantidade(item.id, parseInt(e.target.value) || 1)}
                              className="w-20 text-center"
                            />
                            
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => alterarQuantidade(item.id, item.quantidade + 1)}
                            >
                              <Plus className="w-4 h-4" />
                            </Button>
                            
                            <Button
                              variant="destructive"
                              size="sm"
                              onClick={() => removerProduto(item.id)}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                          
                          <div className="text-right min-w-[100px]">
                            <p className="font-bold">R$ {((precoItem || 0) * item.quantidade).toFixed(2)}</p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="w-5 h-5" />
              Resumo do Pedido
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="observacoes">Observações para os Fornecedores</Label>
              <Textarea
                id="observacoes"
                value={observacoes}
                onChange={(e) => setObservacoes(e.target.value)}
                placeholder="Observações especiais, instruções de entrega, etc."
                className="h-20"
              />
            </div>
            
            <Separator />
            
            <div className="flex justify-between items-center text-lg font-bold">
              <span>Valor Total:</span>
              <span className="text-green-600">R$ {valorTotalGeral.toFixed(2)}</span>
            </div>
            
            <Button
              onClick={finalizarPedido}
              disabled={loading || !todosAtingidos}
              className="w-full h-12 text-lg"
            >
              {loading ? (
                'Processando...'
              ) : !todosAtingidos ? (
                'Valores Mínimos Não Atingidos'
              ) : (
                <>
                  <CreditCard className="w-5 h-5 mr-2" />
                  Finalizar Pedido
                </>
              )}
            </Button>
            
            {!todosAtingidos && (
              <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  Adicione mais produtos aos fornecedores destacados em amarelo para atingir os valores mínimos de compra.
                </AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>

        {/* Notification */}
      </div>

      <Notification
        show={showNotification}
        message={notificationMessage}
        type={notificationType}
        onClose={hideNotification}
      />
    </div>
  );
}
