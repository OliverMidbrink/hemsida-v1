import yfinance as yf
import os
os.chdir(os.path.dirname(os.path.abspath(__file__)))

import infer
import numpy as np
import requests
from datetime import datetime, timedelta
from avanza_get import get_prices_from_tickers
import logging

logger = logging.getLogger(__name__)

def infer_stocks(stocks):
    _stocks = " ".join(stocks)

    print("Downloading data")
    
    """
    seriess = []
    for ticker in stocks:
        api_key = "I7KDQELHHKT930QB"
        print(f"Downloading data for {ticker}")
        url = f'https://www.alphavantage.co/query?function=TIME_SERIES_DAILY&symbol=SEB&interval=1day&apikey=I7KDQELHHKT930QB'
        r = requests.get(url, timeout=1)
        data = r.json()["Time Series (Daily)"]

        series = []
        keys = data.keys()
        for key in keys:
            series.append(data[key]["1. open"])

        seriess.append(series
        #print(data)
    exit()"""

    """five_months_ago = (datetime.now() - timedelta(days=150)).strftime("%Y-%m-%d")
    tomorrow = (datetime.now() + timedelta(days=1)).strftime("%Y-%m-%d")
    data = yf.download(_stocks, start=five_months_ago, end=tomorrow)
    print("Data: ", data)
    data = data["Open"]"""
    data = get_prices_from_tickers(stocks)

    preds = []
    for args in data:
        try:
            if args is None:
                raise ValueError("Received None instead of stock data")
            
            ticker, opening_vals = args
            ticker_data = opening_vals[-55:]
            preds.append(infer.infer(ticker_data))
        except Exception as e:
            logger.error(f"Error in infer_stocks: {str(e)}")
            preds.append(None)

    return preds


if __name__ == "__main__":
    with open("DayInference/nordic_tickers.txt", "r") as f:
        tickers = f.read().splitlines()


    stocks = tickers

    preds, tail = infer_stocks(stocks)

    to_buy = []
    for idx, pred in enumerate(preds):
        print(f"Stock: {stocks[idx]}, pred: {pred}")
        if pred>0.3:
            to_buy.append(stocks[idx])
    
    for stock in to_buy:
        print(f"Buy {stock}")

    print(tail)
    print(tail.index[0])

    preds_and_tickers = list(zip(preds, stocks))
    preds_and_tickers.sort(key=lambda x: x[0], reverse=True)
    # PRint top 10
    for pred, stock in preds_and_tickers[:10]:
        print(f"Stock: {stock}, pred: {pred}")


    # Plot the pred values as a histogram
    import matplotlib.pyplot as plt

    preds = [pred for pred in preds if not np.isnan(pred)]

    print(f"Mean pred: {sum(preds)/len(preds)}")
    print(f"std pred: {sum([(pred - sum(preds)/len(preds))**2 for pred in preds])}")

    plt.hist(preds, bins=20)
    plt.show()
