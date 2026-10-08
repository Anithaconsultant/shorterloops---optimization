from django.db import transaction

from accounts.models import Asset, Cashflow, CustomUser, Facility
from accounts.services.purchase_service import PurchaseService


class FineService:

    @staticmethod
    @transaction.atomic
    def apply_fine(data):

        print("Fine Request Received")

        userid = data.get("userid")
        cityid = data.get("cityid")
        bottle_id = data.get("bottle_id")

        location = data.get("location")
        transaction_type = data.get("transaction_type")
        purpose = data.get("purpose")

        transaction_day = data.get("transactionday")
        transaction_time = data.get("transactionTime")

        user_role = data.get("userrole")

        # --------------------------------------------------
        # 1. LOCK BOTTLE
        # --------------------------------------------------

        asset = (
            Asset.objects
            .select_for_update()
            .filter(AssetId=bottle_id)
            .first()
        )

        if not asset:
            return {
                "success": False,
                "message": "Bottle not found."
            }

        # --------------------------------------------------
        # 2. CALCULATE FINE IN BACKEND
        # --------------------------------------------------

        bottle_price = float(asset.Bottle_Price or 0)

        fine = round(
            bottle_price * 0.5,
            2
        )

        # --------------------------------------------------
        # 3. LOCK USER
        # --------------------------------------------------

        user = (
            CustomUser.objects
            .select_for_update()
            .filter(UserId=userid)
            .first()
        )

        if not user:
            return {
                "success": False,
                "message": "User not found."
            }

        wallet = float(user.wallet or 0)

        if wallet < fine:
            return {
                "success": False,
                "message": "Insufficient Balance"
            }

        # --------------------------------------------------
        # 4. UPDATE WALLET
        # --------------------------------------------------

        wallet -= fine

        user.wallet = str(round(wallet, 2))

        user.save(
            update_fields=["wallet"]
        )

        # --------------------------------------------------
        # 5. GENERATE TRANSACTION ID
        # --------------------------------------------------

        transaction_count = (
            PurchaseService.get_next_transaction_count(
                cityid
            )
        )

        transaction_id = (
            PurchaseService.generate_transaction_id(
                cityid,
                transaction_day,
                transaction_time,
                transaction_count,
                transaction_type
            )
        )

        # --------------------------------------------------
        # 6. CREATE CASHFLOW
        # --------------------------------------------------

        Cashflow.objects.create(
            TransactionId=transaction_id,
            Amount=str(round(fine, 2)),
            Container_Amt="0",
            Content_Amt="0",
            CreditFacility="Municipality Office",
            DebitFacility=user_role,
            Purpose=purpose
        )

        # --------------------------------------------------
        # 7. UPDATE ASSET
        # --------------------------------------------------

        asset.Bottle_loc = location
        asset.Transaction_Id = transaction_id
        asset.Transaction_Date = transaction_day
        asset.Fromfacility = user_role
        asset.Tofacility = "Municipality Office"

        asset.save(
            update_fields=[
                "Bottle_loc",
                "Transaction_Id",
                "Transaction_Date",
                "Fromfacility",
                "Tofacility"
            ]
        )

        # --------------------------------------------------
        # 8. UPDATE MUNICIPALITY CASHBOX
        # --------------------------------------------------

        facility = (
            Facility.objects
            .select_for_update()
            .filter(
                Facilityname="Municipality Office"
            )
            .first()
        )

        if facility:

            current_cash = float(
                facility.Cashbox or 0
            )

            current_cash += fine

            facility.Cashbox = str(
                round(current_cash, 2)
            )

            facility.save(
                update_fields=["Cashbox"]
            )

        # --------------------------------------------------
        # 9. RESPONSE
        # --------------------------------------------------

        return {
            "success": True,
            "fine": round(fine, 2),
            "wallet": round(wallet, 2),
            "transaction_id": transaction_id,
            "asset_id": asset.AssetId,
            "location": asset.Bottle_loc
        }