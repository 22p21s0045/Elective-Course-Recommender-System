from fastapi import FastAPI

from app.routers import testdb, recommend, ocr, elective_courses, opening_course, search
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI(title="Elective Course Recommendation API")
origins = [
    "http://localhost:3000",  # Next.js dev
    "http://127.0.0.1:3000",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# app.include_router(testdb.router)
app.include_router(recommend.router)
app.include_router(ocr.router)
app.include_router(elective_courses.router)
app.include_router(opening_course.router)
app.include_router(search.router)

@app.get("/")
async def root():
    return {"message": "Hello World"}


@app.get("/hello/{name}")
async def say_hello(name: str):
    return {"message": f"Hello {name}"}
