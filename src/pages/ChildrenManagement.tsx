import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../api/client';
import { PageLoader } from '../components/ui/PageLoader';
import { useToast } from '../contexts/ToastContext';
import type { Child } from '../types';

import { ChildList } from '../components/children/ChildList';
import { ChildForm } from '../components/children/ChildForm';
import { AbsenceModal } from '../components/children/AbsenceModal';

export default function ChildrenManagement() {
  const queryClient = useQueryClient();
  const { showToast } = useToast();
  
  const [editingChild, setEditingChild] = useState<Child | null>(null);
  const [absenceChildId, setAbsenceChildId] = useState<string | null>(null);

  const { data: children = [], isLoading: loading } = useQuery({
    queryKey: ['children'],
    queryFn: async () => {
      const response = await apiClient.get('/children');
      return response.data.sort((a: Child, b: Child) => a.firstName.localeCompare(b.firstName));
    }
  });

  const saveMutation = useMutation({
    mutationFn: async (payload: any) => {
      if (editingChild) {
        return apiClient.put(`/children/${editingChild.id}`, payload);
      } else {
        return apiClient.post('/children', payload);
      }
    },
    onSuccess: () => {
      showToast(editingChild ? 'Enfant modifié avec succès.' : 'Enfant ajouté avec succès.', 'success');
      setEditingChild(null);
      queryClient.invalidateQueries({ queryKey: ['children'] });
      window.scrollTo({ top: 0, behavior: 'smooth' });
    },
    onError: (err: any) => {
      showToast(err.response?.data?.error || 'Erreur lors de la sauvegarde', 'error');
    }
  });

  const handleDeleteChild = async (childId: string) => {
    if (confirm('Voulez-vous vraiment supprimer définitivement cet enfant ? (Ses données et son historique seront effacés)')) {
      try {
        await apiClient.delete(`/children/${childId}`);
        showToast('Enfant supprimé avec succès', 'success');
        queryClient.invalidateQueries({ queryKey: ['children'] });
      } catch (err: any) {
        showToast(err.response?.data?.error || 'Erreur lors de la suppression.', 'error');
      }
    }
  };

  const handleEditClick = (child: Child) => {
    setEditingChild(child);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  if (loading) return <PageLoader text="Chargement des enfants..." />;

  return (
    <div className="animate-fade-in">
      <div style={{ marginBottom: '2rem' }}>
        <h1>Gestion des Enfants</h1>
        <p style={{ color: 'var(--color-text-secondary)' }}>Ajoutez de nouveaux enfants et rattachez-les à leurs parents.</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '2rem' }}>
        <ChildForm
          editingChild={editingChild}
          childrenList={children}
          onCancelEdit={() => setEditingChild(null)}
          onSubmit={(payload) => saveMutation.mutate(payload)}
          isPending={saveMutation.isPending}
        />

        <ChildList
          childrenList={children}
          onEditClick={handleEditClick}
          onManageAbsences={(childId) => setAbsenceChildId(childId)}
          onDeleteChild={handleDeleteChild}
        />
      </div>

      {absenceChildId && (
        <AbsenceModal
          childId={absenceChildId}
          onClose={() => setAbsenceChildId(null)}
        />
      )}
    </div>
  );
}
