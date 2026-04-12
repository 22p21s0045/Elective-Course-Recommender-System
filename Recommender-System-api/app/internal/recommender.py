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