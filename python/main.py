import sys
import json
import traceback
import pandas as pd
from datetime import datetime
import joblib
import os
from cosine_similarity import recommend_using_cosine_similarity
from stacked_model import get_top_n_stacked_recommendations

# Debug information
print("Python executable:", sys.executable, file=sys.stderr)
print("Current working directory:", os.getcwd(), file=sys.stderr)
print("Script location:", os.path.abspath(__file__), file=sys.stderr)

def load_models():
    """Load all required ML models"""
    try:
        models = {
            'meta_model': joblib.load('python/meta_model.pkl'),
            'knn_model': joblib.load('python/knn_model.pkl'),
            'SVD_model': joblib.load('python/SVD_model.pkl'),
            'slope_model': joblib.load('python/slope_model.pkl')
        }
        print("Successfully loaded all models", file=sys.stderr)
        return models
    except Exception as e:
        print(f"Model loading failed: {str(e)}", file=sys.stderr)
        raise

def validate_input(data):
    """Validate input structure and types"""
    required = {
        'userId': str,
        'interactions': list,
        'events': list,
        'users': list
    }
    
    for field, field_type in required.items():
        if field not in data:
            raise ValueError(f"Missing required field: {field}")
        if not isinstance(data[field], field_type):
            raise ValueError(f"Field {field} must be {field_type.__name__}")
    
    if not all(isinstance(i, dict) for i in data['interactions']):
        raise ValueError("All interactions must be dictionaries")

def process_data(input_data):
    """Transform raw input into processed DataFrames"""
    print("\n=== PROCESSING STARTED ===", file=sys.stderr)
    
    events_df = pd.DataFrame(input_data['events'])
    users_df = pd.DataFrame(input_data['users'])
    interactions_df = pd.DataFrame(input_data['interactions'])

    print("\n=== RAW DATA SAMPLES ===", file=sys.stderr)
    print("Interactions sample:", interactions_df.head(2).to_string(), file=sys.stderr)
    print("Events sample:", events_df.head(2).to_string(), file=sys.stderr)
    print("Users sample:", users_df.head(2).to_string(), file=sys.stderr)

    column_mapping = {
        'user_id': 'user_id',
        'event_id': 'event_id',
        'interaction_type': 'interaction_type',
        'weight': 'weight',
        'created_at': 'created_at'
    }
    interactions_df = interactions_df.rename(columns=column_mapping)

    merged_data = pd.merge(
        interactions_df,
        users_df,
        on='user_id',
        how='left'
    ).merge(
        events_df,
        on='event_id',
        how='left'
    )

    merged_data['created_at'] = pd.to_datetime(merged_data['created_at'])
    merged_data['weight'] = merged_data['interaction_type'].map({
        'attended': 1.0,
        'bookmark': 0.75,
        'book': 0.75,
        'search': 0.55,
        'view': 0.3
    }).fillna(0.1)

    final_columns = [
        'user_id', 'age', 'location_x', 'event_id',
        'interaction_type', 'category', 'location_y',
        'weight', 'created_at'
    ]
    merged_data = merged_data[final_columns]
    merged_data = merged_data.rename(columns={
        'location_x': 'user_location',
        'location_y': 'event_location'
    })

    print("\n=== PROCESSED DATA ===", file=sys.stderr)
    print("Merged data info:", file=sys.stderr)
    merged_data.info(buf=sys.stderr)
    print("Sample processed data:", merged_data.head(2).to_string(), file=sys.stderr)

    return merged_data, events_df, users_df

def recommend_for_user(target_user_id, interactions_df, events_df, users_df, models, top_n=5):
    """Generate recommendations based on user's interaction history"""
    try:
        print(f"\n=== GENERATING RECOMMENDATIONS FOR {target_user_id} ===", file=sys.stderr)
        
        all_events = interactions_df['event_id'].unique()
        user_interactions = interactions_df[interactions_df['user_id'] == target_user_id]
        interaction_count = len(user_interactions)
        
        print(f"User has {interaction_count} interactions", file=sys.stderr)
        
        if interaction_count == 0:
            print("No interactions, returning empty list", file=sys.stderr)
            return []
        
        if interaction_count < 10:
            print("Using cosine similarity (cold start)", file=sys.stderr)
            return recommend_using_cosine_similarity(
                target_user_id, interactions_df, events_df, k=top_n
            )
        else:
            print("Using stacked model", file=sys.stderr)
            recommendations = get_top_n_stacked_recommendations(
                models['meta_model'],
                [models['knn_model'], models['SVD_model'], models['slope_model']],
                target_user_id,
                interactions_df,
                events_df,
                users_df,
                all_events,
                n=top_n
            )
            if not recommendations:
                print("[Main] Stacked model returned no recommendations, falling back to cosine similarity", file=sys.stderr)
                return recommend_using_cosine_similarity(
                    target_user_id, interactions_df, events_df, k=top_n
                )
            return recommendations
            
    except Exception as e:
        print(f"Recommendation error: {str(e)}", file=sys.stderr)
        traceback.print_exc(file=sys.stderr)
        return []

def main():
    try:
        if len(sys.argv) < 2:
            raise ValueError("No input file provided")
            
        input_file = sys.argv[1]
        print(f"Reading input from file: {input_file}", file=sys.stderr)
        
        with open(input_file, 'r') as f:
            input_data = json.load(f)
        
        print(f"Input data loaded successfully", file=sys.stderr)
        print(f"Processing user: {input_data['userId']}", file=sys.stderr)
        print(f"Interactions: {len(input_data['interactions'])}", file=sys.stderr)
        print(f"Events: {len(input_data['events'])}", file=sys.stderr)
        print(f"Users: {len(input_data['users'])}", file=sys.stderr)

        validate_input(input_data)
        models = load_models()
        interactions_df, events_df, users_df = process_data(input_data)
        
        recommendations = recommend_for_user(
            input_data['userId'],
            interactions_df,
            events_df,
            users_df,
            models
        )
        
        formatted_recommendations = [
            {"eventId": event_id, "score": float(score)} 
            for event_id, score in recommendations
        ]
        
        print(f"\n=== FINAL RECOMMENDATIONS ===", file=sys.stderr)
        print(formatted_recommendations, file=sys.stderr)
        
        output = {
            "userId": input_data['userId'],
            "recommendations": formatted_recommendations,
            "generatedAt": datetime.now().isoformat()
        }
        print(json.dumps(output))
        
    except Exception as e:
        error_msg = {
            "error": str(e),
            "traceback": traceback.format_exc(),
            "argv": sys.argv
        }
        print(json.dumps(error_msg), file=sys.stderr)
        sys.exit(1)

if __name__ == "__main__":
    main()