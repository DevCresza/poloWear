import React, { useState } from 'react';
import { PendingUser } from '@/api/entities';
import { User } from '@/api/entities';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { CheckCircle, ExternalLink, Copy, ArrowLeft } from 'lucide-react';
import UserTypeSelector from './UserTypeSelector';
import UserFormMultimarca from './UserFormMultimarca';
import UserFormFornecedor from './UserFormFornecedor';
import UserFormAdmin from './UserFormAdmin';
import { useNotification } from '@/hooks/useNotification';
import { Notification } from '@/components/ui/notification';

export default function UserCreationWizard({ onSuccess, onCancel }) {
  const [step, setStep] = useState('type'); // 'type', 'form', 'success'
  const [selectedType, setSelectedType] = useState(null);
  const [loading, setLoading] = useState(false);
  const [createdUser, setCreatedUser] = useState(null);
  const { showError, showInfo, showSuccess, showNotification, notificationMessage, notificationType, hideNotification } = useNotification();

  const handleTypeSelect = (type) => {
    setSelectedType(type);
    setStep('form');
  };

  const handleUserSubmit = async (userData) => {
    setLoading(true);
    try {
      // Adicionar dados de controle
      const completeUserData = {
        ...userData,
        status: 'pendente',
        data_criacao: new Date().toISOString()
      };

      // Obter usuário atual
      try {
        const currentUser = await User.me();
        completeUserData.convidado_por = currentUser.id;
      } catch (error) {
        console.log('Não foi possível identificar o usuário atual');
      }

      // Criar usuário pendente
      const newPendingUser = await PendingUser.create(completeUserData);
      setCreatedUser(newPendingUser);
      setStep('success');

    } catch (error) {
      console.error('Erro ao criar usuário:', error);
      const errorMessage = error.response?.data?.message || error.message || 'Ocorreu um erro desconhecido.';
      showError(`Falha ao criar usuário: ${errorMessage}`);
    } finally {
      setLoading(false);
    }
  };

  const openDashboard = () => {
    showInfo('Funcionalidade de painel administrativo será implementada em breve.');
  };

  const copyUserInfo = () => {
    if (!createdUser) return;
    
    const userInfo = `Email: ${createdUser.email}
Nome: ${createdUser.full_name}
Tipo: ${createdUser.tipo_negocio}
Função: ${createdUser.role}
${createdUser.fornecedor_id ? `Fornecedor ID: ${createdUser.fornecedor_id}` : ''}
${createdUser.nome_empresa ? `Empresa: ${createdUser.nome_empresa}` : ''}`;

    navigator.clipboard.writeText(userInfo);
    showSuccess('Informações copiadas! Use no painel administrativo.');
  };

  const renderForm = () => {
    const props = {
      onSubmit: handleUserSubmit,
      onCancel: () => setStep('type'),
      loading
    };

    switch (selectedType) {
      case 'multimarca':
        return <UserFormMultimarca {...props} />;
      case 'fornecedor':
        return <UserFormFornecedor {...props} />;
      case 'admin':
        return <UserFormAdmin {...props} />;
      default:
        return null;
    }
  };

  if (step === 'success') {
    return (
      <div className="max-w-4xl mx-auto">
        <Card className="border-green-200 bg-green-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-green-800">
              <CheckCircle className="w-6 h-6" />
              Usuário Registrado com Sucesso!
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <Alert className="bg-white border-green-200">
              <ExternalLink className="h-4 w-4" />
              <AlertDescription>
                <div className="space-y-4">
                  <p><strong>O usuário foi registrado e está aguardando convite.</strong></p>
                  
                  <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                    <p className="font-semibold mb-3 text-blue-900">Para finalizar o cadastro:</p>
                    <ol className="list-decimal list-inside space-y-2 text-sm text-blue-800">
                      <li>Clique no botão "Painel Administrativo" abaixo</li>
                      <li>No painel, vá para "Users" → "Invite User"</li>
                      <li>Use o botão "Copiar Informações" e cole no formulário de convite</li>
                      <li>Configure a função como: <strong>{createdUser?.role === 'admin' ? 'Admin' : 'User'}</strong></li>
                      <li>Envie o convite - o usuário receberá um email de acesso</li>
                    </ol>
                  </div>

                  {createdUser && (
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <p className="font-semibold mb-2">Informações do usuário criado:</p>
                      <div className="text-sm space-y-1">
                        <p><strong>Nome:</strong> {createdUser.full_name}</p>
                        <p><strong>Email:</strong> {createdUser.email}</p>
                        <p><strong>Tipo:</strong> {createdUser.tipo_negocio}</p>
                        <p><strong>Função:</strong> {createdUser.role}</p>
                        {createdUser.nome_empresa && <p><strong>Empresa:</strong> {createdUser.nome_empresa}</p>}
                      </div>
                    </div>
                  )}
                </div>
              </AlertDescription>
            </Alert>

            <div className="flex justify-center gap-4">
              <Button onClick={copyUserInfo} variant="outline" className="flex items-center gap-2">
                <Copy className="w-4 h-4" />
                Copiar Informações
              </Button>
              <Button onClick={openDashboard} className="bg-blue-600 hover:bg-blue-700 flex items-center gap-2">
                <ExternalLink className="w-4 h-4" />
                Painel Administrativo
              </Button>
              <Button onClick={onSuccess} variant="outline">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Voltar à Lista
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div>
      {step === 'type' && (
        <UserTypeSelector onSelect={handleTypeSelect} />
      )}
      {step === 'form' && renderForm()}

      <Notification
        show={showNotification}
        message={notificationMessage}
        type={notificationType}
        onClose={hideNotification}
      />
    </div>
  );
}