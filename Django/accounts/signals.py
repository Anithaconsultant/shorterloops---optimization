from django.db.models.signals import post_save, pre_save
from django.dispatch import receiver, Signal
from django.core.exceptions import ObjectDoesNotExist
from django.db import transaction
import threading
from .models import Asset, Auditlog, City, Cityrule, CustomUser, BottleInventory
from time import sleep
import time
from django.db.models import F
from django.db import transaction
from django.contrib.auth import get_user_model
from django.utils import timezone

user_data_received = Signal()


@receiver(pre_save, sender=Asset)
def track_changes(sender, instance, **kwargs):
    """Store the original instance values before saving."""
    if instance.pk:
        try:
            instance._original = sender.objects.get(pk=instance.pk)
        except ObjectDoesNotExist:
            instance._original = None  # Handle gracefully if the instance doesn't exist


@receiver(post_save, sender=Asset)
def record_audit_trail_on_save(sender, instance, created, **kwargs):
    if created:
        Auditlog.objects.create(
            action='INSERT',
            AssetId=instance.AssetId,
            CityId=instance.Asset_CityId_id,
            ContentCode=instance.Content_Code,
            Bottle_Code=instance.Bottle_Code,
            Bottle_loc=instance.Bottle_loc,
            TransactionId='',
            TransactionDate='',
            FromFacility='Supermarket shelf',
            ToFacility='',
            userName='Mayor',
            assetStatus=instance.Bottle_Status,
            remQuantity=0,
            Unit=instance.Units,
            ManufactureDate=instance.DOM,
            refillCount=instance.Max_Refill_Count,
            currentselfrefillCount=instance.Current_SelfRefill_Count,
            currentplantrefillCount=instance.Current_PlantRefill_Count,
            Current_Content_Code=instance.Content_Code,
            LatestFillDate=instance.Latest_Refill_Date,
            bottleRetireDate=instance.Retirement_Date,
            RetireReason=instance.Retire_Reason,
        )
    else:
        changed_fields = []
        if hasattr(instance, '_original'):
            for field in instance._meta.fields:
                field_name = field.name
                original_value = getattr(instance._original, field_name, None)
                new_value = getattr(instance, field_name, None)
                if original_value != new_value:
                    changed_fields.append(field_name)

        DEFAULT_FIELDS = {
            "Transaction_Id": "",
            "Fromfacility": "",
            "Tofacility": "",
            "Transaction_Date": "",
            "Latest_Refill_Date": "",
            "Current_Content_Code": "",
        }

        for field, default_value in DEFAULT_FIELDS.items():
            if hasattr(instance, field) and field not in changed_fields:
                setattr(instance, field, default_value)

        if changed_fields:
            Auditlog.objects.create(
                action=f"UPDATE: {', '.join(changed_fields)}",
                AssetId=instance.AssetId,
                CityId=instance.Asset_CityId_id,
                Current_Content_Code=instance.Current_Content_Code,
                userName=instance.Tofacility
            )
        transaction.on_commit(lambda: instance.reset_attributes())


@receiver(post_save, sender=Cityrule)
def update_assets_from_cityrule(sender, instance, **kwargs):
    city_id = instance.cityId
    assets = Asset.objects.filter(Asset_CityId=city_id)

    for asset in assets:
        bottle_code = asset.Bottle_Code
        plant_refill_count = asset.Current_PlantRefill_Count

        # Mapping logic
        if bottle_code in ["B1.V", "B2.V", "B3.V", "B4.V", "B5.V"]:
            tax_value = instance.envtx_c_bvb
        elif bottle_code == "UB.V":
            tax_value = instance.envtx_c_uvb
        elif bottle_code in ["B1.R", "B2.R", "B3.R", "B4.R", "B5.R"]:
            tax_value = instance.envtx_c_brcb if plant_refill_count == 0 else instance.envtx_c_brfb
        elif bottle_code == "UB.R":
            tax_value = instance.envtx_c_urcb if plant_refill_count == 0 else instance.envtx_c_urfb
        else:
            tax_value = None

        if bottle_code in ["B1.V", "B2.V", "B3.V", "B4.V", "B5.V"]:
            tax_retailer = instance.envtx_r_bvb
        elif bottle_code == "UB.V":
            tax_retailer = instance.envtx_r_uvb
        elif bottle_code in ["B1.R", "B2.R", "B3.R", "B4.R", "B5.R"]:
            tax_retailer = instance.envtx_r_brcb if plant_refill_count == 0 else instance.envtx_r_brfb
        elif bottle_code == "UB.R":
            tax_retailer = instance.envtx_r_urcb if plant_refill_count == 0 else instance.envtx_r_urfb
        else:
            tax_retailer = None

        # Update asset's environmental tax
        if tax_value is not None:
            asset.Env_Tax_Customer = tax_value
        if tax_retailer is not None:
            asset.Env_Tax_Retailer = tax_retailer

        # Update fines from city rule mapping.
        # Converting the float values to strings since Asset's fine fields are varchar.
        asset.Discard_Dustbin_fine = str(
            instance.dustbinning_fine) if instance.dustbinning_fine is not None else ''
        asset.Discard_Garbagetruck_fine = str(
            instance.fine_for_throwing_bottle) if instance.fine_for_throwing_bottle is not None else ''
        asset.save()


timers = {}

User = get_user_model()




from collections import Counter
from django.utils import timezone
from django.db import transaction
from django.db.models.signals import post_save
from django.dispatch import receiver

from django.db.models.signals import post_save
from django.dispatch import receiver
from django.db import transaction
from django.utils import timezone
from collections import Counter
from .models import Asset, BottleInventory, City

#@receiver(post_save, sender=Asset)
# def create_initial_bottle_inventory(sender, instance, created, **kwargs):
#     """
#     Create BottleInventory ONCE per city when initial asset batch is ready.
#     SAFE against duplicate signals and race conditions.
#     """
#     if not created:
#         return

#     city_id = instance.Asset_CityId_id

#     with transaction.atomic():

#         # 🔒 Lock inventory table rows for this city
#         existing_inventory = (
#             BottleInventory.objects
#             .select_for_update()
#             .filter(Bottle_CityId_id=city_id)
#         )

#         if existing_inventory.exists():
#             return  # already created safely

#         assets_qs = Asset.objects.filter(Asset_CityId=city_id)
#         total_assets = assets_qs.count()

#         # ⚠️ adjust if your expected asset count changes
#         if total_assets < 90:
#             return

#         from collections import Counter
#         category_counts = Counter()
#         sample_asset_for_category = {}

#         for asset in assets_qs:
#             bottle_type = get_bottle_type(asset)
#             if not bottle_type:
#                 continue

#             producer_code = None
#             if asset.Content_Code:
#                 parts = asset.Content_Code.split(".")
#                 producer_code = parts[1] if len(parts) > 1 else None

#             if bottle_type in ["UVB", "URCB", "URFB"]:
#                 producer_code = "Universal"

#             key = (bottle_type, producer_code)
#             category_counts[key] += 1
#             sample_asset_for_category.setdefault(key, asset)

#         # ✅ SAFE creation
#         for (bottle_type, producer_code), count in category_counts.items():
#             asset = sample_asset_for_category[(bottle_type, producer_code)]

#             bottle_price = float(asset.Bottle_Price or 0)
#             content_price = float(asset.Content_Price or 0)
#             env_tax = float(asset.Env_Tax_Customer or 0)
#             max_refill = int(asset.Max_Refill_Count or 0)
#             redeem_good = float(asset.Redeem_Good or 0)
#             redeem_damaged = float(asset.Redeem_Damaged or 0)
#             discount = float(asset.Discount_RefillB or 0)

#             shampoo_price_per_ml = (
#                 content_price / float(asset.Quantity)
#                 if asset.Quantity else 0
#             )

#             total_mrp = bottle_price + content_price + env_tax

#             BottleInventory.objects.get_or_create(
#                 producer_code=producer_code,
#                 bottle_type=bottle_type,
#                 Bottle_CityId_id=city_id,
#                 cycle_number=0,
#                 defaults={
#                     "current_total_stock": 0,
#                     "bottles_sold_to_supermarket_prev_cycle": count,
#                     "bottles_bought_by_consumers": 0,
#                     "bottles_returned_good": 0,
#                     "bottles_returned_damaged": 0,
#                     "manufacturing_day": asset.DOM,
#                     "content_price_per_ml": shampoo_price_per_ml,
#                     "bottle_price": bottle_price,
#                     "total_mrp": total_mrp,
#                     "max_refill_count": max_refill,
#                     "redeem_value_good": redeem_good,
#                     "redeem_value_damaged": redeem_damaged,
#                     "supermarket_commission_percent": 0,
#                     "consumer_discount_percent": discount,
#                     "bottles_to_produce": 0,
#                     "bottles_to_sell_to_supermarket": 0,
#                     "stock_updated_day": "0",
#                     "last_updated": timezone.now(),
#                 }
#             )

#         print(f"✅ BottleInventory created safely for city {city_id}")


class CityTimer(threading.Thread):
    def __init__(self, city_id, clocktickrate):
        super().__init__()
        self.city_id = city_id
        self.clocktickrate = clocktickrate
        self.intervalcalculation = 86400 / (self.clocktickrate * 60)
        self.running = True
        self.paused = False
        self.last_update_day = None

    def run(self):

        while self.running:

            time.sleep(1)
            with transaction.atomic():
                city = City.objects.select_for_update().get(pk=self.city_id)
                city.refresh_from_db()  # Refresh the instance from the database
                # Check if the timer is paused
                if city.timer_paused:
                    self.paused = True
                    continue  # Skip the rest of the loop if paused
                else:
                    self.paused = False
                # Only update time if not paused
                if not self.paused:
                    # Debugging
                    city.CurrentTime += self.intervalcalculation
                                       
                    if city.CurrentTime >= 86400:  # 24 hours
                        city.CurrentTime = 0
                        city.CurrentDay += 1

                    # Check if 30 days have passed and update wallets if needed
                    if city.CurrentDay != 0 and city.CurrentDay % 30 == 0 and city.CurrentDay != self.last_update_day:
                        self.update_wallets(city.CityId)
                        self.last_update_day = city.CurrentDay

                    city.save()

    def update_wallets(self, city_id):
        CustomUser.objects.filter(User_cityid=city_id).update(
            wallet=F("wallet") + 2000)
        CustomUser.objects.filter(User_cityid=city_id).update(
            update_count=F("update_count") + 1)
        print(f"Successfully updated wallets for users in city ID: {city_id}")

    def stop(self):
        self.running = False

    def pause(self):
        self.paused = True

    def resume(self):
        self.paused = False


def start_timer_for_city(city):
    if city.CityId in timers:
        print(f"Timer already running for city {city.CityName}")
        return
    timer = CityTimer(city.CityId, city.Clocktickrate)
    timers[city.CityId] = timer
    timer.start()


def stop_timer_for_city(city_id):
    if city_id in timers:
        timers[city_id].stop()
        del timers[city_id]


def pause_timer_for_city(city_id):
    if city_id in timers:
        timers[city_id].pause()


def resume_timer_for_city(city_id):
    if city_id in timers:
        timers[city_id].resume()


@receiver(post_save, sender=City)
def start_timer_on_create(sender, instance, created, **kwargs):
    if created:
        start_timer_for_city(instance)

