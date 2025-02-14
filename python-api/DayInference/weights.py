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

# Initialize random data
data = np.random.normal(loc=0, scale=0.04, size=(6, 55))


# Define the constraints for normalization
def normalize_rows(matrix, target_mean=0, target_std=0.04):
    normalized = (matrix - matrix.mean(axis=1, keepdims=True)*0.7) / (matrix.std(axis=1, keepdims=True) + 1e-6)
    return normalized * target_std + target_mean

# Convert data to PyTorch tensor
data_tensor = torch.tensor(data, requires_grad=True, dtype=torch.float32)

# Define optimizer
optimizer = torch.optim.SGD([data_tensor], lr=0.01)

# Sigmoid function
sigmoid = torch.nn.Sigmoid()

# Optimization loop
for iteration in range(10000):  # Set a large max number of iterations
    optimizer.zero_grad()

    # Pass data through the model
    output = model(data_tensor)

    # Apply sigmoid
    output = sigmoid(output)

    print(torch.mean(output[:3]), torch.mean(output[3:]))

    # Compute losses
    loss_first = torch.mean((output[:3] - 1) ** 2)  # Optimizing the first three rows toward 1
    loss_last = torch.mean((output[3:] + 0) ** 2)  # Optimizing the last three rows toward 0 (moving towards -1 pre-sigmoid)

    # Total loss
    loss = loss_first + loss_last

    # Backpropagation
    loss.backward()
    optimizer.step()

    # Normalize rows after updating
    with torch.no_grad():
        data_tensor[:] = torch.tensor(normalize_rows(data_tensor.detach().numpy()))

    # Check convergence conditions
    first_done = torch.mean(output[:3]) > 0.5
    last_done = torch.mean(output[3:]) < 0.1

    # Print progress
    if iteration % 100 == 0:
        print(f"Iteration {iteration}, Loss: {loss.item()}")
        print(f"First 3 Rows Output: {output[:3].detach().numpy()}")
        print(f"Last 3 Rows Output: {output[3:].detach().numpy()}")

    # Stop if both groups meet the criteria
    if first_done and last_done:
        print("Converged!")
        break

# Print final data tensor
print("Final Data Tensor:")
print(data_tensor)

# Print final outputs
print("Final Outputs:")
final_output = sigmoid(model(data_tensor)).detach().numpy()
print(final_output)


data_tensor_np = data_tensor.detach().numpy()

""" Plotting the results """

import matplotlib.pyplot as plt

# Plot 1: Normalized input sequences (First 3 in green, Last 3 in red)
plt.figure(figsize=(12, 6))

# First 3 rows (in green)
for i in range(3):
    plt.plot(data_tensor_np[i], color='green', label='First 3 Rows' if i == 0 else "")

# Last 3 rows (in red)
for i in range(3, 6):
    plt.plot(data_tensor_np[i], color='red', label='Last 3 Rows' if i == 3 else "")

# Add labels, title, legend, and grid
plt.title("Input Sequences (Normalized)")
plt.xlabel("Features")
plt.ylabel("Values")
plt.legend()
plt.grid(True)

# Plot 2: Comparison of Original vs Optimized Data (6 subplots)
fig, axes = plt.subplots(2, 3, figsize=(18, 7))
fig.suptitle("Input vs. Optimized Data Comparison", fontsize=16)

# Plot the comparison for each row
for i, ax in enumerate(axes.flat):
    # Original data (before optimization) in dashed gray line
    ax.plot(data[i], color='gray', linestyle='dashed', alpha=0.7, label='Original Data')

    # Optimized data in solid line
    if i < 3:
        ax.plot(data_tensor_np[i], color='green', label='Optimized Data (First 3 Rows)')
    else:
        ax.plot(data_tensor_np[i], color='red', label='Optimized Data (Last 3 Rows)')

    # Set titles and labels for each subplot
    ax.set_title(f"Row {i + 1}")
    ax.set_xlabel("Features")
    ax.set_ylabel("Values")
    ax.grid(True)
    ax.legend()

# Adjust layout for the second plot
plt.tight_layout(rect=[0, 0, 1, 0.96])

# Show both plots
plt.show()
