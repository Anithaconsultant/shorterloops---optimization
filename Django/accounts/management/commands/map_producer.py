# management/commands/map_producers.py
from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model
from accounts.models import BottleInventory


class Command(BaseCommand):
    help = 'Map producers to shampoo bottles based on production IDs'

    def handle(self, *args, **options):
        User = get_user_model()

        # Adjust this mapping based on your actual field names
        PRODUCER_MAPPING = {
            'b1producer': '1_101',
            'b2producer': '1_102',
            'b3producer': '1_103',
            'b4producer': '1_104',
            'b5producer': '1_105',
        }

        count = 0

        for username_prefix, prod_id_prefix in PRODUCER_MAPPING.items():
            try:
                user = User.objects.filter(
                    username__startswith=username_prefix).first()
                if not user:
                    self.stdout.write(self.style.WARNING(
                        f'User {username_prefix} not found'))
                    continue

                # Update this filter to match your actual field name
                bottles = BottleInventory.objects.filter(
                    production_id__startswith=prod_id_prefix)
                updated = bottles.update(producer=user)
                count += updated
                self.stdout.write(
                    f'Mapped {updated} bottles to {user.username}')

            except Exception as e:
                self.stdout.write(self.style.ERROR(
                    f'Error processing {username_prefix}: {str(e)}'))

        self.stdout.write(self.style.SUCCESS(
            f'Successfully mapped {count} bottles'))
