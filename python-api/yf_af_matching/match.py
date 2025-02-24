import json
import glob
import os
import re
import random
os.chdir(os.path.dirname(os.path.abspath(__file__)))

stock_data = []

# Get all json files in current directory
json_files = glob.glob("orderBookIds/*.json")


sp_500_tickers = []
sp_500_ticker_to_af_id = {}
af_id_to_sp_500_ticker = {}

with open('tickers_test.txt', 'r') as f:
    for line in f:
        sp_500_tickers.append(line.strip())

match_count = 0
for file in json_files:
    try:
        # Extract ID from filename
        order_book_id = file.split('.')[0].split('/')[-1]
        
        # Load and parse JSON
        with open(file, 'r') as f:
            data = json.load(f)
            
        # Check if it's a US stock
        if data.get('type') == 'STOCK' and data.get('flagCode') == 'US':
            title = data.get('title')
            
            # Check for ticker in parentheses
            ticker_match = re.search(r'\(([A-Z]+(?:[-.][A-Z])?)\)', title)
            if ticker_match:
                ticker = ticker_match.group(1)
            elif re.match(r'^[A-Z]{1,7}$', title):
                ticker = title
            else:
                print(f"WARNING NOT FOUND: No ticker found in parentheses for {title}")
                ticker = None
            if title:  # Only add if title exists
                stock_data.append((order_book_id, title, ticker))

            if ticker in sp_500_tickers:
                match_count += 1
                sp_500_ticker_to_af_id[ticker] = order_book_id
                af_id_to_sp_500_ticker[order_book_id] = ticker
                
    except Exception as e:
        print(f"Error processing file {file}: {str(e)}")

# Sort by ID for consistency
stock_data.sort(key=lambda x: int(x[0]))

print(f"{len(stock_data)} items found")
print(f"{match_count} matches found")
# Print first 50 items

# Save the ticker-to-id mappings
with open('sp500_ticker_to_af_id.json', 'w') as f:
    json.dump(sp_500_ticker_to_af_id, f, indent=4)

with open('af_id_to_sp500_ticker.json', 'w') as f:
    json.dump(af_id_to_sp_500_ticker, f, indent=4)

exit()
random.shuffle(stock_data)
for i, (id, title, ticker) in enumerate(stock_data[:50]):
    print(f"{id}:{ticker}")



