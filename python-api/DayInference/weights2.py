# load DayInference/m5_220000.pth as a pytorch model
import model
import torch
import numpy as np
import matplotlib.pyplot as plt

# Initialize the model
model = model.MyModule3()

# Load the weights
model.load_state_dict(torch.load("DayInference/m5_220000.pth", map_location=torch.device('cpu')))

# Set the model to evaluation mode
model.eval()

# print params
for name, param in model.named_parameters():
    if name == "linear1.weight":
        print(param.shape)

        # Get the column wise average
        avg = torch.mean(param, dim=0)
        # Get the column wise absolute average
        abs_avg = torch.mean(torch.abs(param), dim=0)

        # Plot the absolute average and the average
        plt.plot(avg.detach().numpy(), label="Average")
        plt.plot(abs_avg.detach().numpy(), label="Absolute Average")
        plt.legend()
        plt.show()

        # Get the column wise average
        avg = torch.mean(param, dim=1)
        # Get the column wise absolute average
        abs_avg = torch.mean(torch.abs(param), dim=1)

        # Plot the absolute average and the average
        plt.plot(avg.detach().numpy(), label="Average")
        plt.plot(abs_avg.detach().numpy(), label="Absolute Average")
        plt.legend()
        plt.show() 

