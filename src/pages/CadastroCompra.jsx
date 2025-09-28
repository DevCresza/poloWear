import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Contact } from '@/api/entities';
import { SendEmail } from '@/api/integrations';
import { useNotification } from '@/hooks/useNotification';
import { Notification } from '@/components/ui/notification';
import { Store, ArrowRight, CheckCircle, Phone, Mail, Building, MapPin } from 'lucide-react';

export default function CadastroCompra() {
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const {
    showSuccess,
    showError,
    showNotification,
    notificationMessage,
    notificationType
  } = useNotification();
  const [formData, setFormData] = useState({
    nome: '',
    email: '',
    telefone: '',
    empresa: '',
    cidade: '',
    estado: '',
    tem_loja_fisica: '',
    faixa_faturamento: ''
  });

  const estados = [
    'AC', 'AL', 'AP', 'AM', 'BA', 'CE', 'DF', 'ES', 'GO', 'MA', 
    'MT', 'MS', 'MG', 'PA', 'PB', 'PR', 'PE', 'PI', 'RJ', 'RN', 
    'RS', 'RO', 'RR', 'SC', 'SP', 'SE', 'TO'
  ];

  const faixasFaturamento = [
    '0-10k', '10k-20k', '20k-30k', '30k-40k', 'Acima de 50k'
  ];

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.nome || !formData.email || !formData.telefone) {
      showError('Por favor, preencha os campos obrigatórios: Nome, Email e WhatsApp');
      return;
    }
    
    setLoading(true);
    
    try {
      // Dados para salvar no CRM
      const dadosContato = {
        nome: formData.nome,
        email: formData.email,
        telefone: formData.telefone,
        empresa: formData.empresa,
        cidade: formData.cidade,
        estado: formData.estado,
        tem_loja_fisica: formData.tem_loja_fisica,
        faixa_faturamento: formData.faixa_faturamento,
        status: 'novo',
        fonte_lead: 'Formulário Site - Cadastro Multimarca',
        observacoes: `Lead gerado via formulário "Quero ser Multimarca".
Empresa: ${formData.empresa || 'Não informado'}
Loja física: ${formData.tem_loja_fisica || 'Não informado'}
Faturamento: ${formData.faixa_faturamento || 'Não informado'}`
      };

      // Salvar no banco
      await Contact.create(dadosContato);

      // Enviar email
      try {
        await SendEmail({
          to: 'roberto@polomultimarca.com.br',
          subject: 'Nova Solicitação - Quero ser Multimarca POLO Wear',
          body: `Nova solicitação para multimarca POLO Wear:

DADOS:
Nome: ${formData.nome}
Email: ${formData.email}
WhatsApp: ${formData.telefone}
Empresa: ${formData.empresa || 'Não informado'}
Cidade: ${formData.cidade || 'Não informado'}
Estado: ${formData.estado || 'Não informado'}
Tem Loja Física: ${formData.tem_loja_fisica || 'Não informado'}
Faturamento: ${formData.faixa_faturamento || 'Não informado'}

Origem: Formulário Site
Data: ${new Date().toLocaleString('pt-BR')}`
        });
      } catch (emailError) {
        console.error('Erro no email:', emailError);
      }
      
      setSuccess(true);
      
    } catch (error) {
      console.error('Erro:', error);
      showError('Erro ao enviar solicitação. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-gray-100 flex items-center justify-center p-6">
        <Card className="w-full max-w-2xl shadow-2xl">
          <CardContent className="p-12 text-center">
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle className="w-10 h-10 text-green-600" />
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-4">
              Solicitação Enviada!
            </h1>
            <p className="text-lg text-gray-600 mb-8">
              Obrigado pelo interesse em ser multimarca POLO Wear. 
              Nossa equipe entrará em contato em até 24 horas.
            </p>
            <Button 
              onClick={() => window.location.href = '/'}
              className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3"
            >
              Voltar ao Site
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-gray-100 flex items-center justify-center p-6">
      <Card className="w-full max-w-2xl shadow-2xl">
        <CardHeader className="bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-t-lg">
          <div className="flex items-center gap-3">
            <Store className="w-8 h-8" />
            <div>
              <CardTitle className="text-2xl font-bold">
                Quero ser Multimarca POLO Wear
              </CardTitle>
              <p className="text-blue-100">
                Preencha seus dados e nossa equipe entrará em contato
              </p>
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="nome" className="flex items-center gap-2">
                  <Mail className="w-4 h-4" />
                  Nome Completo *
                </Label>
                <Input
                  id="nome"
                  type="text"
                  required
                  value={formData.nome}
                  onChange={(e) => setFormData({...formData, nome: e.target.value})}
                  placeholder="Seu nome completo"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email" className="flex items-center gap-2">
                  <Mail className="w-4 h-4" />
                  Email *
                </Label>
                <Input
                  id="email"
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({...formData, email: e.target.value})}
                  placeholder="seu@email.com"
                />
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="telefone" className="flex items-center gap-2">
                  <Phone className="w-4 h-4" />
                  WhatsApp *
                </Label>
                <Input
                  id="telefone"
                  type="tel"
                  required
                  value={formData.telefone}
                  onChange={(e) => setFormData({...formData, telefone: e.target.value})}
                  placeholder="(11) 99999-9999"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="empresa" className="flex items-center gap-2">
                  <Building className="w-4 h-4" />
                  Nome da Empresa
                </Label>
                <Input
                  id="empresa"
                  type="text"
                  value={formData.empresa}
                  onChange={(e) => setFormData({...formData, empresa: e.target.value})}
                  placeholder="Nome da sua loja"
                />
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="cidade" className="flex items-center gap-2">
                  <MapPin className="w-4 h-4" />
                  Cidade
                </Label>
                <Input
                  id="cidade"
                  type="text"
                  value={formData.cidade}
                  onChange={(e) => setFormData({...formData, cidade: e.target.value})}
                  placeholder="Sua cidade"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="estado">Estado</Label>
                <Select 
                  value={formData.estado} 
                  onValueChange={(value) => setFormData({...formData, estado: value})}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o estado" />
                  </SelectTrigger>
                  <SelectContent>
                    {estados.map(estado => (
                      <SelectItem key={estado} value={estado}>{estado}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="tem_loja_fisica">Tem loja física?</Label>
                <Select 
                  value={formData.tem_loja_fisica} 
                  onValueChange={(value) => setFormData({...formData, tem_loja_fisica: value})}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="sim">Sim</SelectItem>
                    <SelectItem value="nao">Não</SelectItem>
                    <SelectItem value="pretendo_abrir">Pretendo abrir</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="faixa_faturamento">Faturamento Mensal</Label>
                <Select 
                  value={formData.faixa_faturamento} 
                  onValueChange={(value) => setFormData({...formData, faixa_faturamento: value})}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione a faixa" />
                  </SelectTrigger>
                  <SelectContent>
                    {faixasFaturamento.map(faixa => (
                      <SelectItem key={faixa} value={faixa}>{faixa}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <p className="text-sm text-blue-800">
                <strong>Importante:</strong> Após enviar suas informações, nossa equipe 
                entrará em contato em até 24 horas para apresentar nossa proposta.
              </p>
            </div>

            <Button 
              type="submit" 
              disabled={loading}
              className="w-full h-12 bg-blue-600 hover:bg-blue-700 text-lg font-semibold"
            >
              {loading ? 'Enviando...' : (
                <>
                  Enviar Solicitação
                  <ArrowRight className="w-5 h-5 ml-2" />
                </>
              )}
            </Button>
          </form>
        </CardContent>
      </Card>

      <Notification
        show={showNotification}
        message={notificationMessage}
        type={notificationType}
      />
    </div>
  );
}