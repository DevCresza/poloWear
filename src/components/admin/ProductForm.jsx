
import React, { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Fornecedor } from '@/api/entities';
import { Produto } from '@/api/entities';
import { Plus, Minus, Calculator, Upload } from 'lucide-react';
import ImageUploader from './ImageUploader';
import { useNotification } from '@/hooks/useNotification';
import { Notification } from '@/components/ui/notification';

export default function ProductForm({ produto, onSuccess, onCancel }) {
  const { showSuccess, showError, showNotification, notificationMessage, notificationType, hideNotification } = useNotification();
  const [formData, setFormData] = useState({
    nome: '',
    descricao: '',
    marca: '',
    fornecedor_id: '',
    tipo_venda: 'grade',
    grade_configuracao: {
      tamanhos_disponiveis: [],
      quantidades_por_tamanho: {}
    },
    preco_por_peca: 0,
    total_pecas_grade: 0,
    preco_grade_completa: 0,
    margem_lucro: 0,
    custo_por_peca: 0,
    pedido_minimo_grades: 1,
    estoque_atual_grades: 0,
    estoque_minimo_grades: 5,
    fotos: [],
    cores_disponiveis: [],
    categoria: '',
    temporada: 'Atemporal',
    is_destaque: false,
    ativo: true,
    controla_estoque: true,
    permite_venda_sem_estoque: false
  });

  const [fornecedores, setFornecedores] = useState([]);
  const [loading, setLoading] = useState(false);
  const [novaCor, setNovaCor] = useState('');

  const tamanhosPadrao = ['PP', 'P', 'M', 'G', 'GG', 'XG', '2G', '3G', 'EG'];
  
  const categorias = [
    'Camisetas', 'Polos', 'Shorts', 'Calças', 
    'Vestidos', 'Blusas', 'Jaquetas', 'Acessórios'
  ];

  const loadFornecedores = useCallback(async () => {
    try {
      const fornecedoresResult = await Fornecedor.find();
      const fornecedores = fornecedoresResult?.success ? fornecedoresResult.data : [];

      setFornecedores(fornecedores);

      if (!produto && fornecedores.length > 0) {
        setFormData(prev => ({
          ...prev,
          fornecedor_id: fornecedores[0].id,
          marca: fornecedores[0].nome_marca
        }));
      }
    } catch (error) {
      // Error handled silently
    }
  }, [produto]);

  useEffect(() => {
    loadFornecedores();
    if (produto) {
      setFormData({
        ...produto,
        grade_configuracao: produto.grade_configuracao || {
          tamanhos_disponiveis: [],
          quantidades_por_tamanho: {}
        },
        cores_disponiveis: produto.cores_disponiveis || [],
        fotos: produto.fotos || []
      });
    }
  }, [produto, loadFornecedores]);

  const adicionarTamanho = (tamanho) => {
    const novosTamanhos = [...formData.grade_configuracao.tamanhos_disponiveis, tamanho];
    const novasQuantidades = {
      ...formData.grade_configuracao.quantidades_por_tamanho,
      [tamanho]: 1
    };
    
    setFormData(prev => ({
      ...prev,
      grade_configuracao: {
        tamanhos_disponiveis: novosTamanhos,
        quantidades_por_tamanho: novasQuantidades
      }
    }));
    
    calcularTotais(novasQuantidades);
  };

  const removerTamanho = (tamanho) => {
    const novosTamanhos = formData.grade_configuracao.tamanhos_disponiveis.filter(t => t !== tamanho);
    const novasQuantidades = {...formData.grade_configuracao.quantidades_por_tamanho};
    delete novasQuantidades[tamanho];
    
    setFormData(prev => ({
      ...prev,
      grade_configuracao: {
        tamanhos_disponiveis: novosTamanhos,
        quantidades_por_tamanho: novasQuantidades
      }
    }));
    
    calcularTotais(novasQuantidades);
  };

  const atualizarQuantidadeTamanho = (tamanho, quantidade) => {
    const novasQuantidades = {
      ...formData.grade_configuracao.quantidades_por_tamanho,
      [tamanho]: Math.max(0, parseInt(quantidade) || 0)
    };
    
    setFormData(prev => ({
      ...prev,
      grade_configuracao: {
        ...prev.grade_configuracao,
        quantidades_por_tamanho: novasQuantidades
      }
    }));
    
    calcularTotais(novasQuantidades);
  };

  const calcularTotais = (quantidades) => {
    const totalPecas = Object.values(quantidades).reduce((sum, qty) => sum + (qty || 0), 0);
    const precoGrade = totalPecas * (formData.preco_por_peca || 0);
    
    setFormData(prev => ({
      ...prev,
      total_pecas_grade: totalPecas,
      preco_grade_completa: precoGrade
    }));
  };

  const calcularPrecoSugerido = () => {
    if (formData.custo_por_peca && formData.margem_lucro) {
      const precoSugerido = formData.custo_por_peca * (1 + formData.margem_lucro / 100);
      setFormData(prev => ({
        ...prev,
        preco_por_peca: parseFloat(precoSugerido.toFixed(2))
      }));
      calcularTotais(formData.grade_configuracao.quantidades_por_tamanho);
    }
  };

  const adicionarCor = () => {
    if (novaCor && !formData.cores_disponiveis.includes(novaCor)) {
      setFormData(prev => ({
        ...prev,
        cores_disponiveis: [...prev.cores_disponiveis, novaCor]
      }));
      setNovaCor('');
    }
  };

  const removerCor = (cor) => {
    setFormData(prev => ({
      ...prev,
      cores_disponiveis: prev.cores_disponiveis.filter(c => c !== cor)
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (formData.tipo_venda === 'grade' && formData.grade_configuracao.tamanhos_disponiveis.length === 0) {
      showError('Adicione pelo menos um tamanho à grade do produto');
      return;
    }
    
    setLoading(true);
    
    try {
      const dadosProduto = {
        ...formData,
        preco_por_peca: parseFloat(formData.preco_por_peca) || 0,
        custo_por_peca: parseFloat(formData.custo_por_peca) || 0,
        margem_lucro: parseFloat(formData.margem_lucro) || 0,
        total_pecas_grade: parseInt(formData.total_pecas_grade) || 0,
        preco_grade_completa: parseFloat(formData.preco_grade_completa) || 0,
        pedido_minimo_grades: parseInt(formData.pedido_minimo_grades) || 1,
        estoque_atual_grades: parseInt(formData.estoque_atual_grades) || 0,
        estoque_minimo_grades: parseInt(formData.estoque_minimo_grades) || 0
      };

      if (produto) {
        const result = await Produto.update(produto.id, dadosProduto);
      } else {
        const result = await Produto.create(dadosProduto);
      }
      
      showSuccess(produto ? 'Produto atualizado com sucesso!' : 'Produto cadastrado com sucesso!');
      setTimeout(() => {
        onSuccess();
      }, 1500);
    } catch (error) {

      let errorMessage = 'Erro ao salvar produto. Tente novamente.';

      if (error.message) {
        if (error.message.includes('violates check constraint')) {
          errorMessage = 'Dados inválidos: verifique os campos tipo_venda e temporada.';
        } else if (error.message.includes('duplicate key')) {
          errorMessage = 'Produto com esses dados já existe.';
        } else if (error.message.includes('foreign key')) {
          errorMessage = 'Fornecedor selecionado é inválido.';
        } else {
          errorMessage = `Erro: ${error.message}`;
        }
      }

      showError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const tamanhosSelecionados = formData.grade_configuracao.tamanhos_disponiveis;
  const tamanhosDisponiveis = tamanhosPadrao.filter(t => !tamanhosSelecionados.includes(t));

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>{produto ? 'Editar Produto' : 'Cadastrar Novo Produto'}</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Informações Básicas */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="nome">Nome do Produto *</Label>
                <Input
                  id="nome"
                  value={formData.nome}
                  onChange={(e) => setFormData({...formData, nome: e.target.value})}
                  required
                />
              </div>
              
              <div>
                <Label htmlFor="marca">Marca *</Label>
                <Select value={formData.marca} onValueChange={(value) => setFormData({...formData, marca: value})}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione a marca" />
                  </SelectTrigger>
                  <SelectContent>
                    {fornecedores.map((fornecedor, index) => {
                      return (
                        <SelectItem key={`marca-${fornecedor.id}`} value={fornecedor.nome_marca}>
                          {fornecedor.nome_marca}
                        </SelectItem>
                      );
                    })}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="fornecedor">Fornecedor *</Label>
                <Select value={formData.fornecedor_id} onValueChange={(value) => {
                  // Ao mudar fornecedor, atualizar também a marca
                  const fornecedorSelecionado = fornecedores.find(f => f.id === value);
                  setFormData({
                    ...formData,
                    fornecedor_id: value,
                    marca: fornecedorSelecionado ? fornecedorSelecionado.nome_marca : ''
                  });
                }}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o fornecedor" />
                  </SelectTrigger>
                  <SelectContent>
                    {fornecedores.map(fornecedor => (
                      <SelectItem key={`fornecedor-${fornecedor.id}`} value={fornecedor.id}>
                        {fornecedor.nome_marca}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="categoria">Categoria</Label>
                <Select value={formData.categoria} onValueChange={(value) => setFormData({...formData, categoria: value})}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione a categoria" />
                  </SelectTrigger>
                  <SelectContent>
                    {categorias.map(categoria => (
                      <SelectItem key={categoria} value={categoria}>{categoria}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label htmlFor="descricao">Descrição</Label>
              <Textarea
                id="descricao"
                value={formData.descricao}
                onChange={(e) => setFormData({...formData, descricao: e.target.value})}
                rows={3}
              />
            </div>

            {/* Configuração de Grade */}
            {formData.tipo_venda === 'grade' && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Configuração da Grade</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label>Tamanhos Disponíveis</Label>
                    <div className="flex flex-wrap gap-2 mt-2">
                      {tamanhosDisponiveis.map(tamanho => (
                        <Button
                          key={tamanho}
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => adicionarTamanho(tamanho)}
                        >
                          <Plus className="w-4 h-4 mr-1" />
                          {tamanho}
                        </Button>
                      ))}
                    </div>
                  </div>

                  {tamanhosSelecionados.length > 0 && (
                    <div>
                      <Label>Quantidades por Tamanho</Label>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-2">
                        {tamanhosSelecionados.map(tamanho => (
                          <div key={tamanho} className="border rounded-lg p-3">
                            <div className="flex items-center justify-between mb-2">
                              <Badge>{tamanho}</Badge>
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={() => removerTamanho(tamanho)}
                              >
                                <Minus className="w-4 h-4" />
                              </Button>
                            </div>
                            <Input
                              type="number"
                              min="0"
                              value={formData.grade_configuracao.quantidades_por_tamanho[tamanho] || 0}
                              onChange={(e) => atualizarQuantidadeTamanho(tamanho, e.target.value)}
                            />
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="bg-blue-50 p-4 rounded-lg">
                    <div className="text-sm text-blue-800">
                      <strong>Total de Peças na Grade:</strong> {formData.total_pecas_grade}
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Preços e Custos */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Precificação</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="custo_por_peca">Custo por Peça (R$)</Label>
                    <Input
                      id="custo_por_peca"
                      type="number"
                      step="0.01"
                      value={formData.custo_por_peca}
                      onChange={(e) => setFormData({...formData, custo_por_peca: parseFloat(e.target.value) || 0})}
                    />
                  </div>

                  <div>
                    <Label htmlFor="margem_lucro">Margem de Lucro (%)</Label>
                    <div className="flex gap-2">
                      <Input
                        id="margem_lucro"
                        type="number"
                        step="0.01"
                        value={formData.margem_lucro}
                        onChange={(e) => setFormData({...formData, margem_lucro: parseFloat(e.target.value) || 0})}
                      />
                      <Button type="button" onClick={calcularPrecoSugerido} variant="outline">
                        <Calculator className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="preco_por_peca">Preço por Peça (R$) *</Label>
                    <Input
                      id="preco_por_peca"
                      type="number"
                      step="0.01"
                      value={formData.preco_por_peca}
                      onChange={(e) => {
                        const novoPreco = parseFloat(e.target.value) || 0;
                        setFormData({...formData, preco_por_peca: novoPreco});
                        calcularTotais(formData.grade_configuracao.quantidades_por_tamanho);
                      }}
                      required
                    />
                  </div>
                </div>

                {formData.tipo_venda === 'grade' && (
                  <div className="bg-green-50 p-4 rounded-lg">
                    <div className="text-lg font-semibold text-green-800">
                      Preço da Grade Completa: R$ {formData.preco_grade_completa.toFixed(2)}
                    </div>
                    <div className="text-sm text-green-600">
                      {formData.total_pecas_grade} peças × R$ {formData.preco_por_peca.toFixed(2)}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Cores */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Cores Disponíveis</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex gap-2 mb-4">
                  <Input
                    placeholder="Nome da cor"
                    value={novaCor}
                    onChange={(e) => setNovaCor(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), adicionarCor())}
                  />
                  <Button type="button" onClick={adicionarCor}>
                    <Plus className="w-4 h-4 mr-1" />
                    Adicionar
                  </Button>
                </div>

                <div className="flex flex-wrap gap-2">
                  {formData.cores_disponiveis.map(cor => (
                    <Badge key={cor} variant="secondary" className="flex items-center gap-1">
                      {cor}
                      <button
                        type="button"
                        onClick={() => removerCor(cor)}
                        className="ml-1 text-red-500 hover:text-red-700"
                      >
                        ×
                      </button>
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Fotos */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Fotos do Produto</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4">
                  {Array.from({ length: 6 }, (_, index) => (
                    <ImageUploader
                      key={index}
                      imageUrl={formData.fotos?.[index]}
                      onUploadComplete={(url) => {
                        const novasFotos = [...(formData.fotos || [])];
                        novasFotos[index] = url;
                        setFormData({...formData, fotos: novasFotos});
                      }}
                      onRemove={() => {
                        const novasFotos = [...(formData.fotos || [])];
                        novasFotos.splice(index, 1);
                        setFormData({...formData, fotos: novasFotos});
                      }}
                    />
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Estoque */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Controle de Estoque</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center space-x-2">
                  <Switch
                    id="controla_estoque"
                    checked={formData.controla_estoque}
                    onCheckedChange={(checked) => setFormData({...formData, controla_estoque: checked})}
                  />
                  <Label htmlFor="controla_estoque">Controlar estoque</Label>
                </div>

                {formData.controla_estoque && (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <Label htmlFor="estoque_atual_grades">Estoque Atual (grades)</Label>
                      <Input
                        id="estoque_atual_grades"
                        type="number"
                        min="0"
                        value={formData.estoque_atual_grades}
                        onChange={(e) => setFormData({...formData, estoque_atual_grades: parseInt(e.target.value) || 0})}
                      />
                    </div>

                    <div>
                      <Label htmlFor="estoque_minimo_grades">Estoque Mínimo (grades)</Label>
                      <Input
                        id="estoque_minimo_grades"
                        type="number"
                        min="0"
                        value={formData.estoque_minimo_grades}
                        onChange={(e) => setFormData({...formData, estoque_minimo_grades: parseInt(e.target.value) || 0})}
                      />
                    </div>

                    <div>
                      <Label htmlFor="pedido_minimo_grades">Pedido Mínimo (grades)</Label>
                      <Input
                        id="pedido_minimo_grades"
                        type="number"
                        min="1"
                        value={formData.pedido_minimo_grades}
                        onChange={(e) => setFormData({...formData, pedido_minimo_grades: parseInt(e.target.value) || 1})}
                      />
                    </div>
                  </div>
                )}

                <div className="flex items-center space-x-2">
                  <Switch
                    id="permite_venda_sem_estoque"
                    checked={formData.permite_venda_sem_estoque}
                    onCheckedChange={(checked) => setFormData({...formData, permite_venda_sem_estoque: checked})}
                  />
                  <Label htmlFor="permite_venda_sem_estoque">Permitir venda sem estoque (pré-venda)</Label>
                </div>
              </CardContent>
            </Card>

            {/* Configurações */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label htmlFor="temporada">Temporada</Label>
                <Select value={formData.temporada} onValueChange={(value) => setFormData({...formData, temporada: value})}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Verão">Verão</SelectItem>
                    <SelectItem value="Inverno">Inverno</SelectItem>
                    <SelectItem value="Outono">Outono</SelectItem>
                    <SelectItem value="Primavera">Primavera</SelectItem>
                    <SelectItem value="Atemporal">Atemporal</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  id="is_destaque"
                  checked={formData.is_destaque}
                  onCheckedChange={(checked) => setFormData({...formData, is_destaque: checked})}
                />
                <Label htmlFor="is_destaque">Produto em destaque</Label>
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  id="ativo"
                  checked={formData.ativo}
                  onCheckedChange={(checked) => setFormData({...formData, ativo: checked})}
                />
                <Label htmlFor="ativo">Produto ativo</Label>
              </div>
            </div>

            {/* Botões */}
            <div className="flex justify-end space-x-4">
              <Button type="button" variant="outline" onClick={onCancel}>
                Cancelar
              </Button>
              <Button type="submit" disabled={loading}>
                {loading ? 'Salvando...' : produto ? 'Atualizar Produto' : 'Cadastrar Produto'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <Notification
        show={showNotification}
        message={notificationMessage}
        type={notificationType}
        onClose={hideNotification}
      />
    </div>
  );
}
