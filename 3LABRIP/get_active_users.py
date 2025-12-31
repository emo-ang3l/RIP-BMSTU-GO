#!/usr/bin/env python3
"""
Скрипт для извлечения активных пользователей из Django-сессий в Redis
Выводит username и ID сессий с нумерацией
"""
import os
import sys
import django
import redis
import pickle

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

# Словарь для хранения сессий по пользователям: user_id -> список session_ids
user_sessions = {}

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
                    # Извлекаем session_id из ключа (убираем префикс)
                    key_str = key.decode('utf-8') if isinstance(key, bytes) else key
                    session_id = key_str.replace(prefix, '')
                    
                    # Добавляем в словарь
                    if user_id not in user_sessions:
                        user_sessions[user_id] = []
                    user_sessions[user_id].append(session_id)
    except Exception as e:
        # Игнорируем ошибки десериализации
        pass

# Выводим результаты с username и session ID
counter = 1
for user_id in sorted(user_sessions.keys(), key=lambda x: int(x)):
    try:
        user = User.objects.get(id=int(user_id))
        username = user.username
    except User.DoesNotExist:
        username = f"user_{user_id}"
    
    # Выводим все сессии этого пользователя
    for session_id in user_sessions[user_id]:
        print(f"{counter}. {username} - {session_id}")
        counter += 1
