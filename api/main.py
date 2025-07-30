
import os
import urllib

from fastapi import FastAPI, Request, HTTPException
from fastapi.responses import Response, FileResponse
from starlette.status import HTTP_400_BAD_REQUEST

API_1INCH_TOKEN = os.environ.get('API_1INCH_TOKEN', None)
API_1INCH_BASE_URL = os.environ.get('API_1INCH_BASE_URL', None)
SUPPORTED_CHAINS = [ '42161' ]

app = FastAPI()

# ---------- META ----------
@app.get("/meta/{chain_id}/{contract_address}/{token_id}")
def read_root(
    chain_id: str,
    contract_address: str,
    token_id: str,
):
    return {
        "name": "Smart wallet token",
        "description": "Smart wallet token",
        "image": f"https://apidev.envelop.is/metaimg/{chain_id}/{contract_address}/{token_id}"
    }
@app.get("/metaimg/{chain_id}/{contract_address}/{token_id}")
def read_root(
    chain_id: str,
    contract_address: str,
    token_id: str,
):
    return FileResponse('/code/static/smartwallet.png')
# ---------- END META ----------

@app.get("/swapproxy/{chain_id}/{method_name:path}")
def read_root(
    request: Request,
    chain_id: str,
    method_name: str,
):

    if API_1INCH_TOKEN is None:
        raise HTTPException(status_code=HTTP_400_BAD_REQUEST, detail=f"No auth key")
    if API_1INCH_BASE_URL is None:
        raise HTTPException(status_code=HTTP_400_BAD_REQUEST, detail=f"No remote api base url")
    if chain_id not in SUPPORTED_CHAINS:
        raise HTTPException(status_code=HTTP_400_BAD_REQUEST, detail=f"Unsupported chain")

    params = request.query_params
    url =f"{API_1INCH_BASE_URL.strip('/')}/{chain_id}/{method_name}?{params}"

    headers = {
        'User-Agent': 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.11 (KHTML, like Gecko) Chrome/23.0.1271.64 Safari/537.11',
        'Accept': 'application/json',
        'Accept-Charset': 'ISO-8859-1,utf-8;q=0.7,*;q=0.3',
        'Accept-Encoding': 'none',
        'Accept-Language': 'en-US,en;q=0.8',
        'Connection': 'keep-alive',
        'Authorization': f"Bearer {API_1INCH_TOKEN}"
    }

    try:
        req = urllib.request.Request(url, None, headers)
        resp = urllib.request.urlopen(req)
        data = resp.read()
        info = resp.info()
        return Response( content=data, media_type=info.get_content_type() )
    except urllib.error.HTTPError as e:
        return Response(status_code=e.code, media_type='application/json', content=e.fp.read().decode('utf-8'))
    except Exception as e:
        raise HTTPException(status_code=HTTP_400_BAD_REQUEST, detail=f"{e}")

@app.get("/")
def read_root():
    return {"Hello": "World"}


@app.get("/health")
async def health():
    return { "health": "ok" }

#app.include_router(router)