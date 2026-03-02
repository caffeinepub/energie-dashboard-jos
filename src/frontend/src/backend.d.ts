import type { Principal } from "@icp-sdk/core/principal";
export interface Some<T> {
    __kind__: "Some";
    value: T;
}
export interface None {
    __kind__: "None";
}
export type Option<T> = Some<T> | None;
export interface YearlyStartingReadings {
    meterReadings: MeterReadings;
    year: bigint;
}
export interface GlobalMeterReadings {
    gas: number;
    electricityNormal: number;
    electricityHigh: number;
}
export interface YearlyPrognosis {
    estimatedTotalOtherCosts: number;
    estimatedTotalGasCost: number;
    totalMonthsEntered: bigint;
    estimatedTotalElectricityCost: number;
}
export interface MeterReadings {
    gas: number;
    electricityNormal: number;
    electricityHigh: number;
}
export interface Entry {
    month: number;
    otherCosts: number;
    meterReadings: MeterReadings;
    year: number;
}
export interface Consumption {
    gas: number;
    electricityNormal: number;
    electricityHigh: number;
}
export interface YearlyPrices {
    gasPricePerM3: number;
    year: bigint;
    electricityNormal: number;
    electricityDal: number;
}
export interface YearlyTax {
    year: bigint;
    energyTaxGas: number;
    energyTaxElec: number;
}
export interface UserProfile {
    name: string;
    dashboardName: string;
}
export interface Costs {
    gasCostTotal: number;
    yearlyPrognosis: YearlyPrognosis;
    totalOtherCosts: number;
    electricityCostTotal: number;
}
export enum UserRole {
    admin = "admin",
    user = "user",
    guest = "guest"
}
export interface backendInterface {
    assignCallerUserRole(user: Principal, role: UserRole): Promise<void>;
    calculateCosts(defaultGasPricePerM3: number, defaultElectricityNormalPricePerKwh: number, defaultElectricityDalPricePerKwh: number, year: number): Promise<Costs>;
    calculateMonthlyConsumption(year: number, month: number): Promise<Consumption | null>;
    deleteEntry(month: number, year: number): Promise<void>;
    getAllEntries(): Promise<Array<Entry>>;
    getCallerUserProfile(): Promise<UserProfile | null>;
    getCallerUserRole(): Promise<UserRole>;
    getGlobalMeterReadings(): Promise<GlobalMeterReadings | null>;
    getUserProfile(user: Principal): Promise<UserProfile | null>;
    getYearlyPrices(year: bigint): Promise<YearlyPrices | null>;
    getYearlyStartingReadings(year: bigint): Promise<YearlyStartingReadings | null>;
    getYearlyTax(year: bigint): Promise<YearlyTax | null>;
    isCallerAdmin(): Promise<boolean>;
    saveCallerUserProfile(profile: UserProfile): Promise<void>;
    setGlobalMeterReadings(readings: GlobalMeterReadings): Promise<void>;
    setYearlyPrices(year: bigint, gasPrice: number, elecNormal: number, elecDal: number): Promise<void>;
    setYearlyStartingReadings(year: bigint, readings: MeterReadings): Promise<void>;
    setYearlyTax(year: bigint, energyTaxGas: number, energyTaxElec: number): Promise<void>;
    upsertEntry(month: number, year: number, meterReadings: MeterReadings, otherCosts: number): Promise<void>;
}
