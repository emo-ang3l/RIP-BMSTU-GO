#!/usr/bin/env python3
"""
Скрипт для извлечения активных пользователей из Django-сессий в Redis
Использует pickle для десериализации данных сессий
Выводит подробную информацию о пользователях
"""
import os
import sys
import django
import redis
import pickle
from datetime import datetime
from collections import defaultdict

# Настройка Django environment
sys.path.append('/app')
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'insulation_backend.settings')
django.setup()

from django.contrib.auth.models import User

# Подключение к Redis (используем имя сервиса из docker-compose)
r = redis.Redis(host='redis', port=6379, db=0, decode_responses=False)

# Префикс для ключей сессий
prefix = ":1:django.contrib.sessions.cache"

# Получаем все ключи сессий
keys = r.keys(prefix + "*")

# Словарь для хранения информации о пользователях и их сессиях
user_sessions = defaultdict(list)  # user_id -> список ключей сессий

print("=" * 80)
print("АНАЛИЗ АКТИВНЫХ ПОЛЬЗОВАТЕЛЕЙ В REDIS")
print("=" * 80)
print(f"\nВремя выполнения: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
print(f"Всего найдено сессий в Redis: {len(keys)}\n")

# Обрабатываем все сессии
for key in keys:
    try:
        # Получаем данные сессии
        session_data = r.get(key)
        if session_data:
            # Десериализуем pickle данные
            session_dict = pickle.loads(session_data)
            # Извлекаем user_id если он есть
            if '_auth_user_id' in session_dict:
                user_id = session_dict['_auth_user_id']
                if user_id.isdigit():
                    user_sessions[user_id].append(key.decode('utf-8') if isinstance(key, bytes) else key)
    except Exception as e:
        # Игнорируем ошибки десериализации
        pass

# Получаем информацию о пользователях из Django
print("=" * 80)
print("АКТИВНЫЕ ПОЛЬЗОВАТЕЛИ:")
print("=" * 80)

if not user_sessions:
    print("\n❌ Активных пользователей не найдено")
else:
    # Сортируем по user_id
    sorted_user_ids = sorted([int(uid) for uid in user_sessions.keys() if uid.isdigit()])
    
    for user_id in sorted_user_ids:
        user_id_str = str(user_id)
        session_count = len(user_sessions[user_id_str])
        
        try:
            # Получаем информацию о пользователе из Django
            user = User.objects.get(id=user_id)
            
            print(f"\n{'─' * 80}")
            print(f"👤 ПОЛЬЗОВАТЕЛЬ #{user_id}")
            print(f"{'─' * 80}")
            print(f"  ID:              {user.id}")
            print(f"  Username:        {user.username}")
            print(f"  Email:           {user.email or 'не указан'}")
            print(f"  Имя:             {user.first_name or 'не указано'}")
            print(f"  Фамилия:         {user.last_name or 'не указана'}")
            print(f"  Модератор:       {'✅ Да' if user.is_staff else '❌ Нет'}")
            print(f"  Суперпользователь: {'✅ Да' if user.is_superuser else '❌ Нет'}")
            print(f"  Активен:         {'✅ Да' if user.is_active else '❌ Нет'}")
            print(f"  Последний вход:  {user.last_login.strftime('%Y-%m-%d %H:%M:%S') if user.last_login else 'никогда'}")
            print(f"  Дата регистрации: {user.date_joined.strftime('%Y-%m-%d %H:%M:%S')}")
            print(f"  Количество сессий: {session_count}")
            
            if session_count > 0:
                print(f"\n  Ключи сессий:")
                for i, session_key in enumerate(user_sessions[user_id_str][:5], 1):  # Показываем первые 5
                    # Извлекаем session_id из ключа
                    session_id = session_key.replace(prefix, '')
                    print(f"    {i}. {session_id[:50]}...")
                if session_count > 5:
                    print(f"    ... и еще {session_count - 5} сессий")
                    
        except User.DoesNotExist:
            print(f"\n{'─' * 80}")
            print(f"⚠️  ПОЛЬЗОВАТЕЛЬ #{user_id} (НЕ НАЙДЕН В БД)")
            print(f"{'─' * 80}")
            print(f"  ID:              {user_id}")
            print(f"  Количество сессий: {session_count}")
            print(f"  ⚠️  Пользователь удален из базы данных, но сессии остались в Redis")
        except Exception as e:
            print(f"\n{'─' * 80}")
            print(f"❌ ОШИБКА при получении информации о пользователе #{user_id}")
            print(f"{'─' * 80}")
            print(f"  Ошибка: {str(e)}")

# Итоговая статистика
print(f"\n{'=' * 80}")
print("СТАТИСТИКА:")
print("=" * 80)
print(f"  Всего активных пользователей: {len(user_sessions)}")
print(f"  Всего активных сессий: {sum(len(sessions) for sessions in user_sessions.values())}")
print(f"  Среднее количество сессий на пользователя: {sum(len(sessions) for sessions in user_sessions.values()) / len(user_sessions) if user_sessions else 0:.2f}")

# Дополнительная информация
print(f"\n{'=' * 80}")
print("ДОПОЛНИТЕЛЬНАЯ ИНФОРМАЦИЯ:")
print("=" * 80)
print(f"  Префикс ключей сессий: {prefix}")
print(f"  Redis host: redis:6379")
print(f"  База данных Redis: 0")
print("=" * 80)