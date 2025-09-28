import { supabase, handleSupabaseError, handleSupabaseSuccess } from '@/lib/supabase'
import storageService from './storage'
import functionsService from './functions'

class IntegrationsService {
  constructor() {
    this.core = {
      InvokeLLM: this.invokeLLM.bind(this),
      SendEmail: this.sendEmail.bind(this),
      UploadFile: this.uploadFile.bind(this),
      GenerateImage: this.generateImage.bind(this),
      ExtractDataFromUploadedFile: this.extractDataFromUploadedFile.bind(this),
      CreateFileSignedUrl: this.createFileSignedUrl.bind(this),
      UploadPrivateFile: this.uploadPrivateFile.bind(this)
    }
  }

  // Invocar LLM (usando Edge Function do Supabase)
  async invokeLLM(prompt, options = {}) {
    try {
      const { data, error } = await supabase.functions.invoke('invoke-llm', {
        body: {
          prompt,
          model: options.model || 'gpt-3.5-turbo',
          max_tokens: options.max_tokens || 150,
          temperature: options.temperature || 0.7
        }
      })

      if (error) throw error

      return handleSupabaseSuccess({
        response: data.response || `Resposta gerada para: ${prompt.substring(0, 50)}...`,
        usage: data.usage,
        model: data.model
      })
    } catch (error) {
      // Fallback para resposta mock
      console.warn('LLM service not available, using mock response:', error)
      return handleSupabaseSuccess({
        response: `Mock LLM response for: ${prompt.substring(0, 50)}...`,
        usage: { total_tokens: 100 },
        model: 'mock'
      })
    }
  }

  // Enviar email
  async sendEmail(emailData) {
    try {
      const result = await functionsService.sendEmail(emailData)

      if (result.success) {
        return handleSupabaseSuccess({
          sent: true,
          message_id: result.data.message_id || `msg_${Date.now()}`,
          ...result.data
        })
      }

      throw new Error(result.error)
    } catch (error) {
      return handleSupabaseError(error)
    }
  }

  // Upload de arquivo público
  async uploadFile(file, options = {}) {
    try {
      const bucket = options.bucket || 'public-files'
      const folder = options.folder || 'uploads'
      const path = `${folder}/${Date.now()}-${file.name}`

      const result = await storageService.uploadFile(bucket, path, file, {
        allowedTypes: options.allowedTypes || ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif', 'image/bmp', 'application/pdf'],
        maxSize: options.maxSize || 10 * 1024 * 1024 // 10MB
      })

      if (result.success) {
        return handleSupabaseSuccess({
          url: result.data.url,
          filename: file.name,
          path: result.data.path,
          size: file.size,
          type: file.type
        })
      }

      throw new Error(result.error)
    } catch (error) {
      return handleSupabaseError(error)
    }
  }

  // Upload de arquivo privado
  async uploadPrivateFile(file, options = {}) {
    try {
      const bucket = options.bucket || 'private-files'
      const folder = options.folder || 'documents'
      const path = `${folder}/${Date.now()}-${file.name}`

      const result = await storageService.uploadFile(bucket, path, file, {
        allowedTypes: options.allowedTypes || ['application/pdf', 'image/jpeg', 'image/png', 'text/plain'],
        maxSize: options.maxSize || 10 * 1024 * 1024, // 10MB
        storageOptions: {
          public: false // Arquivo privado
        }
      })

      if (result.success) {
        // Para arquivos privados, criar URL assinada
        const signedUrlResult = await storageService.createSignedUrl(
          bucket,
          result.data.path,
          options.expiresIn || 3600
        )

        return handleSupabaseSuccess({
          url: signedUrlResult.success ? signedUrlResult.data : result.data.url,
          filename: file.name,
          path: result.data.path,
          size: file.size,
          type: file.type,
          private: true
        })
      }

      throw new Error(result.error)
    } catch (error) {
      return handleSupabaseError(error)
    }
  }

  // Criar URL assinada para arquivo
  async createFileSignedUrl(filePath, bucket = 'private-files', expiresIn = 3600) {
    try {
      const result = await storageService.createSignedUrl(bucket, filePath, expiresIn)

      if (result.success) {
        return handleSupabaseSuccess({
          url: result.data,
          expires_in: expiresIn,
          expires_at: new Date(Date.now() + expiresIn * 1000).toISOString()
        })
      }

      throw new Error(result.error)
    } catch (error) {
      return handleSupabaseError(error)
    }
  }

  // Gerar imagem (usando serviço de IA)
  async generateImage(prompt, options = {}) {
    try {
      const { data, error } = await supabase.functions.invoke('generate-image', {
        body: {
          prompt,
          size: options.size || '512x512',
          style: options.style || 'realistic',
          quality: options.quality || 'standard'
        }
      })

      if (error) throw error

      return handleSupabaseSuccess({
        url: data.url || `https://via.placeholder.com/512x512?text=${encodeURIComponent(prompt.substring(0, 20))}`,
        prompt,
        size: options.size || '512x512',
        created_at: new Date().toISOString()
      })
    } catch (error) {
      // Fallback para imagem placeholder
      console.warn('Image generation service not available, using placeholder:', error)
      return handleSupabaseSuccess({
        url: `https://via.placeholder.com/512x512?text=${encodeURIComponent(prompt.substring(0, 20))}`,
        prompt,
        size: options.size || '512x512',
        created_at: new Date().toISOString(),
        fallback: true
      })
    }
  }

  // Extrair dados de arquivo uploadado
  async extractDataFromUploadedFile(file, options = {}) {
    try {
      // Para arquivos de texto simples
      if (file.type === 'text/plain' || file.type === 'text/csv') {
        const text = await this.readFileAsText(file)
        return handleSupabaseSuccess({
          data: text,
          type: 'text',
          filename: file.name,
          extracted_at: new Date().toISOString()
        })
      }

      // Para PDFs e imagens, usar Edge Function
      const { data, error } = await supabase.functions.invoke('extract-file-data', {
        body: {
          file_url: options.file_url,
          file_type: file.type,
          extraction_type: options.extraction_type || 'text'
        }
      })

      if (error) throw error

      return handleSupabaseSuccess({
        data: data.extracted_text || 'Dados extraídos do arquivo',
        type: data.type || 'text',
        filename: file.name,
        extracted_at: new Date().toISOString(),
        confidence: data.confidence || 0.8
      })
    } catch (error) {
      // Fallback para extração mock
      console.warn('File extraction service not available, using mock data:', error)
      return handleSupabaseSuccess({
        data: `Mock extracted data from ${file.name}`,
        type: 'text',
        filename: file.name,
        extracted_at: new Date().toISOString(),
        fallback: true
      })
    }
  }

  // Helper para ler arquivo como texto
  readFileAsText(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = (e) => resolve(e.target.result)
      reader.onerror = (e) => reject(e)
      reader.readAsText(file)
    })
  }

  // Processar webhook
  async processWebhook(webhookData, source = 'unknown') {
    try {
      // Log do webhook para auditoria
      const { error } = await supabase
        .from('webhook_logs')
        .insert([{
          source,
          data: webhookData,
          processed_at: new Date().toISOString(),
          status: 'received'
        }])

      if (error) {
        console.warn('Failed to log webhook:', error)
      }

      // Processar webhook baseado na fonte
      switch (source) {
        case 'payment':
          return this.processPaymentWebhook(webhookData)
        case 'shipping':
          return this.processShippingWebhook(webhookData)
        case 'inventory':
          return this.processInventoryWebhook(webhookData)
        default:
          return handleSupabaseSuccess({
            processed: true,
            message: 'Webhook received and logged'
          })
      }
    } catch (error) {
      return handleSupabaseError(error)
    }
  }

  // Processar webhook de pagamento
  async processPaymentWebhook(data) {
    try {
      if (data.event === 'payment.approved' && data.pedido_id) {
        // Atualizar status do pedido
        const { error } = await supabase
          .from('pedidos')
          .update({
            status_pagamento: 'pago',
            updated_at: new Date().toISOString()
          })
          .eq('id', data.pedido_id)

        if (error) throw error
      }

      return handleSupabaseSuccess({ processed: true, type: 'payment' })
    } catch (error) {
      return handleSupabaseError(error)
    }
  }

  // Processar webhook de entrega
  async processShippingWebhook(data) {
    try {
      if (data.event === 'shipment.delivered' && data.pedido_id) {
        // Atualizar status do pedido
        const { error } = await supabase
          .from('pedidos')
          .update({
            status: 'finalizado',
            data_entrega_real: new Date().toISOString(),
            codigo_rastreio: data.tracking_code,
            updated_at: new Date().toISOString()
          })
          .eq('id', data.pedido_id)

        if (error) throw error
      }

      return handleSupabaseSuccess({ processed: true, type: 'shipping' })
    } catch (error) {
      return handleSupabaseError(error)
    }
  }

  // Processar webhook de estoque
  async processInventoryWebhook(data) {
    try {
      if (data.event === 'inventory.updated' && data.produto_id) {
        // Atualizar estoque do produto
        const { error } = await supabase
          .from('produtos')
          .update({
            estoque_atual_grades: data.new_quantity,
            updated_at: new Date().toISOString()
          })
          .eq('id', data.produto_id)

        if (error) throw error
      }

      return handleSupabaseSuccess({ processed: true, type: 'inventory' })
    } catch (error) {
      return handleSupabaseError(error)
    }
  }
}

export const integrationsService = new IntegrationsService()
export default integrationsService