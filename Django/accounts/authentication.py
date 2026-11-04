from rest_framework_simplejwt.authentication import JWTAuthentication
from .audit_context import set_audit_username


class AuditJWTAuthentication(JWTAuthentication):

    def authenticate(self, request):
        result = super().authenticate(request)

        if result is not None:
            user, validated_token = result

            # Store the current user's role
            set_audit_username(user.Role)

        return result