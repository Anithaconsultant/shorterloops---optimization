from django.apps import AppConfig
import os

class AccountsConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'accounts'

    def ready(self):
        import accounts.signals  # keep your signals

        # Only run this in the "main" process (avoid duplicate threads on runserver reload)
        if os.environ.get("RUN_MAIN") == "true":
            from accounts.models import City
            from accounts.signals import start_timer_for_city, timers

            for city in City.objects.all():
                if city.CityId not in timers:
                    start_timer_for_city(city)
