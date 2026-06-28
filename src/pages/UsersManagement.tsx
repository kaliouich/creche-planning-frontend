import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../api/client';
import { Users, Plus, Mail, Shield, AlertTriangle, Pencil, Trash2 } from 'lucide-react';
import { PageLoader } from '../components/ui/PageLoader';
import { useToast } from '../contexts/ToastContext';

import type { UserMeta as User } from '../types';

export default function UsersManagement() {
  const queryClient = useQueryClient();
  const { showToast } = useToast();
  
  // Modal state
  const [showModal, setShowModal] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  
  // Form state
  const [email, setEmail] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [role, setRole] = useState<'ADMIN'>('ADMIN');

  const [userToDelete, setUserToDelete] = useState<User | null>(null);

  const userMetaStr = localStorage.getItem('userMeta');
  const currentUser = userMetaStr ? JSON.parse(userMetaStr) : null;

  const { data: users = [], isLoading: loading } = useQuery({
    queryKey: ['users'],
    queryFn: async () => {
      const res = await apiClient.get('/users');
      return res.data as User[];
    }
  });

  const saveMutation = useMutation({
    mutationFn: async (data: any) => {
      if (editingUser) {
        return apiClient.put(`/users/${editingUser.id}`, data);
      } else {
        return apiClient.post('/users', data);
      }
    },
    onSuccess: () => {
      showToast(editingUser ? 'Utilisateur mis à jour avec succès.' : 'Utilisateur créé. Un email contenant ses accès a été envoyé.', 'success');
      setShowModal(false);
      queryClient.invalidateQueries({ queryKey: ['users'] });
    },
    onError: (err: any) => {
      showToast(err.response?.data?.error || 'Erreur lors de la sauvegarde', 'error');
    }
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      return apiClient.delete(`/users/${id}`);
    },
    onSuccess: () => {
      showToast('Utilisateur supprimé avec succès.', 'success');
      setUserToDelete(null);
      queryClient.invalidateQueries({ queryKey: ['users'] });
    },
    onError: (err: any) => {
      showToast(err.response?.data?.error || 'Erreur lors de la suppression', 'error');
    }
  });

  const openAddModal = () => {
    setEditingUser(null);
    setEmail('');
    setFirstName('');
    setLastName('');
    setRole('ADMIN');
    setShowModal(true);
  };

  const openEditModal = (user: User) => {
    setEditingUser(user);
    setEmail(user.email);
    setFirstName(user.firstName);
    setLastName(user.lastName);
    setRole(user.role as 'ADMIN');
    setShowModal(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const appUrl = window.location.origin + '/planning';
    saveMutation.mutate({ email, firstName, lastName, role, appUrl });
  };

  const handleDelete = () => {
    if (!userToDelete) return;
    deleteMutation.mutate(userToDelete.id);
  };

  if (loading) return <PageLoader text="Chargement des utilisateurs..." />;

  return (
    <div className="admin-dashboard fade-in">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <h2><Users className="icon" /> Gestion des Utilisateurs</h2>
        <button className="btn btn-primary" onClick={openAddModal}>
          <Plus size={20} /> Nouvel Utilisateur
        </button>
      </div>

      <div className="table-responsive" style={{ backgroundColor: 'var(--color-white)', borderRadius: 'var(--radius-lg)', boxShadow: 'var(--shadow-md)', overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
          <thead style={{ backgroundColor: 'var(--color-bg-secondary)' }}>
            <tr>
              <th style={{ padding: '1rem', borderBottom: '1px solid var(--color-glass-border)', color: 'var(--color-text-secondary)', fontWeight: 600 }}>Nom</th>
              <th style={{ padding: '1rem', borderBottom: '1px solid var(--color-glass-border)', color: 'var(--color-text-secondary)', fontWeight: 600 }}>Email</th>
              <th style={{ padding: '1rem', borderBottom: '1px solid var(--color-glass-border)', color: 'var(--color-text-secondary)', fontWeight: 600 }}>Rôle</th>
              <th style={{ padding: '1rem', borderBottom: '1px solid var(--color-glass-border)', color: 'var(--color-text-secondary)', fontWeight: 600 }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.map((user: User) => (
              <tr key={user.id} style={{ borderBottom: '1px solid #f0f0f0', transition: 'background-color var(--transition-fast)' }} className="hover:bg-gray-50">
                <td style={{ padding: '1rem' }}>{user.firstName} {user.lastName}</td>
                <td style={{ padding: '1rem', color: 'var(--color-text-secondary)' }}>{user.email}</td>
                <td style={{ padding: '1rem' }}>
                  <span style={{ 
                    padding: '0.25rem 0.75rem', 
                    borderRadius: '999px', 
                    fontSize: '0.85rem',
                    fontWeight: 500,
                    backgroundColor: user.role === 'ADMIN' ? 'rgba(230, 0, 126, 0.1)' : 'rgba(182, 193, 19, 0.2)',
                    color: user.role === 'ADMIN' ? 'var(--color-primary)' : 'var(--color-text-primary)'
                  }}>
                    {user.role === 'ADMIN' ? 'Administrateur' : 'Parent'}
                  </span>
                </td>
                <td style={{ padding: '1rem' }}>
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    {user.role !== 'PARENT' && (
                      <button 
                        onClick={() => openEditModal(user)}
                        className="btn btn-outline" 
                        style={{ padding: '0.4rem', border: 'none', color: 'var(--color-text-secondary)' }}
                        title="Modifier"
                      >
                        <Pencil size={18} />
                      </button>
                    )}
                    {currentUser?.id !== user.id && user.role !== 'PARENT' && (
                      <button 
                        onClick={() => setUserToDelete(user)}
                        className="btn btn-outline" 
                        style={{ padding: '0.4rem', border: 'none', color: 'var(--color-error)' }}
                        title="Supprimer"
                      >
                        <Trash2 size={18} />
                      </button>
                    )}
                  </div>
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
                  <option value="ADMIN">Administrateur</option>
                </select>
                <p style={{ fontSize: '0.85rem', color: 'var(--color-text-secondary)', marginTop: '0.5rem' }}>
                  Les comptes PARENT sont créés automatiquement via la gestion des enfants.
                </p>
              </div>

              {!editingUser && (
                <div className="form-group">
                  <p style={{ fontSize: '0.85rem', color: 'var(--color-text-secondary)', marginTop: '0.5rem' }}>
                    <AlertTriangle size={14} style={{ display: 'inline', verticalAlign: 'text-bottom' }} />
                    L'utilisateur recevra un e-mail avec un lien pour définir son mot de passe.
                  </p>
                </div>
              )}

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '2rem' }}>
                <button type="button" className="btn btn-outline" onClick={() => setShowModal(false)}>
                  Annuler
                </button>
                <button type="submit" className="btn btn-primary" disabled={saveMutation.isPending}>
                  {saveMutation.isPending ? 'Sauvegarde...' : 'Sauvegarder'}
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
              <button type="button" className="btn" style={{ backgroundColor: 'var(--color-error)', color: '#ffffff', border: 'none', padding: '0.6rem 1.2rem', borderRadius: '8px', cursor: 'pointer' }} onClick={handleDelete} disabled={deleteMutation.isPending}>
                {deleteMutation.isPending ? 'Suppression...' : 'Supprimer définitivement'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
