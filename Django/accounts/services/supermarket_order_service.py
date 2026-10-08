from django.db import transaction

from accounts.models import (
    Asset,
    BottleInventory,
    Cashflow,
    Facility,
)

from accounts.services.purchase_service import PurchaseService


class SupermarketOrderService:

    @staticmethod
    @transaction.atomic
    def place_order(data):

        print("SUPERMARKET ORDER REQUEST RECEIVED:", data)

        # ============================================================
        # 1. GET REQUEST DATA
        # ============================================================

        cityid = data.get("cityid")
        producer_code = data.get("producer_code")
        bottle_type = data.get("bottle_type")
        cycle_number = data.get("cycle_number")
        sell_count = data.get("sell_count")

        transaction_day = data.get("transactionday")
        transaction_time = data.get("transactionTime")

        # ============================================================
        # 2. VALIDATE REQUEST
        # ============================================================

        if not cityid:
            return {
                "success": False,
                "message": "City ID is required."
            }

        if not producer_code:
            return {
                "success": False,
                "message": "Producer code is required."
            }

        if not bottle_type:
            return {
                "success": False,
                "message": "Bottle type is required."
            }

        if cycle_number is None:
            return {
                "success": False,
                "message": "Cycle number is required."
            }

        if sell_count is None:
            return {
                "success": False,
                "message": "Bottle quantity is required."
            }

        try:
            cityid = int(cityid)
            cycle_number = int(cycle_number)
            sell_count = int(sell_count)

        except (TypeError, ValueError):

            return {
                "success": False,
                "message": "Invalid city, cycle or bottle quantity."
            }

        if sell_count <= 0:
            return {
                "success": False,
                "message": "Bottle quantity must be greater than zero."
            }

        # ============================================================
        # 3. LOCK INVENTORY
        # ============================================================

        inventory = (
            BottleInventory.objects
            .select_for_update()
            .filter(
                producer_code=producer_code,
                bottle_type=bottle_type,
                Bottle_CityId_id=cityid,
                cycle_number=cycle_number
            )
            .first()
        )

        if not inventory:

            return {
                "success": False,
                "message": "Inventory record not found."
            }

        # ============================================================
        # 4. PRODUCER INFORMATION
        # ============================================================

        producer_parts = producer_code.split(".")

        if len(producer_parts) < 2:

            return {
                "success": False,
                "message": "Invalid producer code."
            }

        producer_name = (
            producer_parts[0] +
            " Shampoo Producer"
        )

        producer_plant_loc = (
            producer_parts[1] +
            "_Plant"
        )

        print(
            "Producer:",
            producer_name,
            "Plant:",
            producer_plant_loc
        )

        # ============================================================
        # 5. FIND AND LOCK AVAILABLE BOTTLES
        # ============================================================

        bottles = list(
            Asset.objects
            .select_for_update()
            .filter(
                Asset_CityId_id=cityid,
                Bottle_Code=bottle_type,
                Content_Code=producer_code,
                Bottle_loc=producer_plant_loc
            )
            .order_by("AssetDbId")[:sell_count]
        )

        print(
            "Requested:",
            sell_count,
            "Selected:",
            len(bottles)
        )

        if len(bottles) < sell_count:

            return {
                "success": False,
                "message": "Not enough bottles available at producer plant.",
                "requested": sell_count,
                "available": len(bottles)
            }

        # ============================================================
        # 6. CALCULATE ORDER AMOUNT
        #
        # SAME LOGIC AS OLD ANGULAR CODE
        # ============================================================

        total_mrp = float(
            inventory.total_mrp or 0
        )

        commission_percent = float(
            inventory.supermarket_commission_percent or 0
        )

        bottle_price = float(
            inventory.bottle_price or 0
        )

        content_price_per_ml = float(
            inventory.content_price_per_ml or 0
        )

        commission_amount_per_bottle = (
            total_mrp *
            (commission_percent / 100)
        )

        producer_price_per_bottle = (
            total_mrp -
            commission_amount_per_bottle
        )

        total_sale_amount = round(
            producer_price_per_bottle *
            sell_count,
            2
        )

        container_total = round(
            bottle_price *
            sell_count,
            2
        )

        # Existing application uses 500 ml
        content_total = round(
            content_price_per_ml *
            500 *
            sell_count,
            2
        )

        print(
            "ORDER CALCULATION:",
            "MRP =", total_mrp,
            "Commission =", commission_percent,
            "Producer Price =", producer_price_per_bottle,
            "Quantity =", sell_count,
            "Total =", total_sale_amount
        )

        # ============================================================
        # 7. LOCK PRODUCER FACILITY
        # ============================================================

        producer_facility = (
            Facility.objects
            .select_for_update()
            .filter(
                Facilityname=producer_name,
                Facility_cityid=cityid
            )
            .first()
        )

        if not producer_facility:

            return {
                "success": False,
                "message": (
                    f"Producer facility "
                    f"'{producer_name}' not found."
                )
            }

        # ============================================================
        # 8. LOCK SUPERMARKET FACILITY
        # ============================================================

        supermarket_facility = (
            Facility.objects
            .select_for_update()
            .filter(
                Facilityname="Supermarket Owner",
                Facility_cityid=cityid
            )
            .first()
        )

        if not supermarket_facility:

            return {
                "success": False,
                "message": "Supermarket facility not found."
            }

        # ============================================================
        # 9. CHECK SUPERMARKET BALANCE
        # ============================================================

        supermarket_cash = float(
            supermarket_facility.Cashbox or 0
        )

        producer_cash = float(
            producer_facility.Cashbox or 0
        )

        if supermarket_cash < total_sale_amount:

            return {
                "success": False,
                "message": "Insufficient supermarket cashbox balance.",
                "required_amount": total_sale_amount,
                "available_amount": round(
                    supermarket_cash,
                    2
                )
            }

        # ============================================================
        # 10. GENERATE TRANSACTION ID
        # ============================================================

        transaction_count = (
            PurchaseService
            .get_next_transaction_count(
                cityid
            )
        )

        transaction_id = (
            PurchaseService
            .generate_transaction_id(
                cityid,
                transaction_day,
                transaction_time,
                transaction_count,
                "09"
            )
        )

        print(
            "TRANSACTION ID:",
            transaction_id
        )

        # ============================================================
        # 11. UPDATE SUPERMARKET CASHBOX
        # ============================================================

        supermarket_cash -= total_sale_amount

        supermarket_facility.Cashbox = str(
            round(
                supermarket_cash,
                2
            )
        )

        supermarket_facility.save(
            update_fields=[
                "Cashbox"
            ]
        )

        # ============================================================
        # 12. UPDATE PRODUCER CASHBOX
        # ============================================================

        producer_cash += total_sale_amount

        producer_facility.Cashbox = str(
            round(
                producer_cash,
                2
            )
        )

        producer_facility.save(
            update_fields=[
                "Cashbox"
            ]
        )

        print(
            "CASHBOX TRANSFER:",
            "Supermarket:",
            supermarket_cash,
            "Producer:",
            producer_cash
        )

        # ============================================================
        # 13. MOVE BOTTLES TO SUPERMARKET
        # ============================================================

        for bottle in bottles:

            bottle.Bottle_loc = "Supermarket shelf"

            bottle.Transaction_Id = transaction_id

            bottle.Transaction_Date = str(
                transaction_day
            )

            bottle.Fromfacility = producer_name

            bottle.Tofacility = "Supermarket Owner"

            bottle.save(
                update_fields=[
                    "Bottle_loc",
                    "Transaction_Id",
                    "Transaction_Date",
                    "Fromfacility",
                    "Tofacility"
                ]
            )

        print(
            len(bottles),
            "bottles moved to supermarket."
        )

        # ============================================================
        # 14. UPDATE INVENTORY
        # ============================================================

        inventory.bottles_to_sell_to_supermarket = (
            sell_count
        )

        inventory.save(
            update_fields=[
                "bottles_to_sell_to_supermarket"
            ]
        )

        # ============================================================
        # 15. CREATE CASHFLOW
        # ============================================================

        Cashflow.objects.create(

            TransactionId=transaction_id,

            Amount=str(
                round(
                    total_sale_amount,
                    2
                )
            ),

            Container_Amt=str(
                round(
                    container_total,
                    2
                )
            ),

            Content_Amt=str(
                round(
                    content_total,
                    2
                )
            ),

            CreditFacility=producer_name,

            DebitFacility="Supermarket Owner",

            Purpose="Ordering Shampoo from Producer"
        )

        print(
            "CASHFLOW CREATED:",
            transaction_id
        )

        # ============================================================
        # 16. SUCCESS RESPONSE
        # ============================================================

        return {

            "success": True,

            "message": "Order placed successfully.",

            "transaction_id": transaction_id,

            "quantity": sell_count,

            "amount": round(
                total_sale_amount,
                2
            ),

            "container_total": round(
                container_total,
                2
            ),

            "content_total": round(
                content_total,
                2
            ),

            "supermarket_cashbox": round(
                supermarket_cash,
                2
            ),

            "producer_cashbox": round(
                producer_cash,
                2
            ),

            "bottle_ids": [
                bottle.AssetId
                for bottle in bottles
            ]
        }