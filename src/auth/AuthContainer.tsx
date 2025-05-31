import { useEffect } from "react";
import AuthSignIn from "./components/AuthSignIn";
import { authService } from "../services/auth.service";
import { useNavigate } from "react-router-dom";

const AuthContainer = () => {
  const navigate = useNavigate()

  useEffect(() => {
    const user = authService.getCurrentUser()
    if (user && user._id) {
      navigate('/home')
    }
  }, [])

  return <AuthSignIn />;
};

export default AuthContainer;
