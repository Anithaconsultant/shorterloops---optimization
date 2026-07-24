from rest_framework import serializers
from accounts.models import City, CustomUser, Facility, Cityrule, Asset, Shampooprice, Bottleprice, Cashflow, Auditlog,BottleInventory
from django.contrib.auth.hashers import make_password


class CustomUserSerializer(serializers.ModelSerializer):
    class Meta:
        model = CustomUser
        fields = '__all__'
        extra_kwargs = {
            'Password': {'write_only': True},
            'UserId': {'read_only': True}
        }

    def create(self, validated_data):
        # Hash password before saving
        validated_data['password'] = make_password(validated_data['password'])
        return super().create(validated_data)


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
