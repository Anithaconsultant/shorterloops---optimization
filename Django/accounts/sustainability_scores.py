"""Sustainability metrics for ShorterLoops.

Cycle convention
----------------
Cycle 1: day 0 through day 30 (inclusive)
Cycle 2: day 31 through day 60 (inclusive)
Cycle 3: day 61 through day 90 (inclusive), and so on.

Important data notes
--------------------
* Cashflow records identify refilling-station shampoo refills by Purpose and
  TransactionId. The current Cashflow model does not store refill ml or brand.
* Refill volume is therefore reconstructed from Amount and Shampooprice using
  the same calculation used by RefillService. Reconstruction is limited to
  1..500 ml and is accepted only when the matching quantity is unambiguous.
* An Asset's Transaction_Id and Content_Code are overwritten by a later refill.
  A matching current Asset can identify the brand for that transaction, but an
  older overwritten transaction may need price-only inference. Current prices
  cannot guarantee the historical price if the price table has since changed.
* Current_PlantRefill_Count == 1 is the workbook's plant-refilled rule.

This module is read-only: it calculates metrics and does not update records.
"""

from collections import defaultdict
import math
import re

from .models import Asset, Cashflow, Shampooprice


# ---------------------------------------------------------------------------
# Workbook / application constants
# ---------------------------------------------------------------------------

BOTTLE_TYPES = ["BVB", "BVFB", "BRCB", "BRFB", "UVB", "UVFB", "URCB", "URFB"]

# The six metrics shown as the primary sustainability score set.
CURRENT_METRICS = [
    "affinityVirginMaterials",
    "affinityFancyPackaging",
    "reuseMindset",
    "careForMaterials",
    "savingsInWallet",
    "avoidedEmissions",
]

METRIC_LABELS = {
    "affinityVirginMaterials": "Affinity for virgin materials",
    "affinityFancyPackaging": "Affinity for fancy packaging",
    "reuseMindset": "Reuse mindset",
    "careForMaterials": "Care for materials",
    "savingsInWallet": "Savings in wallet",
    "avoidedEmissions": "Avoided emissions",
    "civicSense": "Civic sense",
}

REFILL_PURPOSE = "Refilling shampoo from the Refilling Station"
MAX_REFILL_ML = 500
REFILL_PRICE_ROUNDING_DIGITS = 2

# Bottle footprints from the workbook's carbon-emissions calculation.
EMISSIONS_KG = {
    "BVB": 0.17225,  # branded virgin
    "UVB": 0.13250,  # universal virgin
    "BRCB": 0.07800,  # branded recycled
    "URCB": 0.06000,  # universal recycled
}
REFILL_CLEANING_EMISSIONS_KG = 0.012

RETURN_DESTINATIONS = {
    "return conveyor",
    "bottle reverse vending machine",
    "reverse vending",
    "returnconveyor",
}
STREET_DESTINATIONS = {"street"}
BIN_DESTINATIONS = {"city dustbin", "dustbin", "public dustbin"}
TRUCK_DESTINATIONS = {"garbage truck", "landfill", "municipality landfill"}

BRAND_CODES = {f"B{i}" for i in range(1, 6)}


# ---------------------------------------------------------------------------
# Basic normalisation / safe numeric conversion
# ---------------------------------------------------------------------------

def number(value):
    """Convert a model value to float; empty or invalid values become 0."""
    try:
        if value is None or value == "":
            return 0.0
        return float(str(value).replace(",", "").strip())
    except (TypeError, ValueError):
        return 0.0


def integer(value):
    """Convert a model value to int; empty or invalid values become 0."""
    try:
        if value is None or value == "":
            return 0
        return int(float(str(value).strip()))
    except (TypeError, ValueError):
        return 0


def _normalise_text(value):
    return " ".join(str(value or "").strip().lower().split())


def _normalise_code(value):
    return str(value or "").strip().upper()


def _brand_code(value):
    """Extract B1..B5 from values such as B1, B1.V, or B1 Shampoo."""
    text = _normalise_code(value)
    match = re.search(r"(?:^|[^A-Z0-9])(B[1-5])(?:$|[^A-Z0-9])", text)
    return match.group(1) if match else None


def percentage(numerator, denominator):
    if denominator <= 0:
        return None
    return (numerator / denominator) * 100.0


# ---------------------------------------------------------------------------
# 30-day cycle / transaction ID handling
# ---------------------------------------------------------------------------

def transaction_day(transaction_id, city_id):
    """Read day number from TransactionId: cityid_day_hh:mm_... ."""
    parts = str(transaction_id or "").split("_")
    if len(parts) < 3:
        return None
    if parts[0] != str(city_id):
        return None
    if not parts[1].isdigit():
        return None
    day = int(parts[1])
    return day if day >= 0 else None


def cycle_index(day):
    """Return zero-based cycle index for a day; invalid days return None."""
    try:
        day = int(day)
    except (TypeError, ValueError):
        return None
    if day < 0:
        return None
    if day <= 30:
        return 0
    return (day - 1) // 30


def cycle_bounds(index):
    """Return inclusive day bounds for a zero-based cycle index."""
    index = int(index)
    if index < 0:
        raise ValueError("Cycle index cannot be negative")
    if index == 0:
        return 0, 30
    return index * 30 + 1, (index + 1) * 30


def filter_cashflows_for_cycle(cashflows, city_id, start_day, end_day):
    """Filter Cashflow rows using the city/day encoded in TransactionId."""
    filtered = []
    for tx in cashflows:
        day = transaction_day(getattr(tx, "TransactionId", ""), city_id)
        if day is not None and start_day <= day <= end_day:
            filtered.append(tx)
    return filtered


def filter_assets_for_cycle(assets, city_id, start_day, end_day):
    """Filter Asset rows using the city/day encoded in Transaction_Id."""
    filtered = []
    for asset in assets:
        day = transaction_day(getattr(asset, "Transaction_Id", ""), city_id)
        if day is not None and start_day <= day <= end_day:
            filtered.append(asset)
    return filtered


# ---------------------------------------------------------------------------
# Bottle classification
# ---------------------------------------------------------------------------

def classify_bottle(asset):
    """Map Bottle_Code to workbook group using PlantRefill_Count == 1."""
    code = _normalise_code(getattr(asset, "Bottle_Code", ""))
    is_plant_refilled = integer(
        getattr(asset, "Current_PlantRefill_Count", 0)
    ) == 1

    is_universal = code.startswith("UB.")
    is_virgin = code.endswith(".V")
    is_recycled = code.endswith(".R")

    if is_virgin:
        if is_universal:
            return "UVFB" if is_plant_refilled else "UVB"
        if code.startswith(tuple(f"B{i}." for i in range(1, 6))):
            return "BVFB" if is_plant_refilled else "BVB"

    if is_recycled:
        if is_universal:
            return "URFB" if is_plant_refilled else "URCB"
        if code.startswith(tuple(f"B{i}." for i in range(1, 6))):
            return "BRFB" if is_plant_refilled else "BRCB"

    return None


def _asset_brand(asset):
    """Get B1..B5 brand code from the asset's content/bottle fields."""
    for field in ("Content_Code", "Current_Content_Code", "Bottle_Code"):
        code = _brand_code(getattr(asset, field, ""))
        if code:
            return code
    return None


def _asset_destinations(asset):
    return {
        _normalise_text(getattr(asset, "Tofacility", "")),
        _normalise_text(getattr(asset, "Bottle_loc", "")),
    } - {""}


def _is_return_asset(asset):
    destinations = _asset_destinations(asset)
    return any(
        destination in RETURN_DESTINATIONS
        or "reverse vending" in destination
        or "return conveyor" in destination
        for destination in destinations
    )


def _is_damaged(asset):
    status = _normalise_text(getattr(asset, "Bottle_Status", ""))
    return "damaged" in status or "broken" in status


# ---------------------------------------------------------------------------
# Refill transaction recognition and historical quantity reconstruction
# ---------------------------------------------------------------------------

def is_refill_cashflow(tx):
    """Only successful station refill deductions use this exact Purpose."""
    return _normalise_text(getattr(tx, "Purpose", "")) == _normalise_text(REFILL_PURPOSE)


def _price_brand_name(price_row):
    return str(getattr(price_row, "BottleContent", "") or "").strip()


def _matching_price_rows(brand_hint, price_rows):
    """Find price rows matching an asset Content_Code/brand hint."""
    hint = _normalise_text(brand_hint)
    if not hint:
        return []

    exact = [
        row for row in price_rows
        if _normalise_text(_price_brand_name(row)) == hint
    ]
    if exact:
        return exact

    code = _brand_code(brand_hint)
    if code:
        return [row for row in price_rows if _brand_code(_price_brand_name(row)) == code]

    # Some projects use the complete BottleContent name in Content_Code and
    # include that name inside a longer content label.
    return [
        row for row in price_rows
        if _normalise_text(_price_brand_name(row)) in hint
        or hint in _normalise_text(_price_brand_name(row))
    ]


def _quantities_matching_cash_amount(amount, price_row):
    """Return integer ml quantities 1..500 that reproduce RefillService.Amount.

    RefillService calculates:
        gross = quantity * UnitPrice
        discount = gross * Discount / 100
        amount = round(gross - discount, 2)

    We search around the algebraic inverse and re-run that exact calculation.
    This avoids accepting an approximate division result as an exact quantity.
    """
    amount = round(number(amount), REFILL_PRICE_ROUNDING_DIGITS)
    unit_price = number(getattr(price_row, "UnitPrice", 0))
    discount = number(getattr(price_row, "Discount", 0))

    if amount <= 0 or unit_price <= 0 or discount < 0 or discount >= 100:
        return []

    net_unit_price = unit_price * (1.0 - discount / 100.0)
    if net_unit_price <= 0:
        return []

    approximate_quantity = amount / net_unit_price
    anchor = int(round(approximate_quantity))
    start = max(1, anchor - 3)
    end = min(MAX_REFILL_ML, anchor + 3)

    matches = []
    for quantity_ml in range(start, end + 1):
        gross_amount = quantity_ml * unit_price
        discount_amount = gross_amount * discount / 100.0
        calculated_amount = round(
            gross_amount - discount_amount,
            REFILL_PRICE_ROUNDING_DIGITS,
        )
        if calculated_amount == amount:
            matches.append(quantity_ml)
    return matches


def reconstruct_refill_transaction(tx, price_rows, assets_by_transaction=None):
    """Reconstruct one refill's quantity and, where possible, its brand.

    Priority:
      1. Use an Asset whose current Transaction_Id equals this Cashflow ID to
         narrow the brand to its current Content_Code.
      2. If there is no matching Asset/brand, test current Shampooprice rows.
      3. Accept volume only if all valid candidates agree on one ml quantity.
      4. Assign a brand only if all valid candidates identify one BottleContent.

    `source` is 'asset_price_match' or 'unique_price_match'. Price-only results
    are estimates because historic Shampooprice rows are not versioned.
    """
    amount = number(getattr(tx, "Amount", 0))
    transaction_id = str(getattr(tx, "TransactionId", "") or "")
    matching_assets = (assets_by_transaction or {}).get(transaction_id, [])

    asset_brand_codes = {
        _asset_brand(asset) for asset in matching_assets if _asset_brand(asset)
    }
    asset_content_hints = []
    for asset in matching_assets:
        for field in ("Content_Code", "Current_Content_Code"):
            value = getattr(asset, field, "")
            if value and _normalise_text(value) not in {
                _normalise_text(item) for item in asset_content_hints
            }:
                asset_content_hints.append(value)

    linked_price_rows = []
    for hint in asset_content_hints:
        linked_price_rows.extend(_matching_price_rows(hint, price_rows))

    # De-duplicate by the visible price row identity (BottleContent/UnitPrice/Discount).
    def _row_key(row):
        return (
            _normalise_text(_price_brand_name(row)),
            number(getattr(row, "UnitPrice", 0)),
            number(getattr(row, "Discount", 0)),
        )

    linked_price_rows = list({_row_key(row): row for row in linked_price_rows}.values())
    candidate_rows = linked_price_rows if linked_price_rows else list(price_rows)

    candidates = []
    for row in candidate_rows:
        brand_name = _price_brand_name(row)
        brand_code = _brand_code(brand_name)
        if asset_brand_codes and brand_code and brand_code not in asset_brand_codes:
            continue
        for quantity_ml in _quantities_matching_cash_amount(amount, row):
            candidates.append((brand_name, brand_code, quantity_ml))

    # De-duplicate exact brand/quantity candidates.
    candidates = list(dict.fromkeys(candidates))
    quantities = {candidate[2] for candidate in candidates}
    brands = {candidate[0] for candidate in candidates if candidate[0]}

    quantity_ml = next(iter(quantities)) if len(quantities) == 1 else None
    brand_name = next(iter(brands)) if len(brands) == 1 else None
    brand_code = _brand_code(brand_name) if brand_name else None

    if brand_code is None and len(asset_brand_codes) == 1:
        brand_code = next(iter(asset_brand_codes))

    if linked_price_rows and quantity_ml is not None:
        source = "asset_price_match"
    elif quantity_ml is not None:
        source = "unique_price_match"
    else:
        source = "unresolved"

    return {
        "transactionId": transaction_id,
        "amount": round(amount, 2),
        "quantityMl": quantity_ml,
        "brand": brand_code,
        "brandName": brand_name,
        "source": source,
        "estimated": source == "unique_price_match",
        "ambiguous": bool(candidates) and quantity_ml is None,
    }


def _asset_transaction_index(assets):
    index = defaultdict(list)
    for asset in assets:
        transaction_id = str(getattr(asset, "Transaction_Id", "") or "")
        if transaction_id:
            index[transaction_id].append(asset)
    return index


def _build_refill_summary(cashflows, price_rows, all_city_assets):
    refill_transactions = [tx for tx in cashflows if is_refill_cashflow(tx)]
    assets_by_transaction = _asset_transaction_index(all_city_assets)

    details = [
        reconstruct_refill_transaction(tx, price_rows, assets_by_transaction)
        for tx in refill_transactions
    ]

    total_volume_ml = sum(
        item["quantityMl"] for item in details if item["quantityMl"] is not None
    )
    brand_volume_ml = defaultdict(int)
    for item in details:
        if item["quantityMl"] is not None and item["brand"]:
            brand_volume_ml[item["brand"]] += item["quantityMl"]

    unresolved_count = sum(1 for item in details if item["quantityMl"] is None)
    estimated_count = sum(1 for item in details if item["estimated"])

    return {
        "events": len(refill_transactions),
        "totalVolumeMl": total_volume_ml,
        "bottle500mlEquivalents": total_volume_ml / 500.0,
        "brandVolumeMl": dict(brand_volume_ml),
        "unresolvedEvents": unresolved_count,
        "estimatedEvents": estimated_count,
        "transactions": details,
    }


# ---------------------------------------------------------------------------
# Savings in wallet (brand-wise workbook calculation)
# ---------------------------------------------------------------------------

def _mean_positive(values):
    values = [value for value in values if value > 0]
    return sum(values) / len(values) if values else 0.0


def _cashflow_brand_amounts(cashflows, all_city_assets):
    """Attribute fine/refund cashflows to a brand where Asset linkage exists."""
    assets_by_transaction = _asset_transaction_index(all_city_assets)
    fine_by_brand = defaultdict(float)
    refund_by_brand = defaultdict(float)
    unassigned_fines = 0.0
    unassigned_refunds = 0.0

    for tx in cashflows:
        purpose = _normalise_text(getattr(tx, "Purpose", ""))
        amount = abs(number(getattr(tx, "Amount", 0)))
        if amount <= 0:
            continue

        is_fine = "fine" in purpose or "penalt" in purpose
        is_refund = any(token in purpose for token in ("refund", "redeem", "return"))
        if not is_fine and not is_refund:
            continue

        linked_assets = assets_by_transaction.get(
            str(getattr(tx, "TransactionId", "") or ""), []
        )
        brands = {
            _asset_brand(asset) for asset in linked_assets if _asset_brand(asset)
        }

        if brands:
            share = amount / len(brands)
            target = fine_by_brand if is_fine else refund_by_brand
            for brand in brands:
                target[brand] += share
        elif is_fine:
            unassigned_fines += amount
        elif is_refund:
            unassigned_refunds += amount

    return fine_by_brand, refund_by_brand, unassigned_fines, unassigned_refunds


def _compute_savings_score(
    all_city_assets,
    purchased_assets,
    cashflows,
    refill_summary,
):
    """Calculate brand-wise packaging savings using the workbook's columns.

    Per brand:
      H = (bottles purchased at supermarket + refill 500ml equivalents)
          * (virgin bottle price + virgin-bottle environmental tax)
      I = fines paid
      J = actual bottle expenditure
      K = actual environmental tax
      L = tax reduction on plant-refilled bottles + Discount_RefillB
      M = return/refund earnings
      N = ((H + I) - (J + K - L - M)) / (H + I) * 100

    Brand-specific template values come from branded virgin, non-plant-refilled
    Asset rows in the same city. If the necessary template price/tax is absent,
    that brand is omitted rather than inventing a value.
    """
    brand_assets = defaultdict(list)
    template_assets = defaultdict(list)

    for asset in purchased_assets:
        brand = _asset_brand(asset)
        if brand:
            brand_assets[brand].append(asset)

    for asset in all_city_assets:
        brand = _asset_brand(asset)
        code = _normalise_code(getattr(asset, "Bottle_Code", ""))
        if (
            brand
            and code.endswith(".V")
            and integer(getattr(asset, "Current_PlantRefill_Count", 0)) == 0
        ):
            template_assets[brand].append(asset)

    fine_by_brand, refund_by_brand, unassigned_fines, unassigned_refunds = (
        _cashflow_brand_amounts(cashflows, all_city_assets)
    )

    brand_volume_ml = refill_summary.get("brandVolumeMl", {})
    breakdown = []
    total_baseline = 0.0
    total_actual_net = 0.0

    for brand in sorted(BRAND_CODES):
        bought = brand_assets.get(brand, [])
        templates = template_assets.get(brand, [])

        virgin_bottle_price = _mean_positive([
            number(getattr(asset, "Bottle_Price", 0)) for asset in templates
        ])
        virgin_env_tax = _mean_positive([
            number(getattr(asset, "Env_Tax_Customer", 0)) for asset in templates
        ])

        # A valid baseline needs both original bottle price and its tax value.
        if virgin_bottle_price <= 0 or virgin_env_tax < 0:
            continue

        purchase_count = len(bought)
        refill_volume_ml = number(brand_volume_ml.get(brand, 0))
        refill_equivalents = refill_volume_ml / 500.0

        actual_bottle_cost = sum(
            number(getattr(asset, "Bottle_Price", 0)) for asset in bought
        )
        actual_env_tax = sum(
            number(getattr(asset, "Env_Tax_Customer", 0)) for asset in bought
        )

        plant_refilled_assets = [
            asset for asset in bought
            if integer(getattr(asset, "Current_PlantRefill_Count", 0)) == 1
        ]
        tax_reduction = sum(
            max(
                0.0,
                virgin_env_tax - number(getattr(asset, "Env_Tax_Customer", 0)),
            )
            for asset in plant_refilled_assets
        )
        refill_bottle_discounts = sum(
            number(getattr(asset, "Discount_RefillB", 0))
            for asset in plant_refilled_assets
        )

        expected_baseline_bottle_cost = (
            purchase_count + refill_equivalents
        ) * (virgin_bottle_price + virgin_env_tax)
        fines = fine_by_brand.get(brand, 0.0)
        returns = refund_by_brand.get(brand, 0.0)
        discounts = tax_reduction + refill_bottle_discounts

        baseline_with_fines = expected_baseline_bottle_cost + fines
        actual_net = actual_bottle_cost + actual_env_tax - discounts - returns

        total_baseline += baseline_with_fines
        total_actual_net += actual_net

        breakdown.append({
            "brand": brand,
            "bottlesPurchased": purchase_count,
            "refillVolumeMl": round(refill_volume_ml, 2),
            "refill500mlEquivalents": round(refill_equivalents, 3),
            "virginBottlePrice": round(virgin_bottle_price, 2),
            "virginEnvTax": round(virgin_env_tax, 2),
            "baselineBottleCost": round(expected_baseline_bottle_cost, 2),
            "fines": round(fines, 2),
            "actualBottleCost": round(actual_bottle_cost, 2),
            "actualEnvTax": round(actual_env_tax, 2),
            "discounts": round(discounts, 2),
            "returns": round(returns, 2),
        })

    # Fines/refunds that cannot be tied to a current Asset transaction are kept
    # in the overall total instead of being silently discarded.
    total_baseline += unassigned_fines
    total_actual_net -= unassigned_refunds

    savings_percent = percentage(
        total_baseline - total_actual_net,
        total_baseline,
    )

    return savings_percent, {
        "brands": breakdown,
        "unassignedFines": round(unassigned_fines, 2),
        "unassignedReturns": round(unassigned_refunds, 2),
        "baselineTotal": round(total_baseline, 2),
        "actualNetTotal": round(total_actual_net, 2),
    }


# ---------------------------------------------------------------------------
# Score conversion
# ---------------------------------------------------------------------------

def score_value(percent, symbol="star"):
    """Convert percentage to the 0..5 star level used by the cart display."""
    if percent is None:
        return {"score": None, "level": 0, "symbol": symbol}

    bounded = max(0.0, min(100.0, number(percent)))
    level = math.ceil(bounded / 20.0) if bounded > 0 else 0
    return {
        "score": round(bounded, 1),
        "level": min(5, level),
        "symbol": symbol,
    }


# ---------------------------------------------------------------------------
# One cycle calculation
# ---------------------------------------------------------------------------

def build_cycle_metrics(
    all_city_assets,
    period_assets,
    period_cashflows,
    role=None,
    city_id=None,
    start_day=None,
    end_day=None,
    shampoo_prices=None,
):
    """Build all sustainability metrics for one cycle.

    Existing call shape is preserved:
        build_cycle_metrics(all_city_assets, period_assets, period_cashflows, role=None)

    Optional city_id/start_day/end_day make this function defensively filter
    period_cashflows by the city/day encoded in TransactionId. Callers that
    already pass cycle-filtered lists can continue using the original call.
    """
    all_city_assets = list(all_city_assets or [])
    period_assets = list(period_assets or [])
    period_cashflows = list(period_cashflows or [])

    if city_id is not None and start_day is not None and end_day is not None:
        period_cashflows = filter_cashflows_for_cycle(
            period_cashflows, city_id, int(start_day), int(end_day)
        )

    if role:
        action_assets = [
            asset for asset in period_assets
            if getattr(asset, "Fromfacility", "") == role
            or getattr(asset, "Tofacility", "") == role
        ]
        purchased_assets = [
            asset for asset in period_assets
            if bool(getattr(asset, "purchased", False))
            and getattr(asset, "Tofacility", "") == role
        ]
        cashflows = [
            tx for tx in period_cashflows
            if getattr(tx, "DebitFacility", "") == role
            or getattr(tx, "CreditFacility", "") == role
        ]
    else:
        action_assets = period_assets
        purchased_assets = [
            asset for asset in period_assets
            if bool(getattr(asset, "purchased", False))
        ]
        cashflows = period_cashflows

    # Workbook N_TOTAL counts every purchased Asset, including a bottle whose
    # Bottle_Code is not mapped to one of the eight sustainability groups.
    total = len(purchased_assets)
    counts = {code: 0 for code in BOTTLE_TYPES}
    for asset in purchased_assets:
        category = classify_bottle(asset)
        if category:
            counts[category] += 1
    unclassified_count = max(0, total - sum(counts.values()))

    price_rows = list(shampoo_prices) if shampoo_prices is not None else list(
        Shampooprice.objects.all()
    )
    refill_summary = _build_refill_summary(cashflows, price_rows, all_city_assets)
    self_refills = refill_summary["events"]

    virgin = percentage(
        counts["BVB"] * 5 + counts["UVB"] * 5,
        total * 5,
    )

    fancy = percentage(
        counts["BVB"] * 5
        + counts["BRCB"] * 4.5
        + counts["BVFB"] * 4
        + counts["BRFB"] * 3.5,
        total * 5,
    )

    # N_SRFL is a refill EVENT count (not Current_SelfRefill_Count, which is
    # cumulative on the Asset and cannot be attributed to historical cycles).
    reuse_numerator = (
        self_refills * 5
        + counts["URFB"] * 4.5
        + counts["BRFB"] * 4
        + counts["UVFB"] * 3.5
        + counts["BVFB"] * 3
        + counts["URCB"] * 2.5
        + counts["BRCB"] * 2
        + counts["UVB"] * 0.5
        + counts["BVB"] * 0
    )
    reuse = percentage(reuse_numerator, total * 5)

    return_assets = [asset for asset in action_assets if _is_return_asset(asset)]
    good_returns = sum(1 for asset in return_assets if not _is_damaged(asset))
    care = percentage(good_returns, total)

    street_count = 0
    bin_count = 0
    truck_count = 0
    for asset in action_assets:
        destinations = _asset_destinations(asset)
        if any(
            destination in STREET_DESTINATIONS or "street" in destination
            for destination in destinations
        ):
            street_count += 1
        elif any(
            destination in BIN_DESTINATIONS or "dustbin" in destination
            for destination in destinations
        ):
            bin_count += 1
        elif any(
            destination in TRUCK_DESTINATIONS
            or "garbage truck" in destination
            or "landfill" in destination
            for destination in destinations
        ):
            truck_count += 1

    civic = percentage(bin_count + truck_count, street_count + bin_count + truck_count)

    savings, savings_breakdown = _compute_savings_score(
        all_city_assets,
        purchased_assets,
        cashflows,
        refill_summary,
    )

    # The carbon baseline includes one hypothetical branded-virgin bottle for
    # each supermarket purchase plus each 500ml-equivalent of shampoo refilled
    # at the station. Actual self-refill impact is the cleaning/refilling factor
    # per 500ml equivalent. Plant-refilled purchased bottles use the same
    # cleaning/refilling factor per bottle, without virgin/recycled production.
    self_refill_equivalents = refill_summary["bottle500mlEquivalents"]
    plant_refilled_count = (
        counts["BVFB"] + counts["BRFB"] + counts["UVFB"] + counts["URFB"]
    )
    baseline_emissions = (total + self_refill_equivalents) * EMISSIONS_KG["BVB"]
    actual_emissions = (
        counts["BVB"] * EMISSIONS_KG["BVB"]
        + counts["UVB"] * EMISSIONS_KG["UVB"]
        + counts["BRCB"] * EMISSIONS_KG["BRCB"]
        + counts["URCB"] * EMISSIONS_KG["URCB"]
        + plant_refilled_count * REFILL_CLEANING_EMISSIONS_KG
        + self_refill_equivalents * REFILL_CLEANING_EMISSIONS_KG
    )
    avoided_emissions = percentage(
        baseline_emissions - actual_emissions,
        baseline_emissions,
    )

    metrics = {
        "affinityVirginMaterials": virgin,
        "affinityFancyPackaging": fancy,
        "reuseMindset": reuse,
        "careForMaterials": care,
        "savingsInWallet": savings,
        "avoidedEmissions": avoided_emissions,
        "civicSense": civic,
    }

    return {
        "totalBottles": total,
        "bottleCounts": counts,
        "unclassifiedCount": unclassified_count,
        "metrics": metrics,
        "scores": {
            metric: score_value(metrics.get(metric))
            for metric in CURRENT_METRICS
        },
        "refillSummary": refill_summary,
        "savingsBreakdown": savings_breakdown,
        "disposalCounts": {
            "street": street_count,
            "dustbin": bin_count,
            "garbageTruckOrLandfill": truck_count,
        },
        "returnCounts": {
            "total": len(return_assets),
            "good": good_returns,
            "damaged": len(return_assets) - good_returns,
        },
        "emissions": {
            "baselineKgCo2e": round(baseline_emissions, 4),
            "actualKgCo2e": round(actual_emissions, 4),
            "plantRefilledBottleCount": plant_refilled_count,
            "selfRefill500mlEquivalents": round(self_refill_equivalents, 3),
        },
    }


# ---------------------------------------------------------------------------
# Full city cycle history / current cycle convenience function
# ---------------------------------------------------------------------------

def get_city_sustainability_history(city_id, current_day, role=None):
    """Return all cycles through current_day and identify the current cycle.

    This is an optional convenience entry point for a Django view. It fetches
    city Assets, that city's Cashflows (by TransactionId prefix), and the
    current Shampooprice table once, then reuses the same data for every cycle.
    """
    current_day = int(current_day)
    current_index = cycle_index(current_day)
    if current_index is None:
        raise ValueError("current_day must be zero or greater")

    all_city_assets = list(Asset.objects.filter(Asset_CityId=city_id))
    city_cashflows = list(
        Cashflow.objects.filter(TransactionId__startswith=f"{city_id}_")
    )
    price_rows = list(Shampooprice.objects.all())

    cycles = []
    for index in range(current_index + 1):
        start_day, end_day = cycle_bounds(index)
        period_assets = filter_assets_for_cycle(
            all_city_assets, city_id, start_day, end_day
        )
        period_cashflows = filter_cashflows_for_cycle(
            city_cashflows, city_id, start_day, end_day
        )

        result = build_cycle_metrics(
            all_city_assets=all_city_assets,
            period_assets=period_assets,
            period_cashflows=period_cashflows,
            role=role,
            city_id=city_id,
            start_day=start_day,
            end_day=end_day,
            shampoo_prices=price_rows,
        )
        cycles.append({
            "cycle": index + 1,
            "startDay": start_day,
            "endDay": end_day,
            "isCurrent": index == current_index,
            **result,
        })

    current_cycle = cycles[-1] if cycles else None
    return {
        "cityId": city_id,
        "currentDay": current_day,
        "currentCycle": current_cycle,
        "cycles": cycles,
    }
