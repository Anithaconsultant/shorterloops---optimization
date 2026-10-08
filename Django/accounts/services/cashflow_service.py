from django.db.models import Q, Sum, FloatField
from django.db.models.functions import Cast, Coalesce

from accounts.models import Cashflow


class CashflowService:

    @staticmethod
    def get_summary(city_id, user_role):

        # --------------------------------------------------
        # 1. ONLY TRANSACTIONS BELONGING TO THIS CITY
        # --------------------------------------------------

        city_transactions = Cashflow.objects.filter(
            TransactionId__startswith=f"{city_id}_"
        )

        # --------------------------------------------------
        # 2. HELPER TO CALCULATE TOTAL
        # Amount is CharField, so convert it to FLOAT first.
        # --------------------------------------------------

        def total(queryset):

            result = queryset.annotate(
                amount_number=Cast(
                    "Amount",
                    FloatField()
                )
            ).aggregate(
                total=Coalesce(
                    Sum("amount_number"),
                    0.0
                )
            )

            return round(float(result["total"] or 0), 2)

        # --------------------------------------------------
        # 3. MUNICIPALITY
        # --------------------------------------------------

        environment_tax = total(
            city_transactions.filter(
                CreditFacility="Municipality Office",
                Purpose__icontains="Environment tax"
            )
        )

        throwing_fine = total(
            city_transactions.filter(
                CreditFacility="Municipality Office",
                Purpose__icontains="Throwing Bottle"
            )
        )

        # --------------------------------------------------
        # 4. REVERSE VENDING
        # --------------------------------------------------

        reverse_refund = total(
            city_transactions.filter(
                DebitFacility="Bottle Reverse Vending Machine",
                Purpose__icontains="Refund for returning Bottle"
            )
        )

        # --------------------------------------------------
        # 5. SUPERMARKET
        # --------------------------------------------------

        supermarket_sales = total(
            city_transactions.filter(
                CreditFacility="Supermarket Owner",
                Purpose__icontains="Purchasing"
            )
        )

        supermarket_returns = total(
            city_transactions.filter(
                DebitFacility="Return Conveyor",
                Purpose__icontains="returning"
            )
        )

        # --------------------------------------------------
        # 6. REFILLING STATION
        # --------------------------------------------------

        refill_income = total(
            city_transactions.filter(
                CreditFacility="Refilling Station",
                Purpose__icontains="Refilling"
            )
        )

        # --------------------------------------------------
        # 7. CURRENT USER ROLE TOTALS
        # --------------------------------------------------

        user_fine = total(
            city_transactions.filter(
                DebitFacility=user_role,
                Purpose__icontains="Fine"
            )
        )

        user_purchase = total(
            city_transactions.filter(
                DebitFacility=user_role
            ).filter(
                Q(Purpose__icontains="Purchasing") |
                Q(Purpose__icontains="Refilling")
            )
        )

        user_tax = total(
            city_transactions.filter(
                DebitFacility=user_role,
                CreditFacility="Municipality Office",
                Purpose__icontains="tax"
            )
        )

        user_refund = total(
            city_transactions.filter(
                CreditFacility=user_role,
                Purpose__icontains="Refund"
            )
        )

        # --------------------------------------------------
        # 8. RETURN SMALL RESPONSE TO ANGULAR
        # --------------------------------------------------

        return {

            "municipality": {
                "environment_tax": environment_tax,
                "fine": throwing_fine,
            },

            "reverse_vending": {
                "refund": reverse_refund,
            },

            "supermarket": {
                "sales": supermarket_sales,
                "returns": supermarket_returns,
            },

            "refilling": {
                "refill_income": refill_income,
            },

            "user": {
                "fine": user_fine,
                "purchase": user_purchase,
                "tax": user_tax,
                "refund": user_refund,
            }
        }