import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '../api/client';
import { Loader2, ArrowRightLeft, User, Calendar, CheckCircle2 } from 'lucide-react';

import type { Child } from '../types';
import { DAY_LABELS, HALF_DAY_LABELS } from '../types';
import { isDatePassed } from '../utils/date';
import { MyAssignments } from '../components/planning/MyAssignments';
import { useExchangeOffers, useChildAssignmentsForExchange, useTakeOffer, useCancelOffer, useValidateProposal } from '../hooks/useExchange';

export default function ExchangeBoard() {
  const [selectedChild, setSelectedChild] = useState<Child | null>(null);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');
  const [takingOfferId, setTakingOfferId] = useState<string | null>(null);
  const [offeredAssignmentId, setOfferedAssignmentId] = useState<string>('');

  const { data: currentUserRes } = useQuery({
    queryKey: ['profile'],
    queryFn: () => apiClient.get('/profile')
  });
  const currentUser = currentUserRes?.data;

  const { data: childrenList = [] } = useQuery({
    queryKey: ['children-list'],
    queryFn: async () => {
      const res = await apiClient.get('/children');
      return res.data as Child[];
    }
  });

  const { data: offersData, isLoading } = useExchangeOffers();

  const { data: childAssignments } = useChildAssignmentsForExchange(selectedChild, takingOfferId, offersData);

  const takeOfferMutation = useTakeOffer();
  const cancelOfferMutation = useCancelOffer();
  const validateProposalMutation = useValidateProposal();

  const handleTakeOffer = async () => {
    if (!takingOfferId || !selectedChild) return;
    setError('');
    try {
      const res = await takeOfferMutation.mutateAsync({
        takingOfferId,
        payload: {
          childId: selectedChild.id,
          ...(offeredAssignmentId ? { offeredAssignmentId } : {})
        }
      });
      setSuccess(res.data.status === 'ACCEPTED' ? 'Échange validé avec succès !' : 'Votre proposition de troc a été envoyée au parent.');
      setTakingOfferId(null);
      setOfferedAssignmentId('');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (err: any) {
      setError(err.response?.data?.error || 'Erreur lors de la prise de la permanence');
    }
  };

  const handleCancelOffer = async (offerId: string) => {
    if (!window.confirm('Voulez-vous vraiment annuler cette offre ?')) return;
    try {
      await cancelOfferMutation.mutateAsync(offerId);
      setSuccess('Offre annulée avec succès.');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (err: any) {
      setError(err.response?.data?.error || 'Erreur lors de l\'annulation');
    }
  };

  const handleValidateProposal = async (proposalId: string) => {
    try {
      await validateProposalMutation.mutateAsync(proposalId);
      setSuccess('Proposition validée ! Le planning a été mis à jour.');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (err: any) {
      setError(err.response?.data?.error || 'Erreur lors de la validation');
    }
  };

  if (isLoading) {
    return <div className="flex-center" style={{ padding: '4rem' }}><Loader2 size={32} className="spin" style={{ color: 'var(--color-primary)' }} /></div>;
  }

  const offers = offersData || [];
  const validOffers = offers.filter(o => !isDatePassed(o.weekNumber, o.year, o.dayOfWeek));
  const myOffers = validOffers.filter(o => o.offeringParentId === currentUser?.id);
  const otherOffers = validOffers.filter(o => o.offeringParentId !== currentUser?.id);
  const myChildren = childrenList.filter(c => c.parentId === currentUser?.id || c.parent?.secondId === currentUser?.id);

  // We will ask for the child only when needed later, let's show the board first!
  return (
    <div className="container animate-fade-in" style={{ padding: '2rem 1rem' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '2rem' }}>
        <div>
          <h1 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <ArrowRightLeft color="var(--color-primary)" /> Bourse d'Échange
          </h1>
          <p style={{ color: 'var(--color-text-secondary)' }}>Trouvez un remplaçant ou proposez un troc de permanence.</p>
        </div>
        {childrenList.length > 0 && selectedChild && (
          <button className="btn btn-outline" onClick={() => setSelectedChild(null)}>Changer d'enfant</button>
        )}
      </div>

      {error && <div style={{ backgroundColor: 'rgba(244,63,94,0.1)', color: 'var(--color-secondary)', padding: '1rem', borderRadius: 'var(--radius-md)', marginBottom: '2rem', fontWeight: 500 }}>{error}</div>}
      {success && <div style={{ backgroundColor: 'rgba(16,185,129,0.1)', color: 'var(--color-success)', padding: '1rem', borderRadius: 'var(--radius-md)', marginBottom: '2rem', display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 500, border: '1px solid var(--color-success)' }}><CheckCircle2 size={24} /> {success}</div>}

      {myChildren.map(c => (
        <MyAssignments key={c.id} selectedChild={c} />
      ))}

      <div style={{ display: 'grid', gap: '2rem', gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', marginTop: '2rem' }}>
        {/* Mes offres */}
        <div className="glass-card" style={{ padding: '1.5rem' }}>
          <h2 style={{ fontSize: '1.2rem', marginBottom: '1rem', borderBottom: '1px solid var(--color-border)', paddingBottom: '0.5rem' }}>Mes permanences proposées</h2>
          
          {myOffers.length === 0 ? (
            <p style={{ color: 'var(--color-text-secondary)', fontStyle: 'italic' }}>Vous n'avez aucune offre en cours.</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {myOffers.map(offer => (
                <div key={offer.id} style={{ border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)', padding: '1rem', backgroundColor: 'var(--color-bg-secondary)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div>
                      <strong>Semaine {offer.weekNumber}</strong>
                      <div style={{ color: 'var(--color-text-secondary)', fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                        <Calendar size={14} /> {DAY_LABELS[offer.dayOfWeek]} {HALF_DAY_LABELS[offer.halfDay]}
                      </div>
                    </div>
                    <button className="btn btn-outline" style={{ padding: '0.25rem 0.5rem', fontSize: '0.8rem', borderColor: 'var(--color-error)', color: 'var(--color-error)' }} onClick={() => handleCancelOffer(offer.id)}>Annuler l'offre</button>
                  </div>

                  {offer.proposals.length > 0 && (
                    <div style={{ marginTop: '1rem', borderTop: '1px dashed var(--color-border)', paddingTop: '0.5rem' }}>
                      <p style={{ fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.5rem' }}>Propositions reçues :</p>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                        {offer.proposals.map(p => (
                          <div key={p.id} style={{ padding: '0.75rem', backgroundColor: '#fff', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-sm)' }}>
                            <div style={{ marginBottom: '0.5rem', fontSize: '0.9rem' }}>
                              <strong>{p.proposingParentName}</strong> propose :<br />
                              {p.offeredAssignmentId ? (
                                <span style={{ color: 'var(--color-primary)' }}><ArrowRightLeft size={12} style={{ display: 'inline', marginRight: '4px' }}/> {p.offeredDayOfWeek !== undefined && p.offeredDayOfWeek !== null ? DAY_LABELS[p.offeredDayOfWeek] : ''} {p.offeredHalfDay !== undefined && p.offeredHalfDay !== null ? HALF_DAY_LABELS[p.offeredHalfDay] : ''}</span>
                              ) : (
                                <span style={{ color: 'var(--color-success)' }}>Aucun retour (Remplacement gratuit)</span>
                              )}
                            </div>
                            <button className="btn btn-primary" style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem', width: '100%' }} onClick={() => handleValidateProposal(p.id)} disabled={validateProposalMutation.isPending}>
                              Accepter et Valider l'échange
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Autres offres */}
        <div className="glass-card" style={{ padding: '1.5rem' }}>
          <h2 style={{ fontSize: '1.2rem', marginBottom: '1rem', borderBottom: '1px solid var(--color-border)', paddingBottom: '0.5rem' }}>Permanences disponibles</h2>
          
          {otherOffers.length === 0 ? (
            <p style={{ color: 'var(--color-text-secondary)', fontStyle: 'italic' }}>Aucune offre disponible actuellement.</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {otherOffers.map(offer => {
                const myProposal = offer.proposals.find(p => p.proposingParentId === currentUser?.id);
                return (
                <div key={offer.id} style={{ border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)', padding: '1rem', backgroundColor: '#fff' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div>
                      <strong>Semaine {offer.weekNumber}</strong>
                      <div style={{ color: 'var(--color-text-secondary)', fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                        <Calendar size={14} /> {DAY_LABELS[offer.dayOfWeek]} {HALF_DAY_LABELS[offer.halfDay]}
                      </div>
                      <div style={{ color: 'var(--color-text-tertiary)', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '0.25rem', marginTop: '0.25rem' }}>
                        <User size={12} /> Proposé par {offer.offeringParentName}
                      </div>
                    </div>
                  </div>

                  {myProposal ? (
                    <div style={{ marginTop: '1rem', padding: '0.5rem', backgroundColor: 'var(--color-bg-tertiary)', borderRadius: 'var(--radius-sm)', fontSize: '0.85rem', textAlign: 'center', color: 'var(--color-primary)' }}>
                      Votre proposition a été envoyée. En attente de validation.
                    </div>
                  ) : takingOfferId === offer.id ? (
                    <div style={{ marginTop: '1rem', padding: '1rem', backgroundColor: 'var(--color-bg-secondary)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--color-border)' }}>
                      <p style={{ fontSize: '0.9rem', marginBottom: '0.5rem', fontWeight: 500 }}>Vous voulez cette permanence ?</p>
                      
                      {myChildren.length > 1 && (
                        <div style={{ marginBottom: '1rem' }}>
                          <label style={{ fontSize: '0.85rem', display: 'block', marginBottom: '0.25rem' }}>Pour quel enfant ?</label>
                          <select 
                            className="form-control" 
                            style={{ width: '100%', fontSize: '0.9rem', padding: '0.4rem' }}
                            value={selectedChild?.id || ''}
                            onChange={(e) => setSelectedChild(myChildren.find(c => c.id === e.target.value) || null)}
                          >
                            <option value="">-- Sélectionnez un enfant --</option>
                            {myChildren.map((c: any) => (
                              <option key={c.id} value={c.id}>{c.firstName} {c.lastName}</option>
                            ))}
                          </select>
                        </div>
                      )}

                      {childAssignments && childAssignments.length > 0 && (
                        <div style={{ marginBottom: '1rem' }}>
                          <label style={{ fontSize: '0.85rem', display: 'block', marginBottom: '0.25rem' }}>Proposer un troc avec l'une de vos permanences :</label>
                          <select 
                            className="form-control" 
                            style={{ width: '100%', fontSize: '0.9rem', padding: '0.4rem' }}
                            value={offeredAssignmentId}
                            onChange={(e) => setOfferedAssignmentId(e.target.value)}
                          >
                            <option value="">Aucun troc (Prendre la place)</option>
                            {childAssignments.map((a: any) => (
                              <option key={a.id} value={a.id}>{DAY_LABELS[a.dayOfWeek]} {HALF_DAY_LABELS[a.halfDay]}</option>
                            ))}
                          </select>
                        </div>
                      )}

                      <div style={{ display: 'flex', gap: '0.5rem' }}>
                        <button className="btn btn-primary" style={{ flex: 1, padding: '0.4rem', fontSize: '0.9rem' }} disabled={takeOfferMutation.isPending || !selectedChild} onClick={handleTakeOffer}>Confirmer</button>
                        <button className="btn btn-outline" style={{ padding: '0.4rem', fontSize: '0.9rem' }} onClick={() => { setTakingOfferId(null); setOfferedAssignmentId(''); }}>Annuler</button>
                      </div>
                    </div>
                  ) : (
                    <button className="btn btn-primary" style={{ marginTop: '1rem', width: '100%', padding: '0.4rem', fontSize: '0.9rem' }} onClick={() => {
                      setTakingOfferId(offer.id);
                      if (myChildren.length === 1) setSelectedChild(myChildren[0]);
                    }}>
                      Ça m'intéresse
                    </button>
                  )}
                </div>
              )})}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
