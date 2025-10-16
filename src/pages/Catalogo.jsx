
import React, { useState, useEffect } from 'react';
import { UserCompat as User } from '@/api/entities';
import { Produto } from '@/api/entities';
import { Fornecedor } from '@/api/entities';
import { Capsula } from '@/api/entities';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import {
  Search, ShoppingCart, Eye, Package, Building, Tag, DollarSign, Star, Image as ImageIcon, X
} from 'lucide-react';
import { usePageTitle } from '@/hooks/usePageTitle';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import ProductImageCarousel from '@/components/ui/product-image-carousel';

export default function Catalogo() {
  usePageTitle('Catálogo', 'Explore nossa coleção de produtos de moda no atacado');

  const [user, setUser] = useState(null);
  const [produtos, setProdutos] = useState([]);
  const [fornecedores, setFornecedores] = useState([]);
  const [capsulas, setCapsulas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedMarca, setSelectedMarca] = useState('all');
  const [selectedFornecedor, setSelectedFornecedor] = useState('all');
  const [selectedCapsula, setSelectedCapsula] = useState(null);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [showProductModal, setShowProductModal] = useState(false);
  const [showNotification, setShowNotification] = useState(false);
  const [notificationMessage, setNotificationMessage] = useState('');

  useEffect(() => {
    checkUserAndLoadData();
  }, []);

  const checkUserAndLoadData = async () => {
    try {
      const currentUser = await User.me();
      setUser(currentUser);
      
      const [produtosResult, fornecedoresResult, capsulasResult] = await Promise.all([
        Produto.find(),
        Fornecedor.find(),
        Capsula.find()
      ]);

      const produtos = produtosResult.success ? produtosResult.data : [];
      const fornecedores = fornecedoresResult.success ? fornecedoresResult.data : [];
      const capsulas = capsulasResult.success ? capsulasResult.data : [];

      setProdutos(produtos);
      setFornecedores(fornecedores);
      capsulas.forEach(capsula => {
        if (!capsula.produto_ids) {
          capsula.produto_ids = []; // Ensure produto_ids is an array
        }
      });
      setCapsulas(capsulas);
    } catch (error) {
      // Error handled silently
    } finally {
      setLoading(false);
    }
  };

  const filteredProducts = (produtos || []).filter(produto => {
    if (!produto.ativo) return false;
    
    // Verificar estoque se o produto controla estoque e não permite venda sem estoque e está sem estoque
    if (produto.controla_estoque && !produto.permite_venda_sem_estoque && produto.estoque_atual_grades <= 0) {
      return false;
    }
    
    const matchesSearch = produto.nome?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (produto.descricao && produto.descricao.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesMarca = selectedMarca === 'all' || produto.marca === selectedMarca;
    const matchesFornecedor = selectedFornecedor === 'all' || produto.fornecedor_id === selectedFornecedor;
    const matchesCapsula = !selectedCapsula || selectedCapsula.produto_ids.includes(produto.id);
    
    return matchesSearch && matchesMarca && matchesFornecedor && matchesCapsula;
  });

  const featuredProducts = produtos.filter(p =>
    p.is_destaque &&
    p.ativo &&
    (!p.controla_estoque || p.permite_venda_sem_estoque || p.estoque_atual_grades > 0)
  );
  const activeCapsulas = capsulas.filter(c => c.ativa);

  const getPrice = (produto) => {
    return produto.tipo_venda === 'grade' ? produto.preco_grade_completa : produto.preco_unitario;
  };
  
  const handleSelectCapsula = (capsula) => {
    setSelectedCapsula(capsula);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };
  
  const clearCapsulaFilter = () => {
    setSelectedCapsula(null);
  };

  const showSuccessNotification = (message) => {
    setNotificationMessage(message);
    setShowNotification(true);

    // Auto-hide após 3 segundos
    setTimeout(() => {
      setShowNotification(false);
    }, 3000);
  };

  const handleViewProduct = (produto) => {
    setSelectedProduct(produto);
    setShowProductModal(true);
  };

  const handleAddToCart = (produto) => {
    try {

      // Carregar carrinho existente do localStorage
      const carrinhoSalvo = localStorage.getItem('carrinho');
      const carrinho = carrinhoSalvo ? JSON.parse(carrinhoSalvo) : [];


      // Verificar se produto já existe no carrinho
      const itemExistente = carrinho.find(item => item.id === produto.id);

      let novoCarrinho;
      if (itemExistente) {
        // Atualizar quantidade se já existe
        novoCarrinho = carrinho.map(item =>
          item.id === produto.id
            ? { ...item, quantidade: item.quantidade + 1 }
            : item
        );
      } else {
        // Adicionar novo produto ao carrinho
        novoCarrinho = [...carrinho, { ...produto, quantidade: 1 }];
      }

      // Salvar no localStorage
      localStorage.setItem('carrinho', JSON.stringify(novoCarrinho));

      // Verificar se foi salvo corretamente
      const verificacao = localStorage.getItem('carrinho');

      // Mostrar notificação de sucesso
      showSuccessNotification(`Produto "${produto.nome}" adicionado ao carrinho!`);

    } catch (error) {
      showSuccessNotification('Erro ao adicionar produto ao carrinho. Tente novamente.');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <style>{`
        .shadow-neumorphic { box-shadow: 8px 8px 16px #d1d9e6, -8px -8px 16px #ffffff; }
        .shadow-neumorphic-inset { box-shadow: inset 5px 5px 10px #d1d9e6, inset -5px -5px 10px #ffffff; }
        .shadow-neumorphic-button { box-shadow: 5px 5px 10px #b8b9be, -5px -5px 10px #ffffff; }
        .shadow-neumorphic-button-inset { box-shadow: inset 5px 5px 10px #b8b9be, inset -5px -5px 10px #ffffff; }
      `}</style>

      {selectedCapsula && (
        <div className="p-4 rounded-2xl flex items-center justify-between bg-slate-200 shadow-neumorphic">
          <h2 className="text-xl font-bold text-gray-800">Mostrando produtos da cápsula: <span className="text-blue-600">{selectedCapsula.nome}</span></h2>
          <Button onClick={clearCapsulaFilter} variant="ghost" className="shadow-neumorphic-button active:shadow-neumorphic-button-inset">
            <X className="w-4 h-4 mr-2" />
            Limpar Filtro
          </Button>
        </div>
      )}

      {/* Featured & Capsules Section */}
      {!selectedCapsula && (
        <div className="space-y-8">
          {/* Featured Products */}
          {featuredProducts.length > 0 && (
            <div>
              <h2 className="text-2xl font-bold text-gray-800 mb-4 flex items-center gap-2"><Star className="text-yellow-500"/>Produtos em Destaque</h2>
              <ScrollArea className="w-full whitespace-nowrap rounded-lg">
                <div className="flex space-x-4 pb-4">
                  {featuredProducts.map(produto => (
                    <Card key={produto.id} className="inline-block w-[250px] bg-slate-100 rounded-2xl shadow-neumorphic">
                      <CardContent className="p-3">
                        <div className="mb-3">
                          <ProductImageCarousel images={produto.fotos} productName={produto.nome} />
                        </div>
                        <h3 className="font-semibold mt-2 truncate">{produto.nome}</h3>
                        <Badge variant="outline" className="text-xs bg-slate-200 mb-2">{produto.marca}</Badge>
                        <p className="text-lg font-bold text-blue-600">R$ {getPrice(produto)?.toFixed(2)}</p>
                        <div className="text-xs text-gray-600 space-y-1">
                          <p>{produto.tipo_venda === 'grade' ? `Grade ${produto.total_pecas_grade} pç` : 'Unitário'}</p>
                          {produto.controla_estoque && (
                            <p className={produto.estoque_atual_grades > 0 ? 'text-green-600' : 'text-red-600'}>
                              {produto.estoque_atual_grades > 0 ? `${produto.estoque_atual_grades} em estoque` : 'Sem estoque'}
                            </p>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
                <ScrollBar orientation="horizontal" />
              </ScrollArea>
            </div>
          )}
          
          {/* Capsules */}
          {activeCapsulas.length > 0 && (
            <div>
              <h2 className="text-2xl font-bold text-gray-800 mb-4 flex items-center gap-2"><ImageIcon className="text-purple-500"/>Cápsulas Sugestivas</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {activeCapsulas.map(capsula => (
                  <div key={capsula.id} onClick={() => handleSelectCapsula(capsula)} className="cursor-pointer group">
                    <Card className="bg-slate-100 rounded-2xl shadow-neumorphic overflow-hidden transition-transform group-hover:scale-105">
                      <img src={capsula.imagem_capa_url || 'https://via.placeholder.com/400x200'} alt={capsula.nome} className="w-full h-40 object-cover"/>
                      <CardHeader>
                        <CardTitle className="text-lg">{capsula.nome}</CardTitle>
                        <p className="text-sm text-gray-600">{capsula.descricao}</p>
                        <Badge variant="outline" className="w-fit">{capsula.produto_ids?.length || 0} produtos</Badge>
                      </CardHeader>
                    </Card>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Main Catalog */}
      <Card className="bg-slate-100 rounded-3xl shadow-neumorphic">
        <CardHeader>
          <CardTitle className="text-2xl font-bold text-gray-800">Catálogo de Produtos</CardTitle>
        </CardHeader>
        <CardContent>
          {/* Filters */}
          <div className="p-4 mb-6 rounded-2xl shadow-neumorphic-inset">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  placeholder="Buscar produtos..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Select value={selectedMarca} onValueChange={setSelectedMarca}>
                <SelectTrigger className="w-full md:w-48">
                  <SelectValue placeholder="Todas as marcas" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas as marcas</SelectItem>
                  <SelectItem value="Polo Wear">Polo Wear</SelectItem>
                  <SelectItem value="MX">MX</SelectItem>
                  <SelectItem value="Guirro">Guirro</SelectItem>
                  <SelectItem value="MGM">MGM</SelectItem>
                </SelectContent>
              </Select>
              <Select value={selectedFornecedor} onValueChange={setSelectedFornecedor}>
                <SelectTrigger className="w-full md:w-48">
                  <SelectValue placeholder="Todos fornecedores" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos fornecedores</SelectItem>
                  {fornecedores.map(fornecedor => (
                    <SelectItem key={fornecedor.id} value={fornecedor.id}>
                      {fornecedor.nome_marca}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Products Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredProducts.map(produto => (
              <Card key={produto.id} className="group bg-slate-100 rounded-2xl shadow-neumorphic hover:-translate-y-1 transition-transform flex flex-col h-full">
                <div className="p-3">
                  <div className="relative">
                    <ProductImageCarousel images={produto.fotos} productName={produto.nome} />
                    {produto.is_destaque && (
                      <div className="absolute top-2 right-2 z-10">
                        <Badge className="bg-yellow-500 text-white">
                          <Star className="w-3 h-3 mr-1" />
                          Destaque
                        </Badge>
                      </div>
                    )}
                    {produto.controla_estoque && produto.estoque_atual_grades <= 0 && (
                      <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center rounded-lg z-10">
                        <Badge className="bg-red-600 text-white">Sem Estoque</Badge>
                      </div>
                    )}
                  </div>
                </div>
                <CardContent className="p-4 pt-0 flex-1 flex flex-col">
                  <div className="flex-1 flex flex-col gap-3">
                    <h3 className="font-semibold text-base text-gray-900 line-clamp-2 h-12 leading-6">{produto.nome}</h3>
                    <div className="flex-1 flex flex-col gap-2">
                      <div className="flex items-center justify-between h-6">
                        <Badge variant="outline" className="text-xs bg-slate-200 h-5">{produto.marca}</Badge>
                        <span className="text-lg font-bold text-blue-600">R$ {getPrice(produto)?.toFixed(2)}</span>
                      </div>
                      <div className="text-xs text-gray-600 h-10 flex flex-col justify-start gap-1">
                        <div className="h-4 flex items-center">
                          {produto.tipo_venda === 'grade' ? (
                            <span>Grade completa • {produto.total_pecas_grade} peças</span>
                          ) : (
                            <span>Venda unitária</span>
                          )}
                        </div>
                        <div className="h-4 flex items-center">
                          {produto.controla_estoque && (
                            <span className={`font-medium ${produto.estoque_atual_grades > 0 ? 'text-green-600' : 'text-red-600'}`}>
                              {produto.estoque_atual_grades > 0 ? `${produto.estoque_atual_grades} disponível` : 'Esgotado'}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-2 mt-auto">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="flex-1 rounded-lg shadow-neumorphic-button active:shadow-neumorphic-button-inset"
                        onClick={() => handleViewProduct(produto)}
                      >
                        <Eye className="w-4 h-4 mr-1" /> Ver
                      </Button>
                      <Button
                        size="sm"
                        className="flex-1 bg-blue-600 text-white rounded-lg shadow-neumorphic-button active:shadow-neumorphic-button-inset"
                        disabled={produto.controla_estoque && !produto.permite_venda_sem_estoque && produto.estoque_atual_grades <= 0}
                        onClick={() => handleAddToCart(produto)}
                      >
                        <ShoppingCart className="w-4 h-4 mr-1" />
                        {produto.controla_estoque && !produto.permite_venda_sem_estoque && produto.estoque_atual_grades <= 0 ? 'Esgotado' : 'Adicionar'}
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {filteredProducts.length === 0 && (
            <div className="text-center py-12">
              <Package className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Nenhum produto encontrado</h3>
              <p className="text-gray-600">Tente ajustar os filtros de busca.</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Modal de Detalhes do Produto */}
      <Dialog open={showProductModal} onOpenChange={setShowProductModal}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Detalhes do Produto</DialogTitle>
          </DialogHeader>
          {selectedProduct && (
            <div className="space-y-4">
              <div className="flex gap-6">
                <div className="w-1/2">
                  <ProductImageCarousel images={selectedProduct.fotos} productName={selectedProduct.nome} />
                </div>
                <div className="w-1/2 space-y-4">
                  <div>
                    <h3 className="text-2xl font-bold text-gray-900">{selectedProduct.nome}</h3>
                    <Badge variant="outline" className="mt-2">{selectedProduct.marca}</Badge>
                  </div>

                  <div className="space-y-2">
                    <p className="text-3xl font-bold text-blue-600">R$ {getPrice(selectedProduct)?.toFixed(2)}</p>
                    <p className="text-sm text-gray-600">
                      {selectedProduct.tipo_venda === 'grade' ?
                        `Grade completa • ${selectedProduct.total_pecas_grade} peças` :
                        'Venda unitária'
                      }
                    </p>
                    {selectedProduct.controla_estoque && (
                      <p className={`font-medium ${selectedProduct.estoque_atual_grades > 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {selectedProduct.estoque_atual_grades > 0 ?
                          `${selectedProduct.estoque_atual_grades} disponível` :
                          'Esgotado'
                        }
                      </p>
                    )}
                  </div>

                  {selectedProduct.descricao && (
                    <div>
                      <h4 className="font-semibold text-gray-900 mb-2">Descrição</h4>
                      <p className="text-gray-600">{selectedProduct.descricao}</p>
                    </div>
                  )}

                  <Button
                    className="w-full bg-blue-600 text-white"
                    disabled={selectedProduct.controla_estoque && !selectedProduct.permite_venda_sem_estoque && selectedProduct.estoque_atual_grades <= 0}
                    onClick={() => {
                      handleAddToCart(selectedProduct);
                      setShowProductModal(false);
                    }}
                  >
                    <ShoppingCart className="w-4 h-4 mr-2" />
                    {selectedProduct.controla_estoque && !selectedProduct.permite_venda_sem_estoque && selectedProduct.estoque_atual_grades <= 0 ?
                      'Produto Esgotado' :
                      'Adicionar ao Carrinho'
                    }
                  </Button>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Notificação de sucesso */}
      {showNotification && (
        <div className="fixed top-4 right-4 z-50">
          <div className="bg-green-500 text-white px-6 py-3 rounded-lg shadow-lg flex items-center gap-2 animate-in slide-in-from-top-2">
            <div className="w-5 h-5 rounded-full bg-white flex items-center justify-center">
              <span className="text-green-500 text-sm">✓</span>
            </div>
            <span className="font-medium">{notificationMessage}</span>
            <button
              onClick={() => setShowNotification(false)}
              className="ml-2 text-white hover:text-gray-200"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
