from sklearn.metrics.pairwise import cosine_similarity
import pandas as pd
import sys
import numpy as np

def build_user_event_matrix(interactions_df):
    try:
        matrix = interactions_df.pivot_table(
            index='user_id', 
            columns='event_id', 
            values='weight', 
            aggfunc='sum',
            fill_value=0
        )
        print(f"[Cosine Similarity] User-event matrix shape: {matrix.shape}", file=sys.stderr)
        return matrix
    except Exception as e:
        print(f"[Cosine Similarity] Error building user-event matrix: {str(e)}", file=sys.stderr)
        return pd.DataFrame()

def get_similar_users(user_event_matrix, target_user_id, top_n=5):
    try:
        if target_user_id not in user_event_matrix.index:
            print(f"[Cosine Similarity] Target user {target_user_id} not in matrix", file=sys.stderr)
            return pd.Series(dtype=float)

        user_vector = user_event_matrix.loc[[target_user_id]]
        similarity = cosine_similarity(user_vector, user_event_matrix)[0]

        similarity_scores = pd.Series(similarity, index=user_event_matrix.index)
        similarity_scores = similarity_scores.drop(index=target_user_id, errors='ignore')
        
        print(f"[Cosine Similarity] Similar users scores:\n{similarity_scores.to_string()}", file=sys.stderr)
        return similarity_scores.sort_values(ascending=False).head(top_n)
    except Exception as e:
        print(f"[Cosine Similarity] Error computing similar users: {str(e)}", file=sys.stderr)
        return pd.Series(dtype=float)

def compute_tag_similarity(user_tags, event_tags):
    try:
        user_tags_set = set(user_tags)
        event_tags_set = set(event_tags) if isinstance(event_tags, (list, set)) else set()
        overlap = len(user_tags_set & event_tags_set)
        total = len(user_tags_set | event_tags_set)
        return overlap / total if total > 0 else 0.0
    except Exception as e:
        print(f"[Cosine Similarity] Tag similarity error: {str(e)}", file=sys.stderr)
        return 0.0

def recommend_using_cosine_similarity(target_user_id, interactions_df, events_df, k=5):
    try:
        print("\n[Cosine Similarity Debug]", file=sys.stderr)
        print(f"Input interactions:\n{interactions_df.head(2).to_string()}", file=sys.stderr)
        print(f"Input events:\n{events_df.head(2).to_string()}", file=sys.stderr)

        # Ensure consistent event_id type
        interactions_df['event_id'] = interactions_df['event_id'].astype(str)
        events_df['event_id'] = events_df['event_id'].astype(str)

        user_event_matrix = build_user_event_matrix(interactions_df)
        target_user_events = set(interactions_df[interactions_df['user_id'] == target_user_id]['event_id'])
        user_interactions = interactions_df[interactions_df['user_id'] == target_user_id]
        
        # Extract user-preferred tags
        user_tags = set()
        for _, row in user_interactions.iterrows():
            event_id = row['event_id']
            event = events_df[events_df['event_id'] == event_id]
            if not event.empty:
                event_tags = event['tags'].iloc[0]
                if isinstance(event_tags, (list, set)):
                    user_tags.update(event_tags)
        print(f"[Cosine Similarity] User tags: {user_tags}", file=sys.stderr)

        # Collaborative Filtering
        if not user_event_matrix.empty and len(user_event_matrix.index) > 1:
            similar_users = get_similar_users(user_event_matrix, target_user_id)
            
            if not similar_users.empty:
                print("[Cosine Similarity] Using collaborative filtering", file=sys.stderr)
                recommended = {}
                
                for sim_user, sim_user_score in similar_users.items():
                    sim_user_events = interactions_df[interactions_df['user_id'] == sim_user]
                    for _, row in sim_user_events.iterrows():
                        event_id = row['event_id']
                        if event_id not in target_user_events:
                            event = events_df[events_df['event_id'] == event_id]
                            if not event.empty:
                                event_tags = event['tags'].iloc[0]
                                tag_sim = compute_tag_similarity(user_tags, event_tags)
                                score = row['weight'] * sim_user_score * (0.8 + 0.2 * tag_sim)
                                recommended[event_id] = recommended.get(event_id, 0) + score
                
                if recommended:
                    # Normalize scores to 0.2-0.9
                    scores = list(recommended.values())
                    min_score, max_score = min(scores, default=0), max(scores, default=1)
                    normalized_scores = {}
                    if max_score > min_score:
                        for eid, score in recommended.items():
                            normalized_scores[eid] = 0.2 + 0.7 * (score - min_score) / (max_score - min_score)
                    else:
                        normalized_scores = {eid: 0.9 for eid in recommended}
                    
                    sorted_recs = [[eid, normalized_scores[eid]] for eid in recommended]
                    sorted_recs.sort(key=lambda x: x[1], reverse=True)
                    print(f"[Cosine Similarity] Collaborative filtering recommendations: {sorted_recs[:k]}", file=sys.stderr)
                    
                    if len(sorted_recs) >= k:
                        return sorted_recs[:k]

        # Category-Based Fallback
        print("[Cosine Similarity] Using category-based fallback", file=sys.stderr)
        if user_interactions.empty:
            print("[Cosine Similarity] No interactions, using popular events", file=sys.stderr)
            # Popular events fallback
            event_popularity = interactions_df.groupby('event_id').size().sort_values(ascending=False)
            popular_events = []
            for idx, eid in enumerate(event_popularity.index[:k]):
                if eid not in target_user_events:
                    event = events_df[events_df['event_id'] == eid]
                    if not event.empty:
                        tag_sim = compute_tag_similarity(user_tags, event['tags'].iloc[0])
                        score = 0.5 - 0.1 * (idx / max(1, k)) + 0.1 * tag_sim
                        score = min(max(score, 0.2), 0.5)
                        popular_events.append([eid, score])
            print(f"[Cosine Similarity] Popular events: {popular_events}", file=sys.stderr)
            return popular_events[:k]
        
        user_categories = user_interactions['category'].unique()
        print(f"[Cosine Similarity] User categories: {user_categories}", file=sys.stderr)
        
        candidate_events = []
        category_events = events_df[
            (events_df['category'].isin(user_categories)) & 
            (~events_df['event_id'].isin(target_user_events))
        ]
        for idx, row in category_events.iterrows():
            tag_sim = compute_tag_similarity(user_tags, row['tags'])
            # Base score: 0.9 to 0.7
            score = 0.9 - 0.2 * (idx / max(1, len(category_events)))
            score = score * (1 + 0.1 * tag_sim)  # Slight tag boost
            score = min(max(score, 0.2), 0.9)  # Clamp
            candidate_events.append([row['event_id'], score])
        
        print(f"[Cosine Similarity] Category-based events: {candidate_events}", file=sys.stderr)
        
        if len(candidate_events) >= k:
            candidate_events.sort(key=lambda x: x[1], reverse=True)
            return candidate_events[:k]
        
        # Tag-Based Fallback
        print("\n[Cosine Similarity] Using tag-based fallback", file=sys.stderr)
        tag_candidates = []
        tag_events = events_df[
            (~events_df['event_id'].isin(target_user_events)) &
            (~events_df['event_id'].isin([c[0] for c in candidate_events]))
        ]
        for idx, row in tag_events.iterrows():
            tag_sim = compute_tag_similarity(user_tags, row['tags'])
            if tag_sim > 0:
                # Base score: 0.7 to 0.5
                score = 0.7 - 0.2 * (idx / max(1, len(tag_events)))
                score = score * (1 + 0.1 * tag_sim)
                score = min(max(score, 0.2), 0.7)
                tag_candidates.append([row['event_id'], score])
        
        print(f"[Cosine Similarity] Tag-based candidate events: {tag_candidates}", file=sys.stderr)
        
        candidate_events.extend(tag_candidates)
        candidate_events.sort(key=lambda x: x[1], reverse=True)
        
        if len(candidate_events) >= k:
            return candidate_events[:k]
        
        # Popular Events Fallback
        print("\n[Cosine Similarity] Using popular events fallback", file=sys.stderr)
        event_popularity = interactions_df.groupby('event_id').size().sort_values(ascending=False)
        max_popularity = event_popularity.max() if not event_popularity.empty else 1
        popular_events = []
        for idx, eid in enumerate(event_popularity.index):
            if eid not in target_user_events and eid not in [c[0] for c in candidate_events]:
                event = events_df[events_df['event_id'] == eid]
                if not event.empty:
                    tag_sim = compute_tag_similarity(user_tags, event['tags'].iloc[0])
                    score = 0.5 - 0.1 * (idx / max(1, len(event_popularity))) + 0.1 * tag_sim
                    score = min(max(score, 0.2), 0.5)
                    popular_events.append([eid, score])
                    if len(popular_events) >= k - len(candidate_events):
                        break
        
        candidate_events.extend(popular_events)
        candidate_events.sort(key=lambda x: x[1], reverse=True)
        
        print(f"[Cosine Similarity] Popular events recommendations: {candidate_events[:k]}", file=sys.stderr)
        return candidate_events[:k]
    
    except Exception as e:
        print(f"[Cosine Similarity] Error: {str(e)}", file=sys.stderr)
        import traceback
        traceback.print_exc(file=sys.stderr)
        return []