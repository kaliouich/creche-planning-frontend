import { useState, useEffect } from 'react';
import { apiClient } from '../api/client';
import { Users, Plus, Mail, Key, Shield, AlertTriangle } from 'lucide-react';

interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: 'ADMIN' | 'PROFESSIONAL' | 'PARENT';
}

export default function UsersManagement() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  // Modal state
  const [showModal, setShowModal] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  
  // Form state
  const [email, setEmail] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<'ADMIN' | 'PROFESSIONAL' | 'PARENT'>('PARENT');
  const [saving, setSaving] = useState(false);
  const [userToDelete, setUserToDelete] = useState<User | null>(null);

  const userMetaStr = localStorage.getItem('userMeta');
  const currentUser = userMetaStr ? JSON.parse(userMetaStr) : null;

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const res = await apiClient.get('/users');
      setUsers(res.data);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Erreur lors du chargement des utilisateurs');
    } finally {
      setLoading(false);
    }
  };

  const openAddModal = () => {
    setEditingUser(null);
    setEmail('');
    setFirstName('');
    setLastName('');
    setPassword('');
    setRole('PARENT');
    setShowModal(true);
  };

  const openEditModal = (user: User) => {
    setEditingUser(user);
    setEmail(user.email);
    setFirstName(user.firstName);
    setLastName(user.lastName);
    setPassword(''); // never show password, just allow reset
    setRole(user.role);
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    setSuccess('');

    try {
      if (editingUser) {
        await apiClient.put(`/users/${editingUser.id}`, { email, role, password });
        setSuccess('Utilisateur mis à jour avec succès.');
      } else {
        await apiClient.post('/users', { email, firstName, lastName, role, password });
        setSuccess('Utilisateur créé. Un email contenant ses accès a été envoyé.');
      }
      setShowModal(false);
      fetchUsers();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Erreur lors de la sauvegarde');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!userToDelete) return;
    setSaving(true);
    setError('');
    try {
      await apiClient.delete(`/users/${userToDelete.id}`);
      setSuccess('Utilisateur supprimé avec succès.');
      setUserToDelete(null);
      fetchUsers();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Erreur lors de la suppression');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="flex-center" style={{ minHeight: '50vh' }}><p>Chargement...</p></div>;

  return (
    <div className="admin-dashboard fade-in">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <h2><Users className="icon" /> Gestion des Utilisateurs</h2>
        <button className="btn btn-primary" onClick={openAddModal}>
          <Plus size={20} /> Nouvel Utilisateur
        </button>
      </div>

      {error && <div className="alert alert-error mb-4">{error}</div>}
      {success && <div className="alert alert-success mb-4">{success}</div>}

      <div className="glass-card">
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
          <thead>
            <tr style={{ borderBottom: '2px solid var(--color-glass-border)' }}>
              <th style={{ padding: '1rem' }}>Nom</th>
              <th style={{ padding: '1rem' }}>Email</th>
              <th style={{ padding: '1rem' }}>Rôle</th>
              <th style={{ padding: '1rem' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.map(u => (
              <tr key={u.id} style={{ borderBottom: '1px solid var(--color-glass-border)' }}>
                <td style={{ padding: '1rem' }}>{u.firstName} {u.lastName}</td>
                <td style={{ padding: '1rem' }}>{u.email}</td>
                <td style={{ padding: '1rem' }}>
                  <span className={`badge badge-${u.role === 'ADMIN' ? 'error' : u.role === 'PROFESSIONAL' ? 'warning' : 'info'}`}>
                    {u.role === 'PROFESSIONAL' ? 'PRO' : u.role}
                  </span>
                </td>
                <td style={{ padding: '1rem', display: 'flex', gap: '0.5rem' }}>
                  <button className="btn btn-outline" onClick={() => openEditModal(u)} style={{ padding: '0.4rem 0.8rem', fontSize: '0.9rem' }}>
                    Modifier
                  </button>
                  {currentUser?.id !== u.id && (
                    <button className="btn btn-outline" onClick={() => setUserToDelete(u)} style={{ padding: '0.4rem 0.8rem', fontSize: '0.9rem', color: 'var(--color-error)', borderColor: 'var(--color-error)' }}>
                      Supprimer
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Modal d'édition */}
      {showModal && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }}>
          <div className="glass-card" style={{ width: '100%', maxWidth: '500px', backgroundColor: 'var(--color-bg-primary)' }}>
            <h3>{editingUser ? 'Modifier l\'utilisateur' : 'Nouvel utilisateur'}</h3>
            <form onSubmit={handleSubmit} style={{ marginTop: '1.5rem' }}>
              
              {!editingUser && (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <div className="form-group">
                    <label className="form-label">Prénom</label>
                    <input type="text" className="form-control" value={firstName} onChange={e => setFirstName(e.target.value)} required />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Nom</label>
                    <input type="text" className="form-control" value={lastName} onChange={e => setLastName(e.target.value)} required />
                  </div>
                </div>
              )}

              <div className="form-group">
                <label className="form-label"><Mail size={16} /> Email</label>
                <input type="email" className="form-control" value={email} onChange={e => setEmail(e.target.value)} required />
              </div>

              <div className="form-group">
                <label className="form-label"><Shield size={16} /> Rôle</label>
                <select className="form-control" value={role} onChange={e => setRole(e.target.value as any)} required>
                  <option value="PARENT">Parent</option>
                  <option value="PROFESSIONAL">Pro (Professionnel)</option>
                  <option value="ADMIN">Administrateur</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">
                  <Key size={16} /> {editingUser ? 'Nouveau mot de passe (laisser vide pour ne pas modifier)' : 'Mot de passe initial'}
                </label>
                <input 
                  type="text" 
                  className="form-control" 
                  value={password} 
                  onChange={e => setPassword(e.target.value)} 
                  required={!editingUser}
                  placeholder={editingUser ? '*****' : 'Mot de passe temporaire'}
                />
                {!editingUser && (
                  <p style={{ fontSize: '0.85rem', color: 'var(--color-text-secondary)', marginTop: '0.5rem' }}>
                    <AlertTriangle size={14} style={{ display: 'inline', verticalAlign: 'text-bottom' }} />
                    L'utilisateur recevra ce mot de passe en clair par e-mail.
                  </p>
                )}
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '2rem' }}>
                <button type="button" className="btn btn-outline" onClick={() => setShowModal(false)}>
                  Annuler
                </button>
                <button type="submit" className="btn btn-primary" disabled={saving}>
                  {saving ? 'Sauvegarde...' : 'Sauvegarder'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal de suppression */}
      {userToDelete && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }}>
          <div className="glass-card" style={{ width: '100%', maxWidth: '400px', backgroundColor: 'var(--color-bg-primary)' }}>
            <h3 style={{ color: 'var(--color-error)' }}>Confirmer la suppression</h3>
            <p style={{ marginTop: '1rem', color: 'var(--color-text-secondary)' }}>
              Êtes-vous sûr de vouloir supprimer l'utilisateur <strong>{userToDelete.firstName} {userToDelete.lastName}</strong> ({userToDelete.email}) ?
              Cette action est irréversible.
            </p>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '2rem' }}>
              <button type="button" className="btn btn-outline" onClick={() => setUserToDelete(null)}>
                Annuler
              </button>
              <button type="button" className="btn" style={{ backgroundColor: 'var(--color-error)', color: '#ffffff', border: 'none', padding: '0.6rem 1.2rem', borderRadius: '8px', cursor: 'pointer' }} onClick={handleDelete} disabled={saving}>
                {saving ? 'Suppression...' : 'Supprimer définitivement'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
