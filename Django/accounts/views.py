from django.db.models import Q
from .models import City, CustomUser, Facility, FACILITY_CHOICES, Cityrule, Asset, Cashflow, Auditlog, Bottleprice, Shampooprice,BottleInventory
from .serializers import CustomUserSerializer, citySerializer, facilitySerializer, cityRuleSerializer, AssetSerializer, cashflowSerializer, AuditSerializer, BottleSerializer, shampooSerializer,BottleInventorySerializer
from rest_framework.decorators import api_view
from rest_framework.parsers import JSONParser
from django.http import JsonResponse
from django.db import transaction
from django.shortcuts import get_object_or_404
from django.views.decorators.csrf import csrf_exempt
import json
from django.db.models import QuerySet
from django.core.exceptions import ObjectDoesNotExist
from django.db.models.signals import post_save
from .signals import user_data_received, pause_timer_for_city, resume_timer_for_city
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
currentuser = ''
cartcount = 100

import string
import random

def generate_short_id(length=8):
    characters = string.ascii_letters + string.digits  # a-zA-Z0-9
    return ''.join(random.choices(characters, k=length))

@method_decorator(csrf_exempt, name='dispatch')
class SignUpView(APIView):
    # authentication_classes = []  # Disable all authentication
    # permission_classes = []     # Disable all permissions

    # def post(self, request):
    #     serializer = CustomUserSerializer(data=request.data)
    #     if serializer.is_valid():
    #         user = serializer.save()
    #         user.is_active = True
    #         user.save()

    #         # Create token
    #         refresh = RefreshToken.for_user(user)
    #         token = str(refresh.access_token)

    #         # Verification link
    #         verify_url = f"http://localhost:8000/api/verify-email/?token={token}"

    #         send_mail(
    #             subject="Verify your email",
    #             message=f"Click to verify: {verify_url}",
    #             from_email=settings.EMAIL_HOST_USER,
    #             recipient_list=[user.email],
    #         )

    #         return Response({"message": "User created. Check email to verify."})

    #     return Response(serializer.errors, status=400)
    authentication_classes = []  # Disable all authentication
    permission_classes = []     # Disable all permissions

    def post(self, request):
        print(request.data)
        serializer = CustomUserSerializer(data=request.data)
        if serializer.is_valid():
            user = serializer.save()
            refresh = RefreshToken.for_user(user)
            return Response({
                'refresh': str(refresh),
                'access': str(refresh.access_token),
                'user': CustomUserSerializer(user).data
            }, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class LoginView(APIView):
    authentication_classes = []  # Disable authentication
    permission_classes = []  # Allow unrestricted access

    def post(self, request):
        username = request.data.get('Username')
        password = request.data.get('Password')

        user = authenticate(Username=username, password=password)

        if user:
            refresh = RefreshToken.for_user(user)
            serializer = CustomUserSerializer(user)
            return Response({
                'refresh': str(refresh),
                'access': str(refresh.access_token),
                'user': serializer.data
            })
        return Response(
            {'error': 'Invalid credentials'},
            status=status.HTTP_401_UNAUTHORIZED
        )
User = CustomUser

class VerifyEmailView(APIView):
    authentication_classes = []
    permission_classes = []

    def get(self, request):
        token = request.GET.get('token')

        try:
            access_token = AccessToken(token)
            user_id = access_token['user_id']

            # ✅ FIX HERE
            user = User.objects.get(UserId=user_id)

            user.is_verified = True
            user.save()

            return Response({"message": "Email verified successfully"})

        except Exception as e:
            print("Verification error:", e)
            return Response({"error": "Invalid or expired token"}, status=400)

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
        data = Facility.objects.filter(Facility_cityid=cityid)
        serializer = facilitySerializer(data, many=True)
        return JsonResponse(serializer.data, safe=False)


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
        print(data)
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
    print(itemid)
    if request.method == 'GET':
        data = Asset.objects.filter(AssetId=itemid)
        serializer = AssetSerializer(data, many=True)
        # logs = LogEntry.objects.filter(object_id=itemid)
        return JsonResponse(serializer.data, safe=False)
    elif request.method == 'PUT':
        data = JSONParser().parse(request)
        getasset = Asset.objects.filter(AssetId=itemid).first()
        serializer = AssetSerializer(getasset, data=data, partial=True)
        if serializer.is_valid():
            serializer.save()
        else:
            print("invalid data")
        return JsonResponse(serializer.data, status=status.HTTP_200_OK)


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



@api_view(['GET', 'POST', 'PUT'])
def updatefacility(request):
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
        print("leavefacility",data);
        getfacility = Facility.objects.filter(Owner_id=userid)
        for record in getfacility:
            serializer = facilitySerializer(record, data=data, partial=True)
            if serializer.is_valid():
                serializer.save()
            else:
                print("invalid data")
        return JsonResponse(serializer.data, status=status.HTTP_201_CREATED)


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

            city = City.objects.get(pk=cityid)
            city.timer_paused = timer_paused
            city.save()

            print(f"Timer paused set to {timer_paused} for city {cityid}")

            # Pause or resume the timer based on the timer_paused value
            if timer_paused:
                pause_timer_for_city(cityid)
            else:
                resume_timer_for_city(cityid)

            return JsonResponse({"success": True, "message": f"Timer paused updated to {timer_paused}"})
        except City.DoesNotExist:
            return JsonResponse({"success": False, "error": "City not found"}, status=404)
        except json.JSONDecodeError:
            return JsonResponse({"success": False, "error": "Invalid JSON format"}, status=400)
        except Exception as e:
            return JsonResponse({"success": False, "error": str(e)}, status=500)

    return JsonResponse({"success": False, "error": "Invalid request method"}, status=405)


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


@api_view(['GET', 'POST', 'PUT'])
def updateusercity(request, userid):
    if request.method == 'PUT':
        data = JSONParser().parse(request)
        getuser = CustomUser.objects.filter(pk=userid).first()
        serializer = CustomUserSerializer(getuser, data=data, partial=True)
        if serializer.is_valid():
            serializer.save()
        else:
            print("invalid data")
        return JsonResponse(serializer.data, status=status.HTTP_201_CREATED)
    if request.method == 'GET':
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
@csrf_exempt  # Only for development; use proper authentication in production
def manage_city_timer(request, cityid):
    if request.method == "POST":
        try:
            data = json.loads(request.body)
            action = data.get("action")  # 'pause' or 'resume'
            if not cityid or action not in ["pause", "resume"]:
                return JsonResponse({"error": "Invalid data"}, status=400)

            if not City.objects.filter(pk=cityid).exists():
                return JsonResponse({"error": "City not found"}, status=404)

            if action == "pause":
                pause_timer_for_city(cityid)
                return JsonResponse({"message": f"Paused timer for city {cityid}"})

            elif action == "resume":
                resume_timer_for_city(cityid)
                return JsonResponse({"message": f"Resumed timer for city {cityid}"})

        except json.JSONDecodeError:
            return JsonResponse({"error": "Invalid JSON"}, status=400)

    return JsonResponse({"error": "Invalid request"}, status=405)

@api_view(['POST', 'GET','PUT'])
def bottle_inventory_detail(request):

    # ---------------- POST ----------------
    if request.method == 'POST':
        producer_code = request.data.get('producer_code')
        bottle_type = request.data.get('bottle_type')
        city_id = request.data.get('Bottle_CityId')
        current_cycle = request.data.get('cycle_number')
        previous_cycle = request.data.get('previous_cycle_number')

        print("POST data:", producer_code, bottle_type, city_id, request.data)

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

        print(
            "GET params =>",
            "producer_code:", producer_code,
            "bottle_type:", bottle_type,
            "city_id:", city_id,
            "cycle_number:", cycle_number,
            "ALL:", request.query_params
        )

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

        print("PUT data:", request.data)

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
    
    print(itemid)
    try:

        asset = (
            Asset.objects
            .select_for_update()
            .get(
                AssetId=itemid,
                purchased=False
            )
        )

    except Asset.DoesNotExist:

        return Response({
            "success": False,
            "message": "Bottle not found"
        })

    if asset.dragged:

        return Response({
            "success": False,
            "message": "Bottle already reserved"
        })

    cart = request.data.get("cart")
    print(cart)
    asset.dragged = True
    asset.Bottle_loc = "In" + cart
    print(asset.Bottle_loc)
    asset.save(update_fields=[
        "dragged",
        "Bottle_loc"
    ])

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