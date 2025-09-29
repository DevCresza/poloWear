

import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Button } from '@/components/ui/button';
import { UserCompat as User } from '@/api/entities';
import { supabase } from '@/lib/supabase';
import LogoutConfirmModal from '@/components/ui/LogoutConfirmModal';
import {
  LayoutDashboard,
  LogOut,
  ShoppingCart,
  Package,
  Building,
  Settings,
  ClipboardList,
  UserPlus,
  TrendingUp,
  Image as ImageIcon,
  Users,
  Shield,
  Briefcase
} from 'lucide-react';

export default function Layout({ children, currentPageName }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const location = useLocation();

  useEffect(() => {
    // Não verificar usuário em páginas públicas
    const publicPages = ['Home', 'Login', 'CadastroCompra'];
    const isPublicPage = publicPages.includes(currentPageName);

    if (isPublicPage) {
      setCurrentUser(null);
      return;
    }

    const checkUser = async () => {
      try {

        // 1. Verificar localStorage primeiro (rápido)
        const savedSession = localStorage.getItem('userSession');
        if (savedSession) {
          const session = JSON.parse(savedSession);
          const sessionAge = Date.now() - session.loginTime;

          if (session.isLoggedIn && sessionAge < 3600000) { // 1 hora
            setCurrentUser(session.user);
            return;
          }
        }

        // 2. Se não houver localStorage, verificar Supabase
        const user = await User.me();
        if (user) {
          setCurrentUser(user);

          // Salvar no localStorage
          localStorage.setItem('userSession', JSON.stringify({
            user,
            loginTime: Date.now(),
            isLoggedIn: true
          }));
        } else {
          setCurrentUser(null);
          localStorage.removeItem('userSession');
          localStorage.removeItem('currentUser');
        }
      } catch (error) {
        setCurrentUser(null);
        localStorage.removeItem('userSession');
        localStorage.removeItem('currentUser');
      }
    };

    // Verificar usuário inicial apenas se não for página pública
    checkUser();

    // Listener para mudanças de autenticação
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (event === 'SIGNED_IN' && session) {
          // Usuário logou
          await checkUser();
        } else if (event === 'SIGNED_OUT') {
          // Usuário deslogou
          setCurrentUser(null);
        }
      }
    );

    return () => {
      subscription?.unsubscribe();
    };
  }, [location.pathname]);

  const handleLogout = () => {
    setShowLogoutModal(true);
  };

  const confirmLogout = async () => {
    try {
      // Limpar localStorage
      localStorage.removeItem('userSession');
      localStorage.removeItem('currentUser');

      // Logout do Supabase
      await User.logout();

      // Redirecionar para a página inicial
      window.location.href = createPageUrl('Home');
    } catch (error) {
      // Mesmo se der erro no Supabase, limpar localStorage
      localStorage.removeItem('userSession');
      localStorage.removeItem('currentUser');
      window.location.href = createPageUrl('Home');
    } finally {
      setShowLogoutModal(false);
    }
  };

  const portalPages = [
    'PortalDashboard', 'UserManagement', 'Catalogo', 'MeusPedidos',
    'PedidosAdmin', 'Admin', 'GestaoProdutos', 'GestaoFornecedores',
    'CrmDashboard', 'GestaoClientes', 'GestaoCapsulas', 'GestaoEstoque',
    'Carrinho', 'PedidosFornecedor'
  ];

  // Páginas que não precisam de autenticação
  const publicPages = ['Home', 'Login', 'CadastroCompra'];
  const isPortalPage = portalPages.includes(currentPageName);
  const isPublicPage = publicPages.includes(currentPageName);

  // Se for página pública, não verificar autenticação
  if (isPublicPage) {
    return <main className="bg-slate-100">{children}</main>;
  }

  // Se for página do portal, verificar autenticação
  if (!isPortalPage || !currentUser) {
    return <main className="bg-slate-100">{children}</main>;
  }

  // Verificar se currentUser tem as propriedades necessárias
  if (!currentUser.full_name || !currentUser.role) {
    return <main className="bg-slate-100">Carregando...</main>;
  }

  const isAdmin = currentUser.role === 'admin';
  const isFornecedor = currentUser.tipo_negocio === 'fornecedor';
  const isCliente = currentUser.tipo_negocio === 'multimarca';

  const navLinkClasses = "flex items-center gap-3 px-4 py-2 text-gray-700 rounded-lg transition-all";
  const navLinkHoverClasses = "hover:shadow-[inset_4px_4px_8px_#d1d9e6,inset_-4px_-4px_8px_#ffffff]";
  const navLinkActiveClasses = "bg-blue-50 text-blue-600 shadow-[inset_4px_4px_8px_#d1d9e6,inset_-4px_-4px_8px_#ffffff]";
  const sectionTitleClasses = "px-4 pt-4 pb-2 text-xs font-semibold text-gray-400 uppercase";

  const isActivePage = (pageName) => currentPageName === pageName;
  const getLinkClasses = (pageName) => {
    const baseClasses = `${navLinkClasses} ${navLinkHoverClasses}`;
    return isActivePage(pageName) ? `${baseClasses} ${navLinkActiveClasses}` : baseClasses;
  };

  return (
    <div className="min-h-screen bg-slate-100 flex">
      <style>{`
        .shadow-neumorphic { box-shadow: 8px 8px 16px #d1d9e6, -8px -8px 16px #ffffff; }
        .shadow-neumorphic-inset { box-shadow: inset 5px 5px 10px #d1d9e6, inset -5px -5px 10px #ffffff; }
        .shadow-neumorphic-button { box-shadow: 5px 5px 10px #b8b9be, -5px -5px 10px #ffffff; }
        .shadow-neumorphic-button-inset { box-shadow: inset 5px 5px 10px #b8b9be, inset -5px -5px 10px #ffffff; }
      `}</style>

      <aside className="w-64 bg-slate-100 flex flex-col p-4">
        <div className="h-16 flex items-center justify-center font-bold text-2xl text-blue-600">
          POLO B2B
        </div>
        <nav className="flex-1 mt-6 space-y-1">
          {/* Link Comum */}
          <Link to={createPageUrl('PortalDashboard')} className={getLinkClasses('PortalDashboard')}>
            <LayoutDashboard className="w-5 h-5" />
            <span>Dashboard</span>
          </Link>
          
          {/* Links do Cliente */}
          {(isCliente || isAdmin) && (
            <div>
              {isAdmin && <p className={sectionTitleClasses}>Área do Cliente</p>}
              <Link to={createPageUrl('Catalogo')} className={getLinkClasses('Catalogo')}>
                <ShoppingCart className="w-5 h-5" />
                <span>Catálogo</span>
              </Link>
              <Link to={createPageUrl('Carrinho')} className={getLinkClasses('Carrinho')}>
                <ShoppingCart className="w-5 h-5" />
                <span>Carrinho</span>
              </Link>
              <Link to={createPageUrl('MeusPedidos')} className={getLinkClasses('MeusPedidos')}>
                <Package className="w-5 h-5" />
                <span>Meus Pedidos</span>
              </Link>
            </div>
          )}

          {/* Links do Fornecedor */}
          {(isFornecedor || isAdmin) && (
            <div>
              <p className={isAdmin ? sectionTitleClasses : "sr-only"}>Área do Fornecedor</p>
              <Link to={createPageUrl('GestaoProdutos')} className={getLinkClasses('GestaoProdutos')}>
                <ClipboardList className="w-5 h-5" />
                <span>{isAdmin ? 'Todos Produtos' : 'Meus Produtos'}</span>
              </Link>
              <Link to={createPageUrl('GestaoEstoque')} className={getLinkClasses('GestaoEstoque')}>
                <Package className="w-5 h-5" />
                <span>Gestão de Estoque</span>
              </Link>
              <Link to={createPageUrl('GestaoCapsulas')} className={getLinkClasses('GestaoCapsulas')}>
                <ImageIcon className="w-5 h-5" />
                <span>Cápsulas</span>
              </Link>
              <Link to={createPageUrl('PedidosFornecedor')} className={getLinkClasses('PedidosFornecedor')}>
                <Package className="w-5 h-5" />
                <span>{isAdmin ? 'Pedidos Fornecedores' : 'Meus Pedidos'}</span>
              </Link>
            </div>
          )}
          
          {/* Links de Administração */}
          {isAdmin && (
            <div>
              <p className={sectionTitleClasses}>Administração</p>
              <Link to={createPageUrl('Admin')} className={getLinkClasses('Admin')}>
                <Shield className="w-5 h-5" />
                <span>Painel Admin</span>
              </Link>
              <Link to={createPageUrl('UserManagement')} className={getLinkClasses('UserManagement')}>
                <Users className="w-5 h-5" />
                <span>Gestão de Usuários</span>
              </Link>
              <Link to={createPageUrl('CrmDashboard')} className={getLinkClasses('CrmDashboard')}>
                <TrendingUp className="w-5 h-5" />
                <span>CRM & Leads</span>
              </Link>
              <Link to={createPageUrl('GestaoClientes')} className={getLinkClasses('GestaoClientes')}>
                <UserPlus className="w-5 h-5" />
                <span>Clientes</span>
              </Link>
              <Link to={createPageUrl('GestaoFornecedores')} className={getLinkClasses('GestaoFornecedores')}>
                <Building className="w-5 h-5" />
                <span>Fornecedores</span>
              </Link>
              <Link to={createPageUrl('PedidosAdmin')} className={getLinkClasses('PedidosAdmin')}>
                <Package className="w-5 h-5" />
                <span>Todos Pedidos</span>
              </Link>
            </div>
          )}
        </nav>
        <div className="p-4">
          <Button onClick={handleLogout} variant="ghost" className="w-full justify-start text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg shadow-neumorphic-button active:shadow-neumorphic-button-inset transition-all">
            <LogOut className="w-5 h-5 mr-3" />
            Sair
          </Button>
        </div>
      </aside>

      <div className="flex-1 flex flex-col">
        <header className="h-20 bg-slate-100 flex items-center justify-between px-8">
           <div>
              <h1 className="text-2xl font-bold text-gray-800">{currentPageName?.replace(/([A-Z])/g, ' $1').trim() || 'Dashboard'}</h1>
           </div>
           <div className="flex items-center gap-4">
              <span className="text-sm font-semibold text-gray-600">Olá, {currentUser?.full_name || 'Usuário'}</span>
              <div className="w-12 h-12 rounded-full bg-slate-100 text-blue-600 flex items-center justify-center font-bold text-lg shadow-neumorphic">
                {currentUser?.full_name?.charAt(0) || 'U'}
              </div>
           </div>
        </header>
        <main className="flex-1 p-6 overflow-y-auto">
          {children}
        </main>
      </div>

      <LogoutConfirmModal
        open={showLogoutModal}
        onClose={() => setShowLogoutModal(false)}
        onConfirm={confirmLogout}
      />
    </div>
  );
}

