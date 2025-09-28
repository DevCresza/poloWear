import React, { useState, useEffect } from 'react';
import { Recurso } from '@/api/entities';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Search, BookOpen, Play, Image, CheckSquare, Megaphone } from 'lucide-react';

export default function Recursos() {
  const [recursos, setRecursos] = useState([]);
  const [filteredRecursos, setFilteredRecursos] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTipo, setSelectedTipo] = useState('all');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadRecursos();
  }, []);

  useEffect(() => {
    let filtered = recursos;
    
    if (searchTerm) {
      filtered = filtered.filter(recurso =>
        recurso.titulo.toLowerCase().includes(searchTerm.toLowerCase()) ||
        recurso.descricao?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    if (selectedTipo !== 'all') {
      filtered = filtered.filter(recurso => recurso.tipo === selectedTipo);
    }
    
    setFilteredRecursos(filtered);
  }, [recursos, searchTerm, selectedTipo]);

  const loadRecursos = async () => {
    try {
      const recursosList = await Recurso.list();
      setRecursos(recursosList);
    } catch (error) {
      console.error('Erro ao carregar recursos:', error);
    } finally {
      setLoading(false);
    }
  };

  const getTipoInfo = (tipo) => {
    const tiposMap = {
      artigo: { label: 'Artigo', color: 'bg-blue-100 text-blue-800', icon: BookOpen },
      video: { label: 'Vídeo', color: 'bg-red-100 text-red-800', icon: Play },
      lookbook: { label: 'Lookbook', color: 'bg-purple-100 text-purple-800', icon: Image },
      checklist: { label: 'Checklist', color: 'bg-green-100 text-green-800', icon: CheckSquare },
      marketing: { label: 'Marketing', color: 'bg-orange-100 text-orange-800', icon: Megaphone }
    };
    return tiposMap[tipo] || tiposMap.artigo;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Central de Recursos</h1>
        <p className="text-gray-600">Materiais, dicas e conteúdos para apoiar seu negócio</p>
      </div>

      {/* Filtros */}
      <Card className="mb-6">
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                placeholder="Buscar recursos..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            
            <Select value={selectedTipo} onValueChange={setSelectedTipo}>
              <SelectTrigger className="w-full md:w-48">
                <SelectValue placeholder="Filtrar por tipo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os Tipos</SelectItem>
                <SelectItem value="artigo">Artigos</SelectItem>
                <SelectItem value="video">Vídeos</SelectItem>
                <SelectItem value="lookbook">Lookbooks</SelectItem>
                <SelectItem value="checklist">Checklists</SelectItem>
                <SelectItem value="marketing">Marketing</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Lista de Recursos */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {filteredRecursos.map((recurso) => {
          const tipoInfo = getTipoInfo(recurso.tipo);
          const TipoIcon = tipoInfo.icon;
          
          return (
            <Card key={recurso.id} className="hover:shadow-md transition-shadow">
              {recurso.thumbnail_url && (
                <div className="aspect-video bg-gray-100 rounded-t-lg overflow-hidden">
                  <img 
                    src={recurso.thumbnail_url} 
                    alt={recurso.titulo}
                    className="w-full h-full object-cover"
                  />
                </div>
              )}
              
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <CardTitle className="text-lg line-clamp-2">
                    {recurso.titulo}
                  </CardTitle>
                  <Badge className={tipoInfo.color}>
                    <TipoIcon className="w-3 h-3 mr-1" />
                    {tipoInfo.label}
                  </Badge>
                </div>
              </CardHeader>
              
              <CardContent>
                {recurso.descricao && (
                  <p className="text-sm text-gray-600 mb-4 line-clamp-3">
                    {recurso.descricao}
                  </p>
                )}
                
                <Button 
                  variant="outline" 
                  className="w-full"
                  onClick={() => {
                    if (recurso.tipo === 'video' || recurso.conteudo.startsWith('http')) {
                      window.open(recurso.conteudo, '_blank');
                    }
                  }}
                >
                  {recurso.tipo === 'video' ? 'Assistir' : 'Abrir'}
                </Button>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {filteredRecursos.length === 0 && (
        <Card>
          <CardContent className="text-center py-12">
            <BookOpen className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Nenhum recurso encontrado
            </h3>
            <p className="text-gray-600">
              Tente ajustar os filtros ou termo de busca.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}