import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { apiClient } from '../api/client';
import { useToast } from '../contexts/ToastContext';

export default function ResetPassword() {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { showToast } = useToast();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');

  useEffect(() => {
    if (!token) {
      showToast("Lien de réinitialisation invalide ou manquant.", "error");
      navigate('/');
    }
  }, [token, navigate, showToast]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;

    if (password !== confirmPassword) {
      showToast("Les mots de passe ne correspondent pas.", "error");
      return;
    }
    if (password.length < 8) {
      showToast("Le mot de passe doit contenir au moins 8 caractères.", "error");
      return;
    }

    setLoading(true);
    try {
      await apiClient.post('/auth/reset-password', { token, password });
      showToast("Mot de passe défini avec succès. Vous pouvez maintenant vous connecter.", "success");
      navigate('/');
    } catch (err: any) {
      showToast(err.response?.data?.error || 'Erreur lors de la réinitialisation', "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container" style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div className="card" style={{ maxWidth: 400, width: '100%' }}>
        <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
          <img src="/planning/logo.png" alt="Les Fruits de la Passion" style={{ height: '80px', objectFit: 'contain', margin: '0 auto', display: 'block', marginBottom: '1rem' }} />
        </div>
        <h1 className="h2" style={{ textAlign: 'center', marginBottom: '1rem' }}>Bienvenue à la crèche !</h1>
        <p style={{ textAlign: 'center', marginBottom: '1.5rem', color: 'var(--gray-600)' }}>
          Pour activer votre compte parent et accéder au planning, veuillez créer votre mot de passe personnel.
        </p>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="password">Nouveau mot de passe</label>
            <input
              type="password"
              id="password"
              className="input"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={8}
            />
          </div>
          <div className="form-group">
            <label htmlFor="confirmPassword">Confirmer le mot de passe</label>
            <input
              type="password"
              id="confirmPassword"
              className="input"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              minLength={8}
            />
          </div>
          <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: '1rem' }} disabled={loading}>
            {loading ? <Loader2 className="animate-spin" size={20} /> : 'Valider'}
          </button>
        </form>
      </div>
    </div>
  );
}
