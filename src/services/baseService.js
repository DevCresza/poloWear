import { supabase, handleSupabaseError, handleSupabaseSuccess } from '@/lib/supabase'

class BaseService {
  constructor(tableName) {
    this.tableName = tableName
  }

  // Buscar todos os registros
  async find(options = {}) {
    try {
      let query = supabase.from(this.tableName).select(options.select || '*')

      // Aplicar filtros
      if (options.filters) {
        Object.entries(options.filters).forEach(([key, value]) => {
          if (value !== undefined && value !== null) {
            query = query.eq(key, value)
          }
        })
      }

      // Aplicar ordenação
      if (options.order) {
        query = query.order(options.order.column, { ascending: options.order.ascending !== false })
      }

      // Aplicar limit
      if (options.limit) {
        query = query.limit(options.limit)
      }

      // Aplicar range (paginação)
      if (options.range) {
        query = query.range(options.range.from, options.range.to)
      }

      const { data, error } = await query

      if (error) throw error
      return handleSupabaseSuccess(data)
    } catch (error) {
      return handleSupabaseError(error)
    }
  }

  // Buscar por ID
  async findById(id) {
    try {
      const { data, error } = await supabase
        .from(this.tableName)
        .select('*')
        .eq('id', id)
        .single()

      if (error) throw error
      return handleSupabaseSuccess(data)
    } catch (error) {
      return handleSupabaseError(error)
    }
  }

  // Criar novo registro
  async create(data) {
    try {
      const { data: result, error } = await supabase
        .from(this.tableName)
        .insert([data])
        .select()
        .single()

      if (error) throw error
      return handleSupabaseSuccess(result)
    } catch (error) {
      return handleSupabaseError(error)
    }
  }

  // Atualizar registro
  async update(id, data) {
    try {
      const { data: result, error } = await supabase
        .from(this.tableName)
        .update(data)
        .eq('id', id)
        .select()
        .single()

      if (error) throw error
      return handleSupabaseSuccess(result)
    } catch (error) {
      return handleSupabaseError(error)
    }
  }

  // Deletar registro
  async delete(id) {
    try {
      const { error } = await supabase
        .from(this.tableName)
        .delete()
        .eq('id', id)

      if (error) throw error
      return handleSupabaseSuccess({ id })
    } catch (error) {
      return handleSupabaseError(error)
    }
  }

  // Contar registros
  async count(filters = {}) {
    try {
      let query = supabase.from(this.tableName).select('*', { count: 'exact', head: true })

      // Aplicar filtros
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          query = query.eq(key, value)
        }
      })

      const { count, error } = await query

      if (error) throw error
      return handleSupabaseSuccess(count)
    } catch (error) {
      return handleSupabaseError(error)
    }
  }

  // Buscar com filtro de texto
  async search(column, searchTerm, options = {}) {
    try {
      let query = supabase
        .from(this.tableName)
        .select(options.select || '*')
        .ilike(column, `%${searchTerm}%`)

      // Aplicar ordenação
      if (options.order) {
        query = query.order(options.order.column, { ascending: options.order.ascending !== false })
      }

      // Aplicar limit
      if (options.limit) {
        query = query.limit(options.limit)
      }

      const { data, error } = await query

      if (error) throw error
      return handleSupabaseSuccess(data)
    } catch (error) {
      return handleSupabaseError(error)
    }
  }
}

export default BaseService