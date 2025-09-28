import React, { useState, useEffect } from 'react';
import { Produto } from '@/api/entities';
import { Fornecedor } from '@/api/entities';
import { UserCompat } from '@/api/entities';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Package, Edit, Star, Search, AlertTriangle, Eye } from 'lucide-react';
import ProductForm from '../components/admin/ProductForm';
import { Switch } from '@/components/ui/switch';
import { useNotification } from '@/hooks/useNotification';
import { Notification } from '@/components/ui/notification';

export default function GestaoProdutos() {
  const [produtos, setProdutos] = useState([]);
  const [fornecedores, setFornecedores] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingProduto, setEditingProduto] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterFornecedor, setFilterFornecedor] = useState('all');
  const [filterCategoria, setFilterCategoria] = useState('all');
  const notification = useNotification();

  const categorias = [
    'Camisetas', 'Polos', 'Shorts', 'Calças', 
    'Vestidos', 'Blusas', 'Jaquetas', 'Acessórios'
  ];

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      console.log('🔄 GestaoProdutos: Carregando dados...');

      // Primeiro, obter o usuário atual
      const user = await UserCompat.me();
      if (!user) {
        throw new Error('Usuário não autenticado');
      }

      setCurrentUser(user);
      console.log('👤 Usuário atual:', { id: user.id, role: user.role, fornecedor_id: user.fornecedor_id });

      let produtosResult, fornecedoresResult;

      if (user.role === 'admin') {
        // Admin vê todos os produtos e fornecedores
        [produtosResult, fornecedoresResult] = await Promise.all([
          Produto.find({ order: { column: 'created_at', ascending: false } }),
          Fornecedor.find()
        ]);
      } else if (user.role === 'fornecedor' && user.fornecedor_id) {
        // Fornecedor vê apenas seus próprios produtos
        [produtosResult, fornecedoresResult] = await Promise.all([
          Produto.find({
            filters: { fornecedor_id: user.fornecedor_id },
            order: { column: 'created_at', ascending: false }
          }),
          Fornecedor.find({ filters: { id: user.fornecedor_id } })
        ]);
      } else {
        // Usuário sem fornecedor_id (multimarca) não deveria estar aqui
        console.warn('⚠️ Usuário sem fornecedor_id tentando acessar gestão de produtos');
        produtosResult = { success: true, data: [] };
        fornecedoresResult = { success: true, data: [] };
      }

      console.log('📊 GestaoProdutos: Resultados:', {
        produtos: produtosResult?.success,
        fornecedores: fornecedoresResult?.success,
        userRole: user.role,
        fornecedorId: user.fornecedor_id
      });

      const produtos = produtosResult?.success ? produtosResult.data : [];
      const fornecedores = fornecedoresResult?.success ? fornecedoresResult.data : [];

      setProdutos(produtos);
      setFornecedores(fornecedores);

      console.log('✅ GestaoProdutos: Dados carregados:', { produtos: produtos.length, fornecedores: fornecedores.length });
    } catch (error) {
      console.error("Erro ao carregar dados:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (produto) => {
    setEditingProduto(produto);
    setShowForm(true);
  };

  const handleSuccess = () => {
    setShowForm(false);
    setEditingProduto(null);
    loadData();
  };
  
  const handleDestaqueToggle = async (produto, isChecked) => {
    try {
      await Produto.update(produto.id, { is_destaque: isChecked });
      loadData();
    } catch (error) {
      console.error("Erro ao atualizar destaque:", error);
      notification.showError("Falha ao atualizar o status de destaque do produto.");
    }
  };

  const handleAtivoToggle = async (produto, isChecked) => {
    try {
      await Produto.update(produto.id, { ativo: isChecked });
      loadData();
    } catch (error) {
      console.error("Erro ao atualizar status:", error);
      notification.showError("Falha ao atualizar o status do produto.");
    }
  };

  const getFornecedorNome = (fornecedorId) => {
    const fornecedor = fornecedores.find(f => f.id === fornecedorId);
    return fornecedor ? fornecedor.nome_marca : 'N/A';
  };

  const getStatusEstoque = (produto) => {
    if (!produto.controla_estoque) return null;
    
    if (produto.estoque_atual_grades <= 0) {
      return { label: 'Sem Estoque', color: 'bg-red-100 text-red-800', icon: AlertTriangle };
    }
    
    if (produto.estoque_atual_grades <= produto.estoque_minimo_grades) {
      return { label: 'Estoque Baixo', color: 'bg-yellow-100 text-yellow-800', icon: AlertTriangle };
    }
    
    return { label: 'Em Estoque', color: 'bg-green-100 text-green-800', icon: Package };
  };

  // Filtrar produtos
  const filteredProdutos = produtos.filter(produto => {
    const matchesSearch = produto.nome?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         produto.marca?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFornecedor = filterFornecedor === 'all' || produto.fornecedor_id === filterFornecedor;
    const matchesCategoria = filterCategoria === 'all' || produto.categoria === filterCategoria;
    
    return matchesSearch && matchesFornecedor && matchesCategoria;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {showForm ? (
        <ProductForm
          produto={editingProduto}
          onSuccess={handleSuccess}
          onCancel={() => {
            setShowForm(false);
            setEditingProduto(null);
          }}
        />
      ) : (
        <div className="space-y-6">
          {/* Header */}
          <div className="flex flex-col lg:flex-row gap-4 justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
                <Package className="w-6 h-6" />
                Gestão de Produtos
              </h1>
              <p className="text-gray-600">Cadastre e gerencie produtos com grades personalizadas</p>
            </div>
            
            <Button onClick={() => setShowForm(true)} className="bg-blue-600 hover:bg-blue-700 text-white">
              <Plus className="w-4 h-4 mr-2" />
              Novo Produto
            </Button>
          </div>

          {/* Filtros */}
          <Card>
            <CardContent className="p-4">
              <div className="flex flex-col lg:flex-row gap-4 items-center">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <Input
                    placeholder="Buscar produtos..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
                
                <Select value={filterFornecedor} onValueChange={setFilterFornecedor}>
                  <SelectTrigger className="w-48">
                    <SelectValue placeholder="Todos fornecedores" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos fornecedores</SelectItem>
                    {fornecedores.map(fornecedor => (
                      <SelectItem key={`filter-fornecedor-${fornecedor.id}`} value={fornecedor.id}>
                        {fornecedor.nome_marca}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Select value={filterCategoria} onValueChange={setFilterCategoria}>
                  <SelectTrigger className="w-48">
                    <SelectValue placeholder="Todas categorias" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todas categorias</SelectItem>
                    {categorias.map(categoria => (
                      <SelectItem key={categoria} value={categoria}>
                        {categoria}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Tabela de Produtos */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>Produtos Cadastrados ({filteredProdutos.length})</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Produto</TableHead>
                      <TableHead>Fornecedor</TableHead>
                      <TableHead>Categoria</TableHead>
                      <TableHead>Grade</TableHead>
                      <TableHead>Preço</TableHead>
                      <TableHead>Estoque</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredProdutos.map((produto) => {
                      const statusEstoque = getStatusEstoque(produto);
                      
                      return (
                        <TableRow key={produto.id}>
                          <TableCell>
                            <div className="flex items-center gap-3">
                              {produto.fotos && produto.fotos[0] && (
                                <img 
                                  src={produto.fotos[0]} 
                                  className="w-12 h-12 object-cover rounded-md" 
                                  alt={produto.nome}
                                />
                              )}
                              <div>
                                <div className="font-medium flex items-center gap-2">
                                  {produto.nome}
                                  {produto.is_destaque && <Star className="w-4 h-4 text-yellow-500 fill-current" />}
                                </div>
                                <Badge variant="outline" className="text-xs">
                                  {getFornecedorNome(produto.fornecedor_id)}
                                </Badge>
                              </div>
                            </div>
                          </TableCell>
                          
                          <TableCell>
                            <Badge variant="secondary">
                              {getFornecedorNome(produto.fornecedor_id)}
                            </Badge>
                          </TableCell>
                          
                          <TableCell>
                            {produto.categoria && (
                              <Badge variant="outline">{produto.categoria}</Badge>
                            )}
                          </TableCell>
                          
                          <TableCell>
                            {produto.tipo_venda === 'grade' && (
                              <div className="text-sm">
                                <div>{produto.total_pecas_grade} peças</div>
                                <div className="text-gray-500">
                                  {produto.grade_configuracao?.tamanhos_disponiveis?.join(', ') || 'N/A'}
                                </div>
                              </div>
                            )}
                          </TableCell>
                          
                          <TableCell>
                            <div className="text-sm">
                              {produto.tipo_venda === 'grade' ? (
                                <>
                                  <div className="font-semibold">R$ {produto.preco_grade_completa?.toFixed(2)}</div>
                                  <div className="text-gray-500">R$ {produto.preco_por_peca?.toFixed(2)}/pç</div>
                                </>
                              ) : (
                                <div className="font-semibold">R$ {produto.preco_por_peca?.toFixed(2)}</div>
                              )}
                            </div>
                          </TableCell>
                          
                          <TableCell>
                            {statusEstoque && (
                              <Badge className={statusEstoque.color}>
                                <statusEstoque.icon className="w-3 h-3 mr-1" />
                                {produto.estoque_atual_grades} grades
                              </Badge>
                            )}
                          </TableCell>
                          
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Switch
                                checked={produto.is_destaque}
                                onCheckedChange={(checked) => handleDestaqueToggle(produto, checked)}
                                aria-label="Destaque"
                                size="sm"
                              />
                              <span className="text-xs text-gray-500">Destaque</span>
                            </div>
                            
                            <div className="flex items-center gap-2 mt-1">
                              <Switch
                                checked={produto.ativo}
                                onCheckedChange={(checked) => handleAtivoToggle(produto, checked)}
                                aria-label="Ativo"
                                size="sm"
                              />
                              <span className="text-xs text-gray-500">Ativo</span>
                            </div>
                          </TableCell>
                          
                          <TableCell>
                            <div className="flex gap-2">
                              <Button 
                                variant="outline" 
                                size="sm" 
                                onClick={() => handleEdit(produto)}
                              >
                                <Edit className="w-4 h-4 mr-1" />
                                Editar
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>

              {filteredProdutos.length === 0 && (
                <div className="text-center py-12">
                  <Package className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Nenhum produto encontrado</h3>
                  <p className="text-gray-600">
                    {searchTerm || filterFornecedor !== 'all' || filterCategoria !== 'all' 
                      ? 'Tente ajustar os filtros de busca.' 
                      : 'Cadastre o primeiro produto do sistema.'
                    }
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
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