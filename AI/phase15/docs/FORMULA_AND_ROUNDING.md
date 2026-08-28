# Phase 15 — Deterministic Formula and Rounding Policy

## 1. Authoritative Cost-Plus-Markup Formula

All monetary calculations use Python `Decimal` with zero floating-point imprecision.

$$\text{Material Cost} = \sum_{i} (\text{Unit Quantity}_i \times \text{Cost Per Unit}_i)$$

For batch materials:
$$\text{Unit Quantity}_i = \frac{\text{Batch Quantity}_i}{\text{Batch Units}}$$

$$\text{Labour Cost} = \sum_{j} (\text{Labour Hours}_j \times \text{Hourly Wage Rate}_j)$$

$$\text{Total Overhead} = \sum_{k} \text{Overhead Amount}_k$$

$$\text{Total Packaging} = \sum_{m} \text{Packaging Cost}_m$$

$$\text{Production Cost Floor} = \text{Material Cost} + \text{Labour Cost} + \text{Total Overhead} + \text{Total Packaging}$$

$$\text{Profit Amount} = \text{Production Cost Floor} \times \frac{\text{Profit Markup Percentage}}{100}$$

$$\text{Cost-based Base Estimate} = \text{Production Cost Floor} + \text{Profit Amount}$$

---

## 2. Profit Markup (%) vs Profit Margin Distinction

- **Profit Markup (%)**: Profit expressed as a percentage of creation costs.
  $$\text{Markup} = \frac{\text{Selling Price} - \text{Cost Floor}}{\text{Cost Floor}} \times 100$$
  *Example*: ₹450 cost floor with 20% markup gives ₹90 profit and ₹540 base price.

- **Profit Margin (%)**: Profit expressed as a percentage of selling price.
  $$\text{Margin} = \frac{\text{Selling Price} - \text{Cost Floor}}{\text{Selling Price}} \times 100$$
  *Example*: ₹90 profit on ₹540 selling price corresponds to a 16.67% profit margin.

The system strictly labels and computes **Profit Markup (%)** to prevent confusion.

---

## 3. Decimal Rounding Policy

1. **Internal Precision**: All subtotal additions, multiplications, and divisions are computed at full Python `Decimal` precision.
2. **Display Rounding**: Retail prices in INR are rounded to the nearest integer Rupee using standard `ROUND_HALF_UP` arithmetic:
   - ₹539.49 $\to$ ₹539
   - ₹539.50 $\to$ ₹540
   - ₹539.51 $\to$ ₹540
3. **Difference Preservation**: Both unrounded and rounded values, along with their exact `rounding_difference`, are returned in the API response.
