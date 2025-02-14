# Set the working directory to the directory of this file
import os, time
os.chdir(os.path.dirname(os.path.abspath(__file__)))

import infer_stock as infer_stocks
import pandas as pd
from datetime import datetime

def get_latest_analysis(tickers_file_path="tickers_test.txt"):
    start_time = time.time()
    latest_analysis_file_path = tickers_file_path.replace(".txt", "_analysis.csv")
    today = datetime.now().date()
    file_date = None  # Default file_date when no analysis exists

    tickers = []
    preds = []
    tail = None

    if os.path.exists(latest_analysis_file_path):
        #print(f"Loading analysis from {latest_analysis_file_path}")
        df = pd.read_csv(latest_analysis_file_path)
        if 'Date' in df.columns:
            file_date = pd.to_datetime(df['Date'].iloc[0]).date()
        if file_date == today:
            #print(f"Using existing analysis from {today}")
            tickers = df["Ticker"].tolist()
            preds = df["Prediction"].tolist()
            tail = df["Tail"].tolist() if "Tail" in df.columns else None
        else:
            # Load tickers from file for new analysis
            with open(tickers_file_path, "r") as f:
                tickers = [line.strip() for line in f if line.strip()]
    else:
        #print(f"No analysis found for {today}, creating new analysis")
        # Load tickers from file for new analysis
        with open(tickers_file_path, "r") as f:
            tickers = [line.strip() for line in f if line.strip()]

    # Run inference if today's data isn't available
    if not os.path.exists(latest_analysis_file_path) or file_date != today:
        #print(f"Running new analysis for {today}")
        preds, tail = infer_stocks.infer_stocks(tickers)
        results_df = pd.DataFrame({
            'Date': [today] * len(tickers),
            'Ticker': tickers,
            'Prediction': preds,
            'Tail': "No_tail"
        })
        results_df.to_csv(latest_analysis_file_path, index=False)
        #print(f"Analysis saved to {latest_analysis_file_path}")

    # Summary of results
    #print("\nAnalysis Summary:")
    #print(f"Number of tickers analyzed: {len(tickers)}")
    #print("\nPredictions:")
    #for ticker, pred in zip(tickers, preds):
    #    print(f"{ticker}: {pred:.4f}")

    time_taken = time.time() - start_time
    with open("time_taken.txt", "a") as f:
        f.write(f"{time_taken:.9f}\n")
    
    return tickers, preds

    # The function above will return the tickers and the predictions for the tickers

if __name__ == "__main__":
    tickers, preds = get_latest_analysis()
