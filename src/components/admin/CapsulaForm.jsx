import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Produto } from '@/api/entities';
import { Capsula } from '@/api/entities';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Checkbox } from '@/components/ui/checkbox';
import { Search } from 'lucide-react';
import ImageUploader from './ImageUploader';
import { useNotification } from '@/hooks/useNotification';
import { Notification } from '@/components/ui/notification';

export default function CapsulaForm({ capsula, onSuccess, onCancel }) {
  const [formData, setFormData] = useState({
    nome: '',
    descricao: '',
    imagem_capa_url: '',
    produto_ids: [],
    ativa: true,
  });
  const [allProdutos, setAllProdutos] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(false);
  const { showError, showNotification, notificationMessage, notificationType, hideNotification } = useNotification();

  useEffect(() => {
    if (capsula) {
      setFormData({
        nome: capsula.nome || '',
        descricao: capsula.descricao || '',
        imagem_capa_url: capsula.imagem_capa_url || '',
        produto_ids: capsula.produto_ids || [],
        ativa: capsula.ativa !== undefined ? capsula.ativa : true,
      });
    }

    const loadProdutos = async () => {
      try {
        const result = await Produto.find({
          order: { column: 'nome', ascending: true }
        });
        const produtosList = result.success ? result.data : [];
        setAllProdutos(produtosList);
      } catch (error) {
        console.error("Erro ao carregar produtos:", error);
      }
    };
    loadProdutos();
  }, [capsula]);

  const handleProductSelection = (productId) => {
    setFormData(prev => {
      const newProductIds = prev.produto_ids.includes(productId)
        ? prev.produto_ids.filter(id => id !== productId)
        : [...prev.produto_ids, productId];
      return { ...prev, produto_ids: newProductIds };
    });
  };

  const filteredProdutos = allProdutos.filter(p => 
    p.nome.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (formData.produto_ids.length === 0) {
      showError('Selecione ao menos um produto para a cápsula.');
      return;
    }
    setLoading(true);
    try {
      if (capsula) {
        await Capsula.update(capsula.id, formData);
      } else {
        await Capsula.create(formData);
      }
      onSuccess();
    } catch (error) {
      console.error('Erro ao salvar cápsula:', error);
      showError('Falha ao salvar a cápsula.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="bg-slate-100 border-0 shadow-[8px_8px_16px_#d1d9e6,-8px_-8px_16px_#ffffff]">
      <CardHeader>
        <CardTitle className="text-2xl text-gray-800">{capsula ? 'Editar Cápsula' : 'Nova Cápsula'}</CardTitle>
        <CardDescription>Crie uma coleção de produtos para seus clientes.</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-8">
          <div className="grid md:grid-cols-3 gap-8">
            {/* Coluna 1: Infos e Imagem */}
            <div className="md:col-span-1 space-y-6">
              <div>
                <Label htmlFor="nome" className="font-medium">Nome da Cápsula</Label>
                <Input id="nome" value={formData.nome} onChange={e => setFormData({...formData, nome: e.target.value})} required className="bg-slate-100 shadow-neumorphic-inset" />
              </div>
              <div>
                <Label htmlFor="descricao" className="font-medium">Descrição</Label>
                <Textarea id="descricao" value={formData.descricao} onChange={e => setFormData({...formData, descricao: e.target.value})} className="bg-slate-100 shadow-neumorphic-inset" />
              </div>
              <div>
                <Label className="font-medium">Imagem de Capa</Label>
                <ImageUploader
                  imageUrl={formData.imagem_capa_url}
                  onUploadComplete={url => setFormData({...formData, imagem_capa_url: url})}
                  onRemove={() => setFormData({...formData, imagem_capa_url: ''})}
                />
              </div>
               <div className="flex items-center space-x-2">
                  <Switch id="ativa" checked={formData.ativa} onCheckedChange={checked => setFormData({...formData, ativa: checked})} />
                  <Label htmlFor="ativa">Cápsula Ativa</Label>
              </div>
            </div>

            {/* Coluna 2: Seleção de Produtos */}
            <div className="md:col-span-2">
              <Label className="font-medium text-lg">Selecionar Produtos ({formData.produto_ids.length})</Label>
              <div className="mt-2 relative">
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                <Input 
                  placeholder="Buscar produto..." 
                  value={searchTerm} 
                  onChange={e => setSearchTerm(e.target.value)}
                  className="pl-10 bg-slate-100 shadow-neumorphic-inset"
                />
              </div>
              <ScrollArea className="h-96 mt-4 p-4 rounded-lg bg-slate-100 shadow-neumorphic-inset">
                <div className="space-y-2">
                  {filteredProdutos.map(produto => (
                    <div key={produto.id} className="flex items-center space-x-3 p-2 rounded-md hover:bg-slate-200">
                       <Checkbox
                          id={`prod-${produto.id}`}
                          checked={formData.produto_ids.includes(produto.id)}
                          onCheckedChange={() => handleProductSelection(produto.id)}
                      />
                      <img src={produto.fotos?.[0] || 'https://via.placeholder.com/50'} alt={produto.nome} className="w-10 h-10 rounded-md object-cover"/>
                      <label htmlFor={`prod-${produto.id}`} className="flex-1 cursor-pointer">{produto.nome}</label>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </div>
          </div>
          <div className="flex justify-end gap-4 pt-4">
            <Button type="button" variant="ghost" onClick={onCancel} className="text-gray-700">Cancelar</Button>
            <Button type="submit" disabled={loading} className="bg-blue-600 hover:bg-blue-700 text-white rounded-lg shadow-neumorphic-button active:shadow-neumorphic-button-inset">
              {loading ? 'Salvando...' : 'Salvar Cápsula'}
            </Button>
          </div>
        </form>

        <Notification
          show={showNotification}
          message={notificationMessage}
          type={notificationType}
          onClose={hideNotification}
        />
      </CardContent>
    </Card>
  );
}