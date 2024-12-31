import { useState, FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Button,
  Input,
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
  Separator
} from '../../components'
import { validateEmail } from '../../utils'
import api from '../../services/config/axios'
import { AxiosError } from 'axios'

const AuthSignIn = () => {
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [emailError, setEmailError] = useState('')
  const [loginError, setLoginError] = useState('')

  const handleLogin = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setLoginError('')

    // Validación básica del email
    const emailValidation = validateEmail(email)
    if (!emailValidation.isValid) {
      setEmailError(emailValidation.error)
      return
    }

    if (!password) {
      setLoginError('Por favor ingresa tu contraseña')
      return
    }

    try {
      const { data } = await api.post('/auth/login', { email, password })

      localStorage.setItem('token', data.token)
      localStorage.setItem('user', JSON.stringify(data.user))

      if (data.user.role === 'ADMIN') {
        navigate('/admin/dashboard')
      } else {
        navigate('/dashboard')
      }
    } catch (error: unknown) {
      if (error instanceof AxiosError) {
        setLoginError(error.response?.data?.error || 'Error al iniciar sesión')
      } else {
        setLoginError('Error al iniciar sesión')
      }
    }
  }

  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newEmail = e.target.value
    setEmail(newEmail)
    setEmailError('')
    setLoginError('')
  }

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newPassword = e.target.value
    setPassword(newPassword)
    setLoginError('')
  }

  return (
    <div className='flex items-center justify-center h-screen gradient-background'>
      <Card className='w-[400px] bg-white shadow-md'>
        <CardHeader className='text-center'>
          <CardTitle className='text-lg font-bold'>
            Iniciar sesión en All Fashion
          </CardTitle>
          <CardDescription className='text-sm text-gray-600'>
            Bienvenido de nuevo! Por favor inicia sesión para continuar.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Separator />
          <form onSubmit={handleLogin} className='space-y-4 mt-4'>
            <div className='space-y-2'>
              <Input
                type='email'
                name='email'
                placeholder='Correo electrónico'
                className={`w-full ${
                  emailError || loginError ? 'border-red-500' : ''
                }`}
                value={email}
                onChange={handleEmailChange}
              />
              {emailError && (
                <p className='text-red-500 text-sm'>{emailError}</p>
              )}
            </div>

            <div className='space-y-2'>
              <Input
                type='password'
                name='password'
                placeholder='Contraseña'
                className={`w-full ${loginError ? 'border-red-500' : ''}`}
                value={password}
                onChange={handlePasswordChange}
              />
              {loginError && (
                <p className='text-red-500 text-sm'>{loginError}</p>
              )}
            </div>

            <Button
              type='submit'
              className='w-full'
              disabled={!email || !password}
            >
              Iniciar sesión
            </Button>
          </form>
        </CardContent>
        <CardFooter className='text-center text-sm text-gray-500'>
          All Fashion © 2025
        </CardFooter>
      </Card>
    </div>
  )
}

export default AuthSignIn
