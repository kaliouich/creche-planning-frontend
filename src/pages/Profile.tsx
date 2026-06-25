import { useState, useEffect } from 'react';
import { apiClient } from '../api/client';
import { User, Mail, Key } from 'lucide-react';

export default function Profile() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('');
  const [name, setName] = useState('');
  
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    const savedUser = localStorage.getItem('userMeta');
    if (savedUser) {
      try {
        const u = JSON.parse(savedUser);
        setEmail(u.email || ''); // Assuming userMeta stores email, if not it will be blank initially
        setRole(u.role);
        setName(`${u.firstName} ${u.lastName}`);
      } catch (e) {
        // ignore
      }
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    setSuccess('');

    try {
      await apiClient.put('/profile', { email, password });
      setSuccess('Profil mis à jour avec succès.');
      setPassword('');
      
      // Update local storage email if it was changed
      const savedUser = localStorage.getItem('userMeta');
      if (savedUser) {
        const u = JSON.parse(savedUser);
        u.email = email;
        localStorage.setItem('userMeta', JSON.stringify(u));
      }
    } catch (err: any) {
      setError(err.response?.data?.error || 'Erreur lors de la sauvegarde du profil');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="container" style={{ maxWidth: '600px', marginTop: '2rem' }}>
      <div className="glass-card fade-in">
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '2rem' }}>
          <div style={{ backgroundColor: 'var(--color-bg-secondary)', padding: '1rem', borderRadius: '50%' }}>
            <User size={32} color="var(--color-primary)" />
          </div>
          <div>
            <h2 style={{ marginBottom: 0 }}>Mon Profil</h2>
            <p style={{ color: 'var(--color-text-secondary)', margin: 0 }}>{name} ({role})</p>
          </div>
        </div>

        {error && <div className="alert alert-error mb-4">{error}</div>}
        {success && <div className="alert alert-success mb-4">{success}</div>}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label"><Mail size={16} /> Adresse Email</label>
            <input 
              type="email" 
              className="form-control" 
              value={email} 
              onChange={e => setEmail(e.target.value)} 
              placeholder="Votre email de connexion"
            />
            <small style={{ color: 'var(--color-text-secondary)' }}>
              Vous utiliserez cette adresse pour vous connecter.
            </small>
          </div>

          <div className="form-group" style={{ marginTop: '1.5rem' }}>
            <label className="form-label"><Key size={16} /> Nouveau mot de passe</label>
            <input 
              type="password" 
              className="form-control" 
              value={password} 
              onChange={e => setPassword(e.target.value)} 
              placeholder="Laissez vide pour conserver l'actuel"
            />
          </div>

          <div style={{ marginTop: '2rem' }}>
            <button type="submit" className="btn btn-primary" style={{ width: '100%' }} disabled={saving}>
              {saving ? 'Enregistrement...' : 'Enregistrer les modifications'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
