import React, { useState, useEffect } from 'react';
import { Capsula } from '@/api/entities';
import { UserCompat } from '@/api/entities';
import { Produto } from '@/api/entities';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Plus, Edit, Trash2, Image } from 'lucide-react';
import CapsulaForm from '../components/admin/CapsulaForm';
import { useNotification } from '@/hooks/useNotification';
import { Notification } from '@/components/ui/notification';

export default function GestaoCapsulas() {
  const [capsulas, setCapsulas] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingCapsula, setEditingCapsula] = useState(null);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [capsulaToDelete, setCapsulaToDelete] = useState(null);
  const { showSuccess, showError, showNotification, notificationMessage, notificationType, hideNotification } = useNotification();

  useEffect(() => {
    loadCapsulas();
  }, []);

  const loadCapsulas = async () => {
    setLoading(true);
    try {
      // Primeiro, obter o usuário atual
      const user = await UserCompat.me();
      if (!user) {
        throw new Error('Usuário não autenticado');
      }

      setCurrentUser(user);
      console.log('👤 Usuário atual (Cápsulas):', { id: user.id, role: user.role, fornecedor_id: user.fornecedor_id });

      if (user.role === 'admin') {
        // Admin vê todas as cápsulas
        const result = await Capsula.find({
          order: { column: 'created_at', ascending: false }
        });
        const capsulasList = result.success ? result.data : [];
        setCapsulas(capsulasList);
      } else if (user.role === 'fornecedor' && user.fornecedor_id) {
        // Fornecedor vê apenas cápsulas que contêm seus produtos

        // Primeiro, buscar produtos do fornecedor
        const produtosResult = await Produto.find({
          filters: { fornecedor_id: user.fornecedor_id }
        });

        if (produtosResult.success && produtosResult.data.length > 0) {
          const produtoIds = produtosResult.data.map(p => p.id);

          // Buscar todas as cápsulas e filtrar as que contêm produtos do fornecedor
          const capsulaResult = await Capsula.find({
            order: { column: 'created_at', ascending: false }
          });

          if (capsulaResult.success) {
            const capsulasFiltradas = capsulaResult.data.filter(capsula => {
              // Verificar se a cápsula contém algum produto do fornecedor
              const produtosDaCapsula = capsula.produto_ids || [];
              return produtosDaCapsula.some(produtoId => produtoIds.includes(produtoId));
            });
            setCapsulas(capsulasFiltradas);
          } else {
            setCapsulas([]);
          }
        } else {
          // Fornecedor sem produtos não tem cápsulas
          setCapsulas([]);
        }
      } else {
        // Usuário sem fornecedor_id não deveria estar aqui
        console.warn('⚠️ Usuário sem fornecedor_id tentando acessar gestão de cápsulas');
        setCapsulas([]);
      }
    } catch (error) {
      console.error("Erro ao carregar cápsulas:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (capsula) => {
    setEditingCapsula(capsula);
    setShowForm(true);
  };

  const handleDelete = (capsula) => {
    setCapsulaToDelete(capsula);
    setShowConfirmDialog(true);
  };

  const confirmDelete = async () => {
    if (!capsulaToDelete) return;

    try {
      await Capsula.delete(capsulaToDelete.id);
      showSuccess('Cápsula excluída com sucesso!');
      loadCapsulas();
    } catch (error) {
      console.error("Erro ao excluir cápsula:", error);
      showError('Falha ao excluir a cápsula.');
    } finally {
      setShowConfirmDialog(false);
      setCapsulaToDelete(null);
    }
  };

  const handleSuccess = () => {
    setShowForm(false);
    setEditingCapsula(null);
    loadCapsulas();
  };

  return (
    <div className="bg-slate-100 p-6 rounded-3xl shadow-[8px_8px_16px_#d1d9e6,-8px_-8px_16px_#ffffff]">
      {showForm ? (
        <CapsulaForm
          capsula={editingCapsula}
          onSuccess={handleSuccess}
          onCancel={() => {
            setShowForm(false);
            setEditingCapsula(null);
          }}
        />
      ) : (
        <Card className="bg-transparent border-0">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2 text-2xl text-gray-800">
                <Image className="w-6 h-6" />
                <span>Gestão de Cápsulas</span>
              </CardTitle>
              <CardDescription>Crie e gerencie coleções de produtos.</CardDescription>
            </div>
            <Button onClick={() => setShowForm(true)} className="bg-blue-600 hover:bg-blue-700 text-white rounded-lg shadow-neumorphic-button active:shadow-neumorphic-button-inset transition-all">
              <Plus className="w-4 h-4 mr-2" />
              Nova Cápsula
            </Button>
          </CardHeader>
          <CardContent>
            {loading ? (
              <p>Carregando...</p>
            ) : (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {capsulas.map(capsula => (
                  <Card key={capsula.id} className="bg-slate-100 rounded-2xl shadow-[5px_5px_10px_#b8b9be,-5px_-5px_10px_#ffffff] p-4 space-y-3">
                    <img src={capsula.imagem_capa_url || 'https://via.placeholder.com/400x300'} alt={capsula.nome} className="rounded-lg aspect-video object-cover"/>
                    <h3 className="font-bold text-lg text-gray-800">{capsula.nome}</h3>
                    <p className="text-sm text-gray-600 line-clamp-2">{capsula.descricao}</p>
                    <p className="text-sm font-medium text-blue-600">{capsula.produto_ids?.length || 0} produtos</p>
                    <div className="flex justify-end gap-2">
                      <Button variant="ghost" size="icon" onClick={() => handleEdit(capsula)}>
                        <Edit className="w-4 h-4"/>
                      </Button>
                       <Button variant="ghost" size="icon" onClick={() => handleDelete(capsula)} className="text-red-500 hover:text-red-600">
                        <Trash2 className="w-4 h-4"/>
                      </Button>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Diálogo de Confirmação */}
      <Dialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Confirmar Exclusão</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <p className="text-sm text-gray-700 mb-4">
              Tem certeza que deseja excluir a cápsula <strong>{capsulaToDelete?.nome}</strong>?
            </p>
            <p className="text-xs text-gray-500">
              Esta ação não pode ser desfeita.
            </p>
          </div>
          <div className="flex justify-end gap-3">
            <Button
              variant="outline"
              onClick={() => setShowConfirmDialog(false)}
            >
              Cancelar
            </Button>
            <Button
              onClick={confirmDelete}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              Excluir
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Notification
        show={showNotification}
        message={notificationMessage}
        type={notificationType}
        onClose={hideNotification}
      />
    </div>
  );
}