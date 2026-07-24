import dj_database_url  # noqa: F401 — see note in requirements.txt

from .base import *  # noqa: F401,F403
from decouple import config

DEBUG = False

ALLOWED_HOSTS = [h.strip() for h in config("DJANGO_ALLOWED_HOSTS", default="").split(",") if h.strip()]

DATABASES = {
    "default": dj_database_url.parse(config("DATABASE_URL"), conn_max_age=600, ssl_require=True)
}

SECURE_SSL_REDIRECT = True
SESSION_COOKIE_SECURE = True
CSRF_COOKIE_SECURE = True
SECURE_PROXY_SSL_HEADER = ("HTTP_X_FORWARDED_PROTO", "https")
