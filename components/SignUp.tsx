import React, { useState } from 'react';
import { supabase } from '../services/supabaseClient';

interface SignUpProps {
  onSwitchToLogin: () => void;
}

const SignUp: React.FC<SignUpProps> = ({ onSwitchToLogin }) => {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(false);

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
        },
      },
    });

    if (error) {
      setError(error.message);
    } else if (data.user) {
        const { error: profileError } = await supabase.from('profiles').insert({
            user_id: data.user.id,
            full_name: fullName,
            email: email
        });

        if (profileError) {
             console.warn("Could not create profile, maybe it already exists:", profileError.message);
        }
        setSuccess(true);
    }
    setLoading(false);
  };

  return (
    <div className="w-full max-w-md p-8 space-y-8 bg-zap-card-blue rounded-lg shadow-lg border border-zap-border-blue">
      <div>
        <h1 className="text-3xl font-bold text-center text-white">ZAP <span className="font-light">CONTROLE</span></h1>
        <h2 className="mt-2 text-center text-lg text-zap-text-secondary">
          Crie sua conta
        </h2>
      </div>
      {success ? (
        <div className="text-center">
            <p className="text-green-400 bg-green-900/50 border border-green-700 rounded-md p-4">Cadastro realizado com sucesso! Por favor, verifique seu email para confirmar sua conta.</p>
        </div>
      ) : (
      <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
        {error && <p className="text-center text-sm text-red-400 bg-red-900/50 border border-red-700 rounded-md p-3">{error}</p>}
        <div className="rounded-md shadow-sm space-y-4">
          <div>
            <label htmlFor="full-name" className="sr-only">Nome Completo</label>
            <input 
              id="full-name" 
              name="name" 
              type="text" 
              autoComplete="name" 
              required 
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="appearance-none rounded-md relative block w-full px-3 py-3 border border-zap-border-blue bg-zap-dark-blue text-zap-text-primary placeholder-zap-text-secondary focus:outline-none focus:ring-zap-green-light focus:border-zap-green-light sm:text-sm" 
              placeholder="Nome Completo" />
          </div>
          <div>
            <label htmlFor="email-address-signup" className="sr-only">Email</label>
            <input 
              id="email-address-signup" 
              name="email" 
              type="email" 
              autoComplete="email" 
              required 
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="appearance-none rounded-md relative block w-full px-3 py-3 border border-zap-border-blue bg-zap-dark-blue text-zap-text-primary placeholder-zap-text-secondary focus:outline-none focus:ring-zap-green-light focus:border-zap-green-light sm:text-sm" 
              placeholder="Email" />
          </div>
          <div>
            <label htmlFor="password-signup" className="sr-only">Senha</label>
            <input 
              id="password-signup" 
              name="password" 
              type="password" 
              autoComplete="new-password" 
              required 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="appearance-none rounded-md relative block w-full px-3 py-3 border border-zap-border-blue bg-zap-dark-blue text-zap-text-primary placeholder-zap-text-secondary focus:outline-none focus:ring-zap-green-light focus:border-zap-green-light sm:text-sm" 
              placeholder="Senha" />
          </div>
        </div>

        <div>
          <button 
            type="submit" 
            disabled={loading}
            className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-zap-green hover:bg-zap-green-light focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-zap-dark-blue focus:ring-zap-green-light transition-colors disabled:bg-gray-500 disabled:cursor-not-allowed">
            {loading ? 'Cadastrando...' : 'Cadastrar'}
          </button>
        </div>
      </form>
      )}
      <p className="mt-2 text-center text-sm text-zap-text-secondary">
        Já tem uma conta?{' '}
        <button onClick={onSwitchToLogin} className="font-medium text-zap-green-light hover:text-green-400">
          Entre
        </button>
      </p>
    </div>
  );
};

export default SignUp;