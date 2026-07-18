from fastapi import FastAPI
import time

app = FastAPI()

@app.get("/data")
def get_secure_data():
    # Simulate work
    time.sleep(0.1)
    return {
        "status": "success",
        "data": {
            "symbol": "AAPL",
            "price": 185.92,
            "volume": "52M"
        }
    }
