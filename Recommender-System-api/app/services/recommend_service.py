import time
import pandas as pd
from sqlalchemy.orm import Session
from app import models, schemas
from app.internal.recommender import train_svd_model
from app.internal.data_processor import preprocess_target_student, get_master_data
from app.internal.ml_service import embedding_model
from app.services import course_service

def calculate_hybrid_recommendation(request: schemas.HybridRecommendReq, db: Session) -> dict:
    start_time = time.time()
    student_id = request.student_id

    target_df = preprocess_target_student(student_id, request.raw_grades)
    taken_courses = target_df['course_code'].unique().tolist() if not target_df.empty else []

    open_courses_query = (db.query(models.CourseMaster)
    .join(
        models.OpeningElectiveCourses,
        models.CourseMaster.id == models.OpeningElectiveCourses.course_master_id
    ).filter(
        models.CourseMaster.is_elective == True,
        models.OpeningElectiveCourses.academic_year == request.academic_year,
        models.OpeningElectiveCourses.semester == request.semester,
        models.OpeningElectiveCourses.is_active == True
    ).all())

    unseen_open_courses = [course for course in open_courses_query if course.course_id not in taken_courses]

    if not unseen_open_courses:
        return {"status": "error",
                "message": "No Elective Course for Recommendation in this term (might have taken all or no course is open)"}

    unseen_course_ids = [c.course_id for c in unseen_open_courses]

    ## Train by Model SVD
    master_df = get_master_data(db)
    combined_df = pd.concat([master_df, target_df], ignore_index=True)
    trained_model = train_svd_model(combined_df)

    ## Query Augmentation
    topics_str = ", ".join(request.topics)
    user_intent = f"I want to learn about {topics_str}."
    if request.extra_text:
        user_intent += f" {request.extra_text}"

    final_query = f"query: {user_intent}"
    query_vector = embedding_model.encode([final_query], normalize_embeddings=True)[0].tolist()

    vector_results = db.query(
        models.CourseMaster.course_id,
        models.CourseMaster.embedding_vector.cosine_distance(query_vector).label("distance")
    ).filter(
        models.CourseMaster.course_id.in_(unseen_course_ids),
        models.CourseMaster.embedding_vector.is_not(None)
    ).all()

    embed_scores_dict = {
        row.course_id: (1.0 - (row.distance / 2.0)) for row in vector_results
    }

    final_recommendations = []
    for course in unseen_open_courses:
        desc_th, desc_en = course_service.parse_description(course.description)

        # --- SVD Score ---
        pred = trained_model.predict(uid=student_id, iid=course.course_id)
        est_grade = pred.est
        # Normalize SVD in scale 0.0 - 1.0 (formula: (value - min) / (max - min))
        svd_norm_score = (est_grade - 1.0) / 3.0
        # --- Embedding Score ---
        embed_norm_score = embed_scores_dict.get(course.course_id, 0.0)
        # --- Hybrid Score ---
        hybrid_score = (svd_norm_score * request.svd_weight) + (embed_norm_score * request.embedding_weight)

        final_recommendations.append({
            "course_id": course.course_id,
            "course_name_th": course.course_name_th,
            "course_name_en": course.course_name_en,
            "description_th": desc_th,
            "description_en": desc_en,
            "predicted_grade": round(est_grade, 2),
            "similarity_percent": round(embed_norm_score * 100, 2),
            "hybrid_score_percent": round(hybrid_score * 100, 2)
        })

    final_recommendations.sort(key=lambda x: x["hybrid_score_percent"], reverse=True)
    top_n_results = final_recommendations[:request.limit]

    total_time = time.time() - start_time

    return {
        "status": "success",
        "student_id": student_id,
        "processing_time_seconds": round(total_time, 4),
        "weights_used": {
            "svd": request.svd_weight,
            "embedding": request.embedding_weight
        },
        "recommendations": top_n_results
    }
