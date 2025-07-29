from logging.config import dictConfig
from typing import Union

from fastapi import FastAPI
#from router.main import router

app = FastAPI()


@app.get("/")
def read_root():
    return {"Hello": "World"}


@app.get("/health")
async def health():
    return { "health": "ok" }

#app.include_router(router)