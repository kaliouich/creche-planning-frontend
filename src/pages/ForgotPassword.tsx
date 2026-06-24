import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { apiClient } from '../api/client';
import { useToast } from '../contexts/ToastContext';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const { showToast } = useToast();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;

    setLoading(true);
    try {
      await apiClient.post('/auth/forgot-password', { email, appUrl: window.location.origin });
      showToast("Si cette adresse existe, un email a été envoyé pour réinitialiser le mot de passe.", "success");
      navigate('/');
    } catch (err: any) {
      showToast(err.response?.data?.error || 'Erreur lors de la demande', "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container" style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div className="card" style={{ maxWidth: 400, width: '100%' }}>
        <h1 className="h2" style={{ textAlign: 'center', marginBottom: '1.5rem' }}>Mot de passe oublié</h1>
        <p style={{ textAlign: 'center', marginBottom: '1.5rem', color: 'var(--gray-600)' }}>
          Entrez votre adresse e-mail pour recevoir un lien de réinitialisation.
        </p>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="email">Adresse e-mail</label>
            <input
              type="email"
              id="email"
              className="input"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <button type="submit" className="btn btn-primary" style={{ width: '100%' }} disabled={loading}>
            {loading ? <Loader2 className="animate-spin" size={20} /> : 'Envoyer le lien'}
          </button>
        </form>
        <div style={{ textAlign: 'center', marginTop: '1.5rem' }}>
          <button onClick={() => navigate('/')} className="btn-icon" style={{ color: 'var(--brand-primary)' }}>
            Retour à la connexion
          </button>
        </div>
      </div>
    </div>
  );
}
