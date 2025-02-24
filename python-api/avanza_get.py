import threading
import requests
from concurrent.futures import ThreadPoolExecutor
import time
from queue import Queue
from datetime import datetime
import json
from tqdm import tqdm
import os
# Set working directory to this file's directory
os.chdir(os.path.dirname(os.path.abspath(__file__)))

with open('yf_af_matching/sp500_ticker_to_af_id.json', 'r') as f:
    sp_500_ticker_to_af_id = json.load(f)

with open('yf_af_matching/af_id_to_sp500_ticker.json', 'r') as f:
    af_id_to_sp500_ticker = json.load(f)

def make_request(url, ticker):
    try:
        if ticker is None:
            return None
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

        opening_prices = response.json()['ohlc']
        opening_prices = [float(x['open']) for x in opening_prices]

        return ticker, opening_prices
    except Exception as e:
        print(f"Error making request to {url} for {ticker}: {str(e)}")
        return None

def process_urls(template_url, replacements, max_threads=500):
    results = []
    
    for replacement in tqdm(replacements, desc="Downloading prices"):
        try:
            ticker = af_id_to_sp500_ticker.get(str(replacement))
            url = template_url.replace("{PLACEHOLDER}", str(replacement))
            result = make_request(url, ticker)
            results.append(result)
        except Exception as e:
            results.append([None, None])
            print(f"Error processing {replacement}: {str(e)}")
            
        time.sleep(0.1)
        
    return results


def get_af_from_tickers(tickers_list):
    af_ids = []
    for ticker in tickers_list:
        if ticker in sp_500_ticker_to_af_id:
            af_ids.append(sp_500_ticker_to_af_id[ticker])
        else:
            af_ids.append(None)
    return af_ids

def download_prices(af_ids):
    template_url = "https://www.avanza.se/_api/price-chart/stock/{PLACEHOLDER}?timePeriod=three_years&resolution=day"
    opening_price_lists = process_urls(template_url, af_ids)
    return opening_price_lists

def get_prices_from_tickers(tickers_list):
    af_ids = get_af_from_tickers(tickers_list)
    opening_price_lists = download_prices(af_ids)
    return opening_price_lists

if __name__ == "__main__":

    with open('tickers_test.txt', 'r') as f:
        tickers = [line.strip() for line in f]
    af_ids = get_af_from_tickers(tickers[:3])
    print(af_ids)
    opening_price_lists = download_prices(af_ids)
    print(opening_price_lists)
