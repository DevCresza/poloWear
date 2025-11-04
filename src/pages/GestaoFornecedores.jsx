
import React, { useState, useEffect } from 'react';
import { Fornecedor } from '@/api/entities';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge'; // Added Badge import
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Building, Plus, Trash2 } from 'lucide-react';
import FornecedorForm from '../components/admin/FornecedorForm';

export default function GestaoFornecedores() {
  const [fornecedores, setFornecedores] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingFornecedor, setEditingFornecedor] = useState(null);
  const [fornecedorToDelete, setFornecedorToDelete] = useState(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  useEffect(() => {
    loadFornecedores();
  }, []);

  const loadFornecedores = async () => {
    setLoading(true);
    try {
      const fornecedoresResult = await Fornecedor.find();
      const fornecedores = fornecedoresResult.success ? fornecedoresResult.data : [];
      setFornecedores(fornecedores);
    } catch (error) {
      console.error("Erro ao carregar fornecedores:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (fornecedor) => {
    setEditingFornecedor(fornecedor);
    setShowForm(true);
  };

  const handleSuccess = () => {
    setShowForm(false);
    setEditingFornecedor(null);
    loadFornecedores();
  };

  const handleDeleteClick = (fornecedor) => {
    setFornecedorToDelete(fornecedor);
    setShowDeleteDialog(true);
  };

  const handleConfirmDelete = async () => {
    if (!fornecedorToDelete) return;

    try {
      await Fornecedor.delete(fornecedorToDelete.id);
      setShowDeleteDialog(false);
      setFornecedorToDelete(null);
      loadFornecedores();
    } catch (error) {
      console.error("Erro ao excluir fornecedor:", error);
      alert("Erro ao excluir fornecedor. Verifique se não há produtos ou pedidos vinculados a este fornecedor.");
    }
  };

  const handleCancelDelete = () => {
    setShowDeleteDialog(false);
    setFornecedorToDelete(null);
  };

  return (
     <div>
      {showForm ? (
        <FornecedorForm
          fornecedor={editingFornecedor}
          onSuccess={handleSuccess}
          onCancel={() => {
            setShowForm(false);
            setEditingFornecedor(null);
          }}
        />
      ) : (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Building className="w-5 h-5" />
              <span>Fornecedores</span>
            </CardTitle>
            <Button onClick={() => setShowForm(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Novo Fornecedor
            </Button>
          </CardHeader>
          <CardContent>
             {loading ? (
              <p>Carregando...</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nome da Marca</TableHead>
                    <TableHead>Razão Social</TableHead>
                    <TableHead>CNPJ</TableHead>
                    <TableHead>Pedido Mínimo</TableHead>
                    <TableHead>Email Acesso</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {fornecedores.map((fornecedor) => (
                    <TableRow key={fornecedor.id}>
                      <TableCell className="font-medium">{fornecedor.nome_marca}</TableCell>
                      <TableCell>{fornecedor.razao_social}</TableCell>
                      <TableCell>{fornecedor.cnpj}</TableCell>
                      <TableCell>R$ {fornecedor.pedido_minimo_valor?.toFixed(2) || '0.00'}</TableCell>
                      <TableCell>
                        <div>
                          <div className="font-medium">{fornecedor.email_fornecedor || '-'}</div>
                          {fornecedor.email_fornecedor && (
                            <div className="text-xs text-gray-600">
                              {fornecedor.senha_fornecedor ? '••••••••' : 'Sem senha'}
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge className={fornecedor.ativo_fornecedor ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}>
                          {fornecedor.ativo_fornecedor ? 'Ativo' : 'Inativo'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button variant="outline" size="sm" onClick={() => handleEdit(fornecedor)}>
                            Editar
                          </Button>
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => handleDeleteClick(fornecedor)}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
       )}

      {/* Diálogo de Confirmação de Exclusão */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar Exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir o fornecedor <strong>{fornecedorToDelete?.nome_marca}</strong>?
              <br /><br />
              Esta ação não pode ser desfeita. Certifique-se de que não há produtos ou pedidos vinculados a este fornecedor.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={handleCancelDelete}>
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmDelete}
              className="bg-red-600 hover:bg-red-700"
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
