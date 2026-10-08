from django.db import transaction
from accounts.models import Asset, Cashflow, CustomUser,Facility


class PurchaseService:


    @staticmethod
    @transaction.atomic
    def purchase(data):

        print("Purchase Request Received")

        userid = data.get("userid")
        cityid = data.get("cityid")

        # Lock assets
        raw_ids = data.get("bottles", [])

        bottle_ids = []

        for bottle in raw_ids:
            bottle_ids.append(
                bottle.split("at")[0].replace("City", "")
            )

        assets = list(
            Asset.objects
            .select_for_update()
            .filter(AssetId__in=bottle_ids)
        )

        if len(assets) != len(bottle_ids):
            return {
                "success": False,
                "message": "One or more bottles were not found."
            }

        # Use existing calculation method
        calculation = PurchaseService.calculate_purchase(data)

        if not calculation["success"]:
            return calculation

        total_bill = calculation["total_bill"]
        container_total = calculation["container_total"]
        content_total = calculation["content_total"]
        total_env = calculation["env_tax"]
        purchase_details = calculation["details"]

        user = (
            CustomUser.objects
            .select_for_update()
            .get(UserId=userid)
        )

        wallet = float(user.wallet)

        if wallet < total_bill:
            return {
                "success": False,
                "message": "Insufficient Balance"
            }

        wallet -= total_bill

        user.wallet = str(round(wallet, 2))
        user.save(update_fields=["wallet"])
        transaction_day = data.get("transactionday")
       
        transaction_count = PurchaseService.get_next_transaction_count(cityid)
        transactionTime=data.get('transactionTime')
        transaction_id =  PurchaseService.generate_transaction_id(cityid,transaction_day,transactionTime,transaction_count,"01")
        print(transaction_id)

        user_role = data.get("userrole")
        bottle_loc = data.get("bottleloc")

        # Update every purchased asset
        for asset in assets:
            PurchaseService.update_asset(asset,transaction_id,transaction_day,bottle_loc,user_role)
        # Purchase Cashflow (_01)
       
     
        PurchaseService.create_cashflow(
            transaction_id,
            total_bill-total_env,
            container_total,
            content_total,
            "Supermarket Owner",
            user_role,
            "Purchasing Shampoo from Supermarket"
        )


        # Environment Tax Cashflow (_02)

        tax_transaction_id = PurchaseService.generate_transaction_id(cityid,transaction_day,transactionTime,transaction_count, "02")

        PurchaseService.create_cashflow(tax_transaction_id,total_env,0,0,"Municipality Office",user_role,"Environment tax for Shampoo purchase")
        supermarket_cashbox = (
            PurchaseService.update_facility_cashbox(
                "Supermarket Owner",
                total_bill - total_env,
                cityid
            )
        )

        municipality_cashbox = (
            PurchaseService.update_facility_cashbox(
                "Municipality Office",
                total_env,
                cityid
            )
        )
        return {
            "success": True,
            "wallet": round(wallet, 2),
            "transaction_id": transaction_id,
            "total_bill": round(total_bill, 2),
            "container_total": round(container_total, 2),
            "content_total": round(content_total, 2),
            "env_tax": round(total_env, 2),
            "details": purchase_details,

            # temporary debugging
            "supermarket_cashbox": supermarket_cashbox,
            "municipality_cashbox": municipality_cashbox

        }

    @staticmethod
    def get_next_transaction_count(cityid):

        city_transactions = Cashflow.objects.filter(
            TransactionId__startswith=f"{cityid}_"
        )

        last_count = 0

        for row in city_transactions:

            try:
                count = int(row.TransactionId.split("_")[3])

                if count > last_count:
                    last_count = count

            except Exception:
                pass

        return str(last_count + 1).zfill(6)

    @staticmethod
    def generate_transaction_id(cityid, day, time, count, trans_type):

        return (
            f"{cityid}_"
            f"{day}_"
            f"{time}_"
            f"{count}_"
            f"{trans_type}"
        )

    @staticmethod
    def update_asset(asset, transaction_id, transaction_day, bottle_loc, user_role):

        asset.dragged = False
        asset.purchased = True
        asset.Bottle_Status = "InUse"
        asset.Bottle_loc = bottle_loc
        asset.Transaction_Id = transaction_id
        asset.Transaction_Date = transaction_day
        asset.Fromfacility = "Supermarket Owner"
        asset.Tofacility = user_role

        asset.save(update_fields=[
            "dragged",
            "purchased",
            "Bottle_Status",
            "Bottle_loc",
            "Transaction_Id",
            "Transaction_Date",
            "Fromfacility",
            "Tofacility"
        ])

    @staticmethod
    def create_cashflow(transaction_id,amount,container_amt,content_amt,credit,debit,purpose):

        Cashflow.objects.create(
            TransactionId=transaction_id,
            Amount=str(round(amount,2)),
            Container_Amt=str(round(container_amt,2)),
            Content_Amt=str(round(content_amt,2)),
            CreditFacility=credit,
            DebitFacility=debit,
            Purpose=purpose
        )
    @staticmethod
    def update_facility_cashbox(
        facility_name,
        amount,
        cityid
    ):
        facility = (
            Facility.objects
            .select_for_update()
            .filter(
                Facilityname=facility_name,
                Facility_cityid=cityid
            )
            .first()
        )

        if not facility:
            raise ValueError(
                f"{facility_name} not found for city {cityid}"
            )

        current_cash = float(facility.Cashbox or 0)
        amount = float(amount or 0)

        new_cash = current_cash + amount

        facility.Cashbox = str(
            round(new_cash, 2)
        )

        facility.save(
            update_fields=["Cashbox"]
        )

        print(
            f"CASHBOX UPDATED: "
            f"city={cityid}, "
            f"facility={facility_name}, "
            f"old={current_cash}, "
            f"added={amount}, "
            f"new={new_cash}"
        )

        return round(new_cash, 2)
    @staticmethod
    def calculate_purchase(data):

        raw_ids = data.get("bottles", [])

        bottle_ids = []

        for bottle in raw_ids:
            bottle_ids.append(
                bottle.split("at")[0].replace("City", "")
            )

        assets = list(
            Asset.objects.filter(
                AssetId__in=bottle_ids
            )
        )

        if len(assets) != len(bottle_ids):
            return {
                "success": False,
                "message": "One or more bottles were not found."
            }

        total_bill = 0
        container_total = 0
        content_total = 0
        total_env = 0

        purchase_details = []

        for asset in assets:

            if asset.purchased:
                return {
                    "success": False,
                    "message": f"{asset.AssetId} is already purchased."
                }

            if not asset.dragged:
                return {
                    "success": False,
                    "message": f"{asset.AssetId} is not reserved."
                }

            bottle_price = float(asset.Bottle_Price or 0)
            content_price = float(asset.Content_Price or 0)

            subtotal = bottle_price + content_price

            discount = subtotal * (
                float(asset.Discount_RefillB or 0) / 100
            )

            env_tax = subtotal * (
                float(asset.Env_Tax_Customer or 0) / 100
            )

            total = subtotal + env_tax - discount

            container_total += bottle_price
            content_total += content_price
            total_env += env_tax
            total_bill += total

            purchase_details.append({

                "AssetId": asset.AssetId,

                "Bottle_Code": asset.Bottle_Code,

                "Content_Code": asset.Content_Code,
                "Current_PlantRefill_Count":asset.Current_PlantRefill_Count,
                "Redeem_Good":asset.Redeem_Good,

                "Bottle_Price": bottle_price,

                "Content_Price": content_price,

                "Discount": round(discount, 2),

                "Env_Tax": round(env_tax, 2),

                "Totalvalue": round(total, 2)

            })

        return {

    "success": True,
    "details": purchase_details,
    "total_bill": round(total_bill,2),
    "container_total": round(container_total,2),
    "content_total": round(content_total,2),
    "env_tax": round(total_env,2),
    "netamount": round(total_bill,2)

        }    