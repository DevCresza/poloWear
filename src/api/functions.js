import functionsService from '@/services/functions'

// Adapters para manter compatibilidade com a interface existente
export const consultarCNPJ = async (cnpj) => {
  const result = await functionsService.consultarCNPJ(cnpj)
  if (result.success) {
    return result.data
  }
  throw new Error(result.error)
}

export const exportPedidosPDF = async (filtros) => {
  const result = await functionsService.exportPedidosPDF(filtros)
  if (result.success) {
    return result.data
  }
  throw new Error(result.error)
}

export const exportPedidosExcel = async (filtros) => {
  const result = await functionsService.exportPedidosExcel(filtros)
  if (result.success) {
    return result.data
  }
  throw new Error(result.error)
}

export const exportPedidosFornecedor = async (fornecedorId, filtros) => {
  const result = await functionsService.exportPedidosFornecedor(fornecedorId, filtros)
  if (result.success) {
    return result.data
  }
  throw new Error(result.error)
}

