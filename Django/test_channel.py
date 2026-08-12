import os
import asyncio

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "shorterloops.settings")

import django
django.setup()

from channels.layers import get_channel_layer


async def test_channel_layer():
    channel_layer = get_channel_layer()

    print("Channel layer:", channel_layer)

    await channel_layer.group_add(
        "test_group",
        "test_channel"
    )

    print("GROUP ADD SUCCESS")

    await channel_layer.group_send(
        "test_group",
        {
            "type": "test.message",
            "message": "Redis Channel Layer OK"
        }
    )

    print("GROUP SEND SUCCESS")


asyncio.run(test_channel_layer())