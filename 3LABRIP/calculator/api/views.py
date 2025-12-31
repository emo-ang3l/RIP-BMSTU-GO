# calculator/api/views.py
from datetime import datetime
from decimal import Decimal
import os
import threading
import requests
import json

from django.contrib.auth import authenticate, login, logout
from django.views.decorators.csrf import csrf_exempt
from django.db.models import Sum
from rest_framework import viewsets, status
from rest_framework.decorators import action, api_view, permission_classes
from rest_framework.views import APIView
from rest_framework.permissions import BasePermission, SAFE_METHODS, IsAuthenticated, AllowAny
from rest_framework.response import Response
from rest_framework.parsers import JSONParser, MultiPartParser, FormParser
from rest_framework_simplejwt.tokens import RefreshToken
from drf_yasg.utils import swagger_auto_schema
from drf_yasg import openapi

from calculator.models import Insulator, InsulatorRequest, DetailRequestInsulator
from .serializers import (
    InsulatorSerializer, InsulatorRequestSerializer, DetailRequestInsulatorSerializer, 
    UserSerializer, RegisterSerializer, LoginSerializer
)

# Токен для псевдо-авторизации (8 байт)
CALCULATION_SERVICE_TOKEN = "12345678"
# URL Go-сервиса для расчета
GO_SERVICE_URL = os.environ.get('GO_SERVICE_URL', 'http://go-service:8080')

class IsOwnerOrReadOnly(BasePermission):
    def has_object_permission(self, request, view, obj):
        if request.method in SAFE_METHODS:
            return True
        if request.user.is_staff:
            return True
        return obj.client == request.user

class IsModerator(BasePermission):
    def has_permission(self, request, view):
        return request.user and request.user.is_staff

class IsModeratorOrReadOnly(BasePermission):
    def has_permission(self, request, view):
        if request.method in SAFE_METHODS:
            return True
        return request.user and request.user.is_staff

class InsulatorViewSet(viewsets.ModelViewSet):
    queryset = Insulator.objects.all()
    serializer_class = InsulatorSerializer
    permission_classes = [IsModeratorOrReadOnly]
    parser_classes = [JSONParser, MultiPartParser, FormParser]

    def get_permissions(self):
        if self.action == 'add_to_request':
            permission_classes = [IsAuthenticated]
        else:
            permission_classes = [IsModeratorOrReadOnly]
        return [permission() for permission in permission_classes]

    def get_queryset(self):
        qs = Insulator.objects.all()
        q = self.request.query_params.get('q')
        if q:
            qs = qs.filter(insulator_name__icontains=q)
        return qs.order_by('insulator_name')

    def destroy(self, request, *args, **kwargs):
        instance = self.get_object()
        instance.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)

    @action(detail=True, methods=['post'], url_path='add-to-request')
    def add_to_request(self, request, pk=None):
        insulator = self.get_object()
        user = request.user
        draft = InsulatorRequest.objects.filter(client=user, status_request=InsulatorRequest.Status.DRAFT).first()
        if not draft:
            # Создаем новую заявку используя Django ORM
            draft = InsulatorRequest.objects.create(
                status_request=InsulatorRequest.Status.DRAFT,
                client=user,
                required_r_value=0.0
            )

        existing = DetailRequestInsulator.objects.filter(detail_request=draft, insulator=insulator).exists()
        if existing:
            return Response({"detail": "Already added"}, status=status.HTTP_200_OK)

        order = DetailRequestInsulator.objects.filter(detail_request=draft).count() + 1
        DetailRequestInsulator.objects.create(
            detail_request=draft,
            insulator=insulator,
            quantity=1,
            order=order,
            DetailRequestActive=(order == 1),
            user_comment='Добавлено через API'
        )
        return Response({"detail": "Added to draft", "request_id": draft.id}, status=status.HTTP_201_CREATED)

class InsulatorRequestViewSet(viewsets.ModelViewSet):
    queryset = InsulatorRequest.objects.none()
    serializer_class = InsulatorRequestSerializer
    permission_classes = [IsAuthenticated, IsOwnerOrReadOnly]

    def get_permissions(self):
        if self.action in ['complete', 'reject']:
            permission_classes = [IsAuthenticated, IsModerator]
        elif self.action == 'cart_icon':
            permission_classes = [IsAuthenticated]
        elif self.action == 'update_thickness':
            # Метод для приема результатов от Go-сервиса, использует токен вместо аутентификации
            permission_classes = [AllowAny]
        else:
            permission_classes = [IsAuthenticated, IsOwnerOrReadOnly]
        return [permission() for permission in permission_classes]

    def get_queryset(self):
        user = self.request.user
        if user.is_staff:
            qs = InsulatorRequest.objects.all()
        else:
            qs = InsulatorRequest.objects.filter(client=user)
        status_filter = self.request.query_params.get('status')
        if status_filter:
            qs = qs.filter(status_request=status_filter)
        from_date = self.request.query_params.get('from_date')
        if from_date:
            qs = qs.filter(creation_datetime__gte=from_date)
        to_date = self.request.query_params.get('to_date')
        if to_date:
            qs = qs.filter(creation_datetime__lte=to_date)
        return qs.order_by('-creation_datetime')

    def get_serializer_context(self):
        context = super().get_serializer_context()
        if self.action == 'retrieve':
            context['include_insulators'] = True
        return context

    def create(self, request, *args, **kwargs):
        return Response({"detail": "POST not allowed"}, status=status.HTTP_405_METHOD_NOT_ALLOWED)

    def update(self, request, *args, **kwargs):
        instance = self.get_object()
        if not (instance.client == request.user or request.user.is_staff):
            return Response({"detail": "Permission denied"}, status=status.HTTP_403_FORBIDDEN)
        if instance.status_request not in [InsulatorRequest.Status.DRAFT, InsulatorRequest.Status.FORMED]:
            return Response({"detail": "Cannot edit in this status"}, status=status.HTTP_400_BAD_REQUEST)
        serializer = self.get_serializer(instance, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(serializer.data)

    def destroy(self, request, *args, **kwargs):
        instance = self.get_object()
        # Только модераторы могут удалять заявки
        if not request.user.is_staff:
            return Response({"detail": "Permission denied. Only moderators can delete orders."}, status=status.HTTP_403_FORBIDDEN)
        if instance.status_request != InsulatorRequest.Status.DRAFT:
            return Response({"detail": "Can only delete draft"}, status=status.HTTP_400_BAD_REQUEST)
        instance.status_request = InsulatorRequest.Status.DELETED
        instance.save()
        return Response(status=status.HTTP_204_NO_CONTENT)

    @action(detail=False, methods=['get'], url_path='cart-icon')
    def cart_icon(self, request):
        user = request.user
        draft = InsulatorRequest.objects.filter(client=user, status_request=InsulatorRequest.Status.DRAFT).first()
        if not draft:
            return Response({"request_id": None, "count": 0})
        count = DetailRequestInsulator.objects.filter(detail_request=draft).count()
        return Response({"request_id": draft.id, "count": count})

    @action(detail=True, methods=['put'], url_path='form')
    def form(self, request, pk=None):
        instance = self.get_object()
        if not (instance.client == request.user or request.user.is_staff):
            return Response({"detail": "Permission denied"}, status=status.HTTP_403_FORBIDDEN)
        if instance.status_request != InsulatorRequest.Status.DRAFT:
            return Response({"detail": "Only draft can be formed"}, status=status.HTTP_400_BAD_REQUEST)
        if not (instance.required_r_value > 0):
            return Response({"detail": "Missing required fields"}, status=status.HTTP_400_BAD_REQUEST)
        instance.status_request = InsulatorRequest.Status.FORMED
        instance.formation_datetime = datetime.now()
        instance.save()
        return Response(self.get_serializer(instance).data)

    @action(detail=True, methods=['put'], url_path='complete')
    def complete(self, request, pk=None):
        if not request.user.is_staff:
            return Response({"detail": "Moderator permission required"}, status=status.HTTP_403_FORBIDDEN)
        instance = self.get_object()
        if instance.status_request != InsulatorRequest.Status.FORMED:
            return Response({"detail": "Only formed can be completed"}, status=status.HTTP_400_BAD_REQUEST)
        instance.manager = request.user
        instance.completion_datetime = datetime.now()
        instance.status_request = InsulatorRequest.Status.COMPLETED
        
        # Вычисляем calculated_thickness для деталей
        details = DetailRequestInsulator.objects.filter(detail_request=instance)
        for detail in details:
            detail.calculated_thickness = instance.required_r_value * detail.insulator.thermal_conductivity
            detail.save()
        
        # Сохраняем заявку без total_thickness (он будет рассчитан асинхронно)
        instance.save()
        
        # Асинхронно вызываем Go-сервис для расчета total_thickness
        threading.Thread(
            target=call_calculation_service,
            args=(instance.id, instance.required_r_value)
        ).start()
        
        return Response(self.get_serializer(instance).data)
    
    @action(detail=True, methods=['post'], url_path='update-thickness')
    def update_thickness(self, request, pk=None):
        """
        Метод для приема результатов расчета от Go-сервиса.
        Использует псевдо-авторизацию через токен.
        """
        # Проверка псевдо-авторизации
        token = request.data.get('token')
        if token != CALCULATION_SERVICE_TOKEN:
            return Response({"detail": "Invalid token"}, status=status.HTTP_403_FORBIDDEN)
        
        # Получаем объект напрямую по pk, минуя систему разрешений
        # так как у нас есть токен для авторизации
        try:
            instance = InsulatorRequest.objects.get(pk=pk)
        except InsulatorRequest.DoesNotExist:
            return Response({"detail": "Request not found"}, status=status.HTTP_404_NOT_FOUND)
        
        total_thickness = request.data.get('total_thickness')
        success = request.data.get('success', True)
        
        if total_thickness is None:
            return Response({"detail": "total_thickness is required"}, status=status.HTTP_400_BAD_REQUEST)
        
        # Обновляем total_thickness в заявке
        instance.total_thickness = total_thickness
        instance.save()
        
        return Response({
            "detail": "Thickness updated successfully",
            "request_id": instance.id,
            "total_thickness": total_thickness,
            "success": success
        }, status=status.HTTP_200_OK)

    @action(detail=True, methods=['put'], url_path='reject')
    def reject(self, request, pk=None):
        if not request.user.is_staff:
            return Response({"detail": "Moderator permission required"}, status=status.HTTP_403_FORBIDDEN)
        instance = self.get_object()
        if instance.status_request != InsulatorRequest.Status.FORMED:
            return Response({"detail": "Only formed can be rejected"}, status=status.HTTP_400_BAD_REQUEST)
        instance.manager = request.user
        instance.completion_datetime = datetime.now()
        instance.status_request = InsulatorRequest.Status.REJECTED
        instance.save()
        return Response(self.get_serializer(instance).data)

    @action(detail=True, methods=['delete'], url_path='items/(?P<insulator_id>\\d+)')
    def remove_item(self, request, pk=None, insulator_id=None):
        instance = self.get_object()
        if not instance.client == request.user:
            return Response({"detail": "Permission denied"}, status=status.HTTP_403_FORBIDDEN)
        if instance.status_request != InsulatorRequest.Status.DRAFT:
            return Response({"detail": "Only in draft"}, status=status.HTTP_400_BAD_REQUEST)
        try:
            detail = DetailRequestInsulator.objects.get(detail_request=instance, insulator_id=insulator_id)
            detail.delete()
            details = DetailRequestInsulator.objects.filter(detail_request=instance).order_by('order')
            for i, d in enumerate(details, 1):
                d.order = i
                d.DetailRequestActive = (i == 1)
                d.save()
            return Response(status=status.HTTP_204_NO_CONTENT)
        except DetailRequestInsulator.DoesNotExist:
            return Response({"detail": "Not found"}, status=status.HTTP_404_NOT_FOUND)

    @action(detail=True, methods=['put'], url_path='items/(?P<insulator_id>\\d+)')
    def update_item(self, request, pk=None, insulator_id=None):
        instance = self.get_object()
        if not instance.client == request.user:
            return Response({"detail": "Permission denied"}, status=status.HTTP_403_FORBIDDEN)
        if instance.status_request != InsulatorRequest.Status.DRAFT:
            return Response({"detail": "Only in draft"}, status=status.HTTP_400_BAD_REQUEST)
        try:
            detail = DetailRequestInsulator.objects.get(detail_request=instance, insulator_id=insulator_id)
            serializer = DetailRequestInsulatorSerializer(detail, data=request.data, partial=True)
            serializer.is_valid(raise_exception=True)
            serializer.save()
            return Response(serializer.data)
        except DetailRequestInsulator.DoesNotExist:
            return Response({"detail": "Not found"}, status=status.HTTP_404_NOT_FOUND)

class UserViewSet(viewsets.GenericViewSet):
    permission_classes = [AllowAny]
    serializer_class = UserSerializer

    def get_permissions(self):
        if self.action in ['me', 'update_me']:
            return [IsAuthenticated()]
        return super().get_permissions()

    @action(detail=False, methods=['post'], permission_classes=[AllowAny])
    def register(self, request):
        serializer = RegisterSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()
        return Response(UserSerializer(user).data, status=status.HTTP_201_CREATED)

    @action(detail=False, methods=['get'], permission_classes=[IsAuthenticated])
    def me(self, request):
        return Response(UserSerializer(request.user).data)

    @action(detail=False, methods=['put'], permission_classes=[IsAuthenticated])
    def update_me(self, request):
        serializer = UserSerializer(request.user, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(serializer.data)

class AuthLoginView(APIView):
    """
    API endpoint для логина пользователя.
    Возвращает JWT токены и sessionid.
    """
    permission_classes = [AllowAny]
    authentication_classes = []  # Отключаем аутентификацию для логина
    
    @swagger_auto_schema(
        request_body=openapi.Schema(
            type=openapi.TYPE_OBJECT,
            properties={
                'username': openapi.Schema(type=openapi.TYPE_STRING),
                'password': openapi.Schema(type=openapi.TYPE_STRING),
            },
            required=['username', 'password']
        ),
        responses={
            200: openapi.Schema(
                type=openapi.TYPE_OBJECT,
                properties={
                    'refresh': openapi.Schema(type=openapi.TYPE_STRING),
                    'access': openapi.Schema(type=openapi.TYPE_STRING),
                    'sessionid': openapi.Schema(type=openapi.TYPE_STRING),
                }
            ),
            400: 'Invalid credentials'
        }
    )
    def post(self, request):
        serializer = LoginSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = authenticate(request, username=serializer.validated_data['username'], password=serializer.validated_data['password'])
        if user is None:
            return Response({"detail": "Invalid credentials"}, status=status.HTTP_400_BAD_REQUEST)
        
        # Сохраняем сессию для установки sessionid в cookie
        login(request, user)
        
        # Генерируем JWT
        refresh = RefreshToken.for_user(user)
        
        # Получаем sessionid из текущей сессии
        sessionid = request.session.session_key
        if not sessionid:
            request.session.create()
            sessionid = request.session.session_key
        
        response = Response({
            'refresh': str(refresh),
            'access': str(refresh.access_token),
            'sessionid': sessionid,
        }, status=status.HTTP_200_OK)
        
        # Устанавливаем куки sessionid
        response.set_cookie(
            'sessionid',
            sessionid,
            max_age=1209600,  # 2 недели
            httponly=True,
            secure=False,  # Установите True для HTTPS
            samesite='Lax'
        )
        
        return response

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def auth_logout(request):
    logout(request)
    response = Response({"detail": "Logged out"}, status=status.HTTP_200_OK)
    # Удаляем cookie sessionid с теми же параметрами, что и при установке
    response.delete_cookie(
        'sessionid',
        path='/',
        samesite='Lax'
    )
    return response

def call_calculation_service(request_id, required_r_value):
    """
    Асинхронная функция для вызова Go-сервиса расчета total_thickness.
    """
    try:
        # Получаем данные об изоляторах для расчета
        details = DetailRequestInsulator.objects.filter(detail_request_id=request_id).select_related('insulator')
        details_payload = []
        for detail in details:
            details_payload.append({
                'id': detail.id,
                'insulator_id': detail.insulator.id,
                'thermal_conductivity': detail.insulator.thermal_conductivity,
                'quantity': detail.quantity
            })
        
        payload = {
            'request_id': request_id,
            'required_r_value': float(required_r_value),
            'details': details_payload
        }
        
        url = f"{GO_SERVICE_URL}/calculate"
        response = requests.post(
            url,
            json=payload,
            timeout=5,
            headers={'Content-Type': 'application/json'}
        )
        
        if response.status_code == 200:
            print(f"Calculation service accepted request {request_id}")
        else:
            print(f"Failed to call calculation service for request {request_id}: {response.status_code}")
    except Exception as e:
        print(f"Error calling calculation service for request {request_id}: {str(e)}")