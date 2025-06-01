from train_knn_model import train_knn_model
from train_SVD_model import train_SVD_model
from train_slope_model import train_slope_model
from sklearn.preprocessing import OneHotEncoder
from sklearn.ensemble import RandomForestRegressor
from sklearn.model_selection import train_test_split
from surprise import Dataset, Reader
import numpy as np

def train_stacked_model(interactions_df,events_df,users_df):

    # 1. Load data into Surprise format
    reader = Reader(rating_scale=(0, 1))  # or (1, 5), depending on your scale
    data = Dataset.load_from_df(interactions_df[['user_id', 'event_id', 'weight']], reader)

    # 2. Split into train/test
    trainset, testset = train_test_split(data, test_size=0.2, random_state=42)

    knn_model=train_knn_model(interactions_df)
    SVD_model=train_SVD_model(interactions_df)
    slope_model=train_slope_model(interactions_df)

    
    # One-hot encode event categories
    onehot = OneHotEncoder(handle_unknown='ignore')
    event_cat_encoded = onehot.fit_transform(events_df[['category']]).toarray()

    # Map event_id to its encoded category
    event_cat_map = dict(zip(events_df['event_id'], event_cat_encoded))

    # Map user_id to age
    user_age_map = dict(zip(users_df['user_id'], users_df['age']))

    base_models=[knn_model,SVD_model,slope_model]

    X_meta = []
    y_meta = []

    for uid, iid, true_r in testset:
        base_preds = [model.predict(uid, iid).est for model in base_models]
        
        # Get additional features
        age = user_age_map.get(uid, 0)  # default to 0 if missing
        category_vec = event_cat_map.get(iid, np.zeros(onehot.categories_[0].shape[0]))  # default to zeros

        feature_vector = base_preds + [age] + list(category_vec)
        X_meta.append(feature_vector)
        y_meta.append(true_r)

        X_meta = np.array(X_meta)
        y_meta = np.array(y_meta)

        X_meta_train, X_meta_test, y_meta_train, y_meta_test= train_test_split(X_meta, y_meta, test_size=0.2)
        meta_model = RandomForestRegressor(n_estimators= 100, random_state=42)
        meta_model.fit(X_meta_train, y_meta_train)
        return meta_model