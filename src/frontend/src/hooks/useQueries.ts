import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { MeterReadings, UserProfile } from "../backend.d";
import { useActor } from "./useActor";

// ─── Entries ────────────────────────────────────────────────────────────────

export function useGetAllEntries() {
  const { actor, isFetching } = useActor();
  return useQuery({
    queryKey: ["entries"],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getAllEntries();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useUpsertEntry() {
  const { actor } = useActor();
  const qc = useQueryClient();
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
      if (!actor) throw new Error("Not connected");
      return actor.upsertEntry(month, year, meterReadings, otherCosts);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["entries"] });
      qc.invalidateQueries({ queryKey: ["monthlyConsumption"] });
      qc.invalidateQueries({ queryKey: ["globalMeterReadings"] });
    },
  });
}

export function useDeleteEntry() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ month, year }: { month: number; year: number }) => {
      if (!actor) throw new Error("Not connected");
      return actor.deleteEntry(month, year);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["entries"] });
      qc.invalidateQueries({ queryKey: ["monthlyConsumption"] });
    },
  });
}

export function useCalculateMonthlyConsumption(year: number, month: number) {
  const { actor, isFetching } = useActor();
  return useQuery({
    queryKey: ["monthlyConsumption", year, month],
    queryFn: async () => {
      if (!actor) return null;
      return actor.calculateMonthlyConsumption(year, month);
    },
    enabled: !!actor && !isFetching,
  });
}

// ─── User Profile ────────────────────────────────────────────────────────────

export function useGetCallerUserProfile() {
  const { actor, isFetching } = useActor();
  return useQuery({
    queryKey: ["userProfile"],
    queryFn: async () => {
      if (!actor) return null;
      return actor.getCallerUserProfile();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useSaveCallerUserProfile() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (profile: UserProfile) => {
      if (!actor) throw new Error("Not connected");
      return actor.saveCallerUserProfile(profile);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["userProfile"] });
    },
  });
}

// ─── Yearly Prices ───────────────────────────────────────────────────────────

export function useGetYearlyPrices(year: number) {
  const { actor, isFetching } = useActor();
  return useQuery({
    queryKey: ["yearlyPrices", year],
    queryFn: async () => {
      if (!actor) return null;
      return actor.getYearlyPrices(BigInt(year));
    },
    enabled: !!actor && !isFetching,
  });
}

export function useSetYearlyPrices() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      year,
      gasPrice,
      elecNormal,
      elecDal,
    }: {
      year: number;
      gasPrice: number;
      elecNormal: number;
      elecDal: number;
    }) => {
      if (!actor) throw new Error("Not connected");
      return actor.setYearlyPrices(BigInt(year), gasPrice, elecNormal, elecDal);
    },
    onSuccess: (_data, variables) => {
      qc.invalidateQueries({ queryKey: ["yearlyPrices", variables.year] });
    },
  });
}

// ─── Yearly Tax ──────────────────────────────────────────────────────────────

export function useGetYearlyTax(year: number) {
  const { actor, isFetching } = useActor();
  return useQuery({
    queryKey: ["yearlyTax", year],
    queryFn: async () => {
      if (!actor) return null;
      return actor.getYearlyTax(BigInt(year));
    },
    enabled: !!actor && !isFetching,
  });
}

export function useSetYearlyTax() {
  const { actor } = useActor();
  const qc = useQueryClient();
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
      if (!actor) throw new Error("Not connected");
      return actor.setYearlyTax(BigInt(year), energyTaxGas, energyTaxElec);
    },
    onSuccess: (_data, variables) => {
      qc.invalidateQueries({ queryKey: ["yearlyTax", variables.year] });
    },
  });
}

// ─── Yearly Starting Readings ─────────────────────────────────────────────────

export function useGetYearlyStartingReadings(year: number) {
  const { actor, isFetching } = useActor();
  return useQuery({
    queryKey: ["startingReadings", year],
    queryFn: async () => {
      if (!actor) return null;
      return actor.getYearlyStartingReadings(BigInt(year));
    },
    enabled: !!actor && !isFetching,
  });
}

export function useSetYearlyStartingReadings() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      year,
      readings,
    }: {
      year: number;
      readings: MeterReadings;
    }) => {
      if (!actor) throw new Error("Not connected");
      return actor.setYearlyStartingReadings(BigInt(year), readings);
    },
    onSuccess: (_data, variables) => {
      qc.invalidateQueries({ queryKey: ["startingReadings", variables.year] });
      qc.invalidateQueries({ queryKey: ["monthlyConsumption"] });
    },
  });
}

// ─── Global Meter Readings ────────────────────────────────────────────────────

export function useGetGlobalMeterReadings() {
  const { actor, isFetching } = useActor();
  return useQuery({
    queryKey: ["globalMeterReadings"],
    queryFn: async () => {
      if (!actor) return null;
      return actor.getGlobalMeterReadings();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useSetGlobalMeterReadings() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (readings: MeterReadings) => {
      if (!actor) throw new Error("Not connected");
      return actor.setGlobalMeterReadings(readings);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["globalMeterReadings"] });
    },
  });
}
