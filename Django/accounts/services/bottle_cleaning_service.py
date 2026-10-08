from django.db import transaction

from accounts.models import Asset


class BottleCleaningService:

    @staticmethod
    @transaction.atomic
    def clean_bottles(data):

        bottle_ids = data.get("bottle_ids", [])
        location = data.get("location")
        bottle_type = data.get("bottle_type")

        if not bottle_ids:
            return {
                "success": False,
                "message": "No bottles selected."
            }

        if not location:
            return {
                "success": False,
                "message": "Location is required."
            }

        assets = list(
            Asset.objects
            .select_for_update()
            .filter(
                AssetId__in=bottle_ids
            )
        )

        if len(assets) != len(bottle_ids):
            return {
                "success": False,
                "message": "One or more bottles were not found."
            }

        for asset in assets:

            # Common reset
            asset.Transaction_Id = ""
            asset.Transaction_Date = ""
            asset.Fromfacility = ""
            asset.Tofacility = ""

            asset.dragged = False
            asset.purchased = False

            asset.Bottle_Status = "Empty-Clean"
            asset.Bottle_loc = location

            # ------------------------------------------
            # UNIVERSAL BOTTLE
            # ------------------------------------------

            if bottle_type == "U":

                asset.Content_Code = ""
                asset.Current_Content_Code = ""

                asset.save(
                    update_fields=[
                        "Content_Code",
                        "Current_Content_Code",
                        "Transaction_Id",
                        "Transaction_Date",
                        "Fromfacility",
                        "Tofacility",
                        "dragged",
                        "purchased",
                        "Bottle_Status",
                        "Bottle_loc",
                    ]
                )

            # ------------------------------------------
            # BRANDED BOTTLE
            # ------------------------------------------

            else:

                asset.save(
                    update_fields=[
                        "Transaction_Id",
                        "Transaction_Date",
                        "Fromfacility",
                        "Tofacility",
                        "dragged",
                        "purchased",
                        "Bottle_Status",
                        "Bottle_loc",
                    ]
                )

        return {
            "success": True,
            "updated_count": len(assets),
            "bottle_ids": bottle_ids,
            "location": location
        }

    @staticmethod
    def move_bottles(data):

        bottle_ids = data.get("bottle_ids", [])
        location = data.get("location", "")

        if not bottle_ids:
            return {
                "success": False,
                "message": "No bottle ids provided"
            }

        if not location:
            return {
                "success": False,
                "message": "Location is required"
            }

        with transaction.atomic():

            bottles = list(
                Asset.objects
                .select_for_update()
                .filter(AssetId__in=bottle_ids)
            )

            if len(bottles) != len(bottle_ids):
                return {
                    "success": False,
                    "message": "Some bottles were not found"
                }

            Asset.objects.filter(
                AssetId__in=bottle_ids
            ).update(
                Bottle_loc=location
            )

        return {
            "success": True,
            "updated_count": len(bottles),
            "bottle_ids": bottle_ids,
            "location": location
        }