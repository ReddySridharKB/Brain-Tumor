import matplotlib.pyplot as plt
import os
from app.config.settings import settings

def generate_probability_chart(probability: float, scan_id: int):
    """
    Generate a pie chart indicating the probability of a tumor.
    """
    charts_dir = os.path.join(settings.STORAGE_DIR, "charts")
    os.makedirs(charts_dir, exist_ok=True)
    
    chart_path = os.path.join(charts_dir, f"scan_{scan_id}_prob.png")
    
    labels = ['Tumor Probability', 'Normal']
    sizes = [probability * 100, (1 - probability) * 100]
    colors = ['#ff9999','#66b3ff']
    
    fig1, ax1 = plt.subplots()
    ax1.pie(sizes, labels=labels, colors=colors, autopct='%1.1f%%', startangle=90)
    ax1.axis('equal')  # Equal aspect ratio ensures that pie is drawn as a circle.
    
    plt.title("Tumor Detection Probability")
    plt.savefig(chart_path)
    plt.close()
    
    return chart_path
