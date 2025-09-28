-- POLO B2B - Schema do Banco de Dados
-- Sistema B2B de E-commerce para Multimarcas
-- Gerado com base na análise da aplicação React

-- ============================================================================
-- TABELAS DE USUÁRIOS E AUTENTICAÇÃO
-- ============================================================================

-- Tabela de usuários principal
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    full_name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(50) NOT NULL CHECK (role IN ('admin', 'fornecedor', 'multimarca')),
    tipo_negocio VARCHAR(50) NOT NULL CHECK (tipo_negocio IN ('admin', 'fornecedor', 'multimarca')),
    telefone VARCHAR(20),
    ativo BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_login TIMESTAMP,

    -- Campos específicos para administradores
    permissoes JSONB DEFAULT '{}',
    observacoes TEXT,

    -- Campos específicos para multimarcas
    empresa VARCHAR(255),
    cnpj VARCHAR(18),
    cidade VARCHAR(100),
    estado VARCHAR(2),
    endereco_completo TEXT,
    cep VARCHAR(9),
    tem_loja_fisica VARCHAR(20),
    faixa_faturamento VARCHAR(50),
    limite_credito DECIMAL(10,2) DEFAULT 0,

    -- Campos específicos para fornecedores
    razao_social VARCHAR(255),
    nome_marca VARCHAR(100),

    CONSTRAINT valid_email CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$')
);

-- Tabela para usuários pendentes de aprovação
CREATE TABLE pending_users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    full_name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL,
    telefone VARCHAR(20),
    empresa VARCHAR(255),
    cnpj VARCHAR(18),
    cidade VARCHAR(100),
    estado VARCHAR(2),
    endereco_completo TEXT,
    cep VARCHAR(9),
    tem_loja_fisica VARCHAR(20),
    faixa_faturamento VARCHAR(50),
    tipo_solicitado VARCHAR(50) NOT NULL CHECK (tipo_solicitado IN ('multimarca', 'fornecedor')),
    status VARCHAR(50) DEFAULT 'pendente' CHECK (status IN ('pendente', 'aprovado', 'rejeitado')),
    observacoes TEXT,
    contact_id UUID,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    approved_by UUID REFERENCES users(id),
    approved_at TIMESTAMP,

    FOREIGN KEY (contact_id) REFERENCES contacts(id)
);

-- ============================================================================
-- TABELAS DE FORNECEDORES
-- ============================================================================

CREATE TABLE fornecedores (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nome_marca VARCHAR(100) NOT NULL CHECK (nome_marca IN ('Polo Wear', 'MX', 'Guirro', 'MGM')),
    razao_social VARCHAR(255) NOT NULL,
    cnpj VARCHAR(18),
    responsavel_user_id UUID NOT NULL REFERENCES users(id),
    pedido_minimo_valor DECIMAL(10,2) DEFAULT 0,

    -- Acesso do fornecedor ao sistema
    email_fornecedor VARCHAR(255),
    senha_fornecedor VARCHAR(255),
    ativo_fornecedor BOOLEAN DEFAULT true,

    -- Contatos
    contato_envio_nome VARCHAR(255),
    contato_envio_email VARCHAR(255),
    contato_envio_telefone VARCHAR(20),
    contato_financeiro_nome VARCHAR(255),
    contato_financeiro_email VARCHAR(255),
    contato_financeiro_telefone VARCHAR(20),

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT valid_fornecedor_email CHECK (email_fornecedor IS NULL OR email_fornecedor ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$')
);

-- ============================================================================
-- TABELAS DE PRODUTOS
-- ============================================================================

CREATE TABLE produtos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nome VARCHAR(255) NOT NULL,
    descricao TEXT,
    marca VARCHAR(100) NOT NULL CHECK (marca IN ('Polo Wear', 'MX', 'Guirro', 'MGM')),
    categoria VARCHAR(100),
    fornecedor_id UUID NOT NULL REFERENCES fornecedores(id),

    -- Tipo de venda
    tipo_venda VARCHAR(20) DEFAULT 'grade' CHECK (tipo_venda IN ('grade', 'avulso')),

    -- Configuração da grade
    grade_configuracao JSONB DEFAULT '{"tamanhos_disponiveis": [], "quantidades_por_tamanho": {}}',

    -- Preços
    preco_por_peca DECIMAL(8,2) NOT NULL,
    custo_por_peca DECIMAL(8,2) DEFAULT 0,
    margem_lucro DECIMAL(5,2) DEFAULT 0,
    total_pecas_grade INTEGER DEFAULT 0,
    preco_grade_completa DECIMAL(10,2) DEFAULT 0,

    -- Estoque
    pedido_minimo_grades INTEGER DEFAULT 1,
    estoque_atual_grades INTEGER DEFAULT 0,
    estoque_minimo_grades INTEGER DEFAULT 5,
    controla_estoque BOOLEAN DEFAULT true,
    permite_venda_sem_estoque BOOLEAN DEFAULT false,

    -- Mídia e características
    fotos JSONB DEFAULT '[]',
    cores_disponiveis JSONB DEFAULT '[]',

    -- Configurações
    temporada VARCHAR(50) DEFAULT 'Atemporal' CHECK (temporada IN ('Verão', 'Inverno', 'Outono', 'Primavera', 'Atemporal')),
    is_destaque BOOLEAN DEFAULT false,
    ativo BOOLEAN DEFAULT true,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT positive_prices CHECK (preco_por_peca > 0 AND custo_por_peca >= 0),
    CONSTRAINT positive_stock CHECK (estoque_atual_grades >= 0 AND estoque_minimo_grades >= 0)
);

-- Índices para produtos
CREATE INDEX idx_produtos_fornecedor ON produtos(fornecedor_id);
CREATE INDEX idx_produtos_marca ON produtos(marca);
CREATE INDEX idx_produtos_categoria ON produtos(categoria);
CREATE INDEX idx_produtos_ativo ON produtos(ativo);
CREATE INDEX idx_produtos_destaque ON produtos(is_destaque);

-- ============================================================================
-- TABELAS DE CÁPSULAS
-- ============================================================================

CREATE TABLE capsulas (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nome VARCHAR(255) NOT NULL,
    descricao TEXT,
    imagem_capa_url TEXT,
    produto_ids JSONB DEFAULT '[]',
    ativa BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================================
-- TABELAS DE PEDIDOS
-- ============================================================================

CREATE TABLE pedidos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    comprador_user_id UUID NOT NULL REFERENCES users(id),
    fornecedor_id UUID NOT NULL REFERENCES fornecedores(id),

    -- Status do pedido
    status VARCHAR(50) DEFAULT 'novo_pedido' CHECK (status IN ('novo_pedido', 'em_producao', 'faturado', 'em_transporte', 'finalizado', 'cancelado')),
    status_pagamento VARCHAR(50) DEFAULT 'pendente' CHECK (status_pagamento IN ('pendente', 'pago', 'atrasado', 'cancelado')),

    -- Valores
    valor_total DECIMAL(12,2) NOT NULL,
    desconto DECIMAL(10,2) DEFAULT 0,
    valor_frete DECIMAL(8,2) DEFAULT 0,
    valor_final DECIMAL(12,2) NOT NULL,

    -- Itens do pedido (desnormalizado para performance)
    itens JSONB NOT NULL DEFAULT '[]',

    -- Informações de entrega
    endereco_entrega JSONB,
    data_prevista_entrega DATE,
    data_entrega_real DATE,

    -- Logística
    transportadora VARCHAR(100),
    codigo_rastreio VARCHAR(100),
    nota_fiscal VARCHAR(50),

    -- Observações
    observacoes TEXT,
    observacoes_internas TEXT,

    -- Datas
    created_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT positive_values CHECK (valor_total >= 0 AND valor_final >= 0)
);

-- Índices para pedidos
CREATE INDEX idx_pedidos_comprador ON pedidos(comprador_user_id);
CREATE INDEX idx_pedidos_fornecedor ON pedidos(fornecedor_id);
CREATE INDEX idx_pedidos_status ON pedidos(status);
CREATE INDEX idx_pedidos_status_pagamento ON pedidos(status_pagamento);
CREATE INDEX idx_pedidos_data ON pedidos(created_date);

-- ============================================================================
-- TABELAS DE ESTOQUE
-- ============================================================================

CREATE TABLE movimentacoes_estoque (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    produto_id UUID NOT NULL REFERENCES produtos(id),
    tipo VARCHAR(20) NOT NULL CHECK (tipo IN ('entrada', 'saida', 'ajuste', 'inventario')),
    quantidade_grades INTEGER NOT NULL,
    quantidade_anterior INTEGER NOT NULL,
    quantidade_atual INTEGER NOT NULL,
    motivo VARCHAR(100),
    observacoes TEXT,
    pedido_id UUID REFERENCES pedidos(id),
    user_id UUID NOT NULL REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Índices para movimentações de estoque
CREATE INDEX idx_movimentacoes_produto ON movimentacoes_estoque(produto_id);
CREATE INDEX idx_movimentacoes_tipo ON movimentacoes_estoque(tipo);
CREATE INDEX idx_movimentacoes_data ON movimentacoes_estoque(created_at);

-- ============================================================================
-- TABELAS DE CRM
-- ============================================================================

CREATE TABLE contacts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nome VARCHAR(255) NOT NULL,
    email VARCHAR(255),
    telefone VARCHAR(20),
    empresa VARCHAR(255),
    cidade VARCHAR(100),
    estado VARCHAR(2),

    -- Status do lead
    status VARCHAR(50) DEFAULT 'novo' CHECK (status IN ('novo', 'em_contato', 'negociacao', 'convertido', 'cancelado')),

    -- Dados comerciais
    tem_loja_fisica VARCHAR(20),
    faixa_faturamento VARCHAR(50),

    -- Informações de origem
    fonte_lead VARCHAR(100),

    -- Observações
    observacoes TEXT,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT valid_contact_email CHECK (email IS NULL OR email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$')
);

-- Índices para contatos
CREATE INDEX idx_contacts_status ON contacts(status);
CREATE INDEX idx_contacts_fonte ON contacts(fonte_lead);
CREATE INDEX idx_contacts_email ON contacts(email);
CREATE INDEX idx_contacts_empresa ON contacts(empresa);

-- Tabela para templates de WhatsApp
CREATE TABLE whatsapp_templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nome VARCHAR(255) NOT NULL,
    assunto VARCHAR(255),
    mensagem TEXT NOT NULL,
    ativo BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================================
-- TABELAS DE RECURSOS E CONFIGURAÇÕES
-- ============================================================================

CREATE TABLE recursos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nome VARCHAR(255) NOT NULL,
    descricao TEXT,
    tipo VARCHAR(50) NOT NULL CHECK (tipo IN ('funcionalidade', 'integracao', 'relatorio', 'configuracao')),
    ativo BOOLEAN DEFAULT true,
    configuracao JSONB DEFAULT '{}',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================================
-- TABELAS DE CARRINHO DE COMPRAS
-- ============================================================================

CREATE TABLE carrinho_itens (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id),
    produto_id UUID NOT NULL REFERENCES produtos(id),
    quantidade_grades INTEGER NOT NULL DEFAULT 1,
    preco_unitario DECIMAL(8,2) NOT NULL,
    observacoes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT positive_quantity CHECK (quantidade_grades > 0),
    CONSTRAINT positive_price CHECK (preco_unitario > 0),
    UNIQUE(user_id, produto_id)
);

-- Índices para carrinho
CREATE INDEX idx_carrinho_user ON carrinho_itens(user_id);
CREATE INDEX idx_carrinho_produto ON carrinho_itens(produto_id);

-- ============================================================================
-- TRIGGERS PARA ATUALIZAÇÃO AUTOMÁTICA
-- ============================================================================

-- Função para atualizar timestamp automaticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers para updated_at
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_fornecedores_updated_at BEFORE UPDATE ON fornecedores FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_produtos_updated_at BEFORE UPDATE ON produtos FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_capsulas_updated_at BEFORE UPDATE ON capsulas FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_pedidos_updated_at BEFORE UPDATE ON pedidos FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_contacts_updated_at BEFORE UPDATE ON contacts FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_recursos_updated_at BEFORE UPDATE ON recursos FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_carrinho_updated_at BEFORE UPDATE ON carrinho_itens FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_whatsapp_templates_updated_at BEFORE UPDATE ON whatsapp_templates FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- VIEWS ÚTEIS
-- ============================================================================

-- View para pedidos com informações completas
CREATE VIEW vw_pedidos_completos AS
SELECT
    p.*,
    u.full_name as comprador_nome,
    u.email as comprador_email,
    u.empresa as comprador_empresa,
    f.nome_marca as fornecedor_marca,
    f.razao_social as fornecedor_razao_social
FROM pedidos p
JOIN users u ON p.comprador_user_id = u.id
JOIN fornecedores f ON p.fornecedor_id = f.id;

-- View para produtos com estoque baixo
CREATE VIEW vw_produtos_estoque_baixo AS
SELECT
    p.*,
    f.nome_marca as fornecedor_marca
FROM produtos p
JOIN fornecedores f ON p.fornecedor_id = f.id
WHERE p.controla_estoque = true
AND p.estoque_atual_grades <= p.estoque_minimo_grades
AND p.ativo = true;

-- View para relatório de vendas por fornecedor
CREATE VIEW vw_vendas_por_fornecedor AS
SELECT
    f.id as fornecedor_id,
    f.nome_marca,
    f.razao_social,
    COUNT(p.id) as total_pedidos,
    SUM(p.valor_final) as total_vendas,
    AVG(p.valor_final) as ticket_medio
FROM fornecedores f
LEFT JOIN pedidos p ON f.id = p.fornecedor_id
    AND p.status NOT IN ('cancelado')
GROUP BY f.id, f.nome_marca, f.razao_social;

-- ============================================================================
-- DADOS INICIAIS DE EXEMPLO
-- ============================================================================

-- Inserir usuário administrador padrão
INSERT INTO users (
    full_name,
    email,
    password_hash,
    role,
    tipo_negocio,
    telefone,
    permissoes
) VALUES (
    'Administrador POLO',
    'admin@polo-b2b.com',
    '$2a$10$example_hash_here', -- Hash da senha "admin123"
    'admin',
    'admin',
    '(11) 99999-9999',
    '{
        "ver_dashboard": true,
        "ver_catalogo": true,
        "ver_capsulas": true,
        "fazer_pedidos": true,
        "ver_meus_pedidos": true,
        "ver_todos_pedidos": true,
        "gerenciar_pedidos": true,
        "cadastrar_produtos": true,
        "editar_produtos": true,
        "gerenciar_usuarios": true,
        "ver_crm": true,
        "gerenciar_fornecedores": true,
        "ver_relatorios": true,
        "ver_precos_custo": true,
        "exportar_dados": true
    }'::jsonb
);

-- Inserir fornecedores padrão
INSERT INTO fornecedores (
    nome_marca,
    razao_social,
    cnpj,
    responsavel_user_id,
    pedido_minimo_valor,
    email_fornecedor,
    ativo_fornecedor
) VALUES
(
    'Polo Wear',
    'POLO WEAR COMERCIO DE ROUPAS LTDA',
    '12.345.678/0001-90',
    (SELECT id FROM users WHERE email = 'admin@polo-b2b.com'),
    500.00,
    'fornecedor@polowear.com.br',
    true
);

-- Inserir categorias e templates básicos
INSERT INTO whatsapp_templates (nome, assunto, mensagem) VALUES
(
    'Boas-vindas Multimarca',
    'Bem-vindo à POLO B2B',
    'Olá! Seja bem-vindo(a) à nossa plataforma B2B. Agora você tem acesso ao nosso catálogo completo e pode fazer seus pedidos online. Qualquer dúvida, estamos à disposição!'
),
(
    'Confirmação de Pedido',
    'Pedido Confirmado',
    'Seu pedido foi confirmado e já está em produção. Você receberá atualizações sobre o status por WhatsApp. Obrigado pela preferência!'
);

-- ============================================================================
-- COMENTÁRIOS E DOCUMENTAÇÃO
-- ============================================================================

COMMENT ON TABLE users IS 'Tabela principal de usuários do sistema (admin, fornecedor, multimarca)';
COMMENT ON TABLE fornecedores IS 'Cadastro de fornecedores das marcas';
COMMENT ON TABLE produtos IS 'Catálogo de produtos com sistema de grades';
COMMENT ON TABLE pedidos IS 'Pedidos de compra dos multimarcas';
COMMENT ON TABLE contacts IS 'CRM - Leads e contatos comerciais';
COMMENT ON TABLE carrinho_itens IS 'Itens no carrinho de compras dos usuários';
COMMENT ON TABLE movimentacoes_estoque IS 'Histórico de movimentações de estoque';
COMMENT ON TABLE capsulas IS 'Coleções temáticas de produtos';

COMMENT ON COLUMN produtos.grade_configuracao IS 'JSON com tamanhos disponíveis e quantidades por tamanho';
COMMENT ON COLUMN produtos.tipo_venda IS 'Tipo de venda: grade (completa) ou avulso (peças individuais)';
COMMENT ON COLUMN pedidos.itens IS 'JSON com detalhes dos itens do pedido';
COMMENT ON COLUMN users.permissoes IS 'JSON com permissões específicas do usuário';

-- ============================================================================
-- ÍNDICES ADICIONAIS PARA PERFORMANCE
-- ============================================================================

CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_users_active ON users(ativo);
CREATE INDEX idx_users_email_lower ON users(lower(email));
CREATE INDEX idx_produtos_preco ON produtos(preco_por_peca);
CREATE INDEX idx_pedidos_valor ON pedidos(valor_final);
CREATE INDEX idx_contacts_created ON contacts(created_at);

-- Índice composto para busca de produtos
CREATE INDEX idx_produtos_busca ON produtos(ativo, marca, categoria);

-- Índice para performance de relatórios
CREATE INDEX idx_pedidos_relatorio ON pedidos(created_date, status, fornecedor_id);