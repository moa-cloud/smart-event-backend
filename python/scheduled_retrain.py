import pandas as pd
import numpy as np
from surprise import KNNBasic, SVDpp, SlopeOne, Dataset, Reader
from surprise.model_selection import train_test_split
from sklearn.preprocessing import OneHotEncoder
from sklearn.ensemble import RandomForestRegressor
from pymongo import MongoClient
import pickle
import sys
import logging
import os

# Set up logging
logging.basicConfig(
    filename='C:/Users/HP/NestjsProjects/smart-event/python/retrain.log',
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s'
)

def load_mongodb_data():
    """Load data from MongoDB."""
    try:
        client = MongoClient('mongodb://localhost:27017/')
        db = client['smart_event_db']
        interactions_df = pd.DataFrame(list(db.interactions.find()))
        events_df = pd.DataFrame(list(db.events.find()))
        users_df = pd.DataFrame(list(db.users.find()))
        logging.info(f"Loaded MongoDB data: {len(interactions_df)} interactions, {len(events_df)} events, {len(users_df)} users")
        return interactions_df, events_df, users_df
    except Exception as e:
        logging.error(f"Error loading MongoDB data: {str(e)}")
        return pd.DataFrame(), pd.DataFrame(), pd.DataFrame()

def load_csv_data(interactions_path, events_path, users_path):
    """Load data from CSV files."""
    try:
        interactions_df = pd.read_csv(interactions_path)
        events_df = pd.read_csv(events_path)
        users_df = pd.read_csv(users_path)
        logging.info(f"Loaded CSV data: {len(interactions_df)} interactions, {len(events_df)} events, {len(users_df)} users")
        return interactions_df, events_df, users_df
    except Exception as e:
        logging.error(f"Error loading CSV data: {str(e)}")
        return pd.DataFrame(), pd.DataFrame(), pd.DataFrame()

def merge_data(mongo_interactions, mongo_events, mongo_users, csv_interactions, csv_events, csv_users):
    """Merge MongoDB and CSV data, removing duplicates."""
    try:
        # Standardize MongoDB data (remove _id, ensure columns match)
        if not mongo_interactions.empty:
            mongo_interactions = mongo_interactions.drop(columns=['_id'], errors='ignore')
        if not mongo_events.empty:
            mongo_events = mongo_events.drop(columns=['_id'], errors='ignore')
        if not mongo_users.empty:
            mongo_users = mongo_users.drop(columns=['_id'], errors='ignore')

        # Append data
        interactions_df = pd.concat([mongo_interactions, csv_interactions], ignore_index=True)
        events_df = pd.concat([mongo_events, csv_events], ignore_index=True)
        users_df = pd.concat([mongo_users, csv_users], ignore_index=True)

        # Remove duplicates
        interactions_df = interactions_df.drop_duplicates(
            subset=['user_id', 'event_id', 'interaction_type'], keep='last'
        )
        events_df = events_df.drop_duplicates(subset=['event_id'], keep='last')
        users_df = users_df.drop_duplicates(subset=['user_id'], keep='last')

        logging.info(f"Merged data: {len(interactions_df)} interactions, {len(events_df)} events, {len(users_df)} users")
        return interactions_df, events_df, users_df
    except Exception as e:
        logging.error(f"Error merging data: {str(e)}")
        raise

def preprocess_data(interactions_df, events_df, users_df):
    """Preprocess data for training."""
    try:
        # Ensure consistent types
        interactions_df['user_id'] = interactions_df['user_id'].astype(str)
        interactions_df['event_id'] = interactions_df['event_id'].astype(str)
        events_df['event_id'] = events_df['event_id'].astype(str)
        users_df['user_id'] = users_df['user_id'].astype(str)

        # Map interaction types to weights
        weight_map = {'view': 0.3, 'like': 0.5, 'book': 0.75}
        interactions_df['weight'] = interactions_df['interaction_type'].map(weight_map).fillna(0.3)

        # Merge data
        merged_df = interactions_df.merge(
            users_df[['user_id', 'age']], on='user_id', how='left'
        ).merge(
            events_df[['event_id', 'category', 'tags']], on='event_id', how='left'
        )
        merged_df['age'] = merged_df['age'].fillna(25).astype(int)
        # Handle missing tags
        merged_df['tags'] = merged_df['tags'].apply(lambda x: x if isinstance(x, list) else [])
        logging.info("Data preprocessed successfully")
        return merged_df, events_df, users_df
    except Exception as e:
        logging.error(f"Error preprocessing data: {str(e)}")
        raise

# KNN Training Function
def train_knn_model(interactions_df):
    try:
        all_events = interactions_df['event_id'].unique()
        reader = Reader(rating_scale=(0, 1))
        data = Dataset.load_from_df(interactions_df[['user_id', 'event_id', 'weight']], reader)
        trainset, testset = train_test_split(data, test_size=0.2, random_state=42)
        sim_options = {
            'name': 'cosine',
            'user_based': False  # Item-based filtering
        }
        knn_model = KNNBasic(sim_options=sim_options)
        knn_model.fit(trainset)
        logging.info("KNN model trained successfully")
        return knn_model
    except Exception as e:
        logging.error(f"Error training KNN model: {str(e)}")
        raise

# SVDpp Training Function
def train_SVD_model(interactions_df):
    try:
        all_events = interactions_df['event_id'].unique()
        reader = Reader(rating_scale=(0, 1))
        data = Dataset.load_from_df(interactions_df[['user_id', 'event_id', 'weight']], reader)
        trainset, testset = train_test_split(data, test_size=0.2, random_state=42)
        SVD_model = SVDpp()
        SVD_model.fit(trainset)
        logging.info("SVDpp model trained successfully")
        return SVD_model
    except Exception as e:
        logging.error(f"Error training SVDpp model: {str(e)}")
        raise

# Slope One Training Function
def train_slope_model(interactions_df):
    try:
        all_events = interactions_df['event_id'].unique()
        reader = Reader(rating_scale=(0, 1))
        data = Dataset.load_from_df(interactions_df[['user_id', 'event_id', 'weight']], reader)
        trainset, testset = train_test_split(data, test_size=0.2, random_state=42)
        slope_model = SlopeOne()
        slope_model.fit(trainset)
        logging.info("Slope One model trained successfully")
        return slope_model
    except Exception as e:
        logging.error(f"Error training Slope One model: {str(e)}")
        raise

# Stacked Model Training Function
def train_stacked_model(interactions_df, events_df, users_df):
    try:
        reader = Reader(rating_scale=(0, 1))
        data = Dataset.load_from_df(interactions_df[['user_id', 'event_id', 'weight']], reader)
        trainset, testset = train_test_split(data, test_size=0.2, random_state=42)

        # Handle small testset
        if not testset:
            logging.warning("Testset empty, using trainset for meta-model")
            testset = trainset.build_testset()

        # Train base models
        knn_model = train_knn_model(interactions_df)
        SVD_model = train_SVD_model(interactions_df)
        slope_model = train_slope_model(interactions_df)
        base_models = [knn_model, SVD_model, slope_model]

        # One-hot encode event categories
        onehot = OneHotEncoder(handle_unknown='ignore', sparse_output=False)
        event_cat_encoded = onehot.fit_transform(events_df[['category']])
        event_cat_map = dict(zip(events_df['event_id'], event_cat_encoded))

        # Map user_id to age
        user_age_map = dict(zip(users_df['user_id'], users_df['age']))

        # Generate meta features
        X_meta = []
        y_meta = []
        for uid, iid, true_r in testset:
            base_preds = [model.predict(uid, iid).est for model in base_models]
            age = user_age_map.get(uid, 25)
            category_vec = event_cat_map.get(iid, np.zeros(event_cat_encoded.shape[1]))
            feature_vector = base_preds + [age] + list(category_vec)
            X_meta.append(feature_vector)
            y_meta.append(true_r)

        if not X_meta:
            logging.error("No meta features generated")
            raise ValueError("Empty meta features")

        X_meta = np.array(X_meta)
        y_meta = np.array(y_meta)

        # Train meta-model
        X_meta_train, X_meta_test, y_meta_train, y_meta_test = train_test_split(
            X_meta, y_meta, test_size=0.2, random_state=42
        )
        meta_model = RandomForestRegressor(n_estimators=100, random_state=42)
        meta_model.fit(X_meta_train, y_meta_train)
        logging.info("Stacked meta-model trained successfully")
        return base_models, meta_model
    except Exception as e:
        logging.error(f"Error training stacked model: {str(e)}")
        raise

def save_models(base_models, meta_model, output_dir):
    """Save models to disk."""
    try:
        model_names = ['knn_model.pkl', 'svd_model.pkl', 'slope_one_model.pkl', 'meta_model.pkl']
        models = base_models + [meta_model]
        for name, model in zip(model_names, models):
            with open(os.path.join(output_dir, name), 'wb') as f:
                pickle.dump(model, f)
        logging.info("Models saved successfully")
    except Exception as e:
        logging.error(f"Error saving models: {str(e)}")
        raise

def main():
    """Main retraining function."""
    try:
        # Paths to CSV files
        interactions_csv = 'C:/Users/HP/NestjsProjects/smart-event/python/interaction_data.csv'
        events_csv = 'C:/Users/HP/NestjsProjects/smart-event/python/event_data.csv'
        users_csv = 'C:/Users/HP/NestjsProjects/smart-event/python/user_data.csv'
        output_dir = 'C:/Users/HP/NestjsProjects/smart-event/python/'

        logging.info("Starting model retraining")
        # Load data
        mongo_interactions, mongo_events, mongo_users = load_mongodb_data()
        csv_interactions, csv_events, csv_users = load_csv_data(interactions_csv, events_csv, users_csv)
        
        # Merge data
        interactions_df, events_df, users_df = merge_data(
            mongo_interactions, mongo_events, mongo_users,
            csv_interactions, csv_events, csv_users
        )
        
        # Preprocess
        merged_df, events_df, users_df = preprocess_data(interactions_df, events_df, users_df)
        
        if len(merged_df) < 10:
            logging.warning(f"Low interaction count ({len(merged_df)}), training may be unstable")
        
        # Train models
        base_models, meta_model = train_stacked_model(merged_df, events_df, users_df)
        save_models(base_models, meta_model, output_dir)
        logging.info("Retraining completed successfully")
    except Exception as e:
        logging.error(f"Retraining failed: {str(e)}")
        sys.exit(1)

if __name__ == "__main__":
    main()