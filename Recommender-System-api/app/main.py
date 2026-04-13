from fastapi import FastAPI

from app.routers import testdb, recommend, ocr

app = FastAPI(title="Elective Course Recommendation API")

# app.include_router(testdb.router)
app.include_router(recommend.router)
app.include_router(ocr.router)

@app.get("/")
async def root():
    return {"message": "Hello World"}


@app.get("/hello/{name}")
async def say_hello(name: str):
    return {"message": f"Hello {name}"}
