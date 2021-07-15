from django.urls import path
from . import views

urlpatterns = [
    path('demo', views.demo, name='demo'),
    path('canvas', views.index, name='canvas'),
    path('', views.start, name='start'),
    path('timer', views.timer, name='timer'),
]
