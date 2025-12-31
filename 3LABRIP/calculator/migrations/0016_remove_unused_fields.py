# Generated manually to remove unused fields
from django.db import migrations


class Migration(migrations.Migration):

    dependencies = [
        ('calculator', '0015_alter_detailrequestinsulator_detailrequestactive_and_more'),
    ]

    operations = [
        # Удаляем поля из InsulatorRequest
        migrations.RemoveField(
            model_name='insulatorrequest',
            name='climate_zone',
        ),
        migrations.RemoveField(
            model_name='insulatorrequest',
            name='wall_type',
        ),
        migrations.RemoveField(
            model_name='insulatorrequest',
            name='norm_standard',
        ),
        # Удаляем поля из Insulator
        migrations.RemoveField(
            model_name='insulator',
            name='Insulator_active',
        ),
        migrations.RemoveField(
            model_name='insulator',
            name='price_per_m2',
        ),
        migrations.RemoveField(
            model_name='insulator',
            name='density',
        ),
        migrations.RemoveField(
            model_name='insulator',
            name='fire_rating',
        ),
    ]

