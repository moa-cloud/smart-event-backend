from surprise import SVDpp, Dataset, Reader
from surprise.model_selection import train_test_split


def train_SVD_model(interactions_df):
    all_events = interactions_df['event_id'].unique()

    # 1. Load data into Surprise format
    reader = Reader(rating_scale=(0, 1))  # or (1, 5), depending on your scale
    data = Dataset.load_from_df(interactions_df[['user_id', 'event_id', 'weight']], reader)

    # 2. Split into train/test
    trainset, testset = train_test_split(data, test_size=0.2, random_state=42)

    SVD_model = SVDpp()
    SVD_model.fit(trainset)
    return SVD_model