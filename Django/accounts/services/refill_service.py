from django.db import transaction

from accounts.services.purchase_service import PurchaseService
from accounts.models import (
    Asset,
    Cashflow,
    CustomUser,
    Facility,
    Shampooprice,
)

class RefillService:

    @staticmethod
    @transaction.atomic
    def refill(data):

        print("Refill Request Received")

        userid = data.get("userid")
        cityid = data.get("cityid")
        bottle_id = data.get("bottle_id")

        transaction_day = data.get("transactionday")
        transaction_time = data.get("transactionTime")

        user_role = data.get("userrole")
        bottle_loc = data.get("bottleloc")

        brand = data.get("brand")
        quantity = data.get("quantity")



        # --------------------------------------------------
        # 1. BASIC VALIDATION
        # --------------------------------------------------

        if not bottle_id:
            return {
                "success": False,
                "message": "Bottle ID is required."
            }

        if not brand:
            return {
                "success": False,
                "message": "Refill brand is required."
            }

        try:
            quantity = int(quantity)
        except (TypeError, ValueError):
            return {
                "success": False,
                "message": "Invalid refill quantity."
            }

        if quantity <= 0:
            return {
                "success": False,
                "message": "Refill quantity must be greater than zero."
            }
                # --------------------------------------------------
        # CALCULATE REFILL PRICE FROM DATABASE
        # --------------------------------------------------

        price_record = (
            Shampooprice.objects
            .filter(BottleContent=brand)
            .first()
        )

        if not price_record:
            return {
                "success": False,
                "message": "Shampoo price not found."
            }

        unit_price = float(price_record.UnitPrice or 0)
        discount = float(price_record.Discount or 0)

        gross_amount = quantity * unit_price

        discount_amount = (
            gross_amount * discount / 100
        )

        refill_amount = round(
            gross_amount - discount_amount,
            2
        )
        if refill_amount < 0:
            return {
                "success": False,
                "message": "Invalid refill amount."
            }

        # --------------------------------------------------
        # 2. LOCK ASSET
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

        if wallet < refill_amount:
            return {
                "success": False,
                "message": "Insufficient Balance"
            }

        # --------------------------------------------------
        # 4. GENERATE TRANSACTION ID
        # --------------------------------------------------

        transaction_count = (
            PurchaseService.get_next_transaction_count(cityid)
        )

        transaction_id = (
            PurchaseService.generate_transaction_id(
                cityid,
                transaction_day,
                transaction_time,
                transaction_count,
                "03"
            )
        )

        # --------------------------------------------------
        # 5. UPDATE WALLET
        # --------------------------------------------------

        wallet -= refill_amount

        user.wallet = str(round(wallet, 2))

        user.save(
            update_fields=["wallet"]
        )

        # --------------------------------------------------
        # 6. CREATE REFILL CASHFLOW
        # --------------------------------------------------

        Cashflow.objects.create(
            TransactionId=transaction_id,
            Amount=str(round(refill_amount, 2)),
            Container_Amt="0",
            Content_Amt="0",
            CreditFacility="Refilling Station",
            DebitFacility=user_role,
            Purpose="Refilling shampoo from the Refilling Station"
        )

        # --------------------------------------------------
        # 7. UPDATE ASSET
        # --------------------------------------------------

        asset.Bottle_Status = "InUse"
        asset.Transaction_Id = transaction_id

        asset.Fromfacility = "Shampoo Refilling Station "
        asset.Tofacility = user_role

        asset.Transaction_Date = transaction_day
        asset.Latest_Refill_Date = transaction_day

        asset.Bottle_loc = bottle_loc
        asset.Content_Code = brand

        asset.save(
            update_fields=[
                "Bottle_Status",
                "Transaction_Id",
                "Fromfacility",
                "Tofacility",
                "Transaction_Date",
                "Latest_Refill_Date",
                "Bottle_loc",
                "Content_Code",
            ]
        )

        # --------------------------------------------------
        # 8. UPDATE REFILL STATION CASHBOX
        # --------------------------------------------------

        facility = (
            Facility.objects
            .select_for_update()
            .filter(
                Facilityname="Shampoo Refilling Station Owner"
            )
            .first()
        )

        if facility:

            current_cash = float(
                facility.Cashbox or 0
            )

            # Preserving your CURRENT Angular behaviour.
            current_cash -= refill_amount

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
            "message": "Refill transaction completed.",
            "transaction_id": transaction_id,
            "wallet": round(wallet, 2),

            "unit_price": round(unit_price, 2),
            "discount": round(discount, 2),
            "refill_amount": round(refill_amount, 2),

            "asset_id": asset.AssetId
        }

    @staticmethod
    @transaction.atomic
    def complete_refill(data):

        bottle_id = data.get("bottle_id")
        quantity = data.get("quantity")
        bottle_loc = data.get("bottleloc")

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

        try:
            quantity = int(quantity)
        except (TypeError, ValueError):
            return {
                "success": False,
                "message": "Invalid refill quantity."
            }

        current_count = int(
            asset.Current_SelfRefill_Count or 0
        )

        asset.Current_SelfRefill_Count = current_count + 1
        asset.remQuantity = quantity
        asset.Bottle_Status = "InUse"
        asset.Bottle_loc = bottle_loc

        asset.save(
            update_fields=[
                "Current_SelfRefill_Count",
                "remQuantity",
                "Bottle_Status",
                "Bottle_loc",
            ]
        )

        return {
            "success": True,
            "asset_id": asset.AssetId,
            "current_self_refill_count":
                asset.Current_SelfRefill_Count,
            "quantity": asset.remQuantity,
            "bottle_status": asset.Bottle_Status,
            "bottle_loc": asset.Bottle_loc,
        }