
import yfinance as yf
import os
os.chdir(os.path.dirname(os.path.abspath(__file__)))

import infer
import numpy as np

def infer_stocks(stocks):
    _stocks = " ".join(stocks)

    data = yf.download(_stocks, period="3mo")["Open"]

    preds = []
    for ticker in data.columns:
        ticker_data = data[ticker][-55:].values
        preds.append(infer.infer(ticker_data))

    return preds, data.tail(1)


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
