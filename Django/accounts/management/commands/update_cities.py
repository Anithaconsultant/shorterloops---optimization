# from django.core.management.base import BaseCommand
# from accounts.models import City
# from accounts.signals import start_timer_for_city

# class Command(BaseCommand):
#     help = 'Starts timers for all existing city records'

#     def handle(self, *args, **options):
#         cities = City.objects.all()
#         for city in cities:

#             start_timer_for_city(city)
            

#         self.stdout.write(self.style.SUCCESS("City timers started successfully."))

import time


from django.core.management.base import BaseCommand
from django.db import close_old_connections

from accounts.models import City
from accounts.signals import start_timer_for_city, timers
import logging
logger = logging.getLogger(__name__)


class Command(BaseCommand):
    help = "Owns and supervises all city timers"

    def handle(self, *args, **options):
        self.stdout.write("City timer supervisor started")

        while True:
            try:
                close_old_connections()

                cities = list(
                    City.objects.all().only(
                        "CityId",
                        "CityName",
                        "Clocktickrate",
                        "timer_paused",
                    )
                )

                active_city_ids = {city.CityId for city in cities}

                # Remove references for cities that no longer exist.
                for city_id in list(timers.keys()):
                    if city_id not in active_city_ids:
                        timer = timers.pop(city_id)
                        if timer.is_alive():
                            timer.stop()

                # Start missing or dead timers.
                for city in cities:
                    timer = timers.get(city.CityId)

                    if timer is None or not timer.is_alive():
                        start_timer_for_city(city)

            except Exception:
                logger.exception("City timer supervisor reconciliation failed")

            finally:
                close_old_connections()

            time.sleep(5)
