from typing import List

import pandas as pd
from surprise import Reader, Dataset, SVD

def train_svd_model(combined_df: pd.DataFrame) -> SVD:

    reader = Reader(rating_scale=(1.0, 4.0))
    data = Dataset.load_from_df(
        combined_df[['student_id', 'course_code', 'rating']],
        reader
    )
    trainset = data.build_full_trainset()
    model  = SVD(
        n_factors=40,
        n_epochs=100,
        lr_all=0.01,
        reg_all=0.05,
        random_state=42
    )
    model.fit(trainset)
    return model

def get_top_n_recommendations(model: SVD, student_id: str, combined_df: pd.DataFrame, n: int = 3) -> List:
    all_courses = combined_df['course_code'].unique()
    taken_courses = combined_df[combined_df['student_id'] == student_id]['course_code'].unique()
    unseen_courses = [course for course in all_courses if course not in taken_courses]

    predictions = []
    for course in unseen_courses:
        pred = model.predict(uid=student_id, iid=course)
        predictions.append({
            "course_code": course,
            "predicted_grade": round(pred.est, 2)  # ปัดเศษทศนิยม 2 ตำแหน่งให้สวยงาม
        })

    predictions.sort(key=lambda x: x["predicted_grade"], reverse=True)
    return predictions[:n]