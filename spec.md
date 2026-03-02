# Specification

## Summary
**Goal:** Fix broken gas and electricity cost calculations in the energy dashboard, and add a new usage analysis view with consumption breakdowns.

**Planned changes:**
- Fix monthly gas cost calculation: consumption delta (m³) × gas price (€/m³) per year
- Fix monthly electricity cost calculation: consumption delta (kWh) × electricity price (€/kWh) per year
- Apply per-month price overrides when present, otherwise use yearly defaults
- Ensure SummaryOverview KPI cards (gas costs, electricity costs, total energy costs, yearly prognosis) display correct values
- Fix CostChart to display correct monthly cost lines for gas, electricity, and other costs
- Add a new "Analyse" tab/section accessible from the main navigation
- Display monthly and yearly totals for electricity high tariff (kWh), electricity low tariff (kWh), combined electricity total (kWh), and gas (m³) in the analysis view
- Filter analysis data by the currently selected year

**User-visible outcome:** Cost KPI cards and charts show correct calculated values, and users can navigate to a new "Analyse" section to view detailed energy consumption breakdowns by tariff type and gas usage, both per month and as yearly totals.
