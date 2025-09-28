import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { UserCompat as User } from '@/api/entities'
import { createPageUrl } from '@/utils'
import { usePageTitle } from '@/hooks/usePageTitle'

export default function Login() {
  usePageTitle('Login', 'Acesse sua conta na plataforma POLO B2B');
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const navigate = useNavigate()

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    console.log('🔑 Login attempt started with:', { email: formData.email })

    try {
      console.log('📡 Calling User.login...')
      const result = await User.login(formData)
      console.log('📊 Login result:', result)

      if (result && result.user) {
        console.log('✅ Login successful, user:', result.user)

        // Salvar usuário no localStorage para acesso instantâneo
        const userSession = {
          user: result.user,
          loginTime: Date.now(),
          isLoggedIn: true
        };

        localStorage.setItem('currentUser', JSON.stringify(result.user))
        localStorage.setItem('userSession', JSON.stringify(userSession))

        console.log('💾 User saved to localStorage:', userSession)

        // Verificar se salvou corretamente
        const savedCheck = localStorage.getItem('userSession');
        console.log('✅ localStorage verification:', {
          saved: !!savedCheck,
          data: savedCheck ? JSON.parse(savedCheck) : null
        });
        console.log('🔄 Redirecting to dashboard...')

        // Redirecionamento instantâneo
        navigate(createPageUrl('PortalDashboard'))
      } else {
        console.log('❌ Login failed - no user in result')
        setError('Login falhou - dados inválidos')
      }
    } catch (err) {
      console.error('❌ Login error:', err)
      setError(err.message || 'Erro ao fazer login')
    } finally {
      setLoading(false)
    }
  }

  // Auto-preencher com dados do admin para teste
  const fillAdminData = () => {
    setFormData({
      email: 'admin@polob2b.com',
      password: 'password123'
    })
  }

  return (
    <div className="min-h-screen bg-slate-100 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold text-gray-800">POLO B2B</CardTitle>
          <CardDescription>
            Faça login para acessar a plataforma
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                name="email"
                type="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="seu@email.com"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Senha</Label>
              <Input
                id="password"
                name="password"
                type="password"
                value={formData.password}
                onChange={handleChange}
                placeholder="Sua senha"
                required
              />
            </div>

            {error && (
              <div className="text-red-600 text-sm text-center bg-red-50 p-2 rounded">
                {error}
              </div>
            )}

            <Button
              type="submit"
              className="w-full"
              disabled={loading}
            >
              {loading ? 'Entrando...' : 'Entrar'}
            </Button>

            <div className="text-center">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={fillAdminData}
                className="text-xs"
              >
                Usar dados Admin (Teste)
              </Button>
            </div>

            <div className="text-xs text-gray-500 text-center mt-4">
              <p><strong>Para teste:</strong></p>
              <p>Email: admin@polob2b.com</p>
              <p>Senha: password123</p>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}