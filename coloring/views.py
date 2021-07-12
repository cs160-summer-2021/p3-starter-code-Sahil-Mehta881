from django.shortcuts import render, redirect

def index(request):
    tens_min, ones_min, tens_sec, ones_sec = 0, 0, 0, 0
    if request.method == 'POST':
        form = request.POST.dict()
        payload = {'tens_min': int(form['tens_min']), 'ones_min': int(form['ones_min']), \
            'tens_sec': int(form['tens_sec']), 'ones_sec': int(form['ones_sec'])}
        return render(request, 'coloring/new_interaction.html', payload)
    return render(request, 'coloring/new_interaction.html')

def demo(request):
    return render(request, 'coloring/demo.html')

def start(request):
    return render(request, 'coloring/start.html')

def timer(request):
    return render(request, 'coloring/timer.html')