from django.apps import AppConfig
import sys


class AccountsConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'accounts'

    def ready(self):

        # Do not start CityTimers during Django management commands
        if any(command in sys.argv for command in [
            'makemigrations',
            'migrate',
            'collectstatic',
            'shell',
            'createsuperuser',
              'check',
        ]):
            return

        # Load signals for normal application startup
        import accounts.signals

        from accounts.models import City
        from accounts.signals import start_timer_for_city, timers

        # Start a timer for each city
        for city in City.objects.all():
            if city.CityId not in timers:
                start_timer_for_city(city)