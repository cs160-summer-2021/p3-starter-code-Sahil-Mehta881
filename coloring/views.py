from django.shortcuts import render

def index(request):
    return render(request, 'coloring/new_interaction.html')

def demo(request):
    return render(request, 'coloring/demo.html')

def start(request):
    return render(request, 'coloring/start.html')

def timer(request):
    return render(request, 'coloring/timer.html')