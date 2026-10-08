from rest_framework import serializers
from accounts.models import City, CustomUser, Facility, Cityrule, Asset, Shampooprice, Bottleprice, Cashflow, Auditlog,BottleInventory
from django.contrib.auth.hashers import make_password


class CustomUserSerializer(serializers.ModelSerializer):

    password = serializers.CharField(
        write_only=True,
        required=False
    )

    class Meta:
        model = CustomUser
        fields = [
            'UserId',
            'Username',
            'email',
            'mobile',
            'password',
            'wallet',
            'status',
            'User_cityid',
            'Role',
            'cartId',
            'avatar',
            'gender',
            'login',
        ]
        extra_kwargs = {
            'UserId': {'read_only': True},
        }

    def create(self, validated_data):
        password = validated_data.pop('password', None)

        user = CustomUser(**validated_data)

        if password:
            user.set_password(password)

        user.save()
        return user

class ViewUserSerializer(serializers.ModelSerializer):
    class Meta:
        model = CustomUser
        exclude = ['password', 'last_login', 'is_superuser', 'is_staff',
                   'is_active', 'date_joined', 'groups', 'user_permissions']


class CustomUserLoginSerializer(serializers.Serializer):
    Username = serializers.CharField()
    Password = serializers.CharField(write_only=True)


class shampooSerializer(serializers.ModelSerializer):
    class Meta:
        model = Shampooprice
        fields = '__all__'

class BottleInventorySerializer(serializers.ModelSerializer):
    class Meta:
        model = BottleInventory
        fields = '__all__'

class BottleSerializer(serializers.ModelSerializer):
    class Meta:
        model = Bottleprice
        fields = '__all__'


class citySerializer(serializers.ModelSerializer):
    class Meta:
        model = City
        fields = '__all__'


class facilitySerializer(serializers.ModelSerializer):
    class Meta:
        model = Facility
        fields = '__all__'


class cashflowSerializer(serializers.ModelSerializer):
    class Meta:
        model = Cashflow
        fields = '__all__'


class cityRuleSerializer(serializers.ModelSerializer):
    class Meta:
        model = Cityrule
        fields = '__all__'


class AssetSerializer(serializers.ModelSerializer):
    class Meta:
        model = Asset
        fields = '__all__'
    def validate_asset_id(self, value):
        if Asset.objects.filter(asset_id=value).exists():
            raise serializers.ValidationError("Asset ID already exists.")
        return value

class AuditSerializer(serializers.ModelSerializer):
    class Meta:
        model = Auditlog
        fields = '__all__'
