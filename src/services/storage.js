import { supabase, handleSupabaseError, handleSupabaseSuccess } from '@/lib/supabase'

class StorageService {
  constructor() {
    this.buckets = {
      products: 'public-files',
      capsules: 'public-files',
      avatars: 'public-files',
      documents: 'public-files'
    }
  }

  // Upload de arquivo para um bucket específico
  async uploadFile(bucket, path, file, options = {}) {
    try {
      // Validar tamanho do arquivo
      const maxSize = options.maxSize || 5 * 1024 * 1024 // 5MB padrão
      if (file.size > maxSize) {
        throw new Error('Arquivo muito grande. Tamanho máximo: 5MB')
      }

      // Validar tipo do arquivo
      const allowedTypes = options.allowedTypes || ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif', 'image/bmp']

      console.log('🔍 Storage: Validando arquivo:', {
        file: file,
        fileName: file?.name,
        fileType: file?.type,
        fileSize: file?.size,
        fileConstructor: file?.constructor?.name,
        allowedTypes
      });

      if (!allowedTypes.includes(file.type)) {
        console.error('❌ Storage: Tipo de arquivo não permitido:', file.type);
        throw new Error(`Tipo de arquivo não permitido: ${file.type}. Tipos aceitos: ${allowedTypes.join(', ')}`)
      }

      // Gerar nome único se não especificado
      const fileName = path || `${Date.now()}-${file.name}`

      const { data, error } = await supabase.storage
        .from(bucket)
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: options.upsert || false,
          ...options.storageOptions
        })

      if (error) throw error

      console.log('✅ Storage: Upload bem-sucedido:', data);

      // Obter URL pública
      const { data: urlData } = supabase.storage
        .from(bucket)
        .getPublicUrl(data.path)

      console.log('📂 Storage: URL público gerada:', urlData.publicUrl);

      return handleSupabaseSuccess({
        path: data.path,
        url: urlData.publicUrl,
        fullPath: data.fullPath
      })
    } catch (error) {
      return handleSupabaseError(error)
    }
  }

  // Upload de imagem de produto
  async uploadProductImage(file, productId, imageIndex = 0) {
    const path = `produtos/${productId}/image-${imageIndex}-${Date.now()}.${file.name.split('.').pop()}`
    return this.uploadFile(this.buckets.products, path, file, {
      allowedTypes: ['image/jpeg', 'image/png', 'image/webp'],
      maxSize: 5 * 1024 * 1024 // 5MB
    })
  }

  // Upload de imagem de cápsula
  async uploadCapsuleImage(file, capsulaId) {
    const path = `capsulas/${capsulaId}/capa-${Date.now()}.${file.name.split('.').pop()}`
    return this.uploadFile(this.buckets.capsules, path, file, {
      allowedTypes: ['image/jpeg', 'image/png', 'image/webp'],
      maxSize: 3 * 1024 * 1024 // 3MB
    })
  }

  // Upload de avatar de usuário
  async uploadAvatar(file, userId) {
    const path = `avatars/${userId}/avatar-${Date.now()}.${file.name.split('.').pop()}`
    return this.uploadFile(this.buckets.avatars, path, file, {
      allowedTypes: ['image/jpeg', 'image/png'],
      maxSize: 2 * 1024 * 1024, // 2MB
      upsert: true
    })
  }

  // Upload de documento
  async uploadDocument(file, userId, documentType = 'general') {
    const path = `documentos/${userId}/${documentType}/${Date.now()}-${file.name}`
    return this.uploadFile(this.buckets.documents, path, file, {
      allowedTypes: ['application/pdf', 'image/jpeg', 'image/png', 'text/plain'],
      maxSize: 10 * 1024 * 1024 // 10MB
    })
  }

  // Deletar arquivo
  async deleteFile(bucket, path) {
    try {
      const { error } = await supabase.storage
        .from(bucket)
        .remove([path])

      if (error) throw error
      return handleSupabaseSuccess(true)
    } catch (error) {
      return handleSupabaseError(error)
    }
  }

  // Deletar imagem de produto
  async deleteProductImage(imagePath) {
    return this.deleteFile(this.buckets.products, imagePath)
  }

  // Listar arquivos em um bucket
  async listFiles(bucket, folder = '', options = {}) {
    try {
      const { data, error } = await supabase.storage
        .from(bucket)
        .list(folder, {
          limit: options.limit || 100,
          offset: options.offset || 0,
          sortBy: options.sortBy || { column: 'name', order: 'asc' }
        })

      if (error) throw error
      return handleSupabaseSuccess(data)
    } catch (error) {
      return handleSupabaseError(error)
    }
  }

  // Obter URL pública de um arquivo
  getPublicUrl(bucket, path) {
    try {
      const { data } = supabase.storage
        .from(bucket)
        .getPublicUrl(path)

      return handleSupabaseSuccess(data.publicUrl)
    } catch (error) {
      return handleSupabaseError(error)
    }
  }

  // Criar URL assinada (para arquivos privados)
  async createSignedUrl(bucket, path, expiresIn = 3600) {
    try {
      const { data, error } = await supabase.storage
        .from(bucket)
        .createSignedUrl(path, expiresIn)

      if (error) throw error
      return handleSupabaseSuccess(data.signedUrl)
    } catch (error) {
      return handleSupabaseError(error)
    }
  }

  // Mover arquivo
  async moveFile(bucket, fromPath, toPath) {
    try {
      const { data, error } = await supabase.storage
        .from(bucket)
        .move(fromPath, toPath)

      if (error) throw error
      return handleSupabaseSuccess(data)
    } catch (error) {
      return handleSupabaseError(error)
    }
  }

  // Copiar arquivo
  async copyFile(bucket, fromPath, toPath) {
    try {
      const { data, error } = await supabase.storage
        .from(bucket)
        .copy(fromPath, toPath)

      if (error) throw error
      return handleSupabaseSuccess(data)
    } catch (error) {
      return handleSupabaseError(error)
    }
  }

  // Criar bucket (caso não exista)
  async createBucket(bucketName, options = {}) {
    try {
      const { data, error } = await supabase.storage.createBucket(bucketName, {
        public: options.public !== false, // Público por padrão
        allowedMimeTypes: options.allowedMimeTypes,
        fileSizeLimit: options.fileSizeLimit,
        ...options
      })

      if (error) throw error
      return handleSupabaseSuccess(data)
    } catch (error) {
      return handleSupabaseError(error)
    }
  }

  // Helper para validar imagem
  validateImage(file) {
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp']
    const maxSize = 5 * 1024 * 1024 // 5MB

    if (!allowedTypes.includes(file.type)) {
      return { valid: false, error: 'Tipo de arquivo não permitido. Use JPEG, PNG ou WebP.' }
    }

    if (file.size > maxSize) {
      return { valid: false, error: 'Arquivo muito grande. Máximo 5MB.' }
    }

    return { valid: true }
  }

  // Helper para redimensionar imagem (usando canvas)
  async resizeImage(file, maxWidth = 800, maxHeight = 600, quality = 0.8) {
    return new Promise((resolve, reject) => {
      const canvas = document.createElement('canvas')
      const ctx = canvas.getContext('2d')
      const img = new Image()

      img.onload = () => {
        // Calcular novas dimensões mantendo proporção
        let { width, height } = img

        if (width > height) {
          if (width > maxWidth) {
            height = (height * maxWidth) / width
            width = maxWidth
          }
        } else {
          if (height > maxHeight) {
            width = (width * maxHeight) / height
            height = maxHeight
          }
        }

        canvas.width = width
        canvas.height = height

        // Desenhar imagem redimensionada
        ctx.drawImage(img, 0, 0, width, height)

        // Converter para blob
        canvas.toBlob(resolve, file.type, quality)
      }

      img.onerror = reject
      img.src = URL.createObjectURL(file)
    })
  }

  // Upload múltiplo de imagens
  async uploadMultipleImages(files, bucket, folder = '') {
    try {
      const uploadPromises = files.map((file, index) => {
        const path = `${folder}/${Date.now()}-${index}-${file.name}`
        return this.uploadFile(bucket, path, file)
      })

      const results = await Promise.allSettled(uploadPromises)

      const successful = results
        .filter(result => result.status === 'fulfilled' && result.value.success)
        .map(result => result.value.data)

      const failed = results
        .filter(result => result.status === 'rejected' || !result.value?.success)
        .map((result, index) => ({
          file: files[index].name,
          error: result.reason || result.value?.error || 'Erro desconhecido'
        }))

      return handleSupabaseSuccess({
        successful,
        failed,
        total: files.length
      })
    } catch (error) {
      return handleSupabaseError(error)
    }
  }
}

export const storageService = new StorageService()
export default storageService