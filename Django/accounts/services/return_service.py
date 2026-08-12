
from django.db import transaction

from accounts.models import (
    Asset,
    CustomUser,
    Cashflow,
    Facility
)


class ReturnService:

    # =========================================================
    # 1. CALCULATE RETURN CREDIT
    # =========================================================

    @staticmethod
    def calculate_return_credit(asset):

        bottle_price = float(
            asset.Bottle_Price or 0
        )

        if asset.Bottle_Status == "Empty-Dirty":

            refund = bottle_price * (
                float(asset.Redeem_Good or 0) / 100
            )

        elif asset.Bottle_Status == "Damaged-Empty":

            refund = bottle_price * (
                float(asset.Redeem_Damaged or 0) / 100
            )

        else:

            refund = 0

        return round(
            refund,
            2
        )


    # =========================================================
    # 2. DETERMINE RETURN STATUS
    # =========================================================

    @staticmethod
    def get_return_status(asset):

        # Max refill count = 0
        # Special recycle case

        if asset.Max_Refill_Count == 0:

            return "RECYCLE"


        # Bottle has reached maximum refill count

        if (
            asset.Current_PlantRefill_Count
            >= asset.Max_Refill_Count
        ):

            return "END_OF_LIFE"


        # Normal return

        return "REFILLABLE"


    # =========================================================
    # 3. UPDATE USER WALLET
    # =========================================================

    @staticmethod
    def update_wallet(
        user,
        refund
    ):

        current_wallet = float(
            user.wallet or 0
        )

        new_wallet = (
            current_wallet + refund
        )

        user.wallet = str(
            round(
                new_wallet,
                2
            )
        )

        user.save(
            update_fields=[
                "wallet"
            ]
        )

        return round(
            new_wallet,
            2
        )


    # =========================================================
    # 4. CREATE CASHFLOW
    # =========================================================

    @staticmethod
    def create_cashflow(
        transaction_id,
        amount,
        credit,
        debit,
        purpose
    ):

        Cashflow.objects.create(

            TransactionId=transaction_id,

            Amount=str(
                round(
                    amount,
                    2
                )
            ),

            Container_Amt="0",

            Content_Amt="0",

            CreditFacility=credit,

            DebitFacility=debit,

            Purpose=purpose
        )


    # =========================================================
    # 5. UPDATE FACILITY CASHBOX
    #    FACILITY NAME + CITY
    # =========================================================

    @staticmethod
    def update_facility_cashbox(
        facility_name,
        amount,
        cityid
    ):

        facility = (
            Facility.objects
            .select_for_update()
            .get(
                Facilityname=facility_name,
                Facility_cityid=cityid
            )
        )

        current_cash = float(
            facility.Cashbox or 0
        )

        facility.Cashbox = str(
            round(
                current_cash + amount,
                2
            )
        )

        facility.save(
            update_fields=[
                "Cashbox"
            ]
        )


    # =========================================================
    # 6. GENERATE TRANSACTION ID
    # =========================================================

    @staticmethod
    def generate_transaction_id(
        cityid,
        day,
        time,
        count,
        transaction_type
    ):

        return (
            f"{cityid}_"
            f"{day}_"
            f"{time}_"
            f"{count}_"
            f"{transaction_type}"
        )


    # =========================================================
    # 7. GET NEXT TRANSACTION COUNT
    # =========================================================

    @staticmethod
    def get_next_transaction_count(
        cityid
    ):

        city_transactions = (
            Cashflow.objects.filter(
                TransactionId__startswith=
                f"{cityid}_"
            )
        )

        last_count = 0

        for row in city_transactions:

            try:

                parts = (
                    row.TransactionId
                    .split("_")
                )

                if len(parts) >= 5:

                    count = int(
                        parts[3]
                    )

                    if count > last_count:

                        last_count = count

            except (
                ValueError,
                IndexError,
                AttributeError
            ):

                pass

        return str(
            last_count + 1
        ).zfill(6)


    # =========================================================
    # 8. RETURN BOTTLE
    # =========================================================

    @staticmethod
    @transaction.atomic
    def return_bottle(data):

        print(
            "Return Request Received"
        )


        # =====================================================
        # REQUEST DATA
        # =====================================================

        userid = data.get(
            "userid"
        )

        cityid = data.get(
            "cityid"
        )

        bottleid = data.get(
            "bottleid"
        )

        transaction_day = data.get(
            "transactionday"
        )

        transaction_time = data.get(
            "transactionTime"
        )

        user_role = data.get(
            "userrole"
        )


        # =====================================================
        # DYNAMIC FACILITY / LOCATION
        #
        # returndrop():
        #     Return Conveyor
        #
        # returnreverse():
        #     Bottle Reverse Vending Machine
        # =====================================================

        to_facility = (
            data.get(
                "tofacility"
            )
            or "Return Conveyor"
        )

        bottle_location = (
            data.get(
                "Bottleloc"
            )
            or to_facility
        )


        print(
            "Return Facility:",
            to_facility
        )

        print(
            "Bottle Location:",
            bottle_location
        )


        # =====================================================
        # 1. LOCK BOTTLE
        # =====================================================

        asset = (
            Asset.objects
            .select_for_update()
            .get(
                AssetId=bottleid
            )
        )


        # =====================================================
        # 2. LOCK USER
        # =====================================================

        user = (
            CustomUser.objects
            .select_for_update()
            .get(
                UserId=userid
            )
        )


        # =====================================================
        # 3. DETERMINE RETURN STATUS
        # =====================================================

        status = (
            ReturnService.get_return_status(
                asset
            )
        )


        # =====================================================
        # 4. CALCULATE REFUND
        # =====================================================

        refund = (
            ReturnService.calculate_return_credit(
                asset
            )
        )


        print(
            "Bottle:",
            bottleid
        )

        print(
            "Return Status:",
            status
        )

        print(
            "Refund:",
            refund
        )


        # =====================================================
        # 5. TRANSACTION COUNT
        # =====================================================

        transaction_count = (
            ReturnService
            .get_next_transaction_count(
                cityid
            )
        )


        # =====================================================
        # 6. TRANSACTION ID
        #
        # KEEPING 06 AS REQUESTED
        # =====================================================

        transaction_id = (
            ReturnService
            .generate_transaction_id(
                cityid,
                transaction_day,
                transaction_time,
                transaction_count,
                "06"
            )
        )


        print(
            "Return Transaction:",
            transaction_id
        )


        # =====================================================
        # 7. UPDATE WALLET
        # =====================================================

        new_wallet = (
            ReturnService.update_wallet(
                user,
                refund
            )
        )


        # =====================================================
        # 8. UPDATE ASSET
        # =====================================================

        asset.Bottle_loc = (
            bottle_location
        )

        asset.Transaction_Id = (
            transaction_id
        )

        asset.Transaction_Date = (
            transaction_day
        )

        asset.Fromfacility = (
            user_role
        )

        asset.Tofacility = (
            to_facility
        )


        # -----------------------------------------------------
        # IMPORTANT:
        #
        # Normal REFILLABLE:
        # Preserve existing Bottle_Status.
        #
        # RECYCLE / END_OF_LIFE:
        # Change Bottle_Status to Damaged-Empty.
        # -----------------------------------------------------

        update_fields = [
            "Bottle_loc",
            "Transaction_Id",
            "Transaction_Date",
            "Fromfacility",
            "Tofacility"
        ]


        if status in [
            "RECYCLE",
            "END_OF_LIFE"
        ]:

            asset.Bottle_Status = (
                "Damaged-Empty"
            )

            update_fields.append(
                "Bottle_Status"
            )

            print(
                "Bottle Status changed to:",
                "Damaged-Empty"
            )

        else:

            print(
                "Preserving existing "
                "Bottle_Status:",
                asset.Bottle_Status
            )


        # =====================================================
        # SAVE ASSET
        # =====================================================

        asset.save(
            update_fields=update_fields
        )


        # =====================================================
        # 9. CREATE CASHFLOW
        #
        # Debit facility is dynamic:
        #
        # Return Conveyor
        # OR
        # Bottle Reverse Vending Machine
        # =====================================================

        ReturnService.create_cashflow(

            transaction_id,

            refund,

            user_role,

            to_facility,

            "Refund for returning Bottle"
        )


        # =====================================================
        # 10. REDUCE SUPERMARKET CASHBOX
        #
        # IMPORTANT:
        # Search using BOTH:
        #
        # Facilityname
        # Facility_cityid
        # =====================================================

        if refund > 0:

            ReturnService.update_facility_cashbox(

                "Supermarket Owner",

                -refund,

                cityid
            )


        # =====================================================
        # 11. RESPONSE
        # =====================================================

        return {

            "success": True,

            "refund": round(
                refund,
                2
            ),

            "status": status,

            "bottle_status":
                asset.Bottle_Status,

            "wallet":
                new_wallet,

            "transaction_id":
                transaction_id,

            "bottleid":
                bottleid,

            "facility":
                to_facility
        }