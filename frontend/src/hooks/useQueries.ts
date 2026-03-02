import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useActor } from './useActor';
import type { Entry, YearlyTax, YearlyPrices, MeterReadings, YearlyStartingReadings, GlobalMeterReadings, Consumption, UserProfile } from '../backend';

export function useGetAllEntries() {
  const { actor, isFetching } = useActor();
  return useQuery<Entry[]>({
    queryKey: ['entries'],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getAllEntries();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useUpsertEntry() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      month,
      year,
      meterReadings,
      otherCosts,
    }: {
      month: number;
      year: number;
      meterReadings: MeterReadings;
      otherCosts: number;
    }) => {
      if (!actor) throw new Error('Actor not initialized');
      await actor.upsertEntry(month, year, meterReadings, otherCosts);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['entries'] });
      queryClient.invalidateQueries({ queryKey: ['monthlyConsumption'] });
      queryClient.invalidateQueries({ queryKey: ['globalMeterReadings'] });
    },
  });
}

export function useDeleteEntry() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ month, year }: { month: number; year: number }) => {
      if (!actor) throw new Error('Actor not initialized');
      await actor.deleteEntry(month, year);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['entries'] });
      queryClient.invalidateQueries({ queryKey: ['monthlyConsumption'] });
    },
  });
}

export function useCalculateMonthlyConsumption(year: number, month: number) {
  const { actor, isFetching } = useActor();
  return useQuery<Consumption | null>({
    queryKey: ['monthlyConsumption', year, month],
    queryFn: async () => {
      if (!actor) return null;
      return actor.calculateMonthlyConsumption(year, month);
    },
    enabled: !!actor && !isFetching && year > 0 && month >= 1 && month <= 12,
  });
}

export function useGetCallerUserProfile() {
  const { actor, isFetching } = useActor();
  const query = useQuery<UserProfile | null>({
    queryKey: ['currentUserProfile'],
    queryFn: async () => {
      if (!actor) throw new Error('Actor not available');
      return actor.getCallerUserProfile();
    },
    enabled: !!actor && !isFetching,
    retry: false,
  });
  return {
    ...query,
    isLoading: isFetching || query.isLoading,
    isFetched: !!actor && query.isFetched,
  };
}

export function useSaveCallerUserProfile() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (profile: UserProfile) => {
      if (!actor) throw new Error('Actor not initialized');
      await actor.saveCallerUserProfile(profile);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['currentUserProfile'] });
    },
  });
}

/**
 * Convenience hook: reads the dashboardName field from the user profile.
 * Returns null while loading or if no profile exists.
 */
export function useGetDashboardName() {
  const { actor, isFetching } = useActor();
  return useQuery<string | null>({
    queryKey: ['dashboardName'],
    queryFn: async () => {
      if (!actor) return null;
      const profile = await actor.getCallerUserProfile();
      return profile?.dashboardName ?? null;
    },
    enabled: !!actor && !isFetching,
  });
}

/**
 * Convenience mutation: saves the dashboardName by updating the user profile.
 * Preserves the existing name field if already set.
 */
export function useSetDashboardName() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (dashboardName: string) => {
      if (!actor) throw new Error('Actor not initialized');
      const existing = await actor.getCallerUserProfile();
      const profile: UserProfile = {
        name: existing?.name ?? '',
        dashboardName,
      };
      await actor.saveCallerUserProfile(profile);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dashboardName'] });
      queryClient.invalidateQueries({ queryKey: ['currentUserProfile'] });
    },
  });
}

export function useGetYearlyTax(year: number) {
  const { actor, isFetching } = useActor();
  return useQuery<YearlyTax | null>({
    queryKey: ['yearlyTax', year],
    queryFn: async () => {
      if (!actor) return null;
      return actor.getYearlyTax(BigInt(year));
    },
    enabled: !!actor && !isFetching,
  });
}

export function useSetYearlyTax() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      year,
      energyTaxGas,
      energyTaxElec,
    }: {
      year: number;
      energyTaxGas: number;
      energyTaxElec: number;
    }) => {
      if (!actor) throw new Error('Actor not initialized');
      await actor.setYearlyTax(BigInt(year), energyTaxGas, energyTaxElec);
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['yearlyTax', variables.year] });
    },
  });
}

export function useGetYearlyPrices(year: number) {
  const { actor, isFetching } = useActor();
  return useQuery<YearlyPrices | null>({
    queryKey: ['yearlyPrices', year],
    queryFn: async () => {
      if (!actor) return null;
      return actor.getYearlyPrices(BigInt(year));
    },
    enabled: !!actor && !isFetching,
  });
}

export function useSetYearlyPrices() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      year,
      gasPricePerM3,
      elecPricePerKwh,
    }: {
      year: number;
      gasPricePerM3: number;
      elecPricePerKwh: number;
    }) => {
      if (!actor) throw new Error('Actor not initialized');
      await actor.setYearlyPrices(BigInt(year), gasPricePerM3, elecPricePerKwh);
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['yearlyPrices', variables.year] });
    },
  });
}

export function useGetYearlyStartingReadings(year: number) {
  const { actor, isFetching } = useActor();
  return useQuery<YearlyStartingReadings | null>({
    queryKey: ['yearlyStartingReadings', year],
    queryFn: async () => {
      if (!actor) return null;
      return actor.getYearlyStartingReadings(BigInt(year));
    },
    enabled: !!actor && !isFetching,
  });
}

export function useSetYearlyStartingReadings() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      year,
      readings,
    }: {
      year: number;
      readings: MeterReadings;
    }) => {
      if (!actor) throw new Error('Actor not initialized');
      await actor.setYearlyStartingReadings(BigInt(year), readings);
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['yearlyStartingReadings', variables.year] });
      queryClient.invalidateQueries({ queryKey: ['monthlyConsumption'] });
    },
  });
}

export function useGetGlobalMeterReadings() {
  const { actor, isFetching } = useActor();
  return useQuery<GlobalMeterReadings | null>({
    queryKey: ['globalMeterReadings'],
    queryFn: async () => {
      if (!actor) return null;
      return actor.getGlobalMeterReadings();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useSetGlobalMeterReadings() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (readings: GlobalMeterReadings) => {
      if (!actor) throw new Error('Actor not initialized');
      await actor.setGlobalMeterReadings(readings);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['globalMeterReadings'] });
    },
  });
}
