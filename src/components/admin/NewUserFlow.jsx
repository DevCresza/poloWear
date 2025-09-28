import React, { useState } from 'react';
import { PendingUser } from '@/api/entities';
import { User } from '@/api/entities';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { CheckCircle } from 'lucide-react';
import UserTypeSelector from './UserTypeSelector';
import UserFormMultimarca from './UserFormMultimarca';
import UserFormFornecedor from './UserFormFornecedor';
import UserFormAdmin from './UserFormAdmin';
import { useNotification } from '@/hooks/useNotification';
import { Notification } from '@/components/ui/notification';

export default function NewUserFlow({ onSuccess, onCancel }) {
  const [step, setStep] = useState('type'); // 'type', 'form', 'success'
  const [selectedType, setSelectedType] = useState(null);
  const [loading, setLoading] = useState(false);
  const { showError, showNotification, notificationMessage, notificationType, hideNotification } = useNotification();

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

      // Obter usuário atual para saber quem criou
      try {
        const currentUser = await User.me();
        completeUserData.convidado_por = currentUser.id;
      } catch (error) {
        console.log('Não foi possível identificar o usuário atual');
      }

      // Criar usuário pendente
      await PendingUser.create(completeUserData);
      
      setStep('success');

    } catch (error) {
      console.error('Erro ao criar usuário:', error);
      const errorMessage = error.response?.data?.message || error.message || 'Ocorreu um erro desconhecido.';
      showError(`Falha ao criar usuário: ${errorMessage}`);
    } finally {
      setLoading(false);
    }
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
      <div className="max-w-2xl mx-auto">
        <Alert className="border-green-200 bg-green-50">
          <CheckCircle className="h-4 w-4" />
          <AlertDescription className="text-green-800">
            <div className="space-y-4">
              <p><strong>Usuário criado com sucesso!</strong></p>
              <div className="bg-white p-4 rounded-lg border border-green-200">
                <p className="font-semibold mb-2">Próximos passos:</p>
                <ol className="list-decimal list-inside space-y-1 text-sm">
                  <li>Acesse o painel administrativo</li>
                  <li>Vá para a seção "Users" ou "Usuários"</li>
                  <li>Use a função "Invite User" para convidar o usuário</li>
                  <li>O usuário receberá um email com instruções de acesso</li>
                </ol>
              </div>
              <p className="text-sm">
                Este processo contorna o problema técnico atual e garante que o usuário seja criado corretamente.
              </p>
            </div>
          </AlertDescription>
        </Alert>
        <div className="mt-6 text-center">
          <button 
            onClick={onSuccess}
            className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 transition-colors"
          >
            Voltar à Lista
          </button>
        </div>
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