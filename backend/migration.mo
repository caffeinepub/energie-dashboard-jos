import Map "mo:core/Map";
import Principal "mo:core/Principal";
import Int "mo:core/Int";
import Nat "mo:core/Nat";
import Float "mo:core/Float";

module {
  type UserProfile = {
    name : Text;
    dashboardName : Text;
  };

  type YearlyTax = {
    year : Nat;
    energyTaxGas : Float;
    energyTaxElec : Float;
  };

  type YearlyPrices = {
    year : Nat;
    gasPricePerM3 : Float;
    elecPricePerKwh : Float;
  };

  type YearlyStartingReadings = {
    year : Nat;
    meterReadings : MeterReadings;
  };

  type OldEntry = {
    month : Nat8;
    year : Nat16;
    meterReadings : MeterReadings;
    monthlyGasPrice : ?Float;
    monthlyElecPrice : ?Float;
    monthlyEnergyTaxGas : ?Float;
    monthlyEnergyTaxElec : ?Float;
    otherCosts : Float;
  };

  type MeterReadings = {
    gas : Float;
    electricityNormal : Float;
    electricityHigh : Float;
  };

  type NewEntry = {
    month : Nat8;
    year : Nat16;
    meterReadings : MeterReadings;
    otherCosts : Float;
  };

  type OldActor = {
    userEntries : Map.Map<Principal, Map.Map<Int, OldEntry>>;
    userProfiles : Map.Map<Principal, UserProfile>;
    userYearlyTax : Map.Map<Principal, Map.Map<Nat, YearlyTax>>;
    userYearlyPrices : Map.Map<Principal, Map.Map<Nat, YearlyPrices>>;
    userYearlyStartingReadings : Map.Map<Principal, Map.Map<Nat, YearlyStartingReadings>>;
    userGlobalMeterReadings : Map.Map<Principal, MeterReadings>;
  };

  type NewActor = {
    userEntries : Map.Map<Principal, Map.Map<Int, NewEntry>>;
    userProfiles : Map.Map<Principal, UserProfile>;
    userYearlyTax : Map.Map<Principal, Map.Map<Nat, YearlyTax>>;
    userYearlyPrices : Map.Map<Principal, Map.Map<Nat, YearlyPrices>>;
    userYearlyStartingReadings : Map.Map<Principal, Map.Map<Nat, YearlyStartingReadings>>;
    userGlobalMeterReadings : Map.Map<Principal, MeterReadings>;
  };

  public func run(old : OldActor) : NewActor {
    let newEntries = old.userEntries.map<Principal, Map.Map<Int, OldEntry>, Map.Map<Int, NewEntry>>(
      func(_p, oldMap) {
        oldMap.map<Int, OldEntry, NewEntry>(
          func(_k, oldEntry) {
            {
              month = oldEntry.month;
              year = oldEntry.year;
              meterReadings = oldEntry.meterReadings;
              otherCosts = oldEntry.otherCosts;
            };
          }
        );
      }
    );
    let newState = {
      old with
      userEntries = newEntries;
    };
    newState;
  };
};
