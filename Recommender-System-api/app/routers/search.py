from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import asc

from app import models, schemas
from app.dependencies import get_db
from app.internal.ml_service import embedding_model

router = APIRouter(prefix="/search", tags=["Embeddings Topics"])


@router.post("/embeddings")
async def search_elective_courses(request: schemas.SearchQueryReq, db: Session = Depends(get_db)):
    topics_str = ", ".join(request.topics)
    user_intent = f"I want to learn about {topics_str}."

    if request.extra_text:
        user_intent += f" {request.extra_text}"

    final_query = f"query: {user_intent}"
    query_vector = embedding_model.encode([final_query], normalize_embeddings=True)[0]

    query_vector = query_vector.tolist()
    results = (db.query(
        models.CourseMaster,
        models.CourseMaster.embedding_vector.cosine_distance(query_vector).label("distance")
    ).join(
        models.OpeningElectiveCourses,
        models.CourseMaster.id == models.OpeningElectiveCourses.course_master_id
    ).filter(
        models.CourseMaster.embedding_vector.is_not(None),
        models.CourseMaster.is_elective == True,
        models.OpeningElectiveCourses.academic_year == request.academic_year,
        models.OpeningElectiveCourses.semester == request.semester,
        models.OpeningElectiveCourses.is_active == True
    ).order_by(
        asc("distance")
    ).limit(request.limit).all())

    response_data = []
    for course, distance in results:
        similarity_percent = round((1 - (distance / 2)) * 100, 2)

        response_data.append({
            "course_id": course.course_id,
            "course_name_en": course.course_name_en,
            "course_name_th": course.course_name_th,
            "description": course.description,
            "similarity_score": f"{similarity_percent}%",
        })

    return {
        "user_query": final_query,
        "results": response_data
    }
