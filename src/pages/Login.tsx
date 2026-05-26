import { useState } from 'react';
import { apiClient } from '../api/client';
import { Baby, LogIn } from 'lucide-react';

interface LoginProps {
  onLogin: (user: { id: string; firstName: string; lastName: string; role: string }) => void;
}

export default function Login({ onLogin }: LoginProps) {
  const [email, setEmail] = useState('admin@creche.fr');
  const [password, setPassword] = useState('password123');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await apiClient.post('/auth/login', { email, password });
      onLogin(response.data.user);
    } catch (err: unknown) {
      if (err && typeof err === 'object' && 'response' in err) {
        const axiosErr = err as { response?: { data?: { error?: string } } };
        setError(axiosErr.response?.data?.error || 'Erreur lors de la connexion');
      } else {
        setError('Erreur réseau');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex-center animate-fade-in" style={{ minHeight: '80vh' }}>
      <div className="glass-card" style={{ width: '100%', maxWidth: '400px' }}>
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <Baby size={48} color="var(--color-primary)" style={{ margin: '0 auto' }} />
          <h1 style={{ marginTop: '1rem' }}>Bienvenue</h1>
          <p style={{ color: 'var(--color-text-secondary)' }}>Connectez-vous à Crèche Planning</p>
        </div>

        {error && (
          <div style={{ 
            backgroundColor: 'rgba(244, 63, 94, 0.1)', 
            color: 'var(--color-secondary)', 
            padding: '1rem', 
            borderRadius: 'var(--radius-md)',
            marginBottom: '1.5rem',
            textAlign: 'center',
            fontWeight: 500
          }}>
            {error}
          </div>
        )}

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
