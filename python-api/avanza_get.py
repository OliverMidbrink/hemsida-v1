import threading
import requests
from concurrent.futures import ThreadPoolExecutor
import time
from queue import Queue
from datetime import datetime
def make_request(url):
    try:
        response = requests.get(url, timeout=10)
        assert response.status_code == 200
        assert response.json()['metadata']['resolution']['chartResolution'] == 'day'
        assert response.json()['metadata']['resolution']['chartResolution'] == 'day'
        from_ = response.json()['from']
        to_  = response.json()['to']
        date_from = datetime.strptime(from_, '%Y-%m-%d')
        date_to = datetime.strptime(to_, '%Y-%m-%d')
        # Check that we have at least 2 years of data
        time_diff = date_to - date_from
        if time_diff.days < 730:  # 365*2 days
            raise Exception(f"Not enough data - only {time_diff.days} days available")
        # Print time difference between from and to dates
        print(f"Time diff: {time_diff.days} days ({from_} to {to_})")

        opening_prices = response.json()['ohlc']
        opening_prices = [float(x['open']) for x in opening_prices]

        return opening_prices
    except Exception as e:
        print(f"Error making request to {url}: {str(e)}")
        return None

def process_urls(template_url, replacements, max_threads=500):
    results = []
    
    def worker(replacement):
        url = template_url.replace("{PLACEHOLDER}", str(replacement))
        result = make_request(url)
        if result:
            results.append(result)
    
    with ThreadPoolExecutor(max_workers=max_threads) as executor:
        executor.map(worker, replacements)
        
    return results


if __name__ == "__main__":
    template_url = "https://www.avanza.se/_api/price-chart/stock/{PLACEHOLDER}?timePeriod=three_years&resolution=day"
    replacements = range(4478, 4479)  # Stock ID to replace in URL
    opening_price_lists = process_urls(template_url, replacements)
    import matplotlib.pyplot as plt
    
    # Plot each stock's opening prices
    for i, prices in enumerate(opening_price_lists):
        plt.figure(figsize=(12,6))
        plt.plot(prices)
        plt.title(f'Opening Prices for Stock ID {list(replacements)[i]}')
        plt.xlabel('Days')
        plt.ylabel('Price')
        plt.grid(True)
        plt.show()
