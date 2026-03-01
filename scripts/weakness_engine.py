import pandas as pd
import numpy as np

# Weights
W1 = 0.7  # accuracy weight
W2 = 0.3  # attempts weight

def calculate_weakness_score(accuracy, avg_attempts, max_attempts):
    """Calculate weakness score for a topic"""
    if pd.isna(accuracy) or avg_attempts == 0:
        return 1.0 

    normalized_attempts = avg_attempts / max_attempts
    
    weakness = (1 - accuracy) * W1 + normalized_attempts * W2
    return round(weakness, 3)

def get_weakest_topics(user_row, max_attempts):
    """Extract and rank topics for a user"""
    topics = ["arrays", "strings", "dp", "trees", "graphs", "recursion", "stack/queue", "binary_search"]
    
    topic_scores = []
    
    for topic in topics:
        accuracy_col = f"{topic}_accuracy"
        attempts_col = f"{topic}_avg_attempts"
        
        accuracy = user_row[accuracy_col]
        avg_attempts = user_row[attempts_col]
        
        score = calculate_weakness_score(accuracy, avg_attempts, max_attempts)
        
        topic_scores.append({
            "topic": topic.replace("_", " ").title(),
            "accuracy": accuracy,
            "avg_attempts": avg_attempts,
            "weakness_score": score
        })
    
    return sorted(topic_scores, key=lambda x: x["weakness_score"], reverse=True)

def print_weakness_report(user_id, ranked_topics):
    """Print formatted weakness report for a user"""
    print(f"\n{'='*50}")
    print(f"WEAKNESS REPORT FOR USER {user_id}")
    print(f"{'='*50}")
    print(f"{'Topic':<15} {'Accuracy':<10} {'Avg Attempts':<15} {'Weakness Score':<15}")
    print(f"{'-'*55}")
    
    for topic_data in ranked_topics:
        print(f"{topic_data['topic']:<15} {topic_data['accuracy']:<10.3f} {topic_data['avg_attempts']:<15.2f} {topic_data['weakness_score']:<15.3f}")
    
    print(f"\n WEAKEST: {ranked_topics[0]['topic']} (score: {ranked_topics[0]['weakness_score']:.3f})")
    print(f" STRONGEST: {ranked_topics[-1]['topic']} (score: {ranked_topics[-1]['weakness_score']:.3f})")

def main():
    print("Loading feature vectors...")
    features_df = pd.read_csv("data/features.csv")
    
    submissions_df = pd.read_csv("data/submissions.csv")
    max_attempts = submissions_df["attempts"].max()
    print(f"Max attempts in dataset: {max_attempts}")
    
    all_weakness_scores = []
    
    for _, user_row in features_df.iterrows():
        user_id = int(user_row["user_id"])
        
        ranked_topics = get_weakest_topics(user_row, max_attempts)
        
        print_weakness_report(user_id, ranked_topics)
        
    
        user_scores = {"user_id": user_id}
        for rank, topic_data in enumerate(ranked_topics, 1):
            topic_key = topic_data["topic"].lower().replace(" ", "_")
            user_scores[f"{topic_key}_weakness"] = topic_data["weakness_score"]
            user_scores[f"{topic_key}_rank"] = rank
        
        all_weakness_scores.append(user_scores)
    
    # Save to CSV
    weakness_df = pd.DataFrame(all_weakness_scores)
    weakness_df.to_csv("data/weakness_scores.csv", index=False)
    print(f"\n Saved weakness scores to data/weakness_scores.csv")

if __name__ == "__main__":
    main()