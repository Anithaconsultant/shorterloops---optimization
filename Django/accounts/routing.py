from django.urls import path
from .consumers import CityConsumer

websocket_urlpatterns = [
    path("ws/city/<str:city_id>/", CityConsumer.as_asgi()),
]