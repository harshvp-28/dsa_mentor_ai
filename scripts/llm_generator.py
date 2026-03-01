import os
import pandas as pd
from dotenv import load_dotenv
from google import genai

load_dotenv()

client = genai.Client(api_key=os.getenv("GEMINI_API_KEY"))

def get_user_context(user_id):
    features = pd.read_csv("data/features.csv")
    weakness = pd.read_csv("data/weakness_scores.csv")
    clusters = pd.read_csv("data/clusters.csv")
    
    user_features = features[features["user_id"] == user_id]
    user_weakness = weakness[weakness["user_id"] == user_id]
    user_cluster = clusters[clusters["user_id"] == user_id]
    
    if len(user_features) == 0:
        return None
    
    topic_cols = [col for col in weakness.columns if col.endswith("_weakness")]
    weakest_score = -1
    weakest_topic = ""
    
    for col in topic_cols:
        score = user_weakness[col].values[0]
        if score > weakest_score:
            weakest_score = score
            weakest_topic = col.replace("_weakness", "").replace("_", " ").title()
    
    accuracy_col = weakest_topic.lower().replace(" ", "_") + "_accuracy"
    attempts_col = weakest_topic.lower().replace(" ", "_") + "_avg_attempts"
    accuracy = user_features[accuracy_col].values[0]
    avg_attempts = user_features[attempts_col].values[0]
    cluster = user_cluster["cluster"].values[0]
    
    all_accuracies = [user_features[col].values[0] for col in features.columns if "accuracy" in col]
    avg_acc = sum(all_accuracies) / len(all_accuracies)
    
    diff_performance = {}
    if avg_acc > 0.7:
        diff_performance = {"Easy": "masters easy", "Medium": "solid on medium", "Hard": "can handle hard"}
    elif avg_acc > 0.4:
        diff_performance = {"Easy": "ok on easy", "Medium": "struggles on medium", "Hard": "hard is tough"}
    else:
        diff_performance = {"Easy": "still learning basics", "Medium": "medium is challenging", "Hard": "too advanced"}
    
    return {
        "user_id": user_id,
        "weakest_topic": weakest_topic,
        "weakest_accuracy": round(accuracy, 3),
        "weakest_avg_attempts": round(avg_attempts, 2),
        "cluster": int(cluster),
        "difficulty_performance": diff_performance
    }

def build_prompt(context):
    return f"""
    You are an expert DSA tutor analyzing a student's performance.

    Student Profile:
    - Weakest topic: {context['weakest_topic']}
    - Accuracy: {context['weakest_accuracy']*100:.1f}%
    - Average attempts per problem: {context['weakest_avg_attempts']}
    - Learning cluster: {context['cluster']}
    - Difficulty level: {context['difficulty_performance']}

    Generate the following in a structured format:

    1. PROGRESSIVE QUESTIONS: 3 practice questions on {context['weakest_topic']} 
    (Easy → Medium → Hard) with expected approach hints

    2. TRAP QUESTION: 1 tricky question that tests common misconceptions 
    in {context['weakest_topic']}

    3. COMMON MISTAKES: Top 3 mistakes students make in {context['weakest_topic']}

    4. LEARNING ROADMAP: A 3-step weekly plan to improve {context['weakest_topic']}
    from {context['weakest_accuracy']*100:.1f}% to 80%+ accuracy
    """

def generate_adaptive_content(user_id):
    context = get_user_context(user_id)
    if context is None:
        return f"couldn't find data for user {user_id}"
    
    prompt = build_prompt(context)
    
    try:
        response = client.models.generate_content(
            model="gemini-2.5-flash",
            contents=prompt
        )
        return response.text
    except Exception as e:
        return f"error calling gemini: {e}"

if __name__ == "__main__":
    response = generate_adaptive_content(user_id=1)
    print(response)