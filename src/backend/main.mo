import Map "mo:core/Map";
import Principal "mo:core/Principal";
import Runtime "mo:core/Runtime";
import Int "mo:core/Int";
import Nat "mo:core/Nat";
import Float "mo:core/Float";
import Iter "mo:core/Iter";


import AccessControl "authorization/access-control";
import MixinAuthorization "authorization/MixinAuthorization";

// Apply migration

actor {
  type MeterReadings = {
    gas : Float;
    electricityNormal : Float;
    electricityHigh : Float;
  };

  public type Entry = {
    month : Nat8; // 1-12
    year : Nat16;
    meterReadings : MeterReadings;
    otherCosts : Float;
  };

  public type Consumption = {
    gas : Float;
    electricityNormal : Float;
    electricityHigh : Float;
  };

  public type Costs = {
    gasCostTotal : Float;
    electricityCostTotal : Float;
    yearlyPrognosis : YearlyPrognosis;
    totalOtherCosts : Float;
  };

  public type YearlyPrognosis = {
    estimatedTotalGasCost : Float;
    estimatedTotalElectricityCost : Float;
    estimatedTotalOtherCosts : Float;
    totalMonthsEntered : Nat;
  };

  public type UserProfile = {
    name : Text;
    dashboardName : Text;
  };

  public type YearlyTax = {
    year : Nat;
    energyTaxGas : Float;
    energyTaxElec : Float;
  };

  public type YearlyPrices = {
    year : Nat;
    gasPricePerM3 : Float;
    electricityNormal : Float; // €
    electricityDal : Float; // €
  };

  public type YearlyStartingReadings = {
    year : Nat;
    meterReadings : MeterReadings;
  };

  public type GlobalMeterReadings = MeterReadings;

  let accessControlState = AccessControl.initState();
  include MixinAuthorization(accessControlState);

  func calculateKey(year : Nat16, month : Nat8) : Int {
    year.toNat() * 100 + month.toNat();
  };

  let userEntries = Map.empty<Principal, Map.Map<Int, Entry>>();
  let userProfiles = Map.empty<Principal, UserProfile>();
  let userYearlyTax = Map.empty<Principal, Map.Map<Nat, YearlyTax>>();
  let userYearlyPrices = Map.empty<Principal, Map.Map<Nat, YearlyPrices>>();
  let userYearlyStartingReadings = Map.empty<Principal, Map.Map<Nat, YearlyStartingReadings>>();
  let userGlobalMeterReadings = Map.empty<Principal, GlobalMeterReadings>();

  // User Profile Management
  public query ({ caller }) func getCallerUserProfile() : async ?UserProfile {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view profiles");
    };
    userProfiles.get(caller);
  };

  public query ({ caller }) func getUserProfile(user : Principal) : async ?UserProfile {
    if (caller != user and not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Can only view your own profile");
    };
    userProfiles.get(user);
  };

  public shared ({ caller }) func saveCallerUserProfile(profile : UserProfile) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can save profiles");
    };
    userProfiles.add(caller, profile);
  };

  // Yearly Price & Tax Management
  public shared ({ caller }) func setYearlyPrices(year : Nat, gasPrice : Float, elecNormal : Float, elecDal : Float) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can set prices");
    };

    let newPrices : YearlyPrices = {
      year;
      gasPricePerM3 = gasPrice;
      electricityNormal = elecNormal;
      electricityDal = elecDal;
    };

    let existingPrices = switch (userYearlyPrices.get(caller)) {
      case (null) { Map.empty<Nat, YearlyPrices>() };
      case (?prices) { prices };
    };

    existingPrices.add(year, newPrices);
    userYearlyPrices.add(caller, existingPrices);
  };

  public query ({ caller }) func getYearlyPrices(year : Nat) : async ?YearlyPrices {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can get prices");
    };

    switch (userYearlyPrices.get(caller)) {
      case (null) { null };
      case (?prices) { prices.get(year) };
    };
  };

  public shared ({ caller }) func setYearlyTax(year : Nat, energyTaxGas : Float, energyTaxElec : Float) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can set energy tax");
    };

    let newTax : YearlyTax = {
      year;
      energyTaxGas;
      energyTaxElec;
    };

    let existingTaxes = switch (userYearlyTax.get(caller)) {
      case (null) { Map.empty<Nat, YearlyTax>() };
      case (?taxes) { taxes };
    };

    existingTaxes.add(year, newTax);
    userYearlyTax.add(caller, existingTaxes);
  };

  public query ({ caller }) func getYearlyTax(year : Nat) : async ?YearlyTax {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can get energy tax");
    };

    switch (userYearlyTax.get(caller)) {
      case (null) { null };
      case (?taxes) { taxes.get(year) };
    };
  };

  // Starting Readings & Global Readings Management
  public shared ({ caller }) func setYearlyStartingReadings(year : Nat, readings : MeterReadings) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can set readings");
    };

    let newStart : YearlyStartingReadings = {
      year;
      meterReadings = readings;
    };

    let existing = switch (userYearlyStartingReadings.get(caller)) {
      case (null) { Map.empty<Nat, YearlyStartingReadings>() };
      case (?entries) { entries };
    };

    existing.add(year, newStart);
    userYearlyStartingReadings.add(caller, existing);
  };

  public query ({ caller }) func getYearlyStartingReadings(year : Nat) : async ?YearlyStartingReadings {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can get readings");
    };

    switch (userYearlyStartingReadings.get(caller)) {
      case (null) { null };
      case (?entries) { entries.get(year) };
    };
  };

  public shared ({ caller }) func setGlobalMeterReadings(readings : GlobalMeterReadings) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can set global readings");
    };
    userGlobalMeterReadings.add(caller, readings);
  };

  public query ({ caller }) func getGlobalMeterReadings() : async ?GlobalMeterReadings {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can get global readings");
    };
    userGlobalMeterReadings.get(caller);
  };

  // CRUD operations for Entries
  public shared ({ caller }) func upsertEntry(
    month : Nat8,
    year : Nat16,
    meterReadings : MeterReadings,
    otherCosts : Float,
  ) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can add entries");
    };
    if (month < 1 or month > 12) {
      Runtime.trap("Month must be between 1 and 12");
    };

    let entry : Entry = {
      month;
      year;
      meterReadings;
      otherCosts;
    };

    let existingEntries = switch (userEntries.get(caller)) {
      case (null) { Map.empty<Int, Entry>() };
      case (?entries) { entries };
    };

    existingEntries.add(calculateKey(year, month), entry);
    userEntries.add(caller, existingEntries);

    // Update global meter readings for current year (highest)
    updateGlobalFromLatestEntry(caller, year);
  };

  public shared ({ caller }) func deleteEntry(month : Nat8, year : Nat16) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can delete entries");
    };
    switch (userEntries.get(caller)) {
      case (null) { Runtime.trap("No entries found for user") };
      case (?entries) {
        if (not entries.containsKey(calculateKey(year, month))) {
          Runtime.trap("Entry does not exist");
        };
        entries.remove(calculateKey(year, month));
      };
    };
  };

  public query ({ caller }) func getAllEntries() : async [Entry] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view entries");
    };
    switch (userEntries.get(caller)) {
      case (null) { [] };
      case (?entries) {
        entries.values().toArray();
      };
    };
  };

  // Update global meter readings to latest in a given year
  func compareMonths(a : Nat8, b : Nat8) : { #greater; #less; #equal } {
    if (a > b) { #greater } else if (a < b) { #less } else { #equal };
  };

  func updateGlobalFromLatestEntry(caller : Principal, year : Nat16) {
    switch (userEntries.get(caller)) {
      case (null) {};
      case (?entries) {
        let yearEntries = entries.filter(func(key, entry) { entry.year == year });
        if (yearEntries.size() == 0) { return };
        let latestEntry = yearEntries.values().max(
          func(a, b) { compareMonths(a.month, b.month) },
        );
        switch (latestEntry) {
          case (null) {};
          case (?entry) { userGlobalMeterReadings.add(caller, entry.meterReadings) };
        };
      };
    };
  };

  // Cost & Consumption Calculation
  public query ({ caller }) func calculateCosts(
    defaultGasPricePerM3 : Float,
    defaultElectricityNormalPricePerKwh : Float,
    defaultElectricityDalPricePerKwh : Float,
    year : Nat16,
  ) : async Costs {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can calculate costs");
    };
    switch (userEntries.get(caller)) {
      case (null) {
        Runtime.trap("No entries found for user");
      };
      case (?entries) {
        let filteredEntries = entries.values().filter(
          func(entry) { entry.year == year }
        );

        var totalOtherCosts = 0.0;
        var monthsEntered = 0;
        var totalGasCost = 0.0;
        var totalElectricityCost = 0.0;

        filteredEntries.forEach(
          func(_entry) {
            monthsEntered += 1;
            // Cost calculation will be handled in frontend
          }
        );

        let yearlyPrognosis = if (monthsEntered > 0) {
          let scale = 12.0 / monthsEntered.toFloat();
          {
            estimatedTotalGasCost = totalGasCost * scale;
            estimatedTotalElectricityCost = totalElectricityCost * scale;
            estimatedTotalOtherCosts = totalOtherCosts * scale;
            totalMonthsEntered = monthsEntered;
          };
        } else {
          { estimatedTotalGasCost = 0.0; estimatedTotalElectricityCost = 0.0; estimatedTotalOtherCosts = 0.0; totalMonthsEntered = 0 };
        };

        {
          gasCostTotal = totalGasCost;
          electricityCostTotal = totalElectricityCost;
          yearlyPrognosis;
          totalOtherCosts;
        };
      };
    };
  };

  // Helper to calculate monthly consumption (deltas from meter readings)
  public query ({ caller }) func calculateMonthlyConsumption(year : Nat16, month : Nat8) : async ?Consumption {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can calculate consumption");
    };
    calculateMonthlyConsumptionInternal(caller, year, month);
  };

  func calculateMonthlyConsumptionInternal(caller : Principal, year : Nat16, month : Nat8) : ?Consumption {
    switch (userEntries.get(caller)) {
      case (null) { null };
      case (?entries) {
        let currentKey = calculateKey(year, month);
        let prevYear : ?Nat16 = if (month > 1) { ?year } else if (year > 0) { ?(year - 1 : Nat16) } else { null };
        let prevKey = switch (prevYear) {
          case (null) { null };
          case (?y) { ?calculateKey(y, if (month > 1) { month - 1 : Nat8 } else { 12 }) };
        };

        switch (entries.get(currentKey)) {
          case (null) { null };
          case (?currentEntry) {
            switch (prevKey) {
              case (null) { null };
              case (?key) {
                switch (entries.get(key)) {
                  case (null) {
                    let prevReadings = if (month == 1) {
                      switch (userYearlyStartingReadings.get(caller)) {
                        case (null) { null };
                        case (?yearEntries) {
                          switch (yearEntries.get(year.toNat())) {
                            case (null) { null };
                            case (?startReadings) { ?startReadings.meterReadings };
                          };
                        };
                      };
                    } else { null };
                    switch (prevReadings) {
                      case (null) { null };
                      case (?prev) {
                        let gas = getDelta(prev.gas, currentEntry.meterReadings.gas);
                        let elecNormal = getDelta(
                          prev.electricityNormal,
                          currentEntry.meterReadings.electricityNormal,
                        );
                        let elecHigh = getDelta(prev.electricityHigh, currentEntry.meterReadings.electricityHigh);
                        ?{
                          gas;
                          electricityNormal = elecNormal;
                          electricityHigh = elecHigh;
                        };
                      };
                    };
                  };
                  case (?prevEntry) {
                    let gas = getDelta(prevEntry.meterReadings.gas, currentEntry.meterReadings.gas);
                    let elecNormal = getDelta(
                      prevEntry.meterReadings.electricityNormal,
                      currentEntry.meterReadings.electricityNormal,
                    );
                    let elecHigh = getDelta(prevEntry.meterReadings.electricityHigh, currentEntry.meterReadings.electricityHigh);
                    ?{
                      gas;
                      electricityNormal = elecNormal;
                      electricityHigh = elecHigh;
                    };
                  };
                };
              };
            };
          };
        };
      };
    };
  };

  func getDelta(prev : Float, current : Float) : Float {
    Float.max(0, current - prev);
  };
};
