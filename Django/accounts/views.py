from django.db.models import Q
from .models import City, CustomUser, Facility, FACILITY_CHOICES, Cityrule, Asset, Cashflow, Auditlog, Bottleprice, Shampooprice,BottleInventory,CityruleMaster
from .serializers import CustomUserSerializer, citySerializer, facilitySerializer, cityRuleSerializer, AssetSerializer, cashflowSerializer, AuditSerializer, BottleSerializer, shampooSerializer,BottleInventorySerializer
from rest_framework.decorators import api_view
from rest_framework.parsers import JSONParser
from django.http import JsonResponse
from django.db import transaction
from django.shortcuts import get_object_or_404
from django.views.decorators.csrf import csrf_exempt
import json
import logging
from django.db.models import QuerySet
from django.core.exceptions import ObjectDoesNotExist
from django.db.models.signals import post_save
from .signals import user_data_received, pause_timer_for_city, resume_timer_for_city,broadcast_asset_update
from django.utils.decorators import method_decorator
from django.contrib.auth import authenticate
from rest_framework.response import Response
from rest_framework import status
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework.views import APIView
# from .cityTimer import CityTimer
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework_simplejwt.authentication import JWTAuthentication
from django.core.mail import send_mail
from django.conf import settings
from django.urls import reverse
from rest_framework_simplejwt.tokens import AccessToken
data1 = list()
from collections import Counter
from .services.inventory import create_initial_inventory_for_city
from .services.purchase_service import PurchaseService
from .services.return_service import ReturnService
from .services.bottle_cleaning_service import BottleCleaningService
from .services.cashflow_service import CashflowService
from django.core.cache import cache
from django.utils import timezone
from uuid import uuid4
from django.core.mail import send_mail
from datetime import timedelta
import socket
import os
from django.utils.encoding import force_bytes, force_str
from django.utils.http import urlsafe_base64_decode, urlsafe_base64_encode
from django.core.exceptions import ValidationError
from django.core.validators import validate_email
from django.db import transaction
from smtplib import SMTPException
from django.core.mail import EmailMessage
from django.contrib.auth.password_validation import validate_password
from django.contrib.auth.tokens import PasswordResetTokenGenerator
from django.core.exceptions import ValidationError
from django.contrib.auth import get_user_model
from channels.layers import get_channel_layer
from asgiref.sync import async_to_sync
logger = logging.getLogger(__name__)
currentuser = ''
cartcount = 100
import string,random

from .sustainability_scores import (
    CURRENT_METRICS,
    METRIC_LABELS,
    build_cycle_metrics,
    cycle_bounds,
    cycle_index,
    transaction_day,
    score_value,
)
def generate_short_id(length=8):
    characters = string.ascii_letters + string.digits  # a-zA-Z0-9
    return ''.join(random.choices(characters, k=length))
@method_decorator(csrf_exempt, name='dispatch')
class SignUpView(APIView):
    authentication_classes = []
    permission_classes = []

    def post(self, request):


        # --------------------------------------------------
        # CHECK EMAIL FORMAT
        # --------------------------------------------------
        email = request.data.get("email", "").strip()

        try:
            validate_email(email)
        except ValidationError:
            return Response(
                {
                    "email": [
                        "Please enter a valid email address."
                    ]
                },
                status=status.HTTP_400_BAD_REQUEST
            )

        # --------------------------------------------------
        # CHECK WHETHER EMAIL DOMAIN EXISTS
        # --------------------------------------------------
        domain = email.split("@")[-1]

        try:
            socket.gethostbyname(domain)
        except socket.gaierror:
            return Response(
                {
                    "email": [
                        "Email domain does not exist. "
                        "Please enter a valid email address."
                    ]
                },
                status=status.HTTP_400_BAD_REQUEST
            )

        # --------------------------------------------------
        # VALIDATE USER DATA
        # --------------------------------------------------
        serializer = CustomUserSerializer(data=request.data)

        if not serializer.is_valid():
            return Response(
                serializer.errors,
                status=status.HTTP_400_BAD_REQUEST
            )

        try:

            # --------------------------------------------------
            # DATABASE TRANSACTION
            # User will be rolled back if email sending fails.
            # --------------------------------------------------
            with transaction.atomic():

                # --------------------------------------------------
                # CREATE USER
                # --------------------------------------------------
                user = serializer.save()

                # --------------------------------------------------
                # USER MUST VERIFY EMAIL
                # --------------------------------------------------
                user.is_email_verified = False

                # --------------------------------------------------
                # GENERATE VERIFICATION TOKEN
                # --------------------------------------------------
                user.email_verification_token = uuid4()

               

                # --------------------------------------------------
                # RECORD VERIFICATION EMAIL TIME
                # --------------------------------------------------
                user.email_verification_sent_at = timezone.now()

                user.save(
                    update_fields=[
                        'is_email_verified',
                        'email_verification_token',
                        'email_verification_sent_at'
                    ]
                )

                # --------------------------------------------------
                # FRONTEND URL
                # --------------------------------------------------
                FRONTEND_URL = os.getenv("FRONTEND_URL")

                # Make sure the URL ends with /
               # FRONTEND_URL = FRONTEND_URL.rstrip("/") + "/"

                # --------------------------------------------------
                # CREATE VERIFICATION LINK
                # --------------------------------------------------
                verification_link = (
                    f"{FRONTEND_URL}#/verify-email/"
                    f"{user.email_verification_token}"
                )

                # print(
                #     "VERIFICATION LINK:",
                #     verification_link
                # )

                # --------------------------------------------------
                # SEND VERIFICATION EMAIL
                # --------------------------------------------------
                
                send_mail(
                    subject='Verify Your Email Address – Shorter Loops',
                    message=(
                        f'Hi {user.Username},\n\n'
                        'Greetings from Shorter Loops!\n\n'
                        "Thank you for your interest in Shorter Loops. "
                        "We're excited to have you join our community.\n\n"
                        'To verify your email address and complete your '
                        'registration, please click the link below:\n\n'
                        f'{verification_link}\n\n'
                        'Please note that this verification link is valid '
                        'for 24 hours from the time this email was sent. '
                        'If the link expires, you may need to request a '
                        'new verification link.\n\n'
                        'If you did not create an account with Shorter Loops, '
                        'you can safely ignore this email.\n\n'
                        'Regards,\n'
                        'Team Shorter Loops'
                    ),
                    from_email=None,
                    recipient_list=[user.email],
                    fail_silently=False,
                )


            # --------------------------------------------------
            # TRANSACTION SUCCESSFULLY COMMITTED
            # --------------------------------------------------
            return Response(
                {
                    'message':
                        'Registration successful. '
                        'Please verify your email.'
                },
                status=status.HTTP_201_CREATED
            )
        except SMTPException as e:

            return Response(
                {
                    "error":
                        "Verification email could not be sent. "
                        "Your account was not created."
                },
                status=status.HTTP_503_SERVICE_UNAVAILABLE
            )

        except Exception as e:

            # --------------------------------------------------
            # EMAIL / DATABASE / OTHER FAILURE
            # --------------------------------------------------
           
            return Response(
                {
                    "error":
                        "Registration failed. "
                        "Your account was not created."
                },
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

class VerifyEmailView(APIView):
    authentication_classes = []
    permission_classes = []

    def get(self, request, token):
      #  print("===== VERIFY VIEW CALLED =====")
      #  print("===== TOKEN =====", token)


        try:
            user = CustomUser.objects.get(
                email_verification_token=token
            )
        except CustomUser.DoesNotExist:
            return Response(
                {'error': 'Invalid verification link.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        if user.is_email_verified:
            return Response(
                {'error': 'Email is already verified.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        if not user.email_verification_sent_at:
            return Response(
                {'error': 'Invalid verification link.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        expiry_time = (
            user.email_verification_sent_at +
            timedelta(hours=24)
        )

        if timezone.now() > expiry_time:
            return Response(
                {'error': 'Verification link has expired.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Mark email as verified
        user.is_email_verified = True

        # Prevent token reuse
        user.email_verification_token = None
        user.email_verification_sent_at = None

        user.save(update_fields=[
            'is_email_verified',
            'email_verification_token',
            'email_verification_sent_at'
        ])

        # Automatically authenticate the user
        refresh = RefreshToken.for_user(user)

        serializer = CustomUserSerializer(user)

        return Response({
            'message': 'Email verified successfully.',
            'refresh': str(refresh),
            'access': str(refresh.access_token),
            'user': serializer.data
        }, status=status.HTTP_200_OK)
       

User = get_user_model()

from django.conf import settings
from django.contrib.auth import authenticate, get_user_model
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import AllowAny
from rest_framework_simplejwt.tokens import RefreshToken

User = get_user_model()


class LoginView(APIView):
    authentication_classes = []
    permission_classes = [AllowAny]

    def post(self, request):
        login_value = request.data.get('Username')
        password = request.data.get('Password')

        # 1. Validate required fields
        if login_value is None or password is None:
            return Response(
                {
                    'error': 'Username/email and password are required.',
                    'code': 'MISSING_CREDENTIALS'
                },
                status=status.HTTP_not400_BAD_REQUEST
            )

        if not isinstance(login_value, str) or not isinstance(password, str):
            return Response(
                {
                    'error': 'Username/email and password must be valid text.',
                    'code': 'INVALID_INPUT'
                },
                status=status.HTTP_400_BAD_REQUEST
            )

        login_value = login_value.strip()

        if not login_value or not password:
            return Response(
                {
                    'error': 'Please enter both username/email and password.',
                    'code': 'MISSING_CREDENTIALS'
                },
                status=status.HTTP_400_BAD_REQUEST
            )

        # 2. Resolve email to username, if an email was entered
        username = login_value

        if '@' in login_value:
            matching_users = User.objects.filter(
                email__iexact=login_value
            )

            # Keep invalid credentials generic for account security.
            if matching_users.count() != 1:
                return Response(
                    {
                        'error': 'Invalid username/email or password.',
                        'code': 'INVALID_CREDENTIALS'
                    },
                    status=status.HTTP_401_UNAUTHORIZED
                )

            username = matching_users.first().get_username()

        # 3. Authenticate credentials
        user = authenticate(
            request,
            username=username,
            password=password
        )

        if user is None:
            return Response(
                {
                    'error': 'Invalid username/email or password.',
                    'code': 'INVALID_CREDENTIALS'
                },
                status=status.HTTP_401_UNAUTHORIZED
            )

        # 4. Require email verification, if enabled
        if (
            getattr(settings, 'EMAIL_VERIFICATION_REQUIRED', False)
            and not user.is_email_verified
        ):
            return Response(
                {
                    'error': (
                        'Your email address is not verified. '
                        'Please check your inbox and verify your email '
                        'before logging in.'
                    ),
                    'code': 'EMAIL_NOT_VERIFIED'
                },
                status=status.HTTP_403_FORBIDDEN
            )

        # 5. Generate tokens and return the user
        refresh = RefreshToken.for_user(user)
        serializer = CustomUserSerializer(user)

        return Response(
            {
                'message': 'Login successful.',
                'refresh': str(refresh),
                'access': str(refresh.access_token),
                'user': serializer.data
            },
            status=status.HTTP_200_OK
        )

        
User = CustomUser


class UserListView(APIView):
    authentication_classes = [JWTAuthentication]
    permission_classes = [IsAuthenticated]

    def get(self, request):
        users = CustomUser.objects.all()
        serializer = CustomUserSerializer(users, many=True)
        return Response(serializer.data)


class UserProfileView(APIView):
    def get(self, request):
        user = request.user
        serializer = CustomUserSerializer(user)
        return Response(serializer.data)

    def patch(self, request):
        user = request.user
        serializer = CustomUserSerializer(
            user, data=request.data, partial=True)
        if serializer.is_valid():
            if 'Password' in request.data:
                serializer.validated_data['Password'] = make_password(
                    request.data['Password'])
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@transaction.atomic
def confirm_payment(request, seat_number):
    seat = get_object_or_404(Seat, seat_number=seat_number, is_reserved=True)
    # Perform payment processing here...
    seat.is_booked = True
    seat.is_reserved = False
    seat.save()

    return JsonResponse({'message': 'Payment confirmed. Seat booked successfully'})


def get_csrf(request):
    return JsonResponse({'detail': 'CSRF cookie set'})


def reserve_seat(request, seat_number):
    seat = get_object_or_404(Seat, seat_number=seat_number, is_booked=False)
    seat.is_reserved = True
    seat.save()
    return JsonResponse({'message': 'Seat reserved successfully'})


@transaction.atomic
@csrf_exempt
def lockasset(request, itemid):
    try:
        asset = get_object_or_404(Asset, AssetId=itemid, purchased=False)
        if asset.dragged == False:
            asset.dragged = True
            post_save.disconnect(user_data_received, sender=Asset)
            asset.save()

            return JsonResponse({'success': True, 'message': 'item reserved successfully'})
        else:
            return JsonResponse({'success': False, 'message': 'Seat is not available for blocking.'})
    except ObjectDoesNotExist:
        return JsonResponse({'success': False, 'message': 'Seat does not exist.'})


@api_view(['POST'])
@csrf_exempt
def unlockasset(request, itemid):
    if request.method == 'POST':
        asset = Asset.objects.filter(AssetId=itemid).first()
        serializer = AssetSerializer(asset, data=data, partial=True)
        if serializer.is_valid():
            serializer.save()
        else:
            print("invalid data")
        return JsonResponse('message', 'updated successfully')


@api_view(['GET', 'POST'])
def login(request):
    if request.method == 'GET':
        data = CustomUser.objects.all()
        serializer = CustomUserSerializer(data, many=True)
        return JsonResponse(serializer.data, safe=False)


@api_view(['GET', 'POST'])
def signup(request):
    if request.method == 'POST':
        data = JSONParser().parse(request)
        serializer = CustomUserSerializer(data=data)
        if serializer.is_valid():
            serializer.save()
            return JsonResponse({'message': 'Success'})
        else:
            return JsonResponse({'message': 'Username or Email Id is already present!'})
        return JsonResponse(serializer.data, status=status.HTTP_201_CREATED)
    if request.method == 'GET':
        data = CustomUser.objects.all()
        serializer = CustomUserSerializer(data, many=True)
        return JsonResponse(serializer.data, safe=False)


@api_view(['GET', 'POST'])
def getcityname(request, cityid):
    if request.method == 'GET':
        getcity = City.objects.filter(pk=cityid)
        serializer = citySerializer(getcity, many=True)
        
        return JsonResponse(serializer.data, safe=False)


@api_view(['GET', 'POST'])
def addcity(request):
    if request.method == 'POST':
        data = JSONParser().parse(request)
        serializer = citySerializer(data=data)
        if serializer.is_valid():
            serializer.save()
        else:
            print("invalid data")
        return JsonResponse(serializer.data, status=status.HTTP_201_CREATED)
    if request.method == 'GET':
        data = City.objects.all()
        serializer = citySerializer(data, many=True)
        return JsonResponse(serializer.data, safe=False)


def update_city_threads(request):
    # Assuming you have a list of city IDs
    city_data = City.objects.values_list('id', 'Clocktickrate')

    # Create and start a thread for each city
    for city_id, clocktickrate in city_data:
        city_thread = CityThread(city_id, clocktickrate)
        city_thread.start()

    return HttpResponse("City threads update started successfully.")


@api_view(['GET', 'POST', 'PUT'])
def updatecurrent(request, cityid):
    if request.method == 'PUT':
        data = JSONParser().parse(request)
        getcity = City.objects.filter(pk=cityid).first()
        serializer = citySerializer(getcity, data=data, partial=True)
        if serializer.is_valid():
            serializer.save()
        else:
            print("invalid data")
        return JsonResponse(serializer.data, status=status.HTTP_201_CREATED)
    if request.method == 'GET':
        getcity = City.objects.filter(pk=cityid)
        serializer = citySerializer(getcity, many=True)
        return JsonResponse(serializer.data, safe=False)


@api_view(['GET', 'POST'])
def createasset(request, cityid):
    if request.method == 'POST':
        data = JSONParser().parse(request)
        # print(data)
        serializer = AssetSerializer(data=data)
        if serializer.is_valid():
            serializer.save()
        else:
            print("invalid data")
        
        if Asset.objects.filter(Asset_CityId=cityid).count() >= 90:
            create_initial_inventory_for_city(cityid)
        
        return JsonResponse(serializer.data, status=status.HTTP_201_CREATED)
    if request.method == 'GET':
        data = Asset.objects.filter(Asset_CityId=cityid)
        serializer = AssetSerializer(data, many=True)
        return JsonResponse(serializer.data, safe=False)


@api_view(['GET', 'POST'])
def createtransaction(request):
    if request.method == 'POST':
        data = JSONParser().parse(request)
        serializer = cashflowSerializer(data=data)
        if serializer.is_valid():
            serializer.save()
        else:
            print("invalid data")
        return JsonResponse(serializer.data, status=status.HTTP_201_CREATED)
    if request.method == 'GET':
        data = Cashflow.objects.all()
        serializer = cashflowSerializer(data, many=True)
        return JsonResponse(serializer.data, safe=False)


@api_view(['GET'])
def getParticulartransaction(request, cityid, username):

    if request.method == 'GET':
        data = Cashflow.objects.filter(
            TransactionId__startswith=cityid
        ).filter(
            Q(DebitFacility=username) | Q(CreditFacility=username)
        )
        serializer = cashflowSerializer(data, many=True)
        return JsonResponse(serializer.data, safe=False)


@api_view(['GET', 'POST'])
def add_Cityrule(request):
    if request.method == 'POST':
        data = JSONParser().parse(request)
        serializer = cityRuleSerializer(data=data)
        if serializer.is_valid():
            serializer.save()
        else:
            print("invalid data")
        return JsonResponse(serializer.data, status=status.HTTP_201_CREATED)
    if request.method == 'GET':
        data = Cityrule.objects.all()
        serializer = cityRuleSerializer(data, many=True)
        return JsonResponse(serializer.data, safe=False)


@api_view(['GET'])
def get_last_city_rule(request, city_id):
    last_rule = Cityrule.objects.filter(
        cityId=city_id).order_by('ruleId').last()

    if last_rule:
        response_data = {
            "rule_number": last_rule.rule_number,
            "day_number": last_rule.day_number,
            "time_in_hours": last_rule.time_in_hours,
            "virgin_plastic_price": last_rule.virgin_plastic_price,
            "recycled_plastic_price": last_rule.recycled_plastic_price,
            "envtx_p_bvb": last_rule.envtx_p_bvb,
            "envtx_p_brcb": last_rule.envtx_p_brcb,
            "envtx_p_brfb": last_rule.envtx_p_brfb,
            "envtx_p_uvb": last_rule.envtx_p_uvb,
            "envtx_p_urcb": last_rule.envtx_p_urcb,
            "envtx_p_urfb": last_rule.envtx_p_urfb,
            "envtx_r_bvb": last_rule.envtx_r_bvb,
            "envtx_r_brcb": last_rule.envtx_r_brcb,
            "envtx_r_brfb": last_rule.envtx_r_brfb,
            "envtx_r_uvb": last_rule.envtx_r_uvb,
            "envtx_r_urcb": last_rule.envtx_r_urcb,
            "envtx_r_urfb": last_rule.envtx_r_urfb,
            "envtx_c_bvb": last_rule.envtx_c_bvb,
            "envtx_c_brcb": last_rule.envtx_c_brcb,
            "envtx_c_brfb": last_rule.envtx_c_brfb,
            "envtx_c_uvb": last_rule.envtx_c_uvb,
            "envtx_c_urcb": last_rule.envtx_c_urcb,
            "envtx_c_urfb": last_rule.envtx_c_urfb,
            "fine_for_throwing_bottle": last_rule.fine_for_throwing_bottle,
            "dustbinning_fine": last_rule.dustbinning_fine,
            # "display_at_dustbin": city_data.display_at_dustbin,
            # "garbage_truck_announcement": city_data.garbage_truck_announcement
        }
        return JsonResponse(response_data, safe=False)
    return JsonResponse({"message": "No records found"}, status=404)


@api_view(['GET', 'POST'])
def getfacility(request, cityid):

    if request.method == 'GET':

        cache_key = f"facilities_city_{cityid}"

        # First check Redis
        cached_data = cache.get(cache_key)

        if cached_data is not None:

            print("FACILITY DATA FROM REDIS")

            return JsonResponse(
                cached_data,
                safe=False
            )


        # Not available in Redis
        # Read from existing Facility table
        data = Facility.objects.filter(
            Facility_cityid=cityid
        )

        serializer = facilitySerializer(
            data,
            many=True
        )

        facility_data = serializer.data

        # serializer.data is a ReturnList.
        # Convert it to normal Python list before caching.
        facility_data = list(facility_data)

        cache.set(
            cache_key,
            facility_data,
            timeout=3600
        )

        print("FACILITY DATA FROM DATABASE")

        return JsonResponse(
            facility_data,
            safe=False
        )

@api_view(['GET', 'PUT'])
def get_BottlePrice(request):
    if request.method == 'GET':
        data = Bottleprice.objects.all()
        serializer = BottleSerializer(data, many=True)
        return JsonResponse(serializer.data, safe=False)


@api_view(['GET', 'PUT'])
def get_ShampooPrice(request):
    permission_classes = [IsAuthenticated]
    if request.method == 'GET':
        data = Shampooprice.objects.all()
        serializer = shampooSerializer(data, many=True)
        return JsonResponse(serializer.data, safe=False)
    elif request.method == 'PUT':
        data = JSONParser().parse(request)
        #print(data)
        serval = {'UnitPrice': data['UnitPrice'],'Discount':data['Discount']}
        getasset = Shampooprice.objects.filter(BottleContent=data['BottleContent']).first()
        serializer = shampooSerializer(getasset, data=serval, partial=True)
        if serializer.is_valid():
            serializer.save()
        else:
            print("invalid data")
        return JsonResponse(serializer.data, status=status.HTTP_200_OK)

@api_view(['GET', 'PUT'])
def returnasset(request, itemid):

    if request.method == 'GET':
        data = Asset.objects.filter(AssetId=itemid)
        serializer = AssetSerializer(data, many=True)
        return JsonResponse(serializer.data, safe=False)

    elif request.method == 'PUT':

        with transaction.atomic():
            asset = (
                Asset.objects
                .select_for_update()
                .filter(AssetId=itemid)
                .first()
            )

            # 1. Check existence FIRST
            if asset is None:
                return JsonResponse(
                    {"error": "Asset not found"},
                    status=status.HTTP_404_NOT_FOUND
                )

            # 2. Identify only the reserved -> shelf transition
            is_shelf_release = (
                asset.dragged is True
                and request.data.get("dragged") is False
                and request.data.get("Bottle_loc") == "Supermarket shelf"
            )

            # 3. Validate release ownership
            if is_shelf_release:
                user = request.user

                if not user.is_authenticated:
                    return JsonResponse(
                        {"error": "Authentication required"},
                        status=status.HTTP_401_UNAUTHORIZED
                    )

                expected_location = "In" + str(user.cartId)

                if asset.Bottle_loc != expected_location:
                    return JsonResponse(
                        {
                            "success": False,
                            "message": "You cannot release another user's reserved bottle."
                        },
                        status=status.HTTP_403_FORBIDDEN
                    )

            # 4. Preserve generic serializer update behavior
            serializer = AssetSerializer(
                asset,
                data=request.data,
                partial=True
            )

            if not serializer.is_valid():
                return JsonResponse(
                    serializer.errors,
                    status=status.HTTP_400_BAD_REQUEST
                )

            serializer.save()

            # 5. Broadcast after successful commit
            transaction.on_commit(
                lambda: broadcast_asset_update(asset)
            )

            return JsonResponse(
                serializer.data,
                status=status.HTTP_200_OK
            )

@api_view(['GET', 'POST'])
def facility(request, mayorid):
    if request.method == 'POST':
        data = JSONParser().parse(request)
        global cartcount

        # Loop through FACILITY_CHOICES to process each facility
        for code, faciname, cashbox_value in FACILITY_CHOICES:
            if faciname in ['Municipality Office', 'Clock Tower', 'Public Dustbin', 'Municipality Landfill', 'Garbage Truck']:
                if faciname == 'Municipality Office':
                    cartIds = str(data['Facility_cityid']) + \
                        '_' + str(cartcount)
                    serval = {
                        'Facilityname': faciname,
                        'Facility_cityid': data['Facility_cityid'],
                        'Owner_status': 'Active',
                        'Owner_id': mayorid,
                        'Cashbox': cashbox_value,
                        'LedgerId': '0',
                        'cartId': cartIds
                    }
                else:
                    serval = {
                        'Facilityname': faciname,
                        'Facility_cityid': data['Facility_cityid'],
                        'Owner_status': 'Active',
                        'Owner_id': mayorid,
                        'Cashbox': cashbox_value,
                        'LedgerId': '0',
                        'cartId': '0'
                    }
            else:
                cartcount += 1
                cartIds = str(data['Facility_cityid']) + '_' + str(cartcount)
                serval = {
                    'Facilityname': faciname,
                    'Facility_cityid': data['Facility_cityid'],
                    'Owner_status': '',
                    'Owner_id': '',
                    'Cashbox': cashbox_value,
                    'LedgerId': '0',
                    'cartId': cartIds
                }

            # Serialize and save the data
            serializer = facilitySerializer(data=serval)
            if serializer.is_valid():
                serializer.save()
            else:
                print("invalid data")

        return JsonResponse(serializer.data, status=status.HTTP_201_CREATED)

    if request.method == 'GET':
        data = Facility.objects.all()
        serializer = facilitySerializer(data, many=True)
        return JsonResponse(serializer.data, safe=False)



@api_view(['PUT'])
def updatefacility(request):
    data = request.data

    facility_name = data.get('Facilityname')
    city_id = data.get('Facility_cityid')
    owner_id = data.get('Owner_id')

    if not facility_name or city_id is None or not owner_id:
        return JsonResponse(
            {"error": "Missing facility ownership details"},
            status=status.HTTP_400_BAD_REQUEST
        )

    try:
        with transaction.atomic():
            facility = Facility.objects.select_for_update().filter(
                Facilityname=facility_name,
                Facility_cityid=city_id
            ).first()

            if not facility:
                return JsonResponse(
                    {"error": "Facility not found"},
                    status=status.HTTP_404_NOT_FOUND
                )

            # Do not overwrite an existing owner.
            if facility.Owner_id:
                return JsonResponse(
                    {"error": "Facility already has an owner"},
                    status=status.HTTP_409_CONFLICT
                )

            facility.Owner_id = str(owner_id)
            facility.Owner_status = "Active"
            facility.save(
                update_fields=["Owner_id", "Owner_status"]
            )

            payload = {
                "FacilityId": facility.FacilityId,
                "Facility_cityid": facility.Facility_cityid,
                "Facilityname": facility.Facilityname,
                "Owner_id": facility.Owner_id,
                "Owner_status": facility.Owner_status,
            }

            city_id_for_event = facility.Facility_cityid

            def broadcast_facility_owner():
                channel_layer = get_channel_layer()

                async_to_sync(channel_layer.group_send)(
                    f"city_{city_id_for_event}",
                    {
                        "type": "facility_owner_updated",
                        "data": payload
                    }
                )

            transaction.on_commit(broadcast_facility_owner)

        return JsonResponse(
            payload,
            status=status.HTTP_200_OK
        )

    except Exception:
        import logging
        logging.getLogger(__name__).exception(
            "Facility ownership update failed"
        )

        return JsonResponse(
            {"error": "Unable to update facility ownership"},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(['GET', 'POST', 'PUT'])
def updatetransactionfacility(request, cityid):
    if request.method == 'PUT':
        data = JSONParser().parse(request)
        serval = {'Owner_id': data['Owner_id'], 'Owner_status': 'Active'}
        getfacility = Facility.objects.filter(
            Facilityname=data['Facilityname'], Facility_cityid=data['Facility_cityid']).first()
        serializer = facilitySerializer(getfacility, data=serval, partial=True)
        if serializer.is_valid():
            serializer.save()
        else:
            print("invalid data")
        return JsonResponse(serializer.data, status=status.HTTP_201_CREATED)


@api_view(['GET', 'PUT'])
def getfacilitycash(request, facilityName, cityid):
    if request.method == 'GET':
        data = Facility.objects.filter(
            Facilityname=facilityName, Facility_cityid=cityid)
        serializer = facilitySerializer(data, many=True)
        return JsonResponse(serializer.data, safe=False)
    if request.method == 'PUT':
        data = JSONParser().parse(request)
        serval = {'Cashbox': data['Cashbox']}
        getfacility = Facility.objects.filter(
            Facilityname=facilityName, Facility_cityid=cityid).first()
        serializer = facilitySerializer(getfacility, data=serval, partial=True)
        if serializer.is_valid():
            serializer.save()
        else:
            print("invalid data")
        return JsonResponse(serializer.data, safe=False)


@api_view(['GET', 'POST', 'PUT'])
def leavefacility(request, userid):
    if request.method == 'PUT':
        data = JSONParser().parse(request)

        # Release the city mayor mapping for this user
        City.objects.filter(MayorId=userid).update(MayorId=None)

        # Deactivate the user's facility ownership
        getfacility = Facility.objects.filter(Owner_id=str(userid))

        for record in getfacility:
            serializer = facilitySerializer(
                record, data=data, partial=True
            )
            if serializer.is_valid():
                serializer.save()
            else:
                return JsonResponse(
                    serializer.errors,
                    status=status.HTTP_400_BAD_REQUEST
                )

        return JsonResponse(
            {"message": "City and facility mappings released"},
            status=status.HTTP_200_OK
        )
@api_view(['GET', 'POST'])
def cityrule(request):
    if request.method == 'POST':
        data = JSONParser().parse(request)
        serializer = cityRuleSerializer(data=data)
        if serializer.is_valid():
            serializer.save()
        else:
            print("invalid data")
        return JsonResponse(serializer.data, status=status.HTTP_201_CREATED)
    if request.method == 'GET':
        data = Cityrule.objects.all()
        serializer = cityRuleSerializer(data, many=True)
        return JsonResponse(serializer.data, safe=False)



@api_view(['GET', 'POST', 'PUT'])
@csrf_exempt
def toggle_city_timer(request, cityid):

    if request.method == "POST":
        try:
            data = json.loads(request.body)
            timer_paused = data.get("timer_paused")

            if not isinstance(timer_paused, bool):
                return JsonResponse(
                    {
                        "success": False,
                        "error": "Invalid timer_paused value"
                    },
                    status=400,
                )

            updated = City.objects.filter(
                pk=cityid
            ).update(
                timer_paused=timer_paused
            )

            if not updated:
                return JsonResponse(
                    {
                        "success": False,
                        "error": "City not found"
                    },
                    status=404,
                )

            return JsonResponse({
                "success": True,
                "message": (
                    f"Timer paused updated to {timer_paused}"
                ),
            })

        except json.JSONDecodeError:
            return JsonResponse(
                {
                    "success": False,
                    "error": "Invalid JSON format"
                },
                status=400,
            )

    return JsonResponse(
        {
            "success": False,
            "error": "Invalid request method"
        },
        status=405,
    )


@api_view(['GET', 'POST', 'PUT'])
def editcity(request, cityid):

    try:
        city = City.objects.get(pk=cityid)  # Fetch a single city instance
    except City.DoesNotExist:
        return Response({"error": "City not found"}, status=status.HTTP_404_NOT_FOUND)

    if request.method == 'POST' or request.method == 'PUT':
        data = JSONParser().parse(request)
        serializer = citySerializer(city, data=data, partial=True)

        if serializer.is_valid():
            serializer.save()
            return JsonResponse(serializer.data, status=status.HTTP_200_OK)
        else:
            return JsonResponse(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    if request.method == 'GET':
        getcity = City.objects.filter(pk=cityid)
        serializer = citySerializer(getcity, many=True)
        return JsonResponse(serializer.data, safe=False)


@api_view(['GET', 'PUT'])
def updateusercity(request, userid):
    if request.method == 'PUT':
        try:
            getuser = CustomUser.objects.get(pk=userid)
        except CustomUser.DoesNotExist:
            return JsonResponse(
                {"error": "User not found"},
                status=status.HTTP_404_NOT_FOUND
            )

        serializer = CustomUserSerializer(
            getuser,
            data=request.data,
            partial=True
        )

        if serializer.is_valid():
            serializer.save()
            return JsonResponse(
                serializer.data,
                status=status.HTTP_200_OK
            )

        return JsonResponse(
            {"errors": serializer.errors},
            status=status.HTTP_400_BAD_REQUEST
        )

    data = CustomUser.objects.all()
    serializer = CustomUserSerializer(data, many=True)
    return JsonResponse(serializer.data, safe=False)


@api_view(['GET'])
def get_audit_logs(request, asset_id):
    assetid = asset_id.split("&")[0]
    cityid = asset_id.split("&")[1]
    data = Auditlog.objects.filter(AssetId=asset_id, CityId=cityid)
    serializer = AuditSerializer(data, many=True)
    return JsonResponse(serializer.data, safe=False)


@api_view(['GET'])
def get_audit_logsuser(request, user):
    username = user.split("&")[0]
    cityid = user.split("&")[1]
    data = Auditlog.objects.filter(userName=username)
    serializer = AuditSerializer(data, many=True)
    return JsonResponse(serializer.data, safe=False)


def filter_audit_logs(request):
    filters = {}

    # Parse comma-separated values for multi-select fields
    city = request.GET.get('city')
    if city:
        filters['CityId__in'] = city.split(',')

    brand = request.GET.get('brand')
    if brand:
        filters['ContentCode__in'] = brand.split(',')

    current_location = request.GET.get('current_location')
    if current_location:
        filters['Bottle_loc__in'] = current_location.split(',')

    exit_location = request.GET.get('exit_location')
    if exit_location:
        filters['ToFacility__in'] = exit_location.split(',')

    entry_location = request.GET.get('entry_location')
    if entry_location:
        filters['FromFacility__in'] = entry_location.split(',')

    status = request.GET.get('status')
    if status:
        filters['assetStatus__in'] = status.split(',')

    role_user = request.GET.get('role_user')
    role_user_filters = None
    if role_user:
        usernames = role_user.split(',')
        role_user_filters = Q(userName__in=usernames) | Q(
            FromFacility__in=usernames) | Q(ToFacility__in=usernames)

    bottle_type = request.GET.get('bottle_type')
    if bottle_type:
        filters['Bottle_Code__in'] = bottle_type.split(',')

    current_selfrefill = request.GET.get('current_selfrefill')
    if current_selfrefill:
        filters['Current_SelfRefill_Count__in'] = current_selfrefill.split(',')

    current_plantrefill = request.GET.get('current_plantrefill')
    if current_plantrefill:
        filters['Current_PlantRefill_Count__in'] = current_plantrefill.split(
            ',')

    TransactionId = request.GET.get('TransactionId')
    if TransactionId:
        filters['TransactionId__in'] = TransactionId.split(',')

    assetID = request.GET.get('assetID')
    if assetID:
        filters['AssetId__in'] = assetID.split(',')

    day = request.GET.get('day')
    if day:
        filters['TransactionDate__in'] = day.split(',')

     # Filter based on TransactionDate between start_day and end_day
    startDay = request.GET.get('startDay')
    endDay = request.GET.get('endDay')

    if startDay and endDay:
        # Filter for records where the day of TransactionDate is between start_day and end_day
        filters['TransactionDate__range'] = [startDay, endDay]

    if role_user_filters:
        filtered_logs = Auditlog.objects.filter(
            Q(**filters) & role_user_filters)
    else:
        filtered_logs = Auditlog.objects.filter(**filters)

    if isinstance(filtered_logs, QuerySet):
        pass
    data = list(filtered_logs.values())

    return JsonResponse(data, safe=False)


def get_filter_options(request):
    city_options = list(Auditlog.objects.values_list(
        'CityId', flat=True).distinct())
    brand_options = list(Auditlog.objects.values_list(
        'ContentCode', flat=True).distinct())
    current_locationOptions = list(
        Auditlog.objects.values_list('Bottle_loc', flat=True).distinct())
    exit_locationOptions = list(Auditlog.objects.values_list(
        'ToFacility', flat=True).distinct())
    entry_locationOptions = list(Auditlog.objects.values_list(
        'FromFacility', flat=True).distinct())
    status_options = list(Auditlog.objects.values_list(
        'assetStatus', flat=True).distinct())
    role_options = list(Auditlog.objects.values_list(
        'userName', flat=True).distinct())
    BottleTypeOptions = list(Auditlog.objects.values_list(
        'Bottle_Code', flat=True).distinct())
    currentSelfRefillOptions = list(Auditlog.objects.values_list(
        'currentselfrefillCount', flat=True).distinct())

    currentPlantRefillOptions = list(Auditlog.objects.values_list(
        'currentplantrefillCount', flat=True).distinct())
    TransactionIdOptions = list(Auditlog.objects.values_list(
        'TransactionId', flat=True).distinct())
    assetIdOptions = list(Auditlog.objects.values_list(
        'AssetId', flat=True).distinct())
    dayOptions = list(Auditlog.objects.values_list(
        'TransactionDate', flat=True).distinct())

    data = {
        'cityOptions': city_options,
        'brandOptions': brand_options,
        'current_locationOptions': current_locationOptions,
        'exit_locationOptions': exit_locationOptions,
        'entry_locationOptions': entry_locationOptions,
        'statusOptions': status_options,
        'roleOptions': role_options,
        'BottleTypeOptions': BottleTypeOptions,
        'currentSelfRefillOptions': currentSelfRefillOptions,
        'currentRefillOptions': currentPlantRefillOptions,
        'TransactionIdOptions': TransactionIdOptions,
        'assetIdOptions': assetIdOptions,
        'dayOptions': dayOptions,
        'startDay': dayOptions,
        'endDay': dayOptions

    }
    return JsonResponse(data)



@api_view(['GET', 'POST'])
@csrf_exempt
def manage_city_timer(request, cityid):

    if request.method == "POST":
        try:
            data = json.loads(request.body)
            action = data.get("action")

            if action not in ["pause", "resume"]:
                return JsonResponse(
                    {"error": "Invalid data"},
                    status=400
                )

            if action == "pause":
                timer_paused = True
            else:
                timer_paused = False

            updated = City.objects.filter(
                pk=cityid
            ).update(
                timer_paused=timer_paused
            )

            if not updated:
                return JsonResponse(
                    {"error": "City not found"},
                    status=404
                )

            return JsonResponse({
                "success": True,
                "message": (
                    f"{'Paused' if timer_paused else 'Resumed'} "
                    f"timer for city {cityid}"
                )
            })

        except json.JSONDecodeError:
            return JsonResponse(
                {"error": "Invalid JSON"},
                status=400
            )

    return JsonResponse(
        {
            "success": False,
            "error": "Invalid request method"
        },
        status=405
    )

@api_view(['POST', 'GET','PUT'])
def bottle_inventory_detail(request):

    # ---------------- POST ----------------
    if request.method == 'POST':
        producer_code = request.data.get('producer_code')
        bottle_type = request.data.get('bottle_type')
        city_id = request.data.get('Bottle_CityId')
        current_cycle = request.data.get('cycle_number')
        previous_cycle = request.data.get('previous_cycle_number')

        #print("POST data:", producer_code, bottle_type, city_id, request.data)

        current_cycle = int(current_cycle) if current_cycle is not None else None
        previous_cycle = int(previous_cycle) if previous_cycle is not None else None

        # 🔹 Update previous cycle
        if previous_cycle and previous_cycle > 0:
            try:
                prev_inventory = BottleInventory.objects.get(
                    producer_code=producer_code,
                    bottle_type=bottle_type,
                    Bottle_CityId_id=city_id,
                    cycle_number=previous_cycle
                )

                update_fields = [
                    'bottles_bought_by_consumers',
                    'bottles_returned_damaged',
                    'bottles_returned_good',
                    'bottles_sold_to_supermarket_prev_cycle'
                ]

                update_data = {
                    field: request.data[field]
                    for field in update_fields
                    if field in request.data
                }

                if update_data:
                    serializer = BottleInventorySerializer(
                        prev_inventory,
                        data=update_data,
                        partial=True
                    )
                    if serializer.is_valid():
                        serializer.save()
            except BottleInventory.DoesNotExist:
                pass

        # 🔹 Create new cycle
        data = request.data.copy()
        for field in [
            'bottles_bought_by_consumers',
            'bottles_returned_damaged',
            'bottles_returned_good',
            'bottles_sold_to_supermarket_prev_cycle'
        ]:
            data[field] = 0

        data['Bottle_CityId_id'] = city_id

        serializer = BottleInventorySerializer(data=data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_201_CREATED)

        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    # ---------------- GET ----------------
    if request.method == 'GET':
        producer_code = request.query_params.get('producer_code')
        bottle_type = request.query_params.get('bottle_type')
        city_id = request.query_params.get('city_id')
        cycle_number = request.query_params.get('cycle_number')

        # print(
        #     "GET params =>",
        #     "producer_code:", producer_code,
        #     "bottle_type:", bottle_type,
        #     "city_id:", city_id,
        #     "cycle_number:", cycle_number,
        #     "ALL:", request.query_params
        # )

        # 🔴 strict validation (city_id must be string digit)
        if not producer_code or not bottle_type or not city_id:
            return Response(
                {'error': 'Missing query parameters.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        qs = BottleInventory.objects.filter(
            producer_code=producer_code,
            bottle_type=bottle_type,
            Bottle_CityId_id=int(city_id)   # 🔑 convert explicitly
        )

        # OPTIONAL cycle filter
        if cycle_number:
            qs = qs.filter(cycle_number=int(cycle_number))

        if not qs.exists():
            # print("STEP 1 producer:",
            #     list(
            #         BottleInventory.objects
            #         .filter(producer_code=producer_code)
            #         .values(
            #             "id",
            #             "producer_code",
            #             "bottle_type",
            #             "Bottle_CityId_id",
            #             "cycle_number"
            #         )
            #     )
            # )

            # print("STEP 2 producer + bottle:",
            #     list(
            #         BottleInventory.objects
            #         .filter(
            #             producer_code=producer_code,
            #             bottle_type=bottle_type
            #         )
            #         .values(
            #             "id",
            #             "producer_code",
            #             "bottle_type",
            #             "Bottle_CityId_id",
            #             "cycle_number"
            #         )
            #     )
            # )

            # print("STEP 3 producer + bottle + city:",
            #     list(
            #         BottleInventory.objects
            #         .filter(
            #             producer_code=producer_code,
            #             bottle_type=bottle_type,
            #             Bottle_CityId_id=int(city_id)
            #         )
            #         .values(
            #             "id",
            #             "producer_code",
            #             "bottle_type",
            #             "Bottle_CityId_id",
            #             "cycle_number"
            #         )
            #     )
            # )

            # print("FINAL QUERY:", list(qs.values()))
            return Response(
                {'error': 'Inventory not found.'},
                status=status.HTTP_404_NOT_FOUND
            )

        # 🔑 supermarket expects ONE record for a cycle
        inventory = qs.first()

        serializer = BottleInventorySerializer(inventory)
        return Response(serializer.data, status=status.HTTP_200_OK)
    
    # ---------------- PUT ----------------
    if request.method == 'PUT':
        producer_code = request.data.get('producer_code')
        bottle_type = request.data.get('bottle_type')
        city_id = request.data.get('Bottle_CityId')
        cycle_number = request.data.get('cycle_number')
        bottles_to_sell = request.data.get('bottles_to_sell_to_supermarket')

        #print("PUT data:", request.data)

        # 🔴 Validate required fields
        if not producer_code or not bottle_type or not city_id or not cycle_number:
            return Response(
                {'error': 'Missing required fields.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        try:
            inventory = BottleInventory.objects.get(
                producer_code=producer_code,
                bottle_type=bottle_type,
                Bottle_CityId_id=int(city_id),
                cycle_number=int(cycle_number)
            )

            # 🔹 Update only this field
            inventory.bottles_to_sell_to_supermarket = bottles_to_sell
            inventory.save()

            serializer = BottleInventorySerializer(inventory)
            return Response(serializer.data, status=status.HTTP_200_OK)

        except BottleInventory.DoesNotExist:
            return Response(
                {'error': 'Inventory record not found for given city, cycle, producer and bottle type.'},
                status=status.HTTP_404_NOT_FOUND
            )




@api_view(["POST"])
@transaction.atomic
def reserve_bottle(request, itemid):
    try:
        asset = (
            Asset.objects
            .select_for_update()
            .get(AssetId=itemid, purchased=False)
        )
    except Asset.DoesNotExist:
        return Response({
            "success": False,
            "message": "Bottle not found or already purchased"
        }, status=404)

    if asset.dragged:
        return Response({
            "success": False,
            "message": "Bottle already reserved"
        }, status=409)

    user = request.user

    if not user.is_authenticated:
        return Response({
            "success": False,
            "message": "Authentication required"
        }, status=401)

    if str(user.User_cityid) != str(asset.Asset_CityId_id):
        return Response({
            "success": False,
            "message": "Bottle belongs to another city"
        }, status=403)

    cartq = user.cartId
   # print(user)
    data = json.loads(request.body)
    cart = data.get("cart")
   # print(cart,itemid,cartq)
    if not cart or str(cart) == "0":
        return Response({
            "success": False,
            "message": "User cart is not assigned"
        }, status=400)

    asset.dragged = True
    asset.Bottle_loc = "In" + str(cart)

    asset.save(update_fields=["dragged", "Bottle_loc"])

    transaction.on_commit(
        lambda: broadcast_asset_update(asset)
    )

    return Response({
        "success": True,
        "asset_id": asset.AssetId,
        "dragged": asset.dragged,
        "bottle_loc": asset.Bottle_loc,
    })



@api_view(['POST'])
def purchase(request):
    result = PurchaseService.purchase(request.data)
    return Response(result)

@api_view(['POST'])
def return_bottle(request):

    result = ReturnService.return_bottle(request.data)

    return Response(result)

@api_view(["POST"])
def calculatepurchase(request):

    result = PurchaseService.calculate_purchase(request.data)

    return Response(result)





from accounts.services.refill_service import RefillService


@api_view(["POST"])
def refill_bottle(request):

    try:
        result = RefillService.refill(request.data)

        if result.get("success"):
            return Response(
                result,
                status=status.HTTP_200_OK
            )

        return Response(
            result,
            status=status.HTTP_400_BAD_REQUEST
        )

    except Exception as e:

     #   print("Refill Error:", str(e))

        return Response(
            {
                "success": False,
                "message": str(e)
            },
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )

@api_view(["POST"])
def complete_refill(request):

    try:
        result = RefillService.complete_refill(
            request.data
        )

        if result.get("success"):
            return Response(
                result,
                status=status.HTTP_200_OK
            )

        return Response(
            result,
            status=status.HTTP_400_BAD_REQUEST
        )

    except Exception as e:

     #   print("Complete Refill Error:", str(e))

        return Response(
            {
                "success": False,
                "message": str(e)
            },
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )    


from accounts.services.fine_service import FineService


@api_view(["POST"])
def apply_bottle_fine(request):

    try:
        result = FineService.apply_fine(request.data)

        if result.get("success"):
            return Response(
                result,
                status=status.HTTP_200_OK
            )

        return Response(
            result,
            status=status.HTTP_400_BAD_REQUEST
        )

    except Exception as e:
       # print("Fine Transaction Error:", str(e))

        return Response(
            {
                "success": False,
                "message": str(e)
            },
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )

   
@api_view(["POST"])
def bulk_clean_bottles(request):

    try:

        result = (
            BottleCleaningService
            .clean_bottles(request.data)
        )

        if result.get("success"):

            return Response(
                result,
                status=status.HTTP_200_OK
            )

        return Response(
            result,
            status=status.HTTP_400_BAD_REQUEST
        )

    except Exception as e:

        # print(
        #     "Bottle Cleaning Error:",
        #     str(e)
        # )

        return Response(
            {
                "success": False,
                "message": str(e)
            },
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        ) 

@api_view(["POST"])
def bulk_move_bottles(request):

    try:

        result = BottleCleaningService.move_bottles(
            request.data
        )

        if result.get("success"):
            return Response(
                result,
                status=status.HTTP_200_OK
            )

        return Response(
            result,
            status=status.HTTP_400_BAD_REQUEST
        )

    except Exception as e:

       # print("Bulk bottle move error:", e)

        return Response(
            {
                "success": False,
                "message": str(e)
            },
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(["GET"])
def cashflow_summary(request):

    city_id = request.query_params.get("city_id")
    user_role = request.query_params.get("user_role")

    if not city_id:
        return Response(
            {
                "success": False,
                "message": "city_id is required."
            },
            status=status.HTTP_400_BAD_REQUEST
        )

    if not user_role:
        return Response(
            {
                "success": False,
                "message": "user_role is required."
            },
            status=status.HTTP_400_BAD_REQUEST
        )

    try:

        summary = CashflowService.get_summary(
            city_id,
            user_role
        )

        return Response(
            {
                "success": True,
                "data": summary
            },
            status=status.HTTP_200_OK
        )

    except Exception as e:

        # print(
        #     "Cashflow Summary Error:",
        #     str(e)
        # )

        return Response(
            {
                "success": False,
                "message": str(e)
            },
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


from accounts.services.supermarket_order_service import (
    SupermarketOrderService
)


@api_view(["POST"])
def supermarket_order(request):

    try:

        result = SupermarketOrderService.place_order(
            request.data
        )

        if result.get("success"):

            return Response(
                result,
                status=status.HTTP_200_OK
            )

        return Response(
            result,
            status=status.HTTP_400_BAD_REQUEST
        )

    except Exception as e:

        # print(
        #     "SUPERMARKET ORDER ERROR:",
        #     str(e)
        # )

        return Response(
            {
                "success": False,
                "message": str(e)
            },
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )

    
@api_view(['GET'])
def get_city_rule_master(request, citytype):

    try:
        rule = CityruleMaster.objects.get(
            citytype=citytype,
            rule_number=0
        )

        return Response({
            "citytype": rule.citytype,

            "envtx_p_bvb": rule.envtx_p_bvb,
            "envtx_p_brcb": rule.envtx_p_brcb,
            "envtx_p_brfb": rule.envtx_p_brfb,
            "envtx_p_uvb": rule.envtx_p_uvb,
            "envtx_p_urcb": rule.envtx_p_urcb,
            "envtx_p_urfb": rule.envtx_p_urfb,

            "envtx_r_bvb": rule.envtx_r_bvb,
            "envtx_r_brcb": rule.envtx_r_brcb,
            "envtx_r_brfb": rule.envtx_r_brfb,
            "envtx_r_uvb": rule.envtx_r_uvb,
            "envtx_r_urcb": rule.envtx_r_urcb,
            "envtx_r_urfb": rule.envtx_r_urfb,

            "envtx_c_bvb": rule.envtx_c_bvb,
            "envtx_c_brcb": rule.envtx_c_brcb,
            "envtx_c_brfb": rule.envtx_c_brfb,
            "envtx_c_uvb": rule.envtx_c_uvb,
            "envtx_c_urcb": rule.envtx_c_urcb,
            "envtx_c_urfb": rule.envtx_c_urfb,
        })

    except CityruleMaster.DoesNotExist:
        return Response(
            {"error": "City rule master not found"},
            status=404
        )
    

class FeedbackEmailAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        message = request.data.get("message", "")

        if not isinstance(message, str) or not message.strip():
            return Response(
                {"message": "Please enter your feedback."},
                status=status.HTTP_400_BAD_REQUEST
            )

        message = message.strip()

        if len(message) > 5000:
            return Response(
                {"message": "Feedback cannot exceed 5000 characters."},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Always obtain the user from JWT authentication.
        user = request.user

        # Read the verified email directly from CustomUser.
       

        recipient = getattr(
            settings, "FEEDBACK_RECEIVER_EMAIL", ""
        )

        if not recipient:
            return Response(
                {"message": "Feedback recipient is not configured."},
                status=status.HTTP_503_SERVICE_UNAVAILABLE
            )

        email = EmailMessage(
            subject="ShorterLoops - User Feedback",
            body=(
                f"Feedback from: {user.Username}\n"
                f"User email: {user.email}\n"
                f"User Role: {user.pk}\n\n"
                f"Feedback:\n{message}"
            ),
            from_email=None,
            to=[recipient],
            reply_to=[user.email],
        )

        try:
            email.send(fail_silently=False)
        except Exception:
            return Response(
                {"message": "Unable to send feedback. Please try again."},
                status=status.HTTP_502_BAD_GATEWAY
            )

        return Response(
            {"message": "Your feedback has been submitted successfully."},
            status=status.HTTP_200_OK
        )
        
User = get_user_model()
token_generator = PasswordResetTokenGenerator()


class PasswordResetRequestView(APIView):
    permission_classes = [AllowAny]
    authentication_classes = []

    def post(self, request):
        email = request.data.get("email", "")

        if not isinstance(email, str):
            return Response(
                {"message": "If an account exists for that email, a reset link will be sent."},
                status=status.HTTP_200_OK,
            )

        email = email.strip()

        # Always return the same response to avoid revealing
        # whether an email address is registered.
        generic_message = (
            "If an account exists for that email, a reset link will be sent."
        )

        if not email:
            return Response(
                {"message": generic_message},
                status=status.HTTP_200_OK,
            )

        users = User.objects.filter(email__iexact=email)

        # If your application requires verified email addresses,
        # only send reset links to verified accounts.
        if hasattr(User, "is_email_verified"):
            users = users.filter(is_email_verified=True)

        user = users.first()

        if user:
            try:
                uid = urlsafe_base64_encode(force_bytes(user.pk))
                token = token_generator.make_token(user)

                frontend_url = getattr(
                    settings,
                    "PASSWORD_RESET_FRONTEND_URL",
                    "",
                ).rstrip("/")

                if not frontend_url:
                    logger.error(
                        "PASSWORD_RESET_FRONTEND_URL is not configured."
                    )
                    return Response(
                        {"message": generic_message},
                        status=status.HTTP_200_OK,
                    )

                reset_link = (
                    f"{frontend_url}/#/reset-password/{uid}/{token}"
                )

                send_mail(
                    subject="ShorterLoops - Reset Your Password",
                    message=(
                        f"Hello {user.Username},\n\n"
                        "We received a request to reset your password.\n\n"
                        f"Use this link to choose a new password:\n{reset_link}\n\n"
                        "If you did not request this, you can ignore this email."
                    ),
                    from_email=None,
                    recipient_list=[user.email],
                    fail_silently=False,
                )

            except Exception:
                logger.exception("Failed to send password reset email.")

        return Response(
            {"message": generic_message},
            status=status.HTTP_200_OK,
        )


class PasswordResetConfirmView(APIView):
    permission_classes = [AllowAny]
    authentication_classes = []

    def post(self, request):
        uid = request.data.get("uid")
        token = request.data.get("token")
        new_password = request.data.get("new_password")

        if not all(
            isinstance(value, str) and value
            for value in (uid, token, new_password)
        ):
            return Response(
                {"message": "Invalid or incomplete password reset request."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            user_id = force_str(urlsafe_base64_decode(uid))
            user = User.objects.get(pk=user_id)
        except (ValueError, TypeError, OverflowError, User.DoesNotExist):
            return Response(
                {"message": "This reset link is invalid or has expired."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if not token_generator.check_token(user, token):
            return Response(
                {"message": "This reset link is invalid or has expired."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            validate_password(new_password, user=user)
        except ValidationError as exc:
            return Response(
                {"message": list(exc.messages)},
                status=status.HTTP_400_BAD_REQUEST,
            )

        user.set_password(new_password)
        user.save(update_fields=["password"])

        return Response(
            {"message": "Password reset successfully. Please log in."},
            status=status.HTTP_200_OK,
        )
#@api_view(["GET"])
# def sustainability_scorecard(request, cityid):
#     try:
#         current_day = max(
#             0, int(request.query_params.get("current_day", 0))
#         )
#     except (TypeError, ValueError):
#         return JsonResponse(
#             {"error": "current_day must be a non-negative integer"},
#             status=400,
#         )

#     role = request.query_params.get("role", "").strip()

#     city_assets = list(
#         Asset.objects.filter(Asset_CityId_id=cityid)
#     )

#     city_cashflows = list(
#         Cashflow.objects.filter(
#             TransactionId__startswith=f"{cityid}_"
#         )
#     )

#     # Parse the transaction day only once per record.
#     assets_with_days = [
#         (asset, transaction_day(asset.Transaction_Id, cityid))
#         for asset in city_assets
#     ]

#     cashflows_with_days = [
#         (tx, transaction_day(tx.TransactionId, cityid))
#         for tx in city_cashflows
#     ]

#     def assets_for_cycle(start_day, end_day):
#         return [
#             asset for asset, day in assets_with_days
#             if day is not None and start_day <= day <= end_day
#         ]

#     def cashflows_for_cycle(start_day, end_day):
#         return [
#             tx for tx, day in cashflows_with_days
#             if day is not None and start_day <= day <= end_day
#         ]

#     current_index = cycle_index(current_day)
#     start_day, end_day = cycle_bounds(current_index)

#     current_assets = assets_for_cycle(start_day, end_day)
#     current_cashflows = cashflows_for_cycle(start_day, end_day)

#     user_current = build_cycle_metrics(
#         city_assets,
#         current_assets,
#         current_cashflows,
#         role=role,
#     )

#     city_current = build_cycle_metrics(
#         city_assets,
#         current_assets,
#         current_cashflows,
#         role=None,
#     )

#     # PPT requires a maximum of 12 displayed time blocks.
#     first_cycle = max(0, current_index - 11)
#     history = []

#     for index in range(first_cycle, current_index + 1):
#         start, end = cycle_bounds(index)

#         summary = build_cycle_metrics(
#             city_assets,
#             assets_for_cycle(start, end),
#             cashflows_for_cycle(start, end),
#             role=role,
#         )

#         history.append({
#             "cycle_number": index + 1,
#             "start_day": start,
#             "end_day": end,
#             "scores": summary["scores"],
#             "avoidedEmissions": (
#                 summary["metrics"]["avoidedEmissions"]
#             ),
#         })

#     comparison_keys = [
#         "affinityVirginMaterials",
#         "affinityFancyPackaging",
#         "reuseMindset",
#         "careForMaterials",
#         "civicSense",
#         "savingsInWallet",
#     ]

#     comparison = []

#     for key in comparison_keys:
#         user_metric = user_current["metrics"][key]
#         city_metric = city_current["metrics"][key]

#         comparison.append({
#             "key": key,
#             "label": (
#                 "Saving potential"
#                 if key == "savingsInWallet"
#                 else user_metric["label"]
#             ),
#             "you": user_metric,
#             "city": city_metric,
#         })

#     return JsonResponse({
#         "current_day": current_day,
#         "current_cycle": current_index + 1,
#         "current": {
#             "start_day": start_day,
#             "end_day": end_day,
#             "totalBottles": user_current["totalBottles"],
#             "bottleCounts": user_current["bottleCounts"],
#             "scores": user_current["scores"],
#         },
#         "history": history,
#         "comparison": comparison,
#         "metricLabels": [
#             user_current["metrics"][key]["label"]
#             for key in CURRENT_METRICS
#         ],
#     })

@api_view(["GET"])
def sustainability_scorecard(request, cityid):
    try:
        current_day = int(
            request.query_params.get("current_day", 0)
        )

        if current_day < 0:
            raise ValueError

    except (TypeError, ValueError):
        return JsonResponse(
            {"error": "current_day must be a non-negative integer"},
            status=400,
        )

    role = request.query_params.get("role", "").strip()

    # --------------------------------------------------
    # 1. Fetch city assets and cashflows
    # --------------------------------------------------

    city_assets = list(
        Asset.objects.filter(Asset_CityId_id=cityid)
    )

    city_cashflows = list(
        Cashflow.objects.filter(
            TransactionId__startswith=f"{cityid}_"
        )
    )

    # --------------------------------------------------
    # 2. Parse transaction days once
    # --------------------------------------------------

    assets_with_days = [
        (
            asset,
            transaction_day(asset.Transaction_Id, cityid),
        )
        for asset in city_assets
    ]

    cashflows_with_days = [
        (
            tx,
            transaction_day(tx.TransactionId, cityid),
        )
        for tx in city_cashflows
    ]

    # --------------------------------------------------
    # 3. Cycle-specific filtering
    # --------------------------------------------------

    def assets_for_cycle(start_day, end_day):
        return [
            asset
            for asset, day in assets_with_days
            if day is not None
            and start_day <= day <= end_day
        ]

    def cashflows_for_cycle(start_day, end_day):
        return [
            tx
            for tx, day in cashflows_with_days
            if day is not None
            and start_day <= day <= end_day
        ]

    # --------------------------------------------------
    # 4. Format one metric as a score object
    # --------------------------------------------------

    def get_score_object(summary, key):
        scores = summary.get("scores") or {}
        score = scores.get(key)

        if isinstance(score, dict):
            return {
                "score": score.get("score"),
                "level": score.get("level", 0),
                "symbol": score.get("symbol", "star"),
            }

        # Handles missing or null scores safely.
        return score_value(
            (summary.get("metrics") or {}).get(key)
        )

    # --------------------------------------------------
    # 5. Format scores as an ordered array for Angular
    # --------------------------------------------------

    def get_score_rows(summary):
        rows = []

        for key in CURRENT_METRICS:
            score = get_score_object(summary, key)

            rows.append({
                "key": key,
                "label": METRIC_LABELS.get(key, key),
                "score": score["score"],
                "level": score["level"],
                "symbol": score["symbol"],
            })

        return rows

    # --------------------------------------------------
    # 6. Identify the current 30-day cycle
    # --------------------------------------------------

    current_index = cycle_index(current_day)

    if current_index is None:
        return JsonResponse(
            {"error": "Invalid current_day"},
            status=400,
        )

    start_day, end_day = cycle_bounds(current_index)

    current_assets = assets_for_cycle(start_day, end_day)
    current_cashflows = cashflows_for_cycle(start_day, end_day)

    # --------------------------------------------------
    # 7. Calculate user's current-cycle metrics
    # --------------------------------------------------

    user_current = build_cycle_metrics(
        city_assets,
        current_assets,
        current_cashflows,
        role=role,
    )

    # --------------------------------------------------
    # 8. Calculate entire city's current-cycle metrics
    # --------------------------------------------------

    city_current = build_cycle_metrics(
        city_assets,
        current_assets,
        current_cashflows,
        role=None,
    )

    # --------------------------------------------------
    # 9. Build historical cycles (maximum 12)
    # --------------------------------------------------

    first_cycle = max(0, current_index - 11)

    history = []

    for index in range(first_cycle, current_index + 1):

        cycle_start, cycle_end = cycle_bounds(index)

        cycle_assets = assets_for_cycle(
            cycle_start,
            cycle_end,
        )

        cycle_cashflows = cashflows_for_cycle(
            cycle_start,
            cycle_end,
        )

        summary = build_cycle_metrics(
            city_assets,
            cycle_assets,
            cycle_cashflows,
            role=role,
        )

        history.append({
            "cycle_number": index + 1,
            "start_day": cycle_start,
            "end_day": cycle_end,

            # Angular expects an array of score objects.
            "scores": get_score_rows(summary),

            # Angular expects an object, not a raw number or null.
            "avoidedEmissions": get_score_object(
                summary,
                "avoidedEmissions",
            ),
        })

    # --------------------------------------------------
    # 10. Build user vs city comparison
    # --------------------------------------------------

    comparison_keys = [
        "affinityVirginMaterials",
        "affinityFancyPackaging",
        "reuseMindset",
        "careForMaterials",
        "civicSense",
        "savingsInWallet",
    ]

    comparison = []

    for key in comparison_keys:

        metric_label = METRIC_LABELS.get(key, key)

        if key == "savingsInWallet":
            metric_label = "Saving potential"

        comparison.append({
            "key": key,
            "label": metric_label,

            # Always return score objects, even when the value is null.
            "you": score_value(
                user_current["metrics"].get(key)
            ),

            "city": score_value(
                city_current["metrics"].get(key)
            ),
        })

    # --------------------------------------------------
    # 11. Metric labels in the same order as score arrays
    # --------------------------------------------------

    metric_labels = [
        METRIC_LABELS.get(key, key)
        for key in CURRENT_METRICS
    ]

    # --------------------------------------------------
    # 12. Final API response
    # --------------------------------------------------

    response_data = {
        "current_day": current_day,
        "current_cycle": current_index + 1,

        "current": {
            "start_day": start_day,
            "end_day": end_day,
            "totalBottles": user_current["totalBottles"],
            "bottleCounts": user_current["bottleCounts"],

            # Now an ordered array for Angular *ngFor.
            "scores": get_score_rows(user_current),
        },

        "history": history,
        "comparison": comparison,
        "metricLabels": metric_labels,
    }

    return JsonResponse(response_data)
