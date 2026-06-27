import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../api/client';
import { ExchangeOffer, Child } from '../types';

export function useExchangeOffers() {
  return useQuery({
    queryKey: ['exchange-offers'],
    queryFn: async () => {
      const res = await apiClient.get('/exchange/offers');
      return res.data.offers as ExchangeOffer[];
    }
  });
}

export function useChildAssignmentsForExchange(selectedChild: Child | null, takingOfferId: string | null, offersData?: ExchangeOffer[]) {
  return useQuery({
    queryKey: ['child-assignments', selectedChild?.id, takingOfferId],
    queryFn: async () => {
      if (!selectedChild || !takingOfferId) return null;
      const offer = offersData?.find(o => o.id === takingOfferId);
      if (!offer) return null;
      const planningRes = await apiClient.get(`/planning/${offer.weekId}`);
      
      const assignments: any[] = [];
      planningRes.data.slots.forEach((s: any) => {
        const myAssignment = s.assignments?.find((a: any) => a.child.id === selectedChild.id);
        if (myAssignment && !myAssignment.isOfferedForExchange) {
          assignments.push({
            id: myAssignment.id,
            dayOfWeek: s.dayOfWeek,
            halfDay: s.halfDay
          });
        }
      });
      return assignments;
    },
    enabled: !!selectedChild && !!takingOfferId
  });
}

export function useTakeOffer() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ takingOfferId, payload }: { takingOfferId: string, payload: { childId: string, offeredAssignmentId?: string } }) => {
      return apiClient.post(`/exchange/offers/${takingOfferId}/take`, payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['exchange-offers'] });
    }
  });
}

export function useCancelOffer() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (offerId: string) => {
      return apiClient.delete(`/exchange/offers/${offerId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['exchange-offers'] });
    }
  });
}

export function useValidateProposal() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (proposalId: string) => {
      return apiClient.post(`/exchange/proposals/${proposalId}/validate`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['exchange-offers'] });
    }
  });
}
