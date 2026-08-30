import requests
import time
import numpy as np
from datetime import datetime, timedelta

API_URL = "http://localhost:8000/api/sensor-data"

class NodeSimulator:
    def __init__(self, node_id, scenario, lat, lon):
        self.node_id = node_id
        self.scenario = scenario
        self.latitude = lat
        self.longitude = lon
        self.state_counter = 0
        
        # Initial State
        self.tilt_x_deg = np.random.normal(0.03, 0.005)
        self.tilt_y_deg = np.random.normal(-0.01, 0.005)
        self.cumulative_displacement_mm = np.random.normal(0.1, 0.02)
        self.crack_opening_mm = np.random.normal(0.0, 0.005)

    def simulate_reading(self, current_time):
        self.state_counter += 1
        
        # Base independent noises
        tilt_change = np.random.normal(0, 0.001)
        disp_change = np.random.normal(0, 0.005)
        crack_change = np.random.normal(0, 0.001)
        
        acceleration_mps2 = np.random.normal(0.04, 0.005)
        peak_acceleration_mps2 = acceleration_mps2 + np.random.uniform(0.01, 0.03)
        rms_acceleration_mps2 = acceleration_mps2 * 0.7
        dominant_frequency_hz = np.random.normal(18.0, 0.5)
        vibration_duration_s = np.random.uniform(0.1, 0.5)
        
        # Scenario Logic
        if self.scenario == "DETERIORATING":
            severity = min(self.state_counter / 100.0, 1.0)
            disp_change += severity * 0.1
            crack_change += severity * 0.02
            tilt_change += severity * 0.005
            acceleration_mps2 += severity * 0.02
        elif self.scenario == "SEVERE":
            severity = min(self.state_counter / 40.0, 2.5)
            disp_change += severity * 0.5
            crack_change += severity * 0.1
            tilt_change += severity * 0.01
            acceleration_mps2 += severity * 0.1
            
        # Update accumulators
        self.tilt_x_deg += tilt_change
        self.tilt_y_deg += tilt_change * 0.5 # Correlated tilt
        tilt_magnitude_deg = np.sqrt(self.tilt_x_deg**2 + self.tilt_y_deg**2)
        tilt_rate_deg_per_time = tilt_change / 10.0 # per minute approx
        
        displacement_mm = max(0.0, disp_change) # Current interval displacement
        self.cumulative_displacement_mm += displacement_mm
        displacement_rate_mm_per_time = displacement_mm / 10.0
        
        self.crack_opening_mm = max(0.0, self.crack_opening_mm + crack_change)
        crack_growth_rate_mm_per_time = max(0.0, crack_change) / 10.0
        crack_detected = 1 if self.crack_opening_mm > 0.1 else 0

        reading = {
            "node_id": self.node_id,
            "timestamp": current_time.isoformat(),
            "latitude": self.latitude,
            "longitude": self.longitude,
            "battery_level": 95 - int(self.state_counter / 10),
            "tilt_x_deg": self.tilt_x_deg,
            "tilt_y_deg": self.tilt_y_deg,
            "tilt_magnitude_deg": tilt_magnitude_deg,
            "tilt_change_deg": tilt_change,
            "tilt_rate_deg_per_time": tilt_rate_deg_per_time,
            "acceleration_mps2": acceleration_mps2,
            "peak_acceleration_mps2": peak_acceleration_mps2,
            "rms_acceleration_mps2": rms_acceleration_mps2,
            "dominant_frequency_hz": dominant_frequency_hz,
            "vibration_duration_s": vibration_duration_s,
            "displacement_mm": displacement_mm,
            "displacement_change_mm": disp_change,
            "displacement_rate_mm_per_time": displacement_rate_mm_per_time,
            "cumulative_displacement_mm": self.cumulative_displacement_mm,
            "crack_detected": crack_detected,
            "crack_opening_mm": self.crack_opening_mm,
            "crack_opening_change_mm": crack_change,
            "crack_growth_rate_mm_per_time": crack_growth_rate_mm_per_time
        }
        
        return reading

def main():
    print("============================================================")
    print("MINE SUBSIDENCE AI - MULTI-NODE SIMULATOR")
    print("============================================================\n")
    
    # Initialize 12 nodes with realistic coordinates
    base_lat = 23.758
    base_lon = 86.415
    
    node_configs = [
        ("N_FULL_01", "NORMAL"), ("N_FULL_02", "NORMAL"),
        ("N_FULL_03", "NORMAL"), ("N_FULL_04", "NORMAL"),
        ("N_FULL_05", "NORMAL"), ("N_FULL_06", "NORMAL"),
        ("N_FULL_07", "NORMAL"), ("N_FULL_08", "NORMAL"),
        ("N_FULL_09", "DETERIORATING"), ("N_FULL_10", "DETERIORATING"),
        ("N_FULL_11", "DETERIORATING"),
        ("N_FULL_12", "SEVERE")
    ]
    
    # Single mine panel boundaries: lat ~23.750 to 23.765, lon ~86.408 to 86.425
    # Deterministically distribute nodes inside the panel
    nodes = []
    for i, (nid, scenario) in enumerate(node_configs):
        # Organic pseudo-random placement inside the panel
        lat = 23.752 + abs(np.sin((i+1) * 12.9898)) * 0.009
        lon = 86.411 + abs(np.cos((i+1) * 4.1415)) * 0.011
        nodes.append(NodeSimulator(nid, scenario, lat, lon))
        
    print(f"Initialized {len(nodes)} independent physical nodes within panel boundary.")
    print("Starting simulation loop. Press Ctrl+C to stop.\n")
    
    current_time = datetime.now()
    step = 0
    
    try:
        while True:
            print(f"\n--- Simulation Step {step} at {current_time} ---")
            for node in nodes:
                data = node.simulate_reading(current_time)
                
                try:
                    res = requests.post(API_URL, json=data)
                    # We just print the telemetry, we do NOT print the model risk response here
                    print(f"[{data['timestamp']}] {node.node_id} | disp={data['displacement_mm']:.4f}mm, tilt={data['tilt_magnitude_deg']:.4f}deg, crack={data['crack_opening_mm']:.4f}mm")
                except requests.exceptions.ConnectionError:
                    print("Backend not reachable. Ensure FastAPI is running.")
                    return
                    
            step += 1
            current_time += timedelta(minutes=10) # 10 minute logical interval
            time.sleep(1) # 1 second real-time interval
            
    except KeyboardInterrupt:
        print("\nSimulation stopped.")

if __name__ == "__main__":
    main()
