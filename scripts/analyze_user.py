import pandas as pd
from scripts.fetch_user_profile import build_feature_vector

def calculate_weakness_score(accuracy, attempts_proxy):
    """Calculate weakness score using same formula as before"""
    return round((1 - accuracy) * 0.7 + attempts_proxy * 0.3, 3)

def get_attempts_proxy(features, topic):
    """Estimate attempts based on difficulty performance"""
    return 1 - features["hard_accuracy"]

def get_recommendations(topic, username, features):
    """Get 3 problems (easy, medium, hard) for given topic"""
    problems_df = pd.read_csv("data/problems.csv")
    
    topic_problems = problems_df[problems_df["topic"] == topic]
    
    if len(topic_problems) == 0:
        return []
    easy = topic_problems[topic_problems["difficulty"] == "EASY"]
    medium = topic_problems[topic_problems["difficulty"] == "MEDIUM"]
    hard = topic_problems[topic_problems["difficulty"] == "HARD"]
    
    picks = []
    
    if len(easy) > 0:
        pick = easy.sample(1).iloc[0]
        picks.append(("Easy", pick["title"], int(pick["questionId"])))
    
    if len(medium) > 0:
        pick = medium.sample(1).iloc[0]
        picks.append(("Medium", pick["title"], int(pick["questionId"])))
    
    if len(hard) > 0:
        pick = hard.sample(1).iloc[0]
        picks.append(("Hard", pick["title"], int(pick["questionId"])))
    
    return picks

def analyze_user(username):
    print(f"\n🔍 Analyzing user: {username}")
    print("="*50)
    
    features = build_feature_vector(username)
    if not features:
        return {"error": f"Could not fetch data for {username}"}
    
    print(f"📊 Total problems solved: {features['total_solved']}")
    print(f"   Easy: {features['easy_solved']} | Medium: {features['medium_solved']} | Hard: {features['hard_solved']}")
    
    # 2. Calculate weakness scores
    topics_list = ["Arrays", "Strings", "DP", "Trees", "Graphs", "Recursion", "Stack/Queue", "Binary Search"]
    
    weakness_scores = []
    for topic in topics_list:
        acc_key = f"{topic.lower().replace('/', '_').replace(' ', '_')}_accuracy"
        solved_key = f"{topic.lower().replace('/', '_').replace(' ', '_')}_solved"
        
        accuracy = features[acc_key]
        solved = features[solved_key]
        attempts_proxy = get_attempts_proxy(features, topic)
        
        weakness = calculate_weakness_score(accuracy, attempts_proxy)
        
        weakness_scores.append({
            "topic": topic,
            "accuracy": accuracy,
            "solved": solved,
            "weakness": weakness
        })
    
    # 3. Rank topics
    weakness_scores.sort(key=lambda x: x["weakness"], reverse=True)
    
    print("\n📈 WEAKNESS RANKING (highest = weakest):")
    for i, item in enumerate(weakness_scores, 1):
        strength = "🔴" if i <= 2 else "🟡" if i <= 4 else "🟢"
        print(f"   {strength} {i}. {item['topic']:12} | accuracy: {item['accuracy']:.3f} | solved: {item['solved']:3} | weakness: {item['weakness']:.3f}")
    
    # 4. Get recommendations for weakest topic
    weakest_topic = weakness_scores[0]["topic"]
    print(f"\n💡 WEAKEST TOPIC: {weakest_topic} (weakness score: {weakness_scores[0]['weakness']:.3f})")
    
    recommendations = get_recommendations(weakest_topic, username, features)
    
    print(f"\n🎯 RECOMMENDED PROBLEMS FOR {weakest_topic.upper()}:")
    for diff, title, qid in recommendations:
        print(f"   • {diff:6}: {title} (ID: {qid})")
    
    # 5. Build result dictionary
    result = {
        "username": username,
        "total_solved": features["total_solved"],
        "weakest_topic": weakest_topic,
        "weakness_score": weakness_scores[0]["weakness"],
        "accuracy_on_weakest": weakness_scores[0]["accuracy"],
        "solved_in_weakest": weakness_scores[0]["solved"],
        "ranked_topics": [
            {"topic": item["topic"], "weakness": item["weakness"]} 
            for item in weakness_scores
        ],
        "recommendations": [
            {"difficulty": diff, "title": title, "id": qid}
            for diff, title, qid in recommendations
        ]
    }
    
    return result

if __name__ == "__main__":
    result = analyze_user("harshnitb")
    
    print("\n" + "="*50)
    print("📦 FINAL RESULT DICTIONARY:")
    print("="*50)
    for key, value in result.items():
        if key not in ["ranked_topics", "recommendations"]:
            print(f"{key}: {value}")
    
    print("\n📋 Ranked topics preview:")
    for item in result["ranked_topics"][:3]:
        print(f"   {item['topic']}: {item['weakness']:.3f}")
    
    print("\n📋 Recommendations preview:")
    for rec in result["recommendations"]:
        print(f"   {rec['difficulty']}: {rec['title']}")