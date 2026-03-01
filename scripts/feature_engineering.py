import pandas as pd

def generate_user_feature_vector(user_id, submissions_df, problems_df):
    merged = submissions_df.merge(problems_df, left_on="problem_id", right_on="questionId")
    
    user_df = merged[merged["user_id"] == user_id]
    
    if user_df.empty:
        return None
    
    grouped = user_df.groupby("topic")
    
    accuracy = grouped["solved"].mean()
    avg_attempts = grouped["attempts"].mean()
    
    feature_vector = {"user_id": user_id}
    
    topics = ["Arrays", "Strings", "DP", "Trees", "Graphs", "Recursion", "Stack/Queue", "Binary Search"]
    
    for topic in topics:
        feature_vector[f"{topic.lower().replace(' ', '_')}_accuracy"] = round(accuracy.get(topic, 0), 3)
        feature_vector[f"{topic.lower().replace(' ', '_')}_avg_attempts"] = round(avg_attempts.get(topic, 0), 2)
    
    return feature_vector

def main():
    print("Loading data...")
    submissions = pd.read_csv("data/submissions.csv")
    problems = pd.read_csv("data/problems.csv")
    
    print("Generating feature vectors for all users...")
    all_features = []
    
    for user_id in range(1, 101):
        features = generate_user_feature_vector(user_id, submissions, problems)
        if features:
            all_features.append(features)
            print(f"  User {user_id}: Done")
    
    features_df = pd.DataFrame(all_features)
    features_df.to_csv("data/features.csv", index=False)
    print(f"\nSaved {len(all_features)} feature vectors to data/features.csv")
    
    print("\nFirst 3 users preview:")
    print(features_df.head(3))

if __name__ == "__main__":
    main()