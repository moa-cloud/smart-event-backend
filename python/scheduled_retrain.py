import pandas as pd
import numpy as np
from surprise import KNNBasic, SVDpp, SlopeOne, Dataset, Reader
from surprise.model_selection import train_test_split as surprise_train_test_split
from sklearn.model_selection import train_test_split as sklearn_train_test_split
from sklearn.preprocessing import OneHotEncoder
from sklearn.ensemble import RandomForestRegressor
from pymongo import MongoClient
from bson import ObjectId
import pickle
import sys
import logging
import os
import csv

# Set up logging
logging.basicConfig(
    filename='C:/Users/HP/NestjsProjects/smart-event/python/retrain.log',
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s',
    filemode='a'  # Append to log file
)

def load_mongodb_data():
    """Load data from MongoDB and verify connection/collections."""
    try:
        client = MongoClient('mongodb://localhost:27017/')
        db = client['users']
        
        collections = db.list_collection_names()
        expected_collections = {'interactions', 'events', 'users', 'eventcatagories'}
        logging.info(f"Available collections: {collections}")
        if not expected_collections.issubset(collections):
            logging.warning(f"Missing collections: {expected_collections - set(collections)}")
        
        # Load data
        interactions_df = pd.DataFrame(list(db.interactions.find())) if 'interactions' in collections else pd.DataFrame()
        events_df = pd.DataFrame(list(db.events.find())) if 'events' in collections else pd.DataFrame()
        users_df = pd.DataFrame(list(db.users.find())) if 'users' in collections else pd.DataFrame()
        
        # Load eventcatagories for category names
        category_map = {str(doc['_id']): doc.get('categoryName', 'unknown') for doc in db.eventcatagories.find()}
        
        # Standardize interactions
        if not interactions_df.empty:
            # Rename columns first
            interactions_df = interactions_df.rename(columns={
                'userId': 'user_id',
                'eventId': 'event_id',
                'interactionType': 'interaction_type',
                'createdAt': 'created_at',
                'updatedAt': 'updated_at'
            })
            # Ensure string conversion
            interactions_df['user_id'] = interactions_df['user_id'].apply(lambda x: str(x) if isinstance(x, ObjectId) else str(x))
            interactions_df['event_id'] = interactions_df['event_id'].apply(lambda x: str(x) if isinstance(x, ObjectId) else str(x))
            interactions_df = interactions_df.drop(columns=['_id', '__v'], errors='ignore')
            interactions_df = interactions_df.loc[:, ~interactions_df.columns.duplicated()]
            logging.info(f"Interactions sample after conversion: {interactions_df[['user_id', 'event_id']].head().to_dict('records')}")
        
        # Standardize events
        if not events_df.empty:
            events_df['event_id'] = events_df['_id'].apply(str)
            events_df = events_df.rename(columns={
                'tag': 'tags',
                'eventCatagory': 'category',
                'price': 'is_free'
            })
            if 'is_free' in events_df.columns:
                events_df['is_free'] = events_df['is_free'].apply(lambda x: True if x == 0 else False if x else True)
            if 'category' in events_df.columns:
                events_df['category'] = events_df['category'].apply(lambda x: category_map.get(str(x), 'unknown') if isinstance(x, ObjectId) else x if isinstance(x, str) else 'unknown')
            if 'tags' in events_df.columns:
                events_df['tags'] = events_df['tags'].apply(
                    lambda x: x if isinstance(x, list) else [x.strip()] if isinstance(x, str) and x.strip() else []
                )
            events_df = events_df.drop(columns=['_id', '__v', 'eventImage', 'description', 'date', 'totalTicket', 'attendeeLimit', 'isActive', 'identification', 'availableTicket', 'createdBy'], errors='ignore')
            logging.info(f"Events sample: {events_df[['event_id']].head().to_dict('records')}")
        
        # Standardize users
        if not users_df.empty:
            users_df['user_id'] = users_df['_id'].apply(str)
            users_df = users_df.rename(columns={'sex': 'gender'})
            users_df['age'] = users_df.get('age', 25)
            users_df['location'] = users_df.get('location', 'unknown')
            users_df = users_df.drop(columns=['_id', '__v', 'firstName', 'lastName', 'email', 'role', 'phoneNumber', 'password', 'updated_at', 'organizationAddress', 'organizationName', 'organizationPhoneNumber', 'resetToken', 'resetTokenExpires'], errors='ignore')
            logging.info(f"Users sample: {users_df[['user_id']].head().to_dict('records')}")
        
        logging.info(f"Loaded MongoDB data: {len(interactions_df)} interactions, {len(events_df)} events, {len(users_df)} users")
        logging.info(f"Interactions columns: {list(interactions_df.columns)}")
        logging.info(f"Events columns: {list(events_df.columns)}")
        logging.info(f"Users columns: {list(users_df.columns)}")
        return interactions_df, events_df, users_df
    except Exception as e:
        logging.error(f"Error loading MongoDB data: {e}")
        return pd.DataFrame(), pd.DataFrame(), pd.DataFrame()
    finally:
        client.close()

def load_csv_data(interactions_path, events_path, users_path):
    """Load data from CSV files and verify structure."""
    try:
        for path in [interactions_path, events_path, users_path]:
            if not os.path.exists(path):
                logging.error(f"CSV file not found: {path}")
                raise FileNotFoundError(f"CSV file not found: {path}")

        def detect_delimiter(file_path):
            with open(file_path, 'r', encoding='utf-8') as file:
                first_line = file.readline().strip()
                logging.info(f"Raw first line of {file_path}: {first_line}")
                try:
                    dialect = csv.Sniffer().sniff(first_line)
                    return dialect.delimiter
                except:
                    for sep in [',', ';', '\t']:
                        if sep in first_line:
                            return sep
                    return ','

        def load_csv_with_fallback(file_path, encoding='utf-8'):
            try:
                delimiter = detect_delimiter(file_path)
                logging.info(f"Detected delimiter for {file_path}: '{delimiter}'")
                df = pd.read_csv(file_path, encoding=encoding, sep=delimiter)
                return df
            except UnicodeDecodeError:
                logging.warning(f"Encoding error for {file_path}, trying latin1")
                df = pd.read_csv(file_path, encoding='latin1', sep=delimiter)
                return df
            except pd.errors.ParserError:
                logging.warning(f"Parser error for {file_path}, trying comma")
                df = pd.read_csv(file_path, encoding=encoding, sep=',')
                return df

        interactions_df = load_csv_with_fallback(interactions_path)
        events_df = load_csv_with_fallback(events_path)
        users_df = load_csv_with_fallback(users_path)

        logging.info(f"Interactions CSV rows: {len(interactions_df)}, path: {interactions_path}, columns: {list(interactions_df.columns)}")
        logging.info(f"Events CSV rows: {len(events_df)}, path: {events_path}, columns: {list(events_df.columns)}")
        logging.info(f"Users CSV rows: {len(users_df)}, path: {users_path}, columns: {list(users_df.columns)}")

        expected_interaction_cols = {'user_id', 'event_id', 'interaction_type'}
        expected_event_cols = {'event_id', 'title', 'category', 'location', 'tags'}
        expected_user_cols = {'user_id', 'age'}

        if not interactions_df.empty:
            if not expected_interaction_cols.issubset(interactions_df.columns):
                logging.warning(f"Missing columns in interactions CSV: {expected_interaction_cols - set(interactions_df.columns)}")
            else:
                logging.info("Interactions CSV structure validated")
        else:
            logging.warning("Interactions CSV is empty")

        if not events_df.empty:
            logging.info(f"Events CSV actual columns: {list(events_df.columns)}")
            if not expected_event_cols.issubset(events_df.columns):
                logging.error(f"Missing columns in events CSV: {expected_event_cols - set(events_df.columns)}")
                column_mapping = {}
                for col in events_df.columns:
                    col_lower = col.lower()
                    if col_lower in [c.lower() for c in expected_event_cols]:
                        column_mapping[col] = next(c for c in expected_event_cols if c.lower() == col_lower)
                if column_mapping:
                    events_df = events_df.rename(columns=column_mapping)
                    logging.info(f"Renamed columns in events CSV: {column_mapping}")
                if not expected_event_cols.issubset(events_df.columns):
                    raise ValueError(f"Invalid events CSV structure after mapping: {expected_event_cols - set(events_df.columns)}")
            if not events_df['event_id'].is_unique:
                logging.error(f"Duplicate event_id values found in events CSV")
                raise ValueError("event_id must be unique in events CSV")
        else:
            logging.error("Events CSV is empty")
            raise ValueError("Events CSV is empty, cannot proceed")

        if not users_df.empty:
            if not expected_user_cols.issubset(users_df.columns):
                logging.warning(f"Missing columns in users CSV: {expected_user_cols - set(users_df.columns)}")
            else:
                logging.info("Users CSV structure validated")
        else:
            logging.warning("Users CSV is empty")

        logging.info(f"Interactions CSV sample:\n{interactions_df.head().to_string() if not interactions_df.empty else 'Empty'}")
        logging.info(f"Events CSV sample:\n{events_df.head().to_string() if not events_df.empty else 'Empty'}")
        logging.info(f"Users CSV sample:\n{users_df.head().to_string() if not users_df.empty else 'Empty'}")

        logging.info(f"Loaded CSV data: {len(interactions_df)} interactions, {len(events_df)} events, {len(users_df)} users")
        return interactions_df, events_df, users_df
    except Exception as e:
        logging.error(f"Error loading CSV data: {e}")
        return pd.DataFrame(), pd.DataFrame(), pd.DataFrame()

def merge_data(mongo_interactions, mongo_events, mongo_users, csv_interactions, csv_events, csv_users):
    """Merge MongoDB and CSV data, removing duplicates."""
    try:
        logging.info(f"Mongo interactions shape: {mongo_interactions.shape}, columns: {list(mongo_interactions.columns)}")
        logging.info(f"Mongo events shape: {mongo_events.shape}, columns: {list(mongo_events.columns)}")
        logging.info(f"Mongo users shape: {mongo_users.shape}, columns: {list(mongo_users.columns)}")
        logging.info(f"CSV interactions shape: {csv_interactions.shape}, columns: {list(csv_interactions.columns)}")
        logging.info(f"CSV events shape: {csv_events.shape}, columns: {list(csv_events.columns)}")
        logging.info(f"CSV users shape: {csv_users.shape}, columns: {list(csv_users.columns)}")

        if all(df.empty for df in [mongo_interactions, mongo_events, mongo_users, csv_interactions, csv_events, csv_users]):
            logging.error("All data sources are empty, cannot proceed")
            raise ValueError("No valid data to process")

        if all(df.empty for df in [mongo_interactions, mongo_events, mongo_users]):
            logging.info("MongoDB data is empty, using CSV data only")
            interactions_df = csv_interactions
            events_df = csv_events
            users_df = csv_users
        else:
            if not mongo_interactions.empty:
                mongo_interactions = mongo_interactions.reset_index(drop=True)
            if not mongo_events.empty:
                mongo_events = mongo_events.reset_index(drop=True)
            if not mongo_users.empty:
                mongo_users = mongo_users.reset_index(drop=True)

            csv_interactions = csv_interactions.reset_index(drop=True)
            csv_events = csv_events.reset_index(drop=True)
            csv_users = csv_users.reset_index(drop=True)

            # Ensure ID columns
            if 'event_id' not in mongo_events.columns:
                logging.error("MongoDB events missing event_id column")
                raise ValueError("MongoDB events missing event_id column")
            if 'user_id' not in mongo_users.columns:
                logging.error("MongoDB users missing user_id column")
                raise ValueError("MongoDB users missing user_id column")

            # Prioritize MongoDB data
            interactions_df = pd.concat([csv_interactions, mongo_interactions], ignore_index=True) if not mongo_interactions.empty else csv_interactions
            events_df = pd.concat([csv_events, mongo_events], ignore_index=True) if not mongo_events.empty else csv_events
            users_df = pd.concat([csv_users, mongo_users], ignore_index=True) if not mongo_users.empty else csv_users

        logging.info(f"Concatenated interactions shape: {interactions_df.shape}, columns: {list(interactions_df.columns)}")
        logging.info(f"Concatenated events shape: {events_df.shape}, columns: {list(events_df.columns)}")
        logging.info(f"Concatenated users shape: {users_df.shape}, columns: {list(users_df.columns)}")

        if events_df.empty or 'event_id' not in events_df.columns:
            logging.error("events_df is empty or missing event_id column")
            raise ValueError("events_df is empty or missing event_id column")

        # Filter invalid interactions and log invalid IDs
        if not interactions_df.empty:
            valid_event_ids = set(events_df['event_id'].astype(str))
            valid_user_ids = set(users_df['user_id'].astype(str))
            initial_len = len(interactions_df)
            
            # Log invalid interactions
            invalid_interactions = interactions_df[
                ~interactions_df['event_id'].astype(str).isin(valid_event_ids) |
                ~interactions_df['user_id'].astype(str).isin(valid_user_ids)
            ]
            if not invalid_interactions.empty:
                logging.info(f"Invalid interactions (count: {len(invalid_interactions)}):")
                for _, row in invalid_interactions[['user_id', 'event_id']].head(10).iterrows():
                    logging.info(f"Invalid: user_id={row['user_id']}, event_id={row['event_id']}")

            interactions_df = interactions_df[
                interactions_df['event_id'].astype(str).isin(valid_event_ids) &
                interactions_df['user_id'].astype(str).isin(valid_user_ids)
            ]
            removed = initial_len - len(interactions_df)
            if removed > 0:
                logging.info(f"Removed {removed} interactions with invalid event_ids or user_ids")

        # Deduplicate, keeping MongoDB (later in concat)
        if not interactions_df.empty:
            interactions_df = interactions_df.drop_duplicates(
                subset=['user_id', 'event_id', 'interaction_type'], keep='last'
            )
        events_df = events_df.drop_duplicates(subset=['event_id'], keep='last')
        if not users_df.empty:
            users_df = users_df.drop_duplicates(subset=['user_id'], keep='last')

        logging.info(f"Merged data: {len(interactions_df)} interactions, {len(events_df)} events, {len(users_df)} users")
        return interactions_df, events_df, users_df
    except Exception as e:
        logging.error(f"Error merging data: {e}")
        raise

def preprocess_data(interactions_df, events_df, users_df):
    """Preprocess data for training."""
    try:
        if not interactions_df.empty:
            interactions_df['user_id'] = interactions_df['user_id'].astype(str)
            interactions_df['event_id'] = interactions_df['event_id'].astype(str)
        events_df['event_id'] = events_df['event_id'].astype(str)
        if not users_df.empty:
            users_df['user_id'] = users_df['user_id'].astype(str)

        if not interactions_df.empty:
            weight_map = {'view': 0.3, 'like': 0.5, 'book': 0.75, 'attended': 1.0}
            interactions_df['weight'] = interactions_df['interaction_type'].map(weight_map).fillna(0.3)

        merged_df = interactions_df
        if not interactions_df.empty:
            merged_df = interactions_df.merge(
                users_df[['user_id', 'age']], on='user_id', how='left'
            ).merge(
                events_df[['event_id', 'category', 'tags']], on='event_id', how='left'
            )
            merged_df['age'] = merged_df['age'].fillna(25).astype(int)
            merged_df['tags'] = merged_df['tags'].apply(
                lambda x: x if isinstance(x, list) else [x] if isinstance(x, str) and x.strip() else []
            )
        logging.info("Data preprocessed successfully")
        return merged_df, events_df, users_df
    except Exception as e:
        logging.error(f"Error preprocessing data: {e}")
        raise

def train_knn_model(interactions_df):
    """Train KNN model."""
    try:
        if interactions_df.empty:
            raise ValueError("Cannot train KNN model with empty interactions")
        reader = Reader(rating_scale=(0, 1))
        data = Dataset.load_from_df(interactions_df[['user_id', 'event_id', 'weight']], reader)
        trainset, testset = surprise_train_test_split(data, test_size=0.2, random_state=42)
        sim_options = {'name': 'cosine', 'user_based': False}
        knn_model = KNNBasic(sim_options=sim_options)
        knn_model.fit(trainset)
        logging.info("KNN model trained successfully")
        return knn_model
    except Exception as e:
        logging.error(f"Error training KNN model: {e}")
        raise

def train_SVD_model(interactions_df):
    """Train SVDpp model."""
    try:
        if interactions_df.empty:
            raise ValueError("Cannot train SVD model with empty interactions")
        reader = Reader(rating_scale=(0, 1))
        data = Dataset.load_from_df(interactions_df[['user_id', 'event_id', 'weight']], reader)
        trainset, testset = surprise_train_test_split(data, test_size=0.2, random_state=42)
        SVD_model = SVDpp()
        SVD_model.fit(trainset)
        logging.info("SVDpp model trained successfully")
        return SVD_model
    except Exception as e:
        logging.error(f"Error training SVDpp model: {e}")
        raise

def train_slope_model(interactions_df):
    """Train Slope One model."""
    try:
        if interactions_df.empty:
            raise ValueError("Cannot train Slope One model with empty interactions")
        reader = Reader(rating_scale=(0, 1))
        data = Dataset.load_from_df(interactions_df[['user_id', 'event_id', 'weight']], reader)
        trainset, testset = surprise_train_test_split(data, test_size=0.2, random_state=42)
        slope_model = SlopeOne()
        slope_model.fit(trainset)
        logging.info("Slope One model trained successfully")
        return slope_model
    except Exception as e:
        logging.error(f"Error training Slope One model: {e}")
        raise

def train_stacked_model(interactions_df, events_df, users_df):
    """Train stacked model with base models and meta-model."""
    try:
        if interactions_df.empty:
            raise ValueError("Cannot train stacked model with empty interactions")
        reader = Reader(rating_scale=(0, 1))
        data = Dataset.load_from_df(interactions_df[['user_id', 'event_id', 'weight']], reader)
        trainset, testset = surprise_train_test_split(data, test_size=0.2, random_state=42)

        if not testset:
            logging.warning("Testset empty, using trainset for meta-model")
            testset = trainset.build_testset()

        knn_model = train_knn_model(interactions_df)
        SVD_model = train_SVD_model(interactions_df)
        slope_model = train_slope_model(interactions_df)
        base_models = [knn_model, SVD_model, slope_model]

        onehot = OneHotEncoder(handle_unknown='ignore', sparse_output=False)
        event_cat_encoded = onehot.fit_transform(events_df[['category']])
        event_cat_map = dict(zip(events_df['event_id'], event_cat_encoded))

        user_age_map = dict(zip(users_df['user_id'], users_df['age']))

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

        X_meta_train, X_meta_test, y_meta_train, y_meta_test = sklearn_train_test_split(
            X_meta, y_meta, test_size=0.2, random_state=42
        )
        meta_model = RandomForestRegressor(n_estimators=100, random_state=42)
        meta_model.fit(X_meta_train, y_meta_train)
        logging.info("Stacked meta-model trained successfully")
        return base_models, meta_model
    except Exception as e:
        logging.error(f"Error training stacked model: {e}")
        raise

def save_models(base_models, meta_model, output_dir):
    """Save models to disk."""
    try:
        model_names = ['knn_model.pkl', 'SVD_model.pkl', 'slope_model.pkl', 'meta_model.pkl']
        models = base_models + [meta_model]
        for name, model in zip(model_names, models):
            with open(os.path.join(output_dir, name), 'wb') as f:
                pickle.dump(model, f)
        logging.info("Models saved successfully")
    except Exception as e:
        logging.error(f"Error saving models: {e}")
        raise

def main():
    """Main retraining function."""
    try:
        interactions_csv = 'C:/Users/HP/NestjsProjects/smart-event/python/interaction_data.csv'
        events_csv = 'C:/Users/HP/NestjsProjects/smart-event/python/event_data.csv'
        users_csv = 'C:/Users/HP/NestjsProjects/smart-event/python/user_data.csv'
        output_dir = 'C:/Users/HP/NestjsProjects/smart-event/python/'

        logging.info("Starting model retraining")
        mongo_interactions, mongo_events, mongo_users = load_mongodb_data()
        csv_interactions, csv_events, csv_users = load_csv_data(interactions_csv, events_csv, users_csv)
        
        interactions_df, events_df, users_df = merge_data(
            mongo_interactions, mongo_events, mongo_users,
            csv_interactions, csv_events, csv_users
        )
        
        merged_df, events_df, users_df = preprocess_data(interactions_df, events_df, users_df)
        
        if len(merged_df) < 10:
            logging.warning(f"Low interaction count ({len(merged_df)}), training may be unstable")
        
        base_models, meta_model = train_stacked_model(merged_df, events_df, users_df)
        save_models(base_models, meta_model, output_dir)
        logging.info("Retraining completed successfully")
    except Exception as e:
        logging.error(f"Retraining failed: {e}")
        sys.exit(1)

if __name__ == "__main__":
    main()