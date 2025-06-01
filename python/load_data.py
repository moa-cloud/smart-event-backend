from pymongo import MongoClient
import pandas as pd

def load_data():
    # Connect to MongoDB
    client = MongoClient("mongodb://localhost:27017/")  # Update if you're using a remote URI

    # Access your database and collection
    db = client["your_database_name"]
    interactions_collection = db["your_interactions_collection"]
    users_collection = db["your_users_collection"]
    events_collection = db["your_events_collection"]

    # Query the data (you can add filters if needed)
    interactions_data = list(interactions_collection.find())
    users_data = list(users_collection.find())
    events_data = list(events_collection.find())

    # Optionally remove MongoDB’s default _id field
    for record in interactions_data: 
        record.pop('_id', None)

    # Convert to DataFrame
    interactions_df = pd.DataFrame(interactions_data)
    events_df= pd.DataFrame(events_data)
    users_df= pd.DataFrame(users_data)

    return (interactions_df,events_df,users_df)
