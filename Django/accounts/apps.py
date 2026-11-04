
from django.apps import AppConfig


class AccountsConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'accounts'

    def ready(self):
        # Register signal handlers only.
        # CityTimer threads are owned exclusively
        # by the update_cities Supervisor process.
        import accounts.signals
