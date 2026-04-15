from fastapi import FastAPI

from app.routers import testdb, recommend, ocr, elective_courses, opening_course

app = FastAPI(title="Elective Course Recommendation API")

# app.include_router(testdb.router)
app.include_router(recommend.router)
app.include_router(ocr.router)
app.include_router(elective_courses.router)
app.include_router(opening_course.router)

@app.get("/")
async def root():
    return {"message": "Hello World"}


@app.get("/hello/{name}")
async def say_hello(name: str):
    return {"message": f"Hello {name}"}
