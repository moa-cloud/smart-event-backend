from surprise import Dataset, Reader, KNNBasic
from surprise.model_selection import train_test_split

def train_knn_model(interactions_df):
    all_events = interactions_df['event_id'].unique()

    # 1. Load data into Surprise format
    reader = Reader(rating_scale=(0, 1))  # or (1, 5), depending on your scale
    data = Dataset.load_from_df(interactions_df[['user_id', 'event_id', 'weight']], reader)

    # 2. Split into train/test
    trainset, testset = train_test_split(data, test_size=0.2, random_state=42)

    # 3. Train a KNN model
    sim_options = {
        'name': 'cosine',  # or 'pearson'
        'user_based': False  # set to False for item-based filtering
    }
    knn_model = KNNBasic(sim_options=sim_options)
    knn_model.fit(trainset)
    return knn_model