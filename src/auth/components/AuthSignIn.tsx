import { useState, FormEvent } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import {
  Button,
  Input,
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
  Separator,
  Loader
} from '../../components'
import { validateEmail } from '../../utils'
import { useAuth } from '../../context/auth/useAuth'
import useUserStore from '../../stores/userStore'

const AuthSignIn = () => {
  const { login } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const setUser = useUserStore((state) => state.setUser)

  const from = location.state?.from?.pathname || '/home'

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [emailError, setEmailError] = useState('')
  const [loginError, setLoginError] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  const handleLogin = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setLoginError('')
    setIsLoading(true)

    // Validación básica del email
    const emailValidation = validateEmail(email)
    if (!emailValidation.isValid) {
      setEmailError(emailValidation.error)
      setIsLoading(false)
      return
    }

    if (!password) {
      setLoginError('Por favor ingresa tu contraseña')
      setIsLoading(false)
      return
    }

    try {
      await login({ email, password })

      const userJSON = localStorage.getItem('user')
      if (userJSON) {
        const user = JSON.parse(userJSON)
        setUser(user)
      }

      navigate(from, { replace: true })
    } catch (error) {
      console.error('Error al iniciar sesión:', error)
      setLoginError('Error al iniciar sesión')
    } finally {
      setIsLoading(false)
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
              disabled={!email || !password || isLoading}
            >
              {isLoading ? (
                <>
                  <Loader className='mr-2 h-4 w-4' />
                </>
              ) : (
                'Iniciar sesión'
              )}
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
