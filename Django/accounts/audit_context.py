from contextvars import ContextVar

_audit_username = ContextVar("audit_username", default=None)


def set_audit_username(username):
    return _audit_username.set(username)


def reset_audit_username(token):
    _audit_username.reset(token)


def get_audit_username():
    return _audit_username.get()