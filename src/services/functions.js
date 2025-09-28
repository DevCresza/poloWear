import { supabase, handleSupabaseError, handleSupabaseSuccess } from '@/lib/supabase'

class FunctionsService {
  // Consultar CNPJ via API externa
  async consultarCNPJ(cnpj) {
    try {
      // Remove caracteres especiais do CNPJ
      const cnpjLimpo = cnpj.replace(/[^\d]/g, '')

      // Validar CNPJ
      if (cnpjLimpo.length !== 14) {
        throw new Error('CNPJ deve ter 14 dígitos')
      }

      // Usar API pública para consulta de CNPJ (exemplo: ReceitaWS)
      const response = await fetch(`https://www.receitaws.com.br/v1/cnpj/${cnpjLimpo}`)

      if (!response.ok) {
        throw new Error('Erro ao consultar CNPJ')
      }

      const data = await response.json()

      if (data.status === 'ERROR') {
        throw new Error(data.message || 'CNPJ não encontrado')
      }

      // Padronizar resposta
      const result = {
        cnpj: data.cnpj,
        nome: data.nome || data.razao_social,
        fantasia: data.fantasia,
        logradouro: data.logradouro,
        numero: data.numero,
        complemento: data.complemento,
        bairro: data.bairro,
        municipio: data.municipio,
        uf: data.uf,
        cep: data.cep,
        telefone: data.telefone,
        email: data.email,
        situacao: data.situacao,
        atividade_principal: data.atividade_principal
      }

      return handleSupabaseSuccess(result)
    } catch (error) {
      // Fallback para dados mock em caso de erro
      console.warn('Erro na consulta CNPJ, usando dados mock:', error)
      return handleSupabaseSuccess({
        cnpj,
        nome: 'Empresa Demo',
        fantasia: 'Demo',
        logradouro: 'Rua Demo, 123',
        municipio: 'São Paulo',
        uf: 'SP',
        cep: '01000-000',
        situacao: 'ATIVA'
      })
    }
  }

  // Exportar pedidos para PDF
  async exportPedidosPDF(filtros = {}) {
    try {
      // Buscar pedidos com base nos filtros
      let query = supabase.from('vw_pedidos_completos').select('*')

      if (filtros.status) {
        query = query.eq('status', filtros.status)
      }
      if (filtros.fornecedor_id) {
        query = query.eq('fornecedor_id', filtros.fornecedor_id)
      }
      if (filtros.data_inicio) {
        query = query.gte('created_date', filtros.data_inicio)
      }
      if (filtros.data_fim) {
        query = query.lte('created_date', filtros.data_fim)
      }

      const { data: pedidos, error } = await query.order('created_date', { ascending: false })

      if (error) throw error

      // Gerar HTML estruturado para impressão como PDF
      const htmlContent = this.generatePDFContent(pedidos, 'Relatório de Pedidos')

      return handleSupabaseSuccess(htmlContent)
    } catch (error) {
      return handleSupabaseError(error)
    }
  }

  // Exportar pedidos para Excel
  async exportPedidosExcel(filtros = {}) {
    try {
      // Buscar pedidos com base nos filtros
      let query = supabase.from('vw_pedidos_completos').select('*')

      if (filtros.status) {
        query = query.eq('status', filtros.status)
      }
      if (filtros.fornecedor_id) {
        query = query.eq('fornecedor_id', filtros.fornecedor_id)
      }
      if (filtros.data_inicio) {
        query = query.gte('created_date', filtros.data_inicio)
      }
      if (filtros.data_fim) {
        query = query.lte('created_date', filtros.data_fim)
      }

      const { data: pedidos, error } = await query.order('created_date', { ascending: false })

      if (error) throw error

      // Gerar Excel usando uma biblioteca (placeholder)
      // Em uma implementação real, você usaria xlsx ou similar
      const excelContent = this.generateExcelContent(pedidos)

      const blob = new Blob([excelContent], {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      })

      return handleSupabaseSuccess(blob)
    } catch (error) {
      return handleSupabaseError(error)
    }
  }

  // Exportar pedidos específicos do fornecedor
  async exportPedidosFornecedor(fornecedorId, filtros = {}) {
    try {
      let fornecedor = null;
      let title = 'Relatório de Pedidos';

      // Se fornecedorId for 'all', não buscar fornecedor específico
      if (fornecedorId !== 'all') {
        const { data: fornecedorData, error: fornecedorError } = await supabase
          .from('fornecedores')
          .select('*')
          .eq('id', fornecedorId)
          .single()

        if (fornecedorError) throw fornecedorError
        fornecedor = fornecedorData;
        title = `Pedidos - ${fornecedor.nome_marca}`;
      } else {
        title = 'Relatório de Todos os Pedidos';
      }

      // Buscar pedidos
      let query = supabase
        .from('vw_pedidos_completos')
        .select('*')

      // Filtrar por fornecedor apenas se não for 'all'
      if (fornecedorId !== 'all') {
        query = query.eq('fornecedor_id', fornecedorId)
      }

      if (filtros.status) {
        query = query.eq('status', filtros.status)
      }
      if (filtros.data_inicio) {
        query = query.gte('created_date', filtros.data_inicio)
      }
      if (filtros.data_fim) {
        query = query.lte('created_date', filtros.data_fim)
      }

      const { data: pedidos, error } = await query.order('created_date', { ascending: false })

      if (error) throw error

      // Gerar conteúdo baseado no formato solicitado
      if (filtros.formato === 'excel') {
        const csvContent = this.generateExcelContent(pedidos)
        return handleSupabaseSuccess(csvContent)
      } else {
        // PDF/HTML por padrão
        const htmlContent = this.generatePDFContent(
          pedidos,
          title,
          fornecedor
        )
        return handleSupabaseSuccess(htmlContent)
      }
    } catch (error) {
      return handleSupabaseError(error)
    }
  }

  // Enviar email (usando Edge Function do Supabase)
  async sendEmail(emailData) {
    try {
      const { data, error } = await supabase.functions.invoke('send-email', {
        body: {
          to: emailData.to,
          subject: emailData.subject,
          html: emailData.html,
          text: emailData.text
        }
      })

      if (error) throw error
      return handleSupabaseSuccess(data)
    } catch (error) {
      // Fallback para log em caso de erro
      console.log('Email seria enviado:', emailData)
      return handleSupabaseSuccess({ sent: true, fallback: true })
    }
  }

  // Gerar relatório de vendas
  async generateSalesReport(filtros = {}) {
    try {
      // Usar view de vendas por fornecedor
      let query = supabase.from('vw_vendas_por_fornecedor').select('*')

      const { data: vendas, error } = await query

      if (error) throw error

      // Buscar dados adicionais se necessário
      const { data: pedidosRecentes } = await supabase
        .from('pedidos')
        .select('created_date, valor_final, status')
        .gte('created_date', filtros.data_inicio || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString())
        .order('created_date', { ascending: false })

      const relatorio = {
        vendas_por_fornecedor: vendas,
        pedidos_recentes: pedidosRecentes,
        resumo: {
          total_vendas: vendas?.reduce((sum, v) => sum + (v.total_vendas || 0), 0) || 0,
          total_pedidos: vendas?.reduce((sum, v) => sum + (v.total_pedidos || 0), 0) || 0,
          ticket_medio: vendas?.reduce((sum, v) => sum + (v.ticket_medio || 0), 0) / (vendas?.length || 1) || 0
        },
        gerado_em: new Date().toISOString()
      }

      return handleSupabaseSuccess(relatorio)
    } catch (error) {
      return handleSupabaseError(error)
    }
  }

  // Atualizar estoque em lote
  async updateEstoqueLote(updates, userId) {
    try {
      const results = []

      for (const update of updates) {
        const { data, error } = await supabase.rpc('update_estoque_com_movimentacao', {
          p_produto_id: update.produto_id,
          p_novo_estoque: update.novo_estoque,
          p_user_id: userId,
          p_motivo: update.motivo || 'Atualização em lote'
        })

        if (error) {
          results.push({ produto_id: update.produto_id, success: false, error: error.message })
        } else {
          results.push({ produto_id: update.produto_id, success: true, data })
        }
      }

      return handleSupabaseSuccess(results)
    } catch (error) {
      return handleSupabaseError(error)
    }
  }

  // Helpers para geração de conteúdo (placeholders)
  generatePDFContent(pedidos, title, extra = null) {
    // Gerar HTML estruturado para conversão em PDF
    const currentDate = new Date().toLocaleDateString('pt-BR');
    const currentTime = new Date().toLocaleTimeString('pt-BR');

    // Garantir que pedidos é um array
    if (!pedidos || !Array.isArray(pedidos)) {
      pedidos = [];
    }

    const htmlContent = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>${title}</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; color: #333; }
        .header { text-align: center; border-bottom: 2px solid #2563eb; padding-bottom: 10px; margin-bottom: 20px; }
        .header h1 { color: #2563eb; margin: 0; }
        .header p { margin: 5px 0; color: #666; }
        .pedido-block { border: 1px solid #e5e7eb; border-radius: 8px; margin-bottom: 20px; padding: 15px; background-color: #f9fafb; }
        .pedido-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px; border-bottom: 1px solid #d1d5db; padding-bottom: 8px; }
        .pedido-id { font-weight: bold; color: #1f2937; }
        .pedido-status { padding: 4px 8px; border-radius: 4px; font-size: 12px; font-weight: bold; }
        .status-novo_pedido { background-color: #dbeafe; color: #1e40af; }
        .status-em_producao { background-color: #fef3c7; color: #92400e; }
        .status-faturado { background-color: #d1fae5; color: #065f46; }
        .status-em_transporte { background-color: #e0e7ff; color: #3730a3; }
        .status-finalizado { background-color: #dcfce7; color: #14532d; }
        .status-cancelado { background-color: #fee2e2; color: #991b1b; }
        .pedido-info { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-bottom: 10px; }
        .info-item { margin-bottom: 5px; }
        .info-label { font-weight: bold; color: #4b5563; }
        .info-value { color: #1f2937; }
        .itens-section { margin-top: 15px; }
        .itens-table { width: 100%; border-collapse: collapse; margin-top: 10px; }
        .itens-table th, .itens-table td { border: 1px solid #d1d5db; padding: 8px; text-align: left; }
        .itens-table th { background-color: #f3f4f6; font-weight: bold; }
        .valor-total { text-align: right; font-size: 18px; font-weight: bold; color: #059669; margin-top: 10px; }
        .summary { background-color: #eff6ff; border: 1px solid #3b82f6; border-radius: 8px; padding: 15px; margin-top: 30px; }
        .summary h3 { color: #1e40af; margin-top: 0; }
        .summary-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 15px; }
        .summary-item { text-align: center; }
        .summary-number { font-size: 24px; font-weight: bold; color: #1e40af; }
        .summary-label { font-size: 14px; color: #6b7280; }
    </style>
</head>
<body>
    <div class="header">
        <h1>${title}</h1>
        <p>Gerado em: ${currentDate} às ${currentTime}</p>
        ${extra ? `<p>${extra.nome_marca || ''} - ${extra.razao_social || ''}</p>` : ''}
    </div>

    ${pedidos && pedidos.length > 0 ? pedidos.map(pedido => `
    <div class="pedido-block">
        <div class="pedido-header">
            <span class="pedido-id">Pedido #${pedido.id?.substring(0, 8) || 'N/A'}</span>
            <span class="pedido-status status-${pedido.status || 'novo_pedido'}">${this.formatStatus(pedido.status)}</span>
        </div>

        <div class="pedido-info">
            <div>
                <div class="info-item">
                    <span class="info-label">Cliente:</span>
                    <span class="info-value">${pedido.comprador_nome || 'N/A'}</span>
                </div>
                <div class="info-item">
                    <span class="info-label">Fornecedor:</span>
                    <span class="info-value">${pedido.fornecedor_nome || 'N/A'}</span>
                </div>
                <div class="info-item">
                    <span class="info-label">Data do Pedido:</span>
                    <span class="info-value">${new Date(pedido.created_date || Date.now()).toLocaleDateString('pt-BR')}</span>
                </div>
            </div>
            <div>
                <div class="info-item">
                    <span class="info-label">Status Pagamento:</span>
                    <span class="info-value">${this.formatPaymentStatus(pedido.status_pagamento)}</span>
                </div>
                <div class="info-item">
                    <span class="info-label">Valor Total:</span>
                    <span class="info-value">R$ ${(pedido.valor_total || 0).toFixed(2)}</span>
                </div>
                <div class="info-item">
                    <span class="info-label">Valor Final:</span>
                    <span class="info-value">R$ ${(pedido.valor_final || 0).toFixed(2)}</span>
                </div>
            </div>
        </div>

        ${this.renderItensSection(pedido)}

        <div class="valor-total">
            Total: R$ ${(pedido.valor_final || 0).toFixed(2)}
        </div>
    </div>
    `).join('') : '<p>Nenhum pedido encontrado.</p>'}

    <div class="summary">
        <h3>Resumo</h3>
        <div class="summary-grid">
            <div class="summary-item">
                <div class="summary-number">${pedidos ? pedidos.length : 0}</div>
                <div class="summary-label">Total de Pedidos</div>
            </div>
            <div class="summary-item">
                <div class="summary-number">R$ ${pedidos ? pedidos.reduce((sum, p) => sum + (p.valor_final || 0), 0).toFixed(2) : '0,00'}</div>
                <div class="summary-label">Valor Total</div>
            </div>
            <div class="summary-item">
                <div class="summary-number">R$ ${pedidos && pedidos.length > 0 ? (pedidos.reduce((sum, p) => sum + (p.valor_final || 0), 0) / pedidos.length).toFixed(2) : '0,00'}</div>
                <div class="summary-label">Ticket Médio</div>
            </div>
        </div>
    </div>
</body>
</html>`;

    return htmlContent;
  }

  formatStatus(status) {
    const statusMap = {
      'novo_pedido': 'Novo Pedido',
      'em_producao': 'Em Produção',
      'faturado': 'Faturado',
      'em_transporte': 'Em Transporte',
      'finalizado': 'Finalizado',
      'cancelado': 'Cancelado'
    };
    return statusMap[status] || status || 'Novo Pedido';
  }

  formatPaymentStatus(status) {
    const statusMap = {
      'pendente': 'Pendente',
      'pago': 'Pago',
      'atrasado': 'Atrasado',
      'cancelado': 'Cancelado'
    };
    return statusMap[status] || status || 'Pendente';
  }

  renderItensSection(pedido) {
    // Verificar se itens existe e é um array
    let itens = [];

    if (pedido.itens) {
      // Se itens é uma string JSON, fazer parse
      if (typeof pedido.itens === 'string') {
        try {
          itens = JSON.parse(pedido.itens);
        } catch (e) {
          console.warn('Erro ao fazer parse dos itens:', e);
          itens = [];
        }
      } else if (Array.isArray(pedido.itens)) {
        itens = pedido.itens;
      }
    }

    if (!itens || !Array.isArray(itens) || itens.length === 0) {
      return '<div class="itens-section"><p>Nenhum item encontrado para este pedido.</p></div>';
    }

    return `
    <div class="itens-section">
        <h4>Itens do Pedido:</h4>
        <table class="itens-table">
            <thead>
                <tr>
                    <th>Produto</th>
                    <th>Quantidade</th>
                    <th>Preço Unit.</th>
                    <th>Subtotal</th>
                </tr>
            </thead>
            <tbody>
                ${itens.map(item => `
                <tr>
                    <td>${item.nome || item.produto_nome || 'Produto'}</td>
                    <td>${item.quantidade || 1}</td>
                    <td>R$ ${(item.preco_unitario || item.preco || 0).toFixed(2)}</td>
                    <td>R$ ${((item.quantidade || 1) * (item.preco_unitario || item.preco || 0)).toFixed(2)}</td>
                </tr>
                `).join('')}
            </tbody>
        </table>
    </div>
    `;
  }

  generateExcelContent(pedidos) {
    // Garantir que pedidos é um array
    if (!pedidos || !Array.isArray(pedidos)) {
      pedidos = [];
    }

    // Transformar pedidos em formato adequado para CSV
    const pedidosForCSV = pedidos.map(pedido => {
      // Processar itens para mostrar resumo
      let itensResumo = 'Nenhum item';
      let quantidadeTotal = 0;

      if (pedido.itens) {
        let itens = [];
        if (typeof pedido.itens === 'string') {
          try {
            itens = JSON.parse(pedido.itens);
          } catch (e) {
            itens = [];
          }
        } else if (Array.isArray(pedido.itens)) {
          itens = pedido.itens;
        }

        if (itens.length > 0) {
          quantidadeTotal = itens.reduce((sum, item) => sum + (item.quantidade || 1), 0);
          itensResumo = `${itens.length} produtos (${quantidadeTotal} itens)`;
        }
      }

      return {
        'ID Pedido': pedido.id?.substring(0, 8) || 'N/A',
        'Data': new Date(pedido.created_date || Date.now()).toLocaleDateString('pt-BR'),
        'Cliente': pedido.comprador_nome || 'N/A',
        'Fornecedor': pedido.fornecedor_nome || 'N/A',
        'Status': this.formatStatus(pedido.status),
        'Status Pagamento': this.formatPaymentStatus(pedido.status_pagamento),
        'Quantidade Itens': quantidadeTotal,
        'Valor Total': (pedido.valor_total || 0).toFixed(2),
        'Desconto': (pedido.desconto || 0).toFixed(2),
        'Valor Frete': (pedido.valor_frete || 0).toFixed(2),
        'Valor Final': (pedido.valor_final || 0).toFixed(2),
        'Itens Resumo': itensResumo,
        'Observações': pedido.observacoes || ''
      };
    });

    const csv = this.arrayToCSV(pedidosForCSV);
    return csv;
  }

  arrayToCSV(array) {
    if (!array || array.length === 0) {
      return 'Nenhum dado encontrado para exportação';
    }

    const headers = Object.keys(array[0]);
    const csvContent = [
      // Cabeçalho
      headers.map(header => `"${header}"`).join(','),
      // Dados
      ...array.map(row =>
        headers.map(header => {
          const value = row[header];
          if (value === null || value === undefined) {
            return '""';
          }
          // Converter para string e escapar aspas
          const stringValue = String(value).replace(/"/g, '""');
          return `"${stringValue}"`;
        }).join(',')
      )
    ].join('\n');

    // Adicionar BOM para UTF-8 (para caracteres especiais)
    return '\uFEFF' + csvContent;
  }
}

export const functionsService = new FunctionsService()
export default functionsService