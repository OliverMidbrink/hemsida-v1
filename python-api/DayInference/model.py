import torch
import torch.nn as nn
import torch.nn.functional as F

class MyModule3(nn.Module):
    def __init__(self):
        super(MyModule3, self).__init__()
    
        self.linear1 = nn.Linear(55, 500)
        self.linear3 = nn.Linear(500, 500)
        self.linear4 = nn.Linear(500, 1)

    def forward(self, x):
        # x shape: (embedding_dim, seq_len)
        
        x = self.linear1(x)
        x = F.relu(x)
        x = self.linear3(x)
        x = F.relu(x)
        x = self.linear4(x)
        
        return x