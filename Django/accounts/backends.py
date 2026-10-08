from django.contrib.auth.backends import BaseBackend
from accounts.models import CustomUser

class CustomUserAuthBackend(BaseBackend):
    def authenticate(self, request, Username=None, password=None, **kwargs):

        print("===== AUTH BACKEND =====")
        print("USERNAME:", Username)
        print("PASSWORD RECEIVED:", password)

        try:
            user = CustomUser.objects.get(Username=Username)

            print("USER FOUND:", user.Username)
            print("EMAIL VERIFIED:", user.is_email_verified)

            if user.check_password(password):
                print("PASSWORD CORRECT")
                return user

            print("PASSWORD INCORRECT")
            return None

        except CustomUser.DoesNotExist:
            print("USER NOT FOUND")
            return None

    def get_user(self, user_id):
        try:
            return CustomUser.objects.get(pk=user_id)
        except CustomUser.DoesNotExist:
            return None

