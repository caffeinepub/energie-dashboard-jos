import { useQueries } from "@tanstack/react-query";
import { useMemo } from "react";
import type { Consumption, Entry } from "../backend.d";
import { useActor } from "./useActor";

export interface MonthlyData {
  month: number;
  consumption: Consumption | null;
  entry: Entry | null;
}

export function useConsumptionData(year: number, entries: Entry[]) {
  const { actor, isFetching } = useActor();

  const yearEntries = useMemo(
    () => entries.filter((e) => e.year === year),
    [entries, year],
  );

  const months = useMemo(() => yearEntries.map((e) => e.month), [yearEntries]);

  const consumptionQueries = useQueries({
    queries: months.map((month) => ({
      queryKey: ["monthlyConsumption", year, month],
      queryFn: async () => {
        if (!actor) return null;
        const result = await actor.calculateMonthlyConsumption(year, month);
        return result ?? null;
      },
      enabled: !!actor && !isFetching,
    })),
  });

  const consumptionByMonth = useMemo(() => {
    const map = new Map<number, Consumption | null>();
    months.forEach((month, i) => {
      map.set(month, consumptionQueries[i]?.data ?? null);
    });
    return map;
  }, [months, consumptionQueries]);

  const isLoading = consumptionQueries.some((q) => q.isLoading);

  return { consumptionByMonth, isLoading, yearEntries };
}

// Dutch month names
export const MONTHS = [
  "Januari",
  "Februari",
  "Maart",
  "April",
  "Mei",
  "Juni",
  "Juli",
  "Augustus",
  "September",
  "Oktober",
  "November",
  "December",
];

export function formatNL(value: number, decimals = 2): string {
  return new Intl.NumberFormat("nl-NL", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(value);
}

export function formatCurrency(value: number): string {
  return new Intl.NumberFormat("nl-NL", {
    style: "currency",
    currency: "EUR",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}

export interface MonthlyCost {
  gasCost: number;
  elecNormalCost: number;
  elecDalCost: number;
  otherCosts: number;
  total: number;
}

export function calculateMonthlyCost(
  consumption: Consumption,
  gasPricePerM3: number,
  elecNormalPrice: number,
  elecDalPrice: number,
  energyTaxGas: number,
  energyTaxElec: number,
  otherCosts: number,
): MonthlyCost {
  const gasCost = consumption.gas * (gasPricePerM3 + energyTaxGas);
  const elecNormalCost =
    consumption.electricityNormal * (elecNormalPrice + energyTaxElec);
  const elecDalCost =
    consumption.electricityHigh * (elecDalPrice + energyTaxElec);

  return {
    gasCost,
    elecNormalCost,
    elecDalCost,
    otherCosts,
    total: gasCost + elecNormalCost + elecDalCost + otherCosts,
  };
}
