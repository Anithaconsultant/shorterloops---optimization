from django.core.management.base import BaseCommand
from accounts.models import City
from accounts.signals import start_timer_for_city

class Command(BaseCommand):
    help = 'Starts timers for all existing city records'

    def handle(self, *args, **options):
        cities = City.objects.all()
        for city in cities:
            start_timer_for_city(city)
            

        self.stdout.write(self.style.SUCCESS("City timers started successfully."))
