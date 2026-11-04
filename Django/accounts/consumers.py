import json

from channels.generic.websocket import AsyncWebsocketConsumer

class CityConsumer(AsyncWebsocketConsumer):

    async def connect(self):
        self.city_id = self.scope["url_route"]["kwargs"]["city_id"]

        self.room_group_name = f"city_{self.city_id}"

        await self.channel_layer.group_add(
            self.room_group_name,
            self.channel_name
        )

        await self.accept()

        print(
            f"WebSocket CONNECTED: "
            f"city={self.city_id}, "
            f"channel={self.channel_name}"
        )

        await self.send(text_data=json.dumps({
            "type": "connection",
            "message": "Connected to city WebSocket",
            "city_id": self.city_id
        }))

    async def disconnect(self, close_code):

        await self.channel_layer.group_discard(
            self.room_group_name,
            self.channel_name
        )

        print(
            f"WebSocket DISCONNECTED: "
            f"city={self.city_id}, "
            f"code={close_code}"
        )



    async def city_update(self, event):

        await self.send(text_data=json.dumps({
            "type": "city_update",
            "data": event["data"]
        }))

    async def city_timer_update(self, event):
        print(event["data"])
        await self.send(
            text_data=json.dumps({
                "type": "city_timer_update",
                "data": event["data"]
            })
        )

    async def asset_update(self, event):

        await self.send(
            text_data=json.dumps({
                "type": "asset_update",
                "data": event["data"]
            })
        )

    async def websocket_test(self, event):
        await self.send(
            text_data=json.dumps({
                "type": "websocket_test",
                "data": event["data"]
            })
        )
    
    async def facility_owner_updated(self, event):
        await self.send(
            text_data=json.dumps({
                "type": "facility_owner_updated",
                "data": event["data"]
            })
        )

    async def receive(self, text_data=None, bytes_data=None):
        if not text_data:
            return

        message = json.loads(text_data)

        if message.get("type") == "heartbeat":
            await self.send(text_data=json.dumps({
                "type": "heartbeat_ack",
                "timestamp": message.get("timestamp"),
            }))
            return

        # Preserve any existing receive handling here,
        # if your consumer already has it.