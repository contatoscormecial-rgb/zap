import React, { useState } from 'react';
import { supabase } from '../services/supabaseClient';

interface LoginProps {
  onSwitchToSignUp: () => void;
}

const Login: React.FC<LoginProps> = ({ onSwitchToSignUp }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      setError("Email ou senha inválidos.");
    }
    setLoading(false);
  };

  return (
    <div className="w-full max-w-md p-8 space-y-8 bg-zap-card-blue rounded-lg shadow-lg border border-zap-border-blue">
      <div>
        <h1 className="text-3xl font-bold text-center text-white">ZAP <span className="font-light">CONTROLE</span></h1>
        <h2 className="mt-2 text-center text-lg text-zap-text-secondary">
          Bem-vindo de volta!
        </h2>
      </div>
      <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
        {error && <p className="text-center text-sm text-red-400 bg-red-900/50 border border-red-700 rounded-md p-3">{error}</p>}
        <div className="rounded-md shadow-sm -space-y-px">
          <div>
            <label htmlFor="email-address" className="sr-only">Email</label>
            <input 
              id="email-address" 
              name="email" 
              type="email" 
              autoComplete="email" 
              required 
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="appearance-none rounded-none relative block w-full px-3 py-3 border border-zap-border-blue bg-zap-dark-blue text-zap-text-primary placeholder-zap-text-secondary focus:outline-none focus:ring-zap-green-light focus:border-zap-green-light focus:z-10 sm:text-sm rounded-t-md" 
              placeholder="Email" />
          </div>
          <div>
            <label htmlFor="password" className="sr-only">Senha</label>
            <input 
              id="password" 
              name="password" 
              type="password" 
              autoComplete="current-password" 
              required 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="appearance-none rounded-none relative block w-full px-3 py-3 border border-zap-border-blue bg-zap-dark-blue text-zap-text-primary placeholder-zap-text-secondary focus:outline-none focus:ring-zap-green-light focus:border-zap-green-light focus:z-10 sm:text-sm rounded-b-md" 
              placeholder="Senha" />
          </div>
        </div>

        <div>
          <button 
            type="submit" 
            disabled={loading}
            className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-zap-green hover:bg-zap-green-light focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-zap-dark-blue focus:ring-zap-green-light transition-colors disabled:bg-gray-500 disabled:cursor-not-allowed">
            {loading ? 'Entrando...' : 'Entrar'}
          </button>
        </div>
      </form>
      <p className="mt-2 text-center text-sm text-zap-text-secondary">
        Não tem uma conta?{' '}
        <button onClick={onSwitchToSignUp} className="font-medium text-zap-green-light hover:text-green-400">
          Cadastre-se
        </button>
      </p>
    </div>
  );
};

export default Login;