from django.db import transaction
from accounts.models import Asset

class PurchaseService:

    @staticmethod
    @transaction.atomic
    def purchase(data):

        print("Purchase Request Received")
        userid = data["userid"]

        cityid = data["cityid"]

        raw_ids = data["bottles"]

        bottle_ids = []

        for bottle in raw_ids:
            bottle_ids.append(
                bottle.split("at")[0].replace("City", "")
            )

        print(bottle_ids)

        print(userid)
        print(cityid)
        print(bottle_ids)
        assets = Asset.objects.select_for_update().filter(
        AssetId__in=bottle_ids
        )

        print("Found", assets.count(), "assets")
        for asset in assets:

            print(
                asset.AssetId,
                asset.dragged,
                asset.purchased,
                asset.Bottle_loc
            )
        return {
            "success": True,
            "message": "Purchase API Working"
        }