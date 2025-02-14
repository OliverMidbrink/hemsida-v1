
import sys
import os

# Add the DayInference folder to the Python path
current_dir = os.path.dirname(os.path.abspath(__file__))
sys.path.append(current_dir)

# Add to ht
from model import MyModule3
import torch
import numpy as np



model = MyModule3()

model.load_state_dict(torch.load(f"DayInference/m5_220000.pth", map_location=torch.device('cpu')))
model.eval()

def infer(input_vector): # Takes in the last 55 opening prices (np.array) and outputs a 0 to 1 value
    try:
        # Specs can be retrieved from Finace/...../test4_binary.py
        #  Risk 14% (benchamrk is 6%)
        #  Expected return 1.5% (benchmark is 0.0005%)

        print("Analysing input vector", input_vector)
        # pct_change of np vector
        _in = np.array(input_vector) + 0.000000000001
        _in = (_in[1:] - _in[:-1]) / _in[:-1]
        _in = np.concatenate(([0], _in), axis=0)

        #print(_in)

        # Move to tensor
        out = model(torch.tensor(_in, dtype=torch.float32))
        return torch.sigmoid(out[0]).item()
    except Exception as e:
        print(f"Error: {e}")
        return None


if __name__ == "__main__":
    print(infer(list(range(55))))
