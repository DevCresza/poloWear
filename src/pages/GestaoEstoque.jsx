import React, { useState, useEffect } from 'react';
import { Produto } from '@/api/entities';
import { MovimentacaoEstoque } from '@/api/entities';
import { Fornecedor } from '@/api/entities';
import { UserCompat as User } from '@/api/entities';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import {
  Package, AlertTriangle, TrendingUp, TrendingDown, Plus, Minus,
  Search, Filter, Eye, Edit, RotateCcw, FileText, Building, X
} from 'lucide-react';

export default function GestaoEstoque() {
  const [produtos, setProdutos] = useState([]);
  const [movimentacoes, setMovimentacoes] = useState([]);
  const [fornecedores, setFornecedores] = useState([]);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedFornecedor, setSelectedFornecedor] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [showMovimentacao, setShowMovimentacao] = useState(false);
  const [selectedProduto, setSelectedProduto] = useState(null);
  const [showNotification, setShowNotification] = useState(false);
  const [notificationMessage, setNotificationMessage] = useState('');
  const [notificationType, setNotificationType] = useState('success');
  const [movimentacaoForm, setMovimentacaoForm] = useState({
    tipo_movimentacao: 'entrada',
    quantidade: '',
    motivo: '',
    observacoes: ''
  });

  useEffect(() => {
    loadData();
  }, []);

  const showSuccessNotification = (message) => {
    setNotificationMessage(message);
    setNotificationType('success');
    setShowNotification(true);
    setTimeout(() => {
      setShowNotification(false);
    }, 3000);
  };

  const showErrorNotification = (message) => {
    setNotificationMessage(message);
    setNotificationType('error');
    setShowNotification(true);
    setTimeout(() => {
      setShowNotification(false);
    }, 3000);
  };

  const loadData = async () => {
    setLoading(true);
    try {
      // Primeiro, obter o usuário atual
      const currentUser = await User.me();
      if (!currentUser) {
        throw new Error('Usuário não autenticado');
      }

      setUser(currentUser);

      let produtosResult, movimentacoesResult, fornecedoresResult;

      if (currentUser.role === 'admin') {
        // Admin vê todos os dados
        [produtosResult, movimentacoesResult, fornecedoresResult] = await Promise.all([
          Produto.find({ order: { column: 'updated_at', ascending: false } }),
          MovimentacaoEstoque.find({ order: { column: 'created_at', ascending: false } }),
          Fornecedor.find()
        ]);
      } else if (currentUser.role === 'fornecedor' && currentUser.fornecedor_id) {
        // Fornecedor vê apenas seus próprios dados
        [produtosResult, movimentacoesResult, fornecedoresResult] = await Promise.all([
          Produto.find({
            filters: { fornecedor_id: currentUser.fornecedor_id },
            order: { column: 'updated_at', ascending: false }
          }),
          MovimentacaoEstoque.find({
            filters: { user_id: currentUser.id },
            order: { column: 'created_at', ascending: false }
          }),
          Fornecedor.find({ filters: { id: currentUser.fornecedor_id } })
        ]);
      } else {
        // Usuário sem fornecedor_id não deveria estar aqui
        produtosResult = { success: true, data: [] };
        movimentacoesResult = { success: true, data: [] };
        fornecedoresResult = { success: true, data: [] };
      }

      const produtosList = produtosResult.success ? produtosResult.data : [];
      const movimentacoesList = movimentacoesResult.success ? movimentacoesResult.data : [];
      const fornecedoresList = fornecedoresResult.success ? fornecedoresResult.data : [];

      setProdutos(produtosList || []);
      setMovimentacoes(movimentacoesList || []);
      setFornecedores(fornecedoresList || []);
    } catch (error) {
    } finally {
      setLoading(false);
    }
  };

  const handleMovimentacao = (produto) => {
    setSelectedProduto(produto);
    setMovimentacaoForm({
      tipo_movimentacao: 'entrada',
      quantidade: '',
      motivo: '',
      observacoes: ''
    });
    setShowMovimentacao(true);
  };

  const submitMovimentacao = async (e) => {
    e.preventDefault();
    
    try {
      const quantidade = parseInt(movimentacaoForm.quantidade);

      // Definir se a movimentação aumenta ou diminui o estoque
      let quantidadeMovimentacao;
      switch (movimentacaoForm.tipo_movimentacao) {
        case 'entrada':
        case 'devolucao': // Devolução aumenta o estoque
          quantidadeMovimentacao = quantidade;
          break;
        case 'saida':
        case 'perda': // Perda diminui o estoque
          quantidadeMovimentacao = -quantidade;
          break;
        case 'ajuste':
          // Para ajuste, usar o valor direto (pode ser positivo ou negativo)
          quantidadeMovimentacao = parseInt(movimentacaoForm.quantidade);
          break;
        default:
          quantidadeMovimentacao = quantidade;
      }

      const estoqueAtual = selectedProduto.estoque_atual_grades || selectedProduto.estoque_atual || 0;
      const novoEstoque = estoqueAtual + quantidadeMovimentacao;
      
      if (novoEstoque < 0) {
        showErrorNotification('Não é possível ter estoque negativo!');
        return;
      }

      // Criar movimentação
      await MovimentacaoEstoque.create({
        produto_id: selectedProduto.id,
        tipo: movimentacaoForm.tipo_movimentacao,
        quantidade_grades: quantidadeMovimentacao,
        quantidade_anterior: estoqueAtual,
        quantidade_atual: novoEstoque,
        motivo: movimentacaoForm.motivo,
        user_id: user.id,
        observacoes: movimentacaoForm.observacoes
      });

      // Atualizar estoque do produto
      await Produto.update(selectedProduto.id, {
        estoque_atual_grades: novoEstoque
      });

      setShowMovimentacao(false);
      showSuccessNotification('Movimentação registrada com sucesso!');
      loadData();

    } catch (error) {
      showErrorNotification('Erro ao registrar movimentação. Tente novamente.');
    }
  };

  const getEstoqueStatus = (produto) => {
    const estoqueAtual = produto.estoque_atual_grades || produto.estoque_atual || 0;
    const estoqueMinimo = produto.estoque_minimo_grades || produto.estoque_minimo || 0;

    if (!produto.controla_estoque) return { label: 'Sem Controle', color: 'bg-gray-100 text-gray-800' };
    if (estoqueAtual <= 0) return { label: 'Sem Estoque', color: 'bg-red-100 text-red-800' };
    if (estoqueAtual <= estoqueMinimo) return { label: 'Estoque Baixo', color: 'bg-yellow-100 text-yellow-800' };
    return { label: 'Normal', color: 'bg-green-100 text-green-800' };
  };

  const filteredProdutos = produtos.filter(produto => {
    const matchesSearch = produto.nome.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFornecedor = selectedFornecedor === 'all' || produto.fornecedor_id === selectedFornecedor;
    return matchesSearch && matchesFornecedor;
  });

  const produtosComProblemas = produtos.filter(p => {
    const estoqueAtual = p.estoque_atual_grades || p.estoque_atual || 0;
    const estoqueMinimo = p.estoque_minimo_grades || p.estoque_minimo || 0;
    return p.controla_estoque && (estoqueAtual <= 0 || estoqueAtual <= estoqueMinimo);
  });

  const fornecedorMap = new Map(fornecedores.map(f => [f.id, f.nome_marca]));

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total de Produtos</p>
                <p className="text-2xl font-bold">{produtos.length}</p>
              </div>
              <Package className="w-8 h-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Sem Estoque</p>
                <p className="text-2xl font-bold text-red-600">
                  {produtos.filter(p => p.controla_estoque && (p.estoque_atual_grades || p.estoque_atual || 0) <= 0).length}
                </p>
              </div>
              <AlertTriangle className="w-8 h-8 text-red-600" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Estoque Baixo</p>
                <p className="text-2xl font-bold text-yellow-600">
                  {produtos.filter(p => {
                    const estoqueAtual = p.estoque_atual_grades || p.estoque_atual || 0;
                    const estoqueMinimo = p.estoque_minimo_grades || p.estoque_minimo || 0;
                    return p.controla_estoque && estoqueAtual > 0 && estoqueAtual <= estoqueMinimo;
                  }).length}
                </p>
              </div>
              <TrendingDown className="w-8 h-8 text-yellow-600" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Valor Total</p>
                <p className="text-2xl font-bold text-green-600">
                  R$ {produtos.reduce((sum, p) => sum + ((p.valor_custo || p.custo_por_peca || 0) * (p.estoque_atual_grades || p.estoque_atual || 0)), 0).toFixed(2)}
                </p>
              </div>
              <TrendingUp className="w-8 h-8 text-green-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="produtos" className="space-y-6">
        <TabsList>
          <TabsTrigger value="produtos">Controle de Estoque</TabsTrigger>
          <TabsTrigger value="movimentacoes">Histórico de Movimentações</TabsTrigger>
          <TabsTrigger value="alertas">Alertas ({produtosComProblemas.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="produtos">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Package className="w-5 h-5" />
                Gestão de Estoque
              </CardTitle>
              
              {/* Filtros */}
              <div className="flex gap-4">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <Input
                    placeholder="Buscar produtos..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <Select value={selectedFornecedor} onValueChange={setSelectedFornecedor}>
                  <SelectTrigger className="w-48">
                    <SelectValue placeholder="Filtrar por fornecedor" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos Fornecedores</SelectItem>
                    {fornecedores.map(fornecedor => (
                      <SelectItem key={fornecedor.id} value={fornecedor.id}>
                        {fornecedor.nome_marca}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardHeader>
            
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Produto</TableHead>
                    <TableHead>Fornecedor</TableHead>
                    <TableHead>Estoque Atual</TableHead>
                    <TableHead>Estoque Mín.</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Última Atualização</TableHead>
                    <TableHead>Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredProdutos.map(produto => {
                    const status = getEstoqueStatus(produto);
                    
                    return (
                      <TableRow key={produto.id}>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            {produto.fotos?.[0] && (
                              <img src={produto.fotos[0]} className="w-10 h-10 object-cover rounded" alt={produto.nome} />
                            )}
                            <div>
                              <div className="font-medium">{produto.nome}</div>
                              <div className="text-sm text-gray-600">{produto.marca}</div>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>{fornecedorMap.get(produto.fornecedor_id)}</TableCell>
                        <TableCell>
                          <span className={`font-semibold ${(produto.estoque_atual_grades || produto.estoque_atual || 0) <= 0 ? 'text-red-600' : 'text-gray-900'}`}>
                            {produto.controla_estoque ? (produto.estoque_atual_grades || produto.estoque_atual || 0) : 'N/A'}
                          </span>
                        </TableCell>
                        <TableCell>{produto.controla_estoque ? (produto.estoque_minimo_grades || produto.estoque_minimo || 0) : 'N/A'}</TableCell>
                        <TableCell>
                          <Badge className={status.color}>{status.label}</Badge>
                        </TableCell>
                        <TableCell>
                          {produto.updated_at ? new Date(produto.updated_at).toLocaleDateString('pt-BR') : '-'}
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => handleMovimentacao(produto)}
                              disabled={!produto.controla_estoque}
                            >
                              <RotateCcw className="w-4 h-4 mr-1" />
                              Movimentar
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="movimentacoes">
          <Card>
            <CardHeader>
              <CardTitle>Histórico de Movimentações</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Data</TableHead>
                    <TableHead>Produto</TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead>Quantidade</TableHead>
                    <TableHead>Motivo</TableHead>
                    <TableHead>Usuário</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {movimentacoes.slice(0, 50).map(mov => {
                    const produto = produtos.find(p => p.id === mov.produto_id);
                    
                    return (
                      <TableRow key={mov.id}>
                        <TableCell>{new Date(mov.created_date).toLocaleDateString('pt-BR')}</TableCell>
                        <TableCell>{produto?.nome || 'Produto não encontrado'}</TableCell>
                        <TableCell>
                          <Badge variant={mov.tipo_movimentacao === 'entrada' ? 'default' : 'destructive'}>
                            {mov.tipo_movimentacao === 'entrada' ? (
                              <Plus className="w-3 h-3 mr-1" />
                            ) : (
                              <Minus className="w-3 h-3 mr-1" />
                            )}
                            {mov.tipo_movimentacao}
                          </Badge>
                        </TableCell>
                        <TableCell className={mov.quantidade > 0 ? 'text-green-600' : 'text-red-600'}>
                          {mov.quantidade > 0 ? '+' : ''}{mov.quantidade}
                        </TableCell>
                        <TableCell>{mov.motivo}</TableCell>
                        <TableCell>{mov.created_by}</TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="alertas">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-red-600">
                <AlertTriangle className="w-5 h-5" />
                Produtos com Problemas de Estoque
              </CardTitle>
            </CardHeader>
            <CardContent>
              {produtosComProblemas.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <Package className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                  <p>Nenhum produto com problemas de estoque!</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Produto</TableHead>
                      <TableHead>Estoque Atual</TableHead>
                      <TableHead>Estoque Mínimo</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Ação</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {produtosComProblemas.map(produto => {
                      const status = getEstoqueStatus(produto);
                      
                      return (
                        <TableRow key={produto.id}>
                          <TableCell>{produto.nome}</TableCell>
                          <TableCell className="text-red-600 font-semibold">{produto.estoque_atual_grades || produto.estoque_atual || 0}</TableCell>
                          <TableCell>{produto.estoque_minimo_grades || produto.estoque_minimo || 0}</TableCell>
                          <TableCell>
                            <Badge className={status.color}>{status.label}</Badge>
                          </TableCell>
                          <TableCell>
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => handleMovimentacao(produto)}
                            >
                              Repor Estoque
                            </Button>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Modal de Movimentação */}
      {showMovimentacao && selectedProduto && (
        <Dialog open={showMovimentacao} onOpenChange={setShowMovimentacao}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Movimentação de Estoque - {selectedProduto.nome}</DialogTitle>
              <DialogDescription>
                Registre entradas, saídas ou ajustes no estoque deste produto.
              </DialogDescription>
            </DialogHeader>
            
            <form onSubmit={submitMovimentacao} className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <Label>Tipo de Movimentação</Label>
                  <Select 
                    value={movimentacaoForm.tipo_movimentacao} 
                    onValueChange={(value) => setMovimentacaoForm({...movimentacaoForm, tipo_movimentacao: value})}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="entrada">Entrada</SelectItem>
                      <SelectItem value="saida">Saída</SelectItem>
                      <SelectItem value="ajuste">Ajuste</SelectItem>
                      <SelectItem value="perda">Perda</SelectItem>
                      <SelectItem value="devolucao">Devolução</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <Label>Quantidade</Label>
                  <Input
                    type="number"
                    value={movimentacaoForm.quantidade}
                    onChange={(e) => setMovimentacaoForm({...movimentacaoForm, quantidade: e.target.value})}
                    placeholder={movimentacaoForm.tipo_movimentacao === 'ajuste' ? 'Positivo: aumenta | Negativo: diminui' : 'Digite a quantidade'}
                    required
                  />
                  {movimentacaoForm.tipo_movimentacao === 'ajuste' && (
                    <p className="text-xs text-gray-500 mt-1">
                      Para ajustes: use valores positivos para aumentar o estoque ou negativos para diminuir
                    </p>
                  )}
                </div>
              </div>
              
              
              <div>
                <Label>Motivo</Label>
                <Input
                  value={movimentacaoForm.motivo}
                  onChange={(e) => setMovimentacaoForm({...movimentacaoForm, motivo: e.target.value})}
                  placeholder="Descreva o motivo da movimentação"
                  required
                />
              </div>
              
              <div>
                <Label>Observações</Label>
                <Textarea
                  value={movimentacaoForm.observacoes}
                  onChange={(e) => setMovimentacaoForm({...movimentacaoForm, observacoes: e.target.value})}
                  placeholder="Observações adicionais..."
                />
              </div>
              
              <div className="flex justify-between items-center p-4 bg-gray-50 rounded-lg">
                <div>
                  <p className="text-sm text-gray-600">Estoque Atual: <span className="font-semibold">{selectedProduto.estoque_atual_grades || selectedProduto.estoque_atual || 0}</span></p>
                  {movimentacaoForm.quantidade && !isNaN(parseInt(movimentacaoForm.quantidade)) && (
                    <p className="text-sm text-gray-600">
                      Novo Estoque: <span className="font-semibold">
                        {(() => {
                          const quantidade = parseInt(movimentacaoForm.quantidade);
                          const estoqueAtual = selectedProduto.estoque_atual_grades || selectedProduto.estoque_atual || 0;

                          let quantidadeMovimentacao;
                          switch (movimentacaoForm.tipo_movimentacao) {
                            case 'entrada':
                            case 'devolucao':
                              quantidadeMovimentacao = quantidade;
                              break;
                            case 'saida':
                            case 'perda':
                              quantidadeMovimentacao = -quantidade;
                              break;
                            case 'ajuste':
                              quantidadeMovimentacao = parseInt(movimentacaoForm.quantidade);
                              break;
                            default:
                              quantidadeMovimentacao = quantidade;
                          }

                          return estoqueAtual + quantidadeMovimentacao;
                        })()}
                      </span>
                    </p>
                  )}
                </div>
              </div>
              
              <div className="flex justify-end gap-4">
                <Button type="button" variant="outline" onClick={() => setShowMovimentacao(false)}>
                  Cancelar
                </Button>
                <Button type="submit">
                  Registrar Movimentação
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
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
    </div>
  );
}