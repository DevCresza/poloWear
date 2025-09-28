# POLO B2B Platform

Uma plataforma B2B de moda e confecções construída com React + Vite, conectando fornecedores, multimarcas e administradores em um ecossistema completo de e-commerce.

## 🚀 Tecnologias

- **Frontend**: React 18 + Vite
- **Styling**: Tailwind CSS + shadcn/ui components
- **Backend**: Supabase (PostgreSQL + Auth + Storage)
- **Routing**: React Router DOM v7
- **Forms**: React Hook Form + Zod validation
- **UI Components**: Radix UI primitives

## 📋 Pré-requisitos

- Node.js 18+
- npm ou yarn
- Conta no Supabase

## ⚙️ Configuração

### 1. Clone o repositório

```bash
git clone https://github.com/DevCresza/poloWear.git
cd poloWear
```

### 2. Instale as dependências

```bash
npm install
```

### 3. Configure as variáveis de ambiente

```bash
# Copie o arquivo de exemplo
cp .env.example .env

# Edite o arquivo .env com suas credenciais do Supabase
```

**Configuração do Supabase:**

1. Acesse [supabase.com](https://supabase.com/dashboard)
2. Crie um novo projeto ou acesse um existente
3. Vá em **Settings > API**
4. Copie a **Project URL** e **anon public key**
5. Cole no arquivo `.env`:

```env
VITE_SUPABASE_URL=https://seu-projeto-id.supabase.co
VITE_SUPABASE_ANON_KEY=sua-chave-anonima-aqui
```

### 4. Configure o banco de dados

Execute o schema SQL fornecido no arquivo `database_schema.sql` no editor SQL do Supabase.

## 🏃 Executando o projeto

### Desenvolvimento

```bash
npm run dev
```

Acesse: http://localhost:5173

### Build para produção

```bash
npm run build
npm run preview
```

### Linting

```bash
npm run lint
```

## 👥 Usuários e Roles

A plataforma possui 3 tipos de usuários:

- **Admin**: Gestão completa da plataforma
- **Fornecedor**: Gestão de produtos e pedidos próprios
- **Multimarca**: Navegação do catálogo e gestão de pedidos

## 🔧 Funcionalidades Principais

- ✅ Sistema de autenticação completo
- ✅ Gestão de usuários multi-role
- ✅ Catálogo de produtos com grades e variações
- ✅ Sistema de pedidos e carrinho
- ✅ CRM para gestão de leads
- ✅ Dashboard com métricas
- ✅ Gestão de estoque
- ✅ Sistema de cápsulas (coleções)
- ✅ Interface responsiva e moderna

## 📱 Estrutura do Projeto

```
src/
├── api/           # Integrações com Supabase
├── components/    # Componentes reutilizáveis
│   ├── ui/        # Componentes base (shadcn/ui)
│   ├── admin/     # Componentes administrativos
│   ├── crm/       # Componentes do CRM
│   └── pedidos/   # Componentes de pedidos
├── hooks/         # Custom hooks
├── lib/           # Utilitários e configurações
├── pages/         # Páginas da aplicação
└── services/      # Serviços e APIs
```

## 🤝 Contribuição

1. Fork o projeto
2. Crie uma branch para sua feature (`git checkout -b feature/AmazingFeature`)
3. Commit suas mudanças (`git commit -m 'Add some AmazingFeature'`)
4. Push para a branch (`git push origin feature/AmazingFeature`)
5. Abra um Pull Request

## 📄 Licença

Este projeto está sob a licença MIT. Veja o arquivo `LICENSE` para mais detalhes.

---

**POLO B2B** - Conectando o futuro da moda B2B 🚀