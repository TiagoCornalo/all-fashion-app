import { useState, FormEvent } from 'react';
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
} from "../../components";
import { validateEmail } from '../../utils';

const SignIn = () => {
  const [email, setEmail] = useState('');
  const [emailError, setEmailError] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const handleValidateEmail = async (email: string) => {
    try {
      const response = await fetch('/api/validate-email', {
        method: 'POST',
        body: JSON.stringify({ email }),
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        setEmailError('No existe una cuenta con este correo electrónico');
        setShowPassword(false);
        return false;
      }

      setEmailError('');
      setShowPassword(true);
      return true;
    } catch (error) {
      setEmailError('Error al validar el correo electrónico');
      return false;
    }
  };

  const handleEmailLogin = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!showPassword) {
      const emailValidation = validateEmail(email);
      if (!emailValidation.isValid) {
        setEmailError(emailValidation.error);
        return;
      }

      await handleValidateEmail(email);
    } else {

      console.log(`Logging in with email: ${email} and password: ${password}`);
    }
  };

  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newEmail = e.target.value;
    setEmail(newEmail);

    if (newEmail) {
      const { isValid, error } = validateEmail(newEmail);
      setEmailError(isValid ? '' : error);
    } else {
      setEmailError('');
    }
  };

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newPassword = e.target.value;
    setPassword(newPassword);
  };

  return (
    <div className="flex items-center justify-center h-screen gradient-background">
      <Card className="w-[400px] bg-white shadow-md">
        <CardHeader className="text-center">
          <CardTitle className="text-lg font-bold">Iniciar sesión en All Fashion</CardTitle>
          <CardDescription className="text-sm text-gray-600">
            Bienvenido de nuevo! Por favor inicia sesión para continuar.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Separator />
          <form onSubmit={handleEmailLogin} className="space-y-4 mt-4">
            <div className="space-y-2">
              <Input
                type="email"
                name="email"
                placeholder="Correo electrónico"
                className={`w-full ${emailError ? 'border-red-500' : ''}`}
                value={email}
                onChange={handleEmailChange}
              />
              {emailError && (
                <p className="text-red-500 text-sm">{emailError}</p>
              )}
            </div>

            {showPassword && (
              <div className="space-y-2">
                <Input
                  type="password"
                  name="password"
                  placeholder="Contraseña"
                  required
                  className={`w-full`}
                  value={password}
                  onChange={handlePasswordChange}
                />
              </div>
            )}

            <Button type="submit" className="w-full">
              {showPassword ? 'Iniciar sesión' : 'Continuar'}
            </Button>
          </form>
        </CardContent>
        <CardFooter className="text-center text-sm text-gray-500">
          All Fashion © 2025
        </CardFooter>
      </Card>
    </div>
  );
};

export default SignIn;
