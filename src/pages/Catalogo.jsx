
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
  Search, ShoppingCart, Eye, Package, Building, Tag, DollarSign, Star, Image as ImageIcon, X, Check, Plus, Minus
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
  const [quantidadeGrades, setQuantidadeGrades] = useState(2);
  const [selectedCores, setSelectedCores] = useState({});
  const [coresProcessadas, setCoresProcessadas] = useState([]);

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
    return produto.tipo_venda === 'grade' ? produto.preco_grade_completa : produto.preco_por_peca;
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
    setQuantidadeGrades(2); // Reset para quantidade mínima

    // Processar cores disponíveis (composicao_grade ou cores_disponiveis)
    const coresDisponiveis = produto.composicao_grade?.cores && produto.composicao_grade.cores.length > 0
      ? produto.composicao_grade.cores
      : (produto.cores_disponiveis && produto.cores_disponiveis.length > 0
          ? produto.cores_disponiveis.map(cor => ({
              nome: cor,
              hexCode: getDefaultColorForName(cor),
              quantidade: Math.floor(produto.estoque_atual_grades / (produto.cores_disponiveis?.length || 1)) || 5
            }))
          : []);

    setCoresProcessadas(coresDisponiveis);

    if (coresDisponiveis.length > 0) {
      const initialCores = {};
      coresDisponiveis.forEach((cor, index) => {
        initialCores[index] = 0;
      });
      setSelectedCores(initialCores);
    } else {
      setSelectedCores({});
    }

    setShowProductModal(true);
  };

  // Função auxiliar para gerar cor padrão baseada no nome
  const getDefaultColorForName = (corNome) => {
    const coresMap = {
      // Pretos e Escuros
      'PRETO': '#000000',
      'POLO PRETO': '#000000',
      'PRETO FOSCO': '#1a1a1a',

      // Brancos
      'BRANCO': '#FFFFFF',
      'BRANCO GELO': '#FFFAFA',
      'OFF WHITE': '#F8F8F8',
      'CREME': '#FFFDD0',

      // Azuis
      'AZUL': '#0066CC',
      'AZUL ESCURO': '#003366',
      'AZUL MARINHO': '#000080',
      'AZUL CLARO': '#87CEEB',
      'AZUL MÉDIO': '#4682B4',
      'AZUL MEDIO': '#4682B4',
      'AZUL ROYAL': '#4169E1',
      'SOL AZUL': '#4682B4',
      'MARINHO': '#000080',
      'JEANS': '#1560BD',
      'JEANS CLARO': '#5B9BD5',
      'JEANS MÉDIO': '#1560BD',
      'JEANS MEDIO': '#1560BD',
      'JEANS ESCURO': '#0F4C81',

      // Verdes
      'VERDE': '#00AA00',
      'VERDE MILITAR': '#4B5320',
      'VERDE ESCURO': '#006400',
      'VERDE CLARO': '#90EE90',
      'VERDE MÉDIO': '#228B22',
      'VERDE MEDIO': '#228B22',
      'SOL VERDE': '#9ACD32',

      // Vermelhos e Rosas
      'VERMELHO': '#CC0000',
      'VERMELHO ESCURO': '#8B0000',
      'VERMELHO MÉDIO': '#DC143C',
      'VERMELHO MEDIO': '#DC143C',
      'ROSA': '#FFB6C1',
      'ROSA CLARO': '#FFB6C1',
      'ROSA MÉDIO': '#FF69B4',
      'ROSA MEDIO': '#FF69B4',
      'ROSA ESCURO': '#FF1493',
      'SOL ROSA': '#FFB6C1',
      'ABESTATO ROSA': '#E6B0AA',

      // Roxos
      'ROXO': '#800080',
      'ROXO CLARO': '#9370DB',
      'ROXO MÉDIO': '#8B008B',
      'ROXO MEDIO': '#8B008B',
      'ROXO ESCURO': '#4B0082',
      'LILÁS': '#C8A2C8',
      'LILAS': '#C8A2C8',
      'UVA': '#6A0DAD',

      // Laranjas e Amarelos
      'LARANJA': '#FF8800',
      'LARANJA CLARO': '#FFA500',
      'LARANJA MÉDIO': '#FF8C00',
      'LARANJA MEDIO': '#FF8C00',
      'LARANJA ESCURO': '#FF6600',
      'AMARELO': '#FFCC00',
      'AMARELO CLARO': '#FFFF99',
      'AMARELO MÉDIO': '#FFD700',
      'AMARELO MEDIO': '#FFD700',
      'AMARELO ESCURO': '#CCAA00',
      'MOSTARDA': '#FFDB58',

      // Marrons e Tons Terra
      'MARROM': '#8B4513',
      'MARROM CLARO': '#D2691E',
      'MARROM MÉDIO': '#A0522D',
      'MARROM MEDIO': '#A0522D',
      'MARROM ESCURO': '#654321',
      'CARAMELO': '#C68E17',
      'BEGE': '#F5F5DC',
      'BEGE CLARO': '#FAF0E6',
      'BEGE MÉDIO': '#D2B48C',
      'BEGE MEDIO': '#D2B48C',
      'BEGE ESCURO': '#C19A6B',
      'CÁQUI': '#C3B091',
      'CAQUI': '#C3B091',
      'NUDE': '#E3BC9A',
      'AREIA': '#C2B280',

      // Vinhos
      'VINHO': '#722F37',
      'VINHO CLARO': '#8B475D',
      'VINHO MÉDIO': '#722F37',
      'VINHO MEDIO': '#722F37',
      'VINHO ESCURO': '#5E1914',
      'BORDÔ': '#800020',
      'BORDO': '#800020',

      // Cinzas e Mesclas
      'CINZA': '#808080',
      'CINZA CLARO': '#D3D3D3',
      'CINZA MÉDIO': '#A9A9A9',
      'CINZA MEDIO': '#A9A9A9',
      'CINZA ESCURO': '#4A4A4A',
      'GRAFITE': '#383838',
      'MESCLA': '#999999',
      'MESCLA CLARO': '#CCCCCC',
      'MESCLA MÉDIO': '#999999',
      'MESCLA MEDIO': '#999999',
      'MESCLA ESCURO': '#666666',

      // Outros
      'CORAL': '#FF7F50',
      'SALMÃO': '#FA8072',
      'SALMAO': '#FA8072',
      'TURQUESA': '#40E0D0',
      'MENTA': '#98FF98',
      'PÊSSEGO': '#FFE5B4',
      'PESSEGO': '#FFE5B4',
      'TERRACOTA': '#E2725B',
      'COBRE': '#B87333',
      'BRONZE': '#CD7F32',
      'DOURADO': '#FFD700',
      'PRATEADO': '#C0C0C0',
      'PETRÓLEO': '#2C5F6F',
      'PETROLEO': '#2C5F6F',
      'FERRUGEM': '#B7410E'
    };

    // Normalizar o nome da cor (maiúsculo e sem espaços extras)
    const corNormalizada = corNome.toUpperCase().trim();

    // Retornar a cor do mapa ou cinza como fallback
    return coresMap[corNormalizada] || '#808080';
  };

  const handleCorQuantidadeChange = (corIndex, quantidade) => {
    if (!coresProcessadas || coresProcessadas.length === 0) return;

    const cor = coresProcessadas[corIndex];
    const maxQuantidade = cor.quantidade || 0;
    const novaQuantidade = Math.max(0, Math.min(parseInt(quantidade) || 0, maxQuantidade));

    setSelectedCores(prev => ({
      ...prev,
      [corIndex]: novaQuantidade
    }));
  };

  const getTotalGradesSelecionadas = () => {
    return Object.values(selectedCores).reduce((sum, qty) => sum + (qty || 0), 0);
  };

  const incrementGrades = () => {
    if (selectedProduct && selectedProduct.controla_estoque) {
      // Verificar se não excede o estoque disponível
      if (quantidadeGrades < selectedProduct.estoque_atual_grades) {
        setQuantidadeGrades(prev => prev + 1);
      }
    } else {
      setQuantidadeGrades(prev => prev + 1);
    }
  };

  const decrementGrades = () => {
    if (quantidadeGrades > 2) { // Mínimo de 2 grades
      setQuantidadeGrades(prev => prev - 1);
    }
  };

  const handleQuantidadeChange = (e) => {
    const value = parseInt(e.target.value) || 2;
    const minimo = 2;

    if (value < minimo) {
      setQuantidadeGrades(minimo);
    } else if (selectedProduct && selectedProduct.controla_estoque) {
      // Verificar se não excede o estoque disponível
      if (value <= selectedProduct.estoque_atual_grades) {
        setQuantidadeGrades(value);
      } else {
        setQuantidadeGrades(selectedProduct.estoque_atual_grades);
      }
    } else {
      setQuantidadeGrades(value);
    }
  };

  const calcularTotal = () => {
    if (!selectedProduct) return { totalPecas: 0, totalValor: 0 };

    const precoPorGrade = selectedProduct.preco_grade_completa || 0;
    const pecasPorGrade = selectedProduct.total_pecas_grade || 12;

    // Se há cores selecionadas, usar o total de grades selecionadas
    const totalGrades = coresProcessadas && coresProcessadas.length > 0 && Object.keys(selectedCores).length > 0
      ? getTotalGradesSelecionadas()
      : quantidadeGrades;

    return {
      totalPecas: totalGrades * pecasPorGrade,
      totalValor: totalGrades * precoPorGrade
    };
  };

  const handleAddToCart = (produto) => {
    try {
      // Carregar carrinho existente do localStorage
      const carrinhoSalvo = localStorage.getItem('carrinho');
      const carrinho = carrinhoSalvo ? JSON.parse(carrinhoSalvo) : [];

      // Preparar o item para adicionar ao carrinho
      const itemCarrinho = {
        ...produto,
        quantidade: 1
      };

      // Se o produto tem composição de cores e há seleções
      if (coresProcessadas && coresProcessadas.length > 0 && getTotalGradesSelecionadas() > 0) {
        // Adicionar informações de cores selecionadas
        itemCarrinho.coresSelecionadas = coresProcessadas
          .map((cor, index) => ({
            nome: cor.nome,
            hexCode: cor.hexCode,
            quantidade: selectedCores[index] || 0
          }))
          .filter(cor => cor.quantidade > 0);

        itemCarrinho.quantidadeTotalGrades = getTotalGradesSelecionadas();
      } else {
        // Usar quantidade padrão
        itemCarrinho.quantidadeTotalGrades = quantidadeGrades;
      }

      // Verificar se produto similar já existe no carrinho (mesmo produto + mesmas cores)
      const itemExistente = carrinho.find(item => {
        if (item.id !== produto.id) return false;

        // Se não tem cores, é o mesmo produto
        if (!item.coresSelecionadas && !itemCarrinho.coresSelecionadas) return true;

        // Se um tem cores e outro não, são diferentes
        if (!item.coresSelecionadas || !itemCarrinho.coresSelecionadas) return false;

        // Comparar cores selecionadas
        return JSON.stringify(item.coresSelecionadas) === JSON.stringify(itemCarrinho.coresSelecionadas);
      });

      let novoCarrinho;
      if (itemExistente) {
        // Atualizar quantidade se já existe
        novoCarrinho = carrinho.map(item =>
          item === itemExistente
            ? { ...item, quantidade: item.quantidade + 1 }
            : item
        );
      } else {
        // Adicionar novo produto ao carrinho
        novoCarrinho = [...carrinho, itemCarrinho];
      }

      // Salvar no localStorage
      localStorage.setItem('carrinho', JSON.stringify(novoCarrinho));

      // Mostrar notificação de sucesso
      const totalGrades = itemCarrinho.quantidadeTotalGrades || 1;
      showSuccessNotification(
        `Produto "${produto.nome}" adicionado ao carrinho! (${totalGrades} ${totalGrades === 1 ? 'grade' : 'grades'})`
      );

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
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          {selectedProduct && (
            <div className="space-y-6">
              {/* Título e Close Button */}
              <div className="flex items-start justify-between">
                <h2 className="text-2xl font-bold text-gray-900 pr-8">{selectedProduct.nome}</h2>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Coluna Esquerda - Imagens */}
                <div className="space-y-4">
                  <ProductImageCarousel images={selectedProduct.fotos} productName={selectedProduct.nome} />
                </div>

                {/* Coluna Direita - Informações */}
                <div className="space-y-6">
                  {/* Badges */}
                  <div className="flex flex-wrap gap-2">
                    <Badge variant="outline" className="text-sm bg-blue-50 text-blue-600 border-blue-200">
                      {selectedProduct.marca || 'Polo Wear'}
                    </Badge>
                    <Badge variant="outline" className="text-sm bg-slate-100 text-gray-700">
                      Camisas
                    </Badge>
                    {selectedProduct.is_destaque && (
                      <Badge className="text-sm bg-yellow-500 text-white border-0">
                        <Star className="w-3 h-3 mr-1" />
                        Destaque
                      </Badge>
                    )}
                  </div>

                  {/* Descrição */}
                  {selectedProduct.descricao && (
                    <p className="text-gray-700 text-sm leading-relaxed">
                      {selectedProduct.descricao}
                    </p>
                  )}

                  {/* Preços */}
                  <div className="bg-blue-50 rounded-xl p-4 space-y-3">
                    <div>
                      <p className="text-sm text-gray-600 mb-1">Preço por Peça</p>
                      <p className="text-3xl font-bold text-blue-600">
                        R$ {(selectedProduct.preco_por_peca ||
                            (selectedProduct.preco_grade_completa && selectedProduct.total_pecas_grade
                              ? selectedProduct.preco_grade_completa / selectedProduct.total_pecas_grade
                              : 0)
                        ).toFixed(2)}
                      </p>
                    </div>
                    <div className="flex items-center justify-between pt-2 border-t border-blue-100">
                      <span className="text-sm text-gray-700">
                        Grade completa ({selectedProduct.total_pecas_grade || 12} peças):
                      </span>
                      <span className="text-xl font-bold text-blue-600">
                        R$ {selectedProduct.preco_grade_completa?.toFixed(2) || '0.00'}
                      </span>
                    </div>
                  </div>

                  {/* Tamanhos da Grade */}
                  {selectedProduct.grade_configuracao?.tamanhos_disponiveis &&
                   selectedProduct.grade_configuracao.tamanhos_disponiveis.length > 0 && (
                    <div className="bg-slate-50 rounded-lg p-3 border border-slate-200">
                      <p className="text-sm font-semibold text-gray-900 mb-2">Composição da Grade:</p>
                      <div className="flex flex-wrap gap-2">
                        {selectedProduct.grade_configuracao.tamanhos_disponiveis.map((tamanho, idx) => (
                          <div key={idx} className="bg-white px-3 py-1.5 rounded border border-gray-300">
                            <span className="text-sm font-medium text-gray-900">{tamanho}</span>
                            {selectedProduct.grade_configuracao.quantidades_por_tamanho[tamanho] && (
                              <span className="text-xs text-gray-600 ml-1">
                                ({selectedProduct.grade_configuracao.quantidades_por_tamanho[tamanho]} pç)
                              </span>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Composição da Grade */}
                  {coresProcessadas && coresProcessadas.length > 0 ? (
                    <div>
                      <h4 className="font-semibold text-gray-900 mb-3">Selecione as Cores e Quantidades:</h4>
                      <div className="space-y-2">
                        {coresProcessadas.map((cor, index) => (
                          <div key={index} className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg border border-slate-200 hover:border-blue-300 transition-colors">
                              <div
                                className="w-10 h-10 rounded-md border-2 border-gray-300 flex-shrink-0"
                                style={{ backgroundColor: cor.hexCode }}
                                title={cor.hexCode}
                              />
                              <div className="flex-1">
                                <p className="font-medium text-sm text-gray-900">{cor.nome}</p>
                                <p className="text-xs text-gray-500">
                                  Disponível: {cor.quantidade} {cor.quantidade === 1 ? 'grade' : 'grades'}
                                </p>
                              </div>
                              <div className="flex items-center gap-2">
                                <Button
                                  variant="outline"
                                  size="icon"
                                  className="h-8 w-8 rounded-lg"
                                  onClick={() => handleCorQuantidadeChange(index, (selectedCores[index] || 0) - 1)}
                                  disabled={(selectedCores[index] || 0) <= 0}
                                >
                                  <Minus className="h-4 w-4" />
                                </Button>
                                <Input
                                  type="number"
                                  value={selectedCores[index] || 0}
                                  onChange={(e) => handleCorQuantidadeChange(index, e.target.value)}
                                  className="w-16 h-8 text-center"
                                  min="0"
                                  max={cor.quantidade}
                                />
                                <Button
                                  variant="outline"
                                  size="icon"
                                  className="h-8 w-8 rounded-lg"
                                  onClick={() => handleCorQuantidadeChange(index, (selectedCores[index] || 0) + 1)}
                                  disabled={(selectedCores[index] || 0) >= cor.quantidade}
                                >
                                  <Plus className="h-4 w-4" />
                                </Button>
                              </div>
                              {selectedCores[index] > 0 && (
                                <div className="text-right min-w-[80px]">
                                  <p className="text-sm font-semibold text-blue-600">
                                    {selectedCores[index]} {selectedCores[index] === 1 ? 'grade' : 'grades'}
                                  </p>
                                  <p className="text-xs text-gray-500">
                                    {selectedCores[index] * (selectedProduct.total_pecas_grade || 12)} peças
                                  </p>
                                </div>
                              )}
                          </div>
                        ))}
                      </div>

                      {/* Resumo das grades selecionadas */}
                      {getTotalGradesSelecionadas() > 0 && (
                        <div className="bg-blue-50 p-3 rounded-lg mt-3 border border-blue-200">
                          <p className="text-sm font-semibold text-blue-800">
                            Total selecionado: {getTotalGradesSelecionadas()} {getTotalGradesSelecionadas() === 1 ? 'grade' : 'grades'}
                          </p>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div>
                      <h4 className="font-semibold text-gray-900 mb-2">Composição da Grade:</h4>
                      <div className="bg-slate-50 rounded-lg p-4 flex items-center justify-center">
                        <p className="text-sm text-gray-500 italic">
                          Composição por cor não configurada
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Estoque Disponível */}
                  {selectedProduct.controla_estoque && (
                    <div className="flex items-center gap-2 text-green-600">
                      <div className="w-5 h-5 rounded-full bg-green-100 flex items-center justify-center">
                        <Check className="w-3 h-3 text-green-600" />
                      </div>
                      <span className="font-medium">
                        {selectedProduct.estoque_atual_grades || 0} grades disponíveis
                      </span>
                    </div>
                  )}

                  {/* Quantidade de Grades - só mostra se NÃO tiver composição de cores */}
                  {(!coresProcessadas || coresProcessadas.length === 0) && (
                    <div className="space-y-2">
                      <label className="font-semibold text-gray-900">Quantidade de Grades:</label>
                      <div className="flex items-center gap-3">
                        <Button
                          variant="outline"
                          size="icon"
                          className="h-10 w-10 rounded-lg"
                          onClick={decrementGrades}
                          disabled={quantidadeGrades <= 2}
                        >
                          <Minus className="h-4 w-4" />
                        </Button>
                        <Input
                          type="number"
                          value={quantidadeGrades}
                          onChange={handleQuantidadeChange}
                          className="w-20 h-10 text-center"
                          min="2"
                          max={selectedProduct.controla_estoque ? selectedProduct.estoque_atual_grades : undefined}
                        />
                        <Button
                          variant="outline"
                          size="icon"
                          className="h-10 w-10 rounded-lg"
                          onClick={incrementGrades}
                          disabled={
                            selectedProduct.controla_estoque &&
                            quantidadeGrades >= selectedProduct.estoque_atual_grades
                          }
                        >
                          <Plus className="h-4 w-4" />
                        </Button>
                        <span className="text-sm text-gray-600 ml-2">Mínimo: 2</span>
                      </div>
                    </div>
                  )}

                  {/* Total */}
                  <div className="bg-slate-100 rounded-xl p-4">
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-semibold text-gray-900">Total:</span>
                      <span className="text-3xl font-bold text-blue-600">
                        R$ {calcularTotal().totalValor.toFixed(2)}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 text-right">
                      {calcularTotal().totalPecas} peças no total
                    </p>
                  </div>

                  {/* Botão Adicionar ao Carrinho */}
                  <Button
                    className="w-full h-12 bg-blue-600 hover:bg-blue-700 text-white text-base font-semibold rounded-xl disabled:bg-gray-400"
                    disabled={
                      (selectedProduct.controla_estoque &&
                        !selectedProduct.permite_venda_sem_estoque &&
                        selectedProduct.estoque_atual_grades <= 0) ||
                      (coresProcessadas &&
                        coresProcessadas.length > 0 &&
                        getTotalGradesSelecionadas() === 0)
                    }
                    onClick={() => {
                      handleAddToCart(selectedProduct);
                      setShowProductModal(false);
                    }}
                  >
                    <ShoppingCart className="w-5 h-5 mr-2" />
                    {selectedProduct.controla_estoque &&
                    !selectedProduct.permite_venda_sem_estoque &&
                    selectedProduct.estoque_atual_grades <= 0
                      ? 'Produto Esgotado'
                      : coresProcessadas &&
                        coresProcessadas.length > 0 &&
                        getTotalGradesSelecionadas() === 0
                      ? 'Selecione as Cores'
                      : 'Adicionar ao Carrinho'}
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
