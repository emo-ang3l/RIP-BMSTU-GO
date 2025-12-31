# calculator/models.py
from django.db import models
from django.contrib.auth.models import User

class Insulator(models.Model):
    insulator_name = models.CharField(max_length=255)
    insulator_description = models.TextField()
    image_key = models.CharField(max_length=255, null=True, blank=True)
    thermal_conductivity = models.FloatField()

    def __str__(self):
        return self.insulator_name

class InsulatorRequest(models.Model):
    class Status(models.TextChoices):
        DRAFT = 'DRAFT', 'Черновик'
        DELETED = 'DELETED', 'Удалён'
        FORMED = 'FORMED', 'Сформирован'
        COMPLETED = 'COMPLETED', 'Завершён'
        REJECTED = 'REJECTED', 'Отклонён'

    status_request = models.CharField(max_length=20, choices=Status.choices, default=Status.DRAFT)
    creation_datetime = models.DateTimeField(auto_now_add=True)
    formation_datetime = models.DateTimeField(null=True, blank=True)
    completion_datetime = models.DateTimeField(null=True, blank=True)
    client = models.ForeignKey(User, on_delete=models.DO_NOTHING, related_name='created_requests')
    manager = models.ForeignKey(User, on_delete=models.DO_NOTHING, related_name='managed_requests', null=True, blank=True)
    required_r_value = models.FloatField(default=0.0)
    total_thickness = models.FloatField(null=True, blank=True)

    def __str__(self):
        return f"Заявка №{self.id}"

class DetailRequestInsulator(models.Model):
    detail_request = models.ForeignKey(InsulatorRequest, on_delete=models.CASCADE)
    insulator = models.ForeignKey(Insulator, on_delete=models.CASCADE)
    quantity = models.IntegerField(default=1)
    order = models.IntegerField(default=1)
    DetailRequestActive = models.BooleanField(default=False)
    user_comment = models.TextField(null=True, blank=True)
    calculated_thickness = models.FloatField(null=True, blank=True)

    def __str__(self):
        return f"{self.detail_request_id}-{self.insulator_id}"

    class Meta:
        unique_together = ('detail_request', 'insulator')