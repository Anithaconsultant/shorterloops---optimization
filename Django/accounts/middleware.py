
from asgiref.sync import iscoroutinefunction
from django.utils.decorators import sync_and_async_middleware

from .audit_context import set_audit_username, reset_audit_username


@sync_and_async_middleware
def AuditUsernameMiddleware(get_response):

    if iscoroutinefunction(get_response):

        async def middleware(request):
            token = set_audit_username(None)

            try:
                return await get_response(request)
            finally:
                reset_audit_username(token)

    else:

        def middleware(request):
            token = set_audit_username(None)

            try:
                return get_response(request)
            finally:
                reset_audit_username(token)

    return middleware
