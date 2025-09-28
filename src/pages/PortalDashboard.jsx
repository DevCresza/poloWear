import React, { useState, useEffect } from 'react';
import { UserCompat as User } from '@/api/entities';
import { Contact } from '@/api/entities';
import { Pedido } from '@/api/entities';
import { Produto } from '@/api/entities';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { LogIn, Shield, ShoppingCart, Package, TrendingUp, Users, DollarSign, Eye, Calendar, Star, AlertTriangle } from 'lucide-react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { usePageTitle } from '@/hooks/usePageTitle';

export default function PortalDashboard() {
  usePageTitle('Dashboard', 'Visão geral da sua conta POLO B2B');
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [dashboardData, setDashboardData] = useState({
    totalVendas: 0,
    vendasMes: 0,
    totalLeads: 0,
    leadsNovos: 0,
    totalClientes: 0,
    clientesAtivos: 0,
    produtosCadastrados: 0,
    pedidosPendentes: 0,
    recentePedidos: [],
    topProdutos: []
  });

  useEffect(() => {
    console.log('🔵 Dashboard: Iniciando verificação de usuário...');

    // Verificar localStorage diretamente (igual outras páginas)
    const savedSession = localStorage.getItem('userSession');
    if (savedSession) {
      try {
        const session = JSON.parse(savedSession);
        const sessionAge = Date.now() - session.loginTime;

        if (session.isLoggedIn && sessionAge < 3600000) { // 1 hora
          console.log('✅ Dashboard: Usuário encontrado no localStorage:', session.user);
          setUser(session.user);
          setLoading(false);

          if (session.user.role === 'admin') {
            console.log('🔄 Dashboard: Carregando dados do admin...');
            loadDashboardData().catch((error) => {
              console.error('❌ Dashboard: Erro ao carregar dados:', error);
            });
          }
        } else {
          console.log('❌ Dashboard: Sessão expirada');
          localStorage.removeItem('userSession');
          localStorage.removeItem('currentUser');
          setError(true);
          setLoading(false);
        }
      } catch (error) {
        console.error('❌ Dashboard: Erro ao ler localStorage:', error);
        setError(true);
        setLoading(false);
      }
    } else {
      console.log('❌ Dashboard: Nenhuma sessão encontrada');
      setError(true);
      setLoading(false);
    }
  }, []);

  const loadDashboardData = async () => {
    try {
      console.log('📊 Dashboard: Iniciando carregamento de dados...');

      const [contactsResult, pedidosResult, produtosResult] = await Promise.all([
        Contact.find({ order: { column: 'created_at', ascending: false } }),
        Pedido.find({ order: { column: 'created_date', ascending: false } }),
        Produto.find()
      ]);

      console.log('📊 Dashboard: Dados recebidos:', {
        contacts: contactsResult?.success,
        pedidos: pedidosResult?.success,
        produtos: produtosResult?.success
      });

      const contacts = contactsResult.success ? contactsResult.data : [];
      const pedidos = pedidosResult.success ? pedidosResult.data : [];
      const produtos = produtosResult.success ? produtosResult.data : [];

      // Calcular vendas totais
      const totalVendas = pedidos?.reduce((sum, pedido) => sum + (pedido.valor_total || 0), 0) || 0;
      
      // Vendas do mês atual
      const currentMonth = new Date().getMonth();
      const currentYear = new Date().getFullYear();
      const vendasMes = pedidos?.filter(pedido => {
        const pedidoDate = new Date(pedido.created_date);
        return pedidoDate.getMonth() === currentMonth && pedidoDate.getFullYear() === currentYear;
      }).reduce((sum, pedido) => sum + (pedido.valor_total || 0), 0) || 0;

      // Leads novos (últimos 30 dias)
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      const leadsNovos = contacts?.filter(contact => new Date(contact.created_at) > thirtyDaysAgo).length || 0;

      // Clientes ativos (que fizeram pelo menos um pedido)
      const clientesComPedidos = new Set(pedidos?.map(p => p.comprador_user_id) || []);
      const clientesAtivos = clientesComPedidos.size;

      // Clientes totais (temporariamente usando contatos como proxy)
      const totalClientes = contacts?.length || 0;

      // Pedidos pendentes
      const pedidosPendentes = pedidos?.filter(p => p.status === 'novo_pedido' || p.status === 'em_producao').length || 0;

      // Pedidos recentes (últimos 5)
      const recentePedidos = pedidos?.slice(0, 5) || [];

      // Top produtos (mais pedidos - simulado)
      const topProdutos = produtos?.filter(p => p.is_destaque).slice(0, 4) || [];

      setDashboardData({
        totalVendas,
        vendasMes,
        totalLeads: contacts?.length || 0,
        leadsNovos,
        totalClientes,
        clientesAtivos,
        produtosCadastrados: produtos?.length || 0,
        pedidosPendentes,
        recentePedidos,
        topProdutos
      });

      console.log('✅ Dashboard: Dados do dashboard carregados com sucesso');

    } catch (error) {
      console.error('❌ Dashboard: Erro ao carregar dados:', error);
    }
  };

  const handleLogin = () => {
    // Limpar localStorage e redirecionar para login
    localStorage.removeItem('userSession');
    localStorage.removeItem('currentUser');
    window.location.href = createPageUrl('Login');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error || !user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-gray-100 flex items-center justify-center p-4">
        <Card className="w-full max-w-md shadow-xl">
          <CardHeader className="text-center">
            <Shield className="w-12 h-12 text-blue-600 mx-auto mb-4" />
            <CardTitle className="text-2xl">Acesso ao Portal B2B</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <p className="text-center text-gray-600">
              Por favor, faça login para acessar o sistema.
            </p>
            <Button onClick={handleLogin} className="w-full h-12 bg-blue-600 hover:bg-blue-700">
              <LogIn className="w-5 h-5 mr-2" />
              Fazer Login
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const isAdmin = user.role === 'admin';

  return (
    <div className="space-y-8">
      <style>{`
        .shadow-neumorphic { box-shadow: 8px 8px 16px #d1d9e6, -8px -8px 16px #ffffff; }
        .shadow-neumorphic-inset { box-shadow: inset 5px 5px 10px #d1d9e6, inset -5px -5px 10px #ffffff; }
        .shadow-neumorphic-button { box-shadow: 5px 5px 10px #b8b9be, -5px -5px 10px #ffffff; }
        .shadow-neumorphic-button-inset { box-shadow: inset 5px 5px 10px #b8b9be, inset -5px -5px 10px #ffffff; }
      `}</style>

      {/* Cabeçalho de Boas-vindas */}
      <div className="bg-slate-100 rounded-3xl p-8 shadow-neumorphic">
        <h1 className="text-3xl font-bold text-gray-800 mb-2">
          Bem-vindo ao Portal B2B, {user.nome_empresa || user.full_name}!
        </h1>
        <p className="text-gray-600 text-lg">
          {isAdmin ? 'Painel administrativo com visão geral do negócio' : 'Sua central de compras e pedidos'}
        </p>
      </div>

      {/* KPIs Principais - Só para Admin */}
      {isAdmin && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card className="bg-slate-100 rounded-2xl shadow-neumorphic">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Vendas Totais</p>
                  <p className="text-2xl font-bold text-green-600">R$ {dashboardData.totalVendas.toLocaleString('pt-BR', {minimumFractionDigits: 2})}</p>
                </div>
                <div className="bg-green-100 p-3 rounded-full">
                  <DollarSign className="w-6 h-6 text-green-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-slate-100 rounded-2xl shadow-neumorphic">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Vendas do Mês</p>
                  <p className="text-2xl font-bold text-blue-600">R$ {dashboardData.vendasMes.toLocaleString('pt-BR', {minimumFractionDigits: 2})}</p>
                </div>
                <div className="bg-blue-100 p-3 rounded-full">
                  <TrendingUp className="w-6 h-6 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-slate-100 rounded-2xl shadow-neumorphic">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total de Leads</p>
                  <p className="text-2xl font-bold text-purple-600">{dashboardData.totalLeads}</p>
                  <p className="text-sm text-green-600">+{dashboardData.leadsNovos} novos</p>
                </div>
                <div className="bg-purple-100 p-3 rounded-full">
                  <Users className="w-6 h-6 text-purple-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-slate-100 rounded-2xl shadow-neumorphic">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Clientes</p>
                  <p className="text-2xl font-bold text-orange-600">{dashboardData.totalClientes}</p>
                  <p className="text-sm text-blue-600">{dashboardData.clientesAtivos} ativos</p>
                </div>
                <div className="bg-orange-100 p-3 rounded-full">
                  <Users className="w-6 h-6 text-orange-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Seção Principal */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Coluna Esquerda - Ações Rápidas */}
        <div className="lg:col-span-1 space-y-6">
          <Card className="bg-slate-100 rounded-2xl shadow-neumorphic">
            <CardHeader>
              <CardTitle className="text-gray-800">Ações Rápidas</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Link to={createPageUrl('Catalogo')} className="block">
                <Button className="w-full justify-start bg-slate-200 text-gray-800 font-semibold rounded-lg shadow-neumorphic-button active:shadow-neumorphic-button-inset transition-all hover:bg-slate-300">
                  <ShoppingCart className="w-5 h-5 mr-3" />
                  Ver Catálogo
                </Button>
              </Link>
              
              <Link to={createPageUrl('MeusPedidos')} className="block">
                <Button className="w-full justify-start bg-slate-200 text-gray-800 font-semibold rounded-lg shadow-neumorphic-button active:shadow-neumorphic-button-inset transition-all hover:bg-slate-300">
                  <Package className="w-5 h-5 mr-3" />
                  Meus Pedidos
                </Button>
              </Link>

              {isAdmin && (
                <>
                  <Link to={createPageUrl('CrmDashboard')} className="block">
                    <Button className="w-full justify-start bg-slate-200 text-gray-800 font-semibold rounded-lg shadow-neumorphic-button active:shadow-neumorphic-button-inset transition-all hover:bg-slate-300">
                      <TrendingUp className="w-5 h-5 mr-3" />
                      CRM & Leads
                    </Button>
                  </Link>
                  
                  <Link to={createPageUrl('Admin')} className="block">
                    <Button className="w-full justify-start bg-slate-200 text-gray-800 font-semibold rounded-lg shadow-neumorphic-button active:shadow-neumorphic-button-inset transition-all hover:bg-slate-300">
                      <Shield className="w-5 h-5 mr-3" />
                      Painel Admin
                    </Button>
                  </Link>
                </>
              )}
            </CardContent>
          </Card>

          {/* Alertas/Pendências - Só Admin */}
          {isAdmin && dashboardData.pedidosPendentes > 0 && (
            <Card className="bg-yellow-50 border-yellow-200 rounded-2xl shadow-neumorphic">
              <CardHeader>
                <CardTitle className="text-yellow-800 flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5" />
                  Atenção Requerida
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-yellow-700">
                  <strong>{dashboardData.pedidosPendentes}</strong> pedidos aguardando processamento
                </p>
                <Link to={createPageUrl('PedidosAdmin')} className="block mt-3">
                  <Button size="sm" className="bg-yellow-200 text-yellow-800 hover:bg-yellow-300">
                    Ver Pedidos
                  </Button>
                </Link>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Coluna Central e Direita */}
        <div className="lg:col-span-2 space-y-6">
          {/* Pedidos Recentes - Admin */}
          {isAdmin && (
            <Card className="bg-slate-100 rounded-2xl shadow-neumorphic">
              <CardHeader>
                <CardTitle className="text-gray-800 flex items-center gap-2">
                  <Package className="w-5 h-5" />
                  Pedidos Recentes
                </CardTitle>
              </CardHeader>
              <CardContent>
                {dashboardData.recentePedidos.length > 0 ? (
                  <div className="space-y-3">
                    {dashboardData.recentePedidos.map((pedido) => (
                      <div key={pedido.id} className="flex items-center justify-between p-3 bg-white rounded-lg shadow-neumorphic-inset">
                        <div>
                          <p className="font-semibold">#{pedido.id.slice(-6).toUpperCase()}</p>
                          <p className="text-sm text-gray-600">R$ {pedido.valor_total?.toFixed(2)}</p>
                        </div>
                        <Badge className="bg-blue-100 text-blue-800">
                          {pedido.status?.replace('_', ' ')}
                        </Badge>
                      </div>
                    ))}
                    <Link to={createPageUrl('PedidosAdmin')} className="block">
                      <Button variant="outline" className="w-full mt-4">
                        <Eye className="w-4 h-4 mr-2" />
                        Ver Todos os Pedidos
                      </Button>
                    </Link>
                  </div>
                ) : (
                  <p className="text-gray-500 text-center py-8">Nenhum pedido recente</p>
                )}
              </CardContent>
            </Card>
          )}

          {/* Produtos em Destaque */}
          {dashboardData.topProdutos.length > 0 && (
            <Card className="bg-slate-100 rounded-2xl shadow-neumorphic">
              <CardHeader>
                <CardTitle className="text-gray-800 flex items-center gap-2">
                  <Star className="w-5 h-5 text-yellow-500" />
                  Produtos em Destaque
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4">
                  {dashboardData.topProdutos.map((produto) => (
                    <div key={produto.id} className="bg-white rounded-lg p-3 shadow-neumorphic-inset">
                      <div className="aspect-square bg-gray-200 rounded mb-2 overflow-hidden">
                        {produto.fotos && produto.fotos[0] ? (
                          <img src={produto.fotos[0]} alt={produto.nome} className="w-full h-full object-cover" />
                        ) : (
                          <div className="flex items-center justify-center h-full">
                            <Package className="w-8 h-8 text-gray-400" />
                          </div>
                        )}
                      </div>
                      <p className="font-medium text-sm truncate">{produto.nome}</p>
                      <p className="text-blue-600 font-bold">R$ {produto.preco?.toFixed(2)}</p>
                    </div>
                  ))}
                </div>
                <Link to={createPageUrl('Catalogo')} className="block mt-4">
                  <Button variant="outline" className="w-full">
                    <ShoppingCart className="w-4 h-4 mr-2" />
                    Ver Catálogo Completo
                  </Button>
                </Link>
              </CardContent>
            </Card>
          )}

          {/* Informações do Perfil - Não Admin */}
          {!isAdmin && (
            <Card className="bg-slate-100 rounded-2xl shadow-neumorphic">
              <CardHeader>
                <CardTitle className="text-gray-800">Seu Perfil</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid md:grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="font-semibold text-gray-700">Empresa:</p>
                    <p className="text-gray-600">{user.nome_empresa || 'Não definido'}</p>
                  </div>
                  <div>
                    <p className="font-semibold text-gray-700">Tipo:</p>
                    <p className="text-gray-600">{user.tipo_negocio || 'Não definido'}</p>
                  </div>
                  <div>
                    <p className="font-semibold text-gray-700">Email:</p>
                    <p className="text-gray-600">{user.email}</p>
                  </div>
                  <div>
                    <p className="font-semibold text-gray-700">Localização:</p>
                    <p className="text-gray-600">{user.cidade && user.estado ? `${user.cidade}/${user.estado}` : 'Não informado'}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Resumo de Crescimento */}
      {isAdmin && (
        <Card className="bg-gradient-to-r from-blue-50 to-purple-50 border-0 rounded-2xl shadow-neumorphic">
          <CardContent className="p-8">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">Resumo do Negócio</h2>
            <div className="grid md:grid-cols-3 gap-6 text-center">
              <div>
                <p className="text-3xl font-bold text-blue-600">{dashboardData.produtosCadastrados}</p>
                <p className="text-gray-600">Produtos no Catálogo</p>
              </div>
              <div>
                <p className="text-3xl font-bold text-green-600">{dashboardData.clientesAtivos}</p>
                <p className="text-gray-600">Clientes Comprando</p>
              </div>
              <div>
                <p className="text-3xl font-bold text-purple-600">{dashboardData.leadsNovos}</p>
                <p className="text-gray-600">Leads Novos (30 dias)</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}