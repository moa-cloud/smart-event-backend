import pandas as pd
from sklearn.preprocessing import OneHotEncoder
import numpy as np
import sys

def get_top_n_stacked_recommendations(meta_model, base_models, user_id, interactions, events_data, users_data, all_events, n=5):
    print("[Stacked Model] Generating recommendations for user:", user_id, file=sys.stderr)
    
    try:
        print("[Stacked Model] Using passed events_data and users_data", file=sys.stderr)
        print(f"[Stacked Model] events_data sample:\n{events_data.head(2).to_string()}", file=sys.stderr)
        print(f"[Stacked Model] users_data sample:\n{users_data.head(2).to_string()}", file=sys.stderr)

        # One-hot encode event categories
        cat_encoder = OneHotEncoder(handle_unknown='ignore')
        event_cat_encoded = cat_encoder.fit_transform(events_data[['category']]).toarray()

        # One-hot encode event tags
        tag_encoder = OneHotEncoder(handle_unknown='ignore', sparse_output=False)
        # Flatten tags lists into a single column of strings
        events_data['tags_str'] = events_data['tags'].apply(lambda x: ','.join(x) if isinstance(x, list) else '')
        tag_encoded = tag_encoder.fit_transform(events_data[['tags_str']]).toarray()

        # Map event_id to encoded features
        event_cat_map = dict(zip(events_data['event_id'], event_cat_encoded))
        event_tag_map = dict(zip(events_data['event_id'], tag_encoded))
        print(f"[Stacked Model] Event category map keys: {list(event_cat_map.keys())}", file=sys.stderr)
        print(f"[Stacked Model] Event tag map keys: {list(event_tag_map.keys())}", file=sys.stderr)

        user_age_map = dict(zip(users_data['user_id'], users_data['age']))
        age = user_age_map.get(user_id, 25)
        print(f"[Stacked Model] User age: {age}", file=sys.stderr)

        seen_events = interactions[interactions['user_id'] == user_id]['event_id'].unique()
        all_available_events = events_data['event_id'].unique()
        unseen_events = [eid for eid in all_available_events if eid not in seen_events]

        print(f"[Stacked Model] Seen events: {seen_events}", file=sys.stderr)
        print(f"[Stacked Model] All available events: {all_available_events}", file=sys.stderr)
        print(f"[Stacked Model] Unseen events: {unseen_events}", file=sys.stderr)

        recommendations = []
        raw_preds = []  # Store [event_id, final_pred] for normalization

        # Score all events
        for event_id in all_available_events:
            try:
                base_preds = [model.predict(user_id, event_id).est for model in base_models]
                category_vec = event_cat_map.get(event_id, np.zeros(event_cat_encoded.shape[1]))
                tag_vec = event_tag_map.get(event_id, np.zeros(tag_encoded.shape[1]))
                
                features = np.array(base_preds + [age] + list(category_vec) + list(tag_vec)).reshape(1, -1)
                final_pred = meta_model.predict(features)[0]
                
                # Store raw prediction
                is_unseen = event_id in unseen_events
                raw_preds.append([event_id, final_pred, is_unseen])
                
                print(f"[Stacked Model] Event {event_id} raw pred: {final_pred} (unseen: {is_unseen})", file=sys.stderr)
            except Exception as e:
                print(f"[Stacked Model] Error predicting for event {event_id}: {str(e)}", file=sys.stderr)
                continue

        if not raw_preds:
            print("[Stacked Model] No valid predictions generated", file=sys.stderr)
            return []

        # Normalize scores to 0.2-0.9 range
        pred_values = [p[1] for p in raw_preds]
        min_pred, max_pred = min(pred_values), max(pred_values)
        if max_pred == min_pred:
            # Avoid division by zero
            scores = [0.9 if raw_preds[i][2] else 0.81 for i in range(len(raw_preds))]  # Unseen: 0.9, Seen: 0.81
        else:
            # Linear normalization
            scores = [
                0.2 + 0.7 * (p - min_pred) / (max_pred - min_pred) if raw_preds[i][2]
                else 0.2 + 0.63 * (p - min_pred) / (max_pred - min_pred)  # 0.9 penalty for seen
                for i, (eid, p, is_unseen) in enumerate(raw_preds)
            ]

        # Combine event_id and score
        for i, (event_id, _, is_unseen) in enumerate(raw_preds):
            recommendations.append([event_id, scores[i]])
            print(f"[Stacked Model] Event {event_id} final score: {scores[i]} (unseen: {is_unseen})", file=sys.stderr)

        recommendations.sort(key=lambda x: x[1], reverse=True)
        print(f"[Stacked Model] Top {n} recommendations with scores: {recommendations[:n]}", file=sys.stderr)
        return recommendations[:n]
    
    except Exception as e:
        print(f"[Stacked Model] Error: {str(e)}", file=sys.stderr)
        import traceback
        traceback.print_exc(file=sys.stderr)
        return []