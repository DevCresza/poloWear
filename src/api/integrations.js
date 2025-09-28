import integrationsService from '@/services/integrations'

// Exportar Core com todos os serviços
export const Core = integrationsService.core

// Adapters para manter compatibilidade com a interface existente
export const InvokeLLM = async (prompt, options) => {
  const result = await integrationsService.core.InvokeLLM(prompt, options)
  if (result.success) {
    return result.data
  }
  throw new Error(result.error)
}

export const SendEmail = async (emailData) => {
  const result = await integrationsService.core.SendEmail(emailData)
  if (result.success) {
    return result.data
  }
  throw new Error(result.error)
}

export const UploadFile = async (file, options) => {
  const result = await integrationsService.core.UploadFile(file, options)
  if (result.success) {
    return result.data
  }
  throw new Error(result.error)
}

export const GenerateImage = async (prompt, options) => {
  const result = await integrationsService.core.GenerateImage(prompt, options)
  if (result.success) {
    return result.data
  }
  throw new Error(result.error)
}

export const ExtractDataFromUploadedFile = async (file, options) => {
  const result = await integrationsService.core.ExtractDataFromUploadedFile(file, options)
  if (result.success) {
    return result.data
  }
  throw new Error(result.error)
}

export const CreateFileSignedUrl = async (filePath, bucket, expiresIn) => {
  const result = await integrationsService.core.CreateFileSignedUrl(filePath, bucket, expiresIn)
  if (result.success) {
    return result.data
  }
  throw new Error(result.error)
}

export const UploadPrivateFile = async (file, options) => {
  const result = await integrationsService.core.UploadPrivateFile(file, options)
  if (result.success) {
    return result.data
  }
  throw new Error(result.error)
}






