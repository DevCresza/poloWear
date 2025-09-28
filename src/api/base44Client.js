// Mock implementation to replace Base44 SDK
export const base44 = {
  entities: {
    Contact: {
      find: () => Promise.resolve([]),
      create: (data) => Promise.resolve({ id: Date.now(), ...data }),
      update: (id, data) => Promise.resolve({ id, ...data }),
      delete: (id) => Promise.resolve({ id }),
    },
    WhatsappTemplate: {
      find: () => Promise.resolve([]),
      create: (data) => Promise.resolve({ id: Date.now(), ...data }),
    },
    Produto: {
      find: () => Promise.resolve([]),
      create: (data) => Promise.resolve({ id: Date.now(), ...data }),
      update: (id, data) => Promise.resolve({ id, ...data }),
      delete: (id) => Promise.resolve({ id }),
    },
    Pedido: {
      find: () => Promise.resolve([]),
      create: (data) => Promise.resolve({ id: Date.now(), ...data }),
      update: (id, data) => Promise.resolve({ id, ...data }),
    },
    Fornecedor: {
      find: () => Promise.resolve([]),
      create: (data) => Promise.resolve({ id: Date.now(), ...data }),
      update: (id, data) => Promise.resolve({ id, ...data }),
    },
    Recurso: {
      find: () => Promise.resolve([]),
      create: (data) => Promise.resolve({ id: Date.now(), ...data }),
    },
    Capsula: {
      find: () => Promise.resolve([]),
      create: (data) => Promise.resolve({ id: Date.now(), ...data }),
      update: (id, data) => Promise.resolve({ id, ...data }),
      delete: (id) => Promise.resolve({ id }),
    },
    PendingUser: {
      find: () => Promise.resolve([]),
      create: (data) => Promise.resolve({ id: Date.now(), ...data }),
      update: (id, data) => Promise.resolve({ id, ...data }),
      delete: (id) => Promise.resolve({ id }),
    },
    MovimentacaoEstoque: {
      find: () => Promise.resolve([]),
      create: (data) => Promise.resolve({ id: Date.now(), ...data }),
    },
  },
  auth: {
    me: () => Promise.resolve({
      id: 1,
      full_name: 'Demo User',
      role: 'admin',
      tipo_negocio: 'admin',
      email: 'demo@polo-b2b.com'
    }),
    login: (credentials) => Promise.resolve({
      user: {
        id: 1,
        full_name: 'Demo User',
        role: 'admin',
        tipo_negocio: 'admin',
        email: credentials.email || 'demo@polo-b2b.com'
      },
      token: 'mock-token'
    }),
    logout: () => Promise.resolve(),
    register: (data) => Promise.resolve({
      user: { id: Date.now(), ...data },
      token: 'mock-token'
    }),
  },
  functions: {
    consultarCNPJ: (cnpj) => Promise.resolve({
      cnpj,
      nome: 'Empresa Demo',
      fantasia: 'Demo',
      logradouro: 'Rua Demo, 123',
      municipio: 'São Paulo',
      uf: 'SP',
      cep: '01000-000',
    }),
    exportPedidosPDF: () => Promise.resolve(new Blob(['PDF content'], { type: 'application/pdf' })),
    exportPedidosExcel: () => Promise.resolve(new Blob(['Excel content'], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })),
    exportPedidosFornecedor: () => Promise.resolve(new Blob(['PDF content'], { type: 'application/pdf' })),
  },
  integrations: {
    Core: {
      InvokeLLM: (prompt) => Promise.resolve({ response: 'Mock LLM response for: ' + prompt }),
      SendEmail: (data) => Promise.resolve({ sent: true, ...data }),
      UploadFile: (file) => Promise.resolve({ url: 'mock-file-url', filename: file.name }),
      GenerateImage: (prompt) => Promise.resolve({ url: 'mock-image-url' }),
      ExtractDataFromUploadedFile: (file) => Promise.resolve({ data: 'Mock extracted data' }),
      CreateFileSignedUrl: (filename) => Promise.resolve({ url: 'mock-signed-url/' + filename }),
      UploadPrivateFile: (file) => Promise.resolve({ url: 'mock-private-url', filename: file.name }),
    }
  }
};
