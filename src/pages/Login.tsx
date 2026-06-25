import { useState } from 'react';
import { apiClient } from '../api/client';
import { LogIn } from 'lucide-react';
import { useToast } from '../contexts/ToastContext';
import { Link } from 'react-router-dom';

interface LoginProps {
  onLogin: (user: { id: string; firstName: string; lastName: string; role: string }) => void;
}

export default function Login({ onLogin }: LoginProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const { showToast } = useToast();
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await apiClient.post('/auth/login', { email, password });
      onLogin(response.data.user);
    } catch (err: unknown) {
      if (err && typeof err === 'object' && 'response' in err) {
        const axiosErr = err as { response?: { data?: { error?: string } } };
        showToast(axiosErr.response?.data?.error || 'Erreur lors de la connexion', 'error');
      } else {
        showToast('Erreur réseau', 'error');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex-center animate-fade-in" style={{ minHeight: '80vh' }}>
      <div className="glass-card" style={{ width: '100%', maxWidth: '400px' }}>
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <img src="/planning/logo.png" alt="Les Fruits de la Passion" style={{ height: '80px', objectFit: 'contain', margin: '0 auto', display: 'block', marginBottom: '1rem' }} />
          <h1 style={{ marginTop: '1rem', fontSize: '1.5rem', fontWeight: 600 }}>Portail Gestion Permanences</h1>
          <p style={{ color: 'var(--color-text-secondary)', marginTop: '0.5rem' }}>Connectez-vous à Crèche Planning</p>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label" htmlFor="login-email">Adresse Email</label>
            <input 
              id="login-email"
              type="email" 
              className="form-input" 
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          
          <div className="form-group">
            <label className="form-label" htmlFor="login-password">Mot de passe</label>
            <input 
              id="login-password"
              type="password" 
              className="form-input" 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          
          <div style={{ textAlign: 'right', marginTop: '-0.5rem', marginBottom: '1rem' }}>
            <Link to="/forgot-password" style={{ fontSize: '0.875rem', color: 'var(--color-primary)', textDecoration: 'none' }}>
              Mot de passe oublié ?
            </Link>
          </div>

          <button 
            type="submit" 
            className="btn btn-primary" 
            style={{ width: '100%', marginTop: '1rem' }}
            disabled={loading}
          >
            {loading ? 'Connexion...' : (
              <>
                <LogIn size={20} />
                Se connecter
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
