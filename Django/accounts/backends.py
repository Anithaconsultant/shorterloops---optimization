from django.contrib.auth.backends import BaseBackend
from accounts.models import CustomUser


class CustomUserAuthBackend(BaseBackend):
    def authenticate(self, request, Username=None, Password=None, **kwargs):
        try:
            user = CustomUser.objects.get(Username=Username)
            if user.check_password(Password):
                return user
            return None
        except CustomUser.DoesNotExist:
            return None

    def get_user(self, user_id):
        try:
            return CustomUser.objects.get(pk=user_id)
        except CustomUser.DoesNotExist:
            return None
