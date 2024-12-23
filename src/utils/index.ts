export const validateEmail = (email: string) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return { isValid: false, error: 'El formato del correo electrónico no es válido' };
  }

  const allowedDomains = ['gmail.com', 'outlook.com', 'hotmail.com', 'yahoo.com'];
  const domain = email.split('@')[1].toLowerCase();
  if (!allowedDomains.includes(domain)) {
    return { isValid: false, error: 'El correo electrónico no es válido' };
  }

  return { isValid: true, error: '' };
};

export const validatePassword = (password: string) => {
  if (password.length < 8) {
    return { isValid: false, error: 'La contraseña debe tener al menos 8 caracteres' };
  }

  const hasLetters = /[a-zA-Z].*[a-zA-Z]/.test(password);
  if (!hasLetters) {
    return { isValid: false, error: 'La contraseña debe contener al menos 2 letras' };
  }

  const hasNumber = /\d/.test(password);
  if (!hasNumber) {
    return { isValid: false, error: 'La contraseña debe contener al menos 1 número' };
  }

  const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);
  if (!hasSpecialChar) {
    return { isValid: false, error: 'La contraseña debe contener al menos 1 carácter especial' };
  }

  return { isValid: true, error: '' };
};

export const formatDateTime = (date: Date) => {
  return date.toLocaleString('es-ES', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  });
}