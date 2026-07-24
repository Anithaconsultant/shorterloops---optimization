from collections import Counter
from django.db import transaction
from django.utils import timezone
from accounts.models import City, Asset, BottleInventory


def get_bottle_type(asset: Asset):
    """Classify Asset into BottleInventory type."""
    print(asset.Bottle_Code, asset.Current_PlantRefill_Count)
    if asset.Bottle_Code in ["B1.V", "B5.V"]:
        return "BVB"
    elif asset.Bottle_Code == "B2.R":
        return "BRFB" if asset.Current_PlantRefill_Count > 0 else "BRCB"
    elif asset.Bottle_Code == "B3.R":
        return "BRFB" if asset.Current_PlantRefill_Count > 0 else "BRCB"
    elif asset.Bottle_Code == "UB.V":
        return "UVB"
    elif asset.Bottle_Code == "UB.R":
        return "URFB" if asset.Current_PlantRefill_Count > 0 else "URCB"
    return None

def create_initial_inventory_for_city(city_id):
    """
    Creates initial BottleInventory ONCE per city
    after minimum asset threshold is reached.
    """

    with transaction.atomic():

        # 🔒 Lock the city row (prevents double execution)
        city = City.objects.select_for_update().get(pk=city_id)

        if city.initial_inventory_created:
            return False  # already done

        assets = Asset.objects.filter(Asset_CityId=city_id)

        # ⛔ wait until full batch arrives
        if assets.count() < 90:
            return False

        category_counts = Counter()
        sample_asset_for_category = {}

        for asset in assets:
            bottle_type = get_bottle_type(asset)
            if not bottle_type:
                continue

            producer_code = None
            if asset.Content_Code:
                producer_code = asset.Content_Code
                

            key = (bottle_type, producer_code)
            category_counts[key] += 1
            sample_asset_for_category.setdefault(key, asset)

        inventories = []

        for (bottle_type, producer_code), count in category_counts.items():
            asset = sample_asset_for_category[(bottle_type, producer_code)]

            bottle_price = float(asset.Bottle_Price or 0)
            content_price = float(asset.Content_Price or 0)
            env_tax = float(asset.Env_Tax_Customer or 0)
            max_refill = int(asset.Max_Refill_Count or 0)
            redeem_good = float(asset.Redeem_Good or 0)
            redeem_damaged = float(asset.Redeem_Damaged or 0)
            discount = float(asset.Discount_RefillB or 0)

            shampoo_price_per_ml = (
                content_price / float(asset.Quantity)
                if asset.Quantity else 0
            )

            total_mrp = bottle_price + content_price + env_tax

            inventories.append(
                BottleInventory(
                    producer_code=producer_code,
                    bottle_type=bottle_type,
                    Bottle_CityId_id=city_id,
                    cycle_number=0,
                    current_total_stock=0,
                    bottles_sold_to_supermarket_prev_cycle=count,
                    bottles_bought_by_consumers=0,
                    bottles_returned_good=0,
                    bottles_returned_damaged=0,
                    manufacturing_day=asset.DOM,
                    content_price_per_ml=shampoo_price_per_ml,
                    bottle_price=bottle_price,
                    total_mrp=total_mrp,
                    max_refill_count=max_refill,
                    redeem_value_good=redeem_good,
                    redeem_value_damaged=redeem_damaged,
                    supermarket_commission_percent=0,
                    consumer_discount_percent=discount,
                    bottles_to_produce=0,
                    bottles_to_sell_to_supermarket=0,
                    stock_updated_day="0",
                    last_updated=timezone.now(),
                )
            )

        # 🚀 bulk insert (faster + deadlock-safe)
        BottleInventory.objects.bulk_create(inventories)

        city.initial_inventory_created = True
        city.save(update_fields=["initial_inventory_created"])

        return True
