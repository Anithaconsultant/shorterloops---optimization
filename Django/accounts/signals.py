from django.db.models.signals import post_save, pre_save,post_delete
from django.dispatch import receiver, Signal
from django.core.exceptions import ObjectDoesNotExist
from django.db import transaction
import threading
from .models import Asset, Auditlog, City, Cityrule, CustomUser
from time import sleep
import time
from django.db.models import F
from django.db import transaction
from django.contrib.auth import get_user_model
from django.utils import timezone
from collections import Counter
from django.utils import timezone
from django.db.models.signals import post_save
from .models import Asset, City
import asyncio
from asgiref.sync import async_to_sync
from channels.layers import get_channel_layer
from django.db.models import F
import logging
logger = logging.getLogger(__name__)
from .audit_context import get_audit_username


user_data_received = Signal()


# @receiver(pre_save, sender=Asset)
# def track_changes(sender, instance, **kwargs):
#     """Store the original instance values before saving."""
#     if instance.pk:
#         try:
#             instance._original = sender.objects.get(pk=instance.pk)
#         except ObjectDoesNotExist:
#             instance._original = None  # Handle gracefully if the instance doesn't exist


# @receiver(post_save, sender=Asset)
# def record_audit_trail_on_save(sender, instance, created, **kwargs):
#     if created:
#         Auditlog.objects.create(
#             action='INSERT',
#             AssetId=instance.AssetId,
#             CityId=instance.Asset_CityId_id,
#             ContentCode=instance.Content_Code,
#             Bottle_Code=instance.Bottle_Code,
#             Bottle_loc=instance.Bottle_loc,
#             TransactionId='',
#             TransactionDate='',
#             FromFacility='Supermarket shelf',
#             ToFacility='',
#             userName='Mayor',
#             assetStatus=instance.Bottle_Status,
#             remQuantity=0,
#             Unit=instance.Units,
#             ManufactureDate=instance.DOM,
#             refillCount=instance.Max_Refill_Count,
#             currentselfrefillCount=instance.Current_SelfRefill_Count,
#             currentplantrefillCount=instance.Current_PlantRefill_Count,
#             Current_Content_Code=instance.Content_Code,
#             LatestFillDate=instance.Latest_Refill_Date,
#             bottleRetireDate=instance.Retirement_Date,
#             RetireReason=instance.Retire_Reason,
#         )
#     else:
#         changed_fields = []
#         if hasattr(instance, '_original'):
#             for field in instance._meta.fields:
#                 field_name = field.name
#                 original_value = getattr(instance._original, field_name, None)
#                 new_value = getattr(instance, field_name, None)
#                 if original_value != new_value:
#                     changed_fields.append(field_name)

#         DEFAULT_FIELDS = {
#             "Transaction_Id": "",
#             "Fromfacility": "",
#             "Tofacility": "",
#             "Transaction_Date": "",
#             "Latest_Refill_Date": "",
#             "Current_Content_Code": "",
#         }

#         for field, default_value in DEFAULT_FIELDS.items():
#             if hasattr(instance, field) and field not in changed_fields:
#                 setattr(instance, field, default_value)

#         if changed_fields:
#             Auditlog.objects.create(
#                 action=f"UPDATE: {', '.join(changed_fields)}",
#                 AssetId=instance.AssetId,
#                 CityId=instance.Asset_CityId_id,
#                 Current_Content_Code=instance.Current_Content_Code,
#                 userName=instance.Tofacility,
#                 Bottle_loc=instance.Bottle_loc,
#                 Transaction_Id=instance.Transaction_Id,
#                 Latest_Refill_Date=instance.Latest_Refill_Date,
                
                
#             )
#         transaction.on_commit(lambda: instance.reset_attributes())

from django.db.models.signals import pre_save, post_save
from django.dispatch import receiver

from .models import Asset, Auditlog


def audit_value(value):
    """
    Convert Asset values into strings for Auditlog.
    Preserve zero and False values.
    """
    if value is None:
        return ""

    return str(value)


def get_asset_audit_snapshot(instance):
    """
    Get all relevant current Asset values.
    Map Asset field names to Auditlog field names.
    """

    return {
        "AssetId": audit_value(instance.AssetId),

        "CityId": audit_value(
            instance.Asset_CityId_id
        ),

        "Bottle_loc": audit_value(
            instance.Bottle_loc
        ),

        "TransactionId": audit_value(
            instance.Transaction_Id
        ),

        "Bottle_Code": audit_value(
            instance.Bottle_Code
        ),

        "TransactionDate": audit_value(
            instance.Transaction_Date
        ),

        "FromFacility": audit_value(
            instance.Fromfacility
        ),

        "ToFacility": audit_value(
            instance.Tofacility
        ),

        "ContentCode": audit_value(
            instance.Content_Code
        ),

        "Current_Content_Code": audit_value(
            instance.Current_Content_Code
        ),

        "assetStatus": audit_value(
            instance.Bottle_Status
        ),

        "remQuantity": audit_value(
            instance.remQuantity
        ),

        "Unit": audit_value(
            instance.Units
        ),

        "ManufactureDate": audit_value(
            instance.DOM
        ),

        "refillCount": audit_value(
            instance.Max_Refill_Count
        ),

        "currentselfrefillCount": audit_value(
            instance.Current_SelfRefill_Count
        ),

        "currentplantrefillCount": audit_value(
            instance.Current_PlantRefill_Count
        ),

        "LatestFillDate": audit_value(
            instance.Latest_Refill_Date
        ),

        "bottleRetireDate": audit_value(
            instance.Retirement_Date
        ),

        "RetireReason": audit_value(
            instance.Retire_Reason
        ),

        "userName": get_audit_username(),
    }


@receiver(pre_save, sender=Asset)
def track_changes(sender, instance, **kwargs):
    """
    Capture original database values before Asset is saved.
    """

    instance._audit_original = None

    if instance.pk:

        instance._audit_original = (
            sender.objects.filter(
                pk=instance.pk
            ).first()
        )


@receiver(post_save, sender=Asset)
def record_audit_trail_on_save(
    sender,
    instance,
    created,
    update_fields=None,
    **kwargs
):
    """
    Record a complete Asset snapshot whenever
    a new Asset is created or an existing Asset changes.
    """

    original = getattr(
        instance,
        "_audit_original",
        None
    )

    # ------------------------------------------------
    # 1. Detect changed fields
    # ------------------------------------------------

    changed_fields = []

    if not created and original:

        for field in instance._meta.concrete_fields:

            field_name = field.name
            field_attname = field.attname

            # Respect save(update_fields=[...])
            if update_fields is not None:

                if (
                    field_name not in update_fields
                    and field_attname not in update_fields
                ):
                    continue

            old_value = getattr(
                original,
                field_attname,
                None
            )

            new_value = getattr(
                instance,
                field_attname,
                None
            )

            if old_value != new_value:
                changed_fields.append(field_name)

    # ------------------------------------------------
    # 2. Do not create unnecessary UPDATE records
    # ------------------------------------------------

    if not created and not changed_fields:
        return

    # ------------------------------------------------
    # 3. Set action
    # ------------------------------------------------

    if created:

        action_value = "INSERT"

    else:

        action_value = (
            "UPDATE: " + ", ".join(changed_fields)
        )

    # ------------------------------------------------
    # 4. Capture complete current Asset snapshot
    # ------------------------------------------------

    audit_data = get_asset_audit_snapshot(instance)

    audit_data["action"] = action_value

    # ------------------------------------------------
    # 5. Save Auditlog
    # ------------------------------------------------

    Auditlog.objects.create(**audit_data)

    # ------------------------------------------------
    # 6. Clean up original snapshot
    # ------------------------------------------------

    if hasattr(instance, "_audit_original"):
        del instance._audit_original
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

def start_timer_for_city(city):
    timer = timers.get(city.CityId)

    if timer is not None and timer.is_alive():
        print(
            f"Timer already running for city {city.CityName}, "
            f"thread={timer.name}"
        )
        return

    # Remove a stale thread reference, if one exists.
    if timer is not None:
        print(
            f"Stale timer reference for city {city.CityName}; "
            "restarting timer."
        )
        timers.pop(city.CityId, None)

    timer = CityTimer(city.CityId, city.Clocktickrate)
    timers[city.CityId] = timer
    timer.start()

    print(
        f"Timer started for city {city.CityName}, "
        f"id={city.CityId}, alive={timer.is_alive()}"
    )

def stop_timer_for_city(city_id):
    if city_id in timers:
        timers[city_id].stop()
        del timers[city_id]


def pause_timer_for_city(city_id):
    return City.objects.filter(
        pk=city_id
    ).update(timer_paused=True)


def resume_timer_for_city(city_id):
    return City.objects.filter(
        pk=city_id
    ).update(timer_paused=False)


@receiver(post_save, sender=City)
def start_timer_on_create(sender, instance, created, **kwargs):
    # Timer ownership belongs exclusively to the
    # update_cities Supervisor process.
    # The background manager discovers new cities.
    pass



class CityTimer(threading.Thread):
    def __init__(self, city_id, clocktickrate):
        super().__init__(daemon=True)

        self.city_id = city_id
        self.clocktickrate = clocktickrate
        self.intervalcalculation = 86400 / (self.clocktickrate * 60)

        self.running = True
        self.paused = False
        self.last_update_day = None

        self.channel_layer = get_channel_layer()

    def run(self):
        print(
            f"CityTimer STARTED: city={self.city_id}, "
            f"interval={self.intervalcalculation}"
        )

        while self.running:
            try:
                time.sleep(1)

                updated_data = None

                with transaction.atomic():
                    city = City.objects.select_for_update().get(
                        pk=self.city_id
                    )

                    if city.timer_paused:
                        self.paused = True
                        continue

                    self.paused = False

                    city.CurrentTime += self.intervalcalculation

                    if city.CurrentTime >= 86400:
                        city.CurrentTime = 0
                        city.CurrentDay += 1

                    if (
                        city.CurrentDay != 0
                        and city.CurrentDay % 30 == 0
                        and city.CurrentDay != self.last_update_day
                    ):
                        self.update_wallets(city.CityId)
                        self.last_update_day = city.CurrentDay

                    city.save(
                        update_fields=["CurrentTime", "CurrentDay"]
                    )

                    updated_data = {
                        "CurrentTime": city.CurrentTime,
                        "CurrentDay": city.CurrentDay,
                    }

                # Transaction has committed at this point.
                # WebSocket delivery must never undo the clock.

                try:
                    async_to_sync(
                        self.channel_layer.group_send
                    )(
                        f"city_{self.city_id}",
                        {
                            "type": "city_timer_update",
                            "data": updated_data,
                        },
                    )
                except Exception:
                    print(
                        f"WEBSOCKET ERROR city={self.city_id}: "
                        f"{time.time()}"
                    )
                    # Clock DB update is already committed.
                    # Continue the timer.

            except City.DoesNotExist:
                print(
                    f"City {self.city_id} no longer exists. "
                    "Stopping timer."
                )
                self.running = False

            except Exception:
                logger.exception(
                    "CityTimer ERROR city=%s",
                    self.city_id,
                )
                time.sleep(1)

        print(f"CityTimer STOPPED for city {self.city_id}")

    def update_wallets(self, city_id):
        CustomUser.objects.filter(
            User_cityid=city_id
        ).update(wallet=F("wallet") + 2000)

        CustomUser.objects.filter(
            User_cityid=city_id
        ).update(update_count=F("update_count") + 1)

        print(
            f"Successfully updated wallets for city ID: {city_id}"
        )

    def stop(self):
        self.running = False

    def pause(self):
        self.paused = True

    def resume(self):
        self.paused = False


from asgiref.sync import async_to_sync
from channels.layers import get_channel_layer


def broadcast_asset_update(asset):

    channel_layer = get_channel_layer()

    async_to_sync(channel_layer.group_send)(
        f"city_{asset.Asset_CityId_id}",
        {
            "type": "asset_update",
            "data": {
                "AssetId": asset.AssetId,
                "dragged": asset.dragged,
                "purchased": asset.purchased,
                "Bottle_loc": asset.Bottle_loc,
                "Bottle_Status": asset.Bottle_Status,
                "remQuantity": asset.remQuantity,
                "Content_Code": asset.Content_Code,
                "Bottle_Code": asset.Bottle_Code,
                "Current_PlantRefill_Count": asset.Current_PlantRefill_Count,
            },
        }
    )

    print(
        f"WEBSOCKET ASSET UPDATE: "
        f"city={asset.Asset_CityId_id}, "
        f"asset={asset.AssetId}"
    )
    
    

from django.core.cache import cache

from .models import Facility


@receiver(post_save, sender=Facility)
def clear_facility_cache_on_save(sender, instance, **kwargs):

    cache_key = f"facilities_city_{instance.Facility_cityid}"

    cache.delete(cache_key)


@receiver(post_delete, sender=Facility)
def clear_facility_cache_on_delete(sender, instance, **kwargs):

    cache_key = f"facilities_city_{instance.Facility_cityid}"

    cache.delete(cache_key)