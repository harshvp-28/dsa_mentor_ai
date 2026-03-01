import requests
import pandas as pd

URL = "https://leetcode.com/graphql"

TOPIC_MAPPING = {
    "Array": "Arrays",
    "String": "Strings",
    "Dynamic Programming": "DP",
    "Tree": "Trees",
    "Binary Tree": "Trees",
    "Binary Search Tree": "Trees",
    "Graph": "Graphs",
    "Depth-First Search": "Graphs",
    "Breadth-First Search": "Graphs",
    "Shortest Path": "Graphs",
    "Topological Sort": "Graphs",
    "Union-Find": "Graphs",
    "Recursion": "Recursion",
    "Backtracking": "Recursion",
    "Divide and Conquer": "Recursion",
    "Stack": "Stack/Queue",
    "Monotonic Stack": "Stack/Queue",
    "Queue": "Stack/Queue",
    "Monotonic Queue": "Stack/Queue",
    "Binary Search": "Binary Search",
}


def fetch_complete_profile(username):
    # Create fresh session every time
    session = requests.Session()

    try:
        session.get(
            "https://leetcode.com",
            headers={"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"}
        )
    except Exception as e:
        print(f"Failed to get CSRF token: {e}")
        return None

    csrf_token = session.cookies.get("csrftoken", "")

    query = """
    query userProfile($username: String!) {
      matchedUser(username: $username) {
        username
        submitStats {
          acSubmissionNum {
            difficulty
            count
            submissions
          }
        }
        tagProblemCounts {
          fundamental { tagName problemsSolved }
          intermediate { tagName problemsSolved }
          advanced { tagName problemsSolved }
        }
      }
    }
    """

    headers = {
        "Content-Type": "application/json",
        "Referer": "https://leetcode.com",
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
        "x-csrftoken": csrf_token,
    }

    try:
        response = session.post(
            URL,
            json={"query": query, "variables": {"username": username}},
            headers=headers
        )

        print(f"Status: {response.status_code}")

        if response.status_code != 200:
            print(f"Error: {response.text[:200]}")
            return None

        data = response.json()

        if "errors" in data:
            print(f"GraphQL Error: {data['errors']}")
            return None

        if not data.get("data") or not data["data"].get("matchedUser"):
            print(f"User '{username}' not found")
            return None

        return data["data"]["matchedUser"]

    except Exception as e:
        print(f"Exception: {e}")
        return None


def build_feature_vector(username):
    print(f"Fetching profile for: {username}")
    profile = fetch_complete_profile(username)

    if not profile:
        return None

    problems_df = pd.read_csv("data/problems.csv")

    difficulty_stats = {}
    for item in profile["submitStats"]["acSubmissionNum"]:
        diff = item["difficulty"]
        difficulty_stats[diff] = {"solved": item["count"], "submissions": item["submissions"]}

    all_tags = []
    all_tags.extend(profile["tagProblemCounts"]["fundamental"])
    all_tags.extend(profile["tagProblemCounts"]["intermediate"])
    all_tags.extend(profile["tagProblemCounts"]["advanced"])

    topic_solved = {}
    for tag in all_tags:
        tag_name = tag["tagName"]
        if tag_name in TOPIC_MAPPING:
            mapped = TOPIC_MAPPING[tag_name]
            topic_solved[mapped] = topic_solved.get(mapped, 0) + tag["problemsSolved"]

    total_solved = difficulty_stats.get("All", {}).get("solved", 0)
    easy_acc = difficulty_stats["Easy"]["solved"] / difficulty_stats["Easy"]["submissions"] if difficulty_stats.get("Easy", {}).get("submissions", 0) > 0 else 0
    medium_acc = difficulty_stats["Medium"]["solved"] / difficulty_stats["Medium"]["submissions"] if difficulty_stats.get("Medium", {}).get("submissions", 0) > 0 else 0
    hard_acc = difficulty_stats["Hard"]["solved"] / difficulty_stats["Hard"]["submissions"] if difficulty_stats.get("Hard", {}).get("submissions", 0) > 0 else 0

    feature_vector = {
        "username": username,
        "total_solved": total_solved,
        "easy_solved": difficulty_stats.get("Easy", {}).get("solved", 0),
        "medium_solved": difficulty_stats.get("Medium", {}).get("solved", 0),
        "hard_solved": difficulty_stats.get("Hard", {}).get("solved", 0),
        "easy_accuracy": round(easy_acc, 3),
        "medium_accuracy": round(medium_acc, 3),
        "hard_accuracy": round(hard_acc, 3),
    }

    topics_list = ["Arrays", "Strings", "DP", "Trees", "Graphs", "Recursion", "Stack/Queue", "Binary Search"]
    for topic in topics_list:
        solved = topic_solved.get(topic, 0)
        available = problems_df[problems_df["topic"] == topic].shape[0]
        topic_acc = min(solved / available, 1.0) if available > 0 else 0
        key = topic.lower().replace("/", "_").replace(" ", "_")
        feature_vector[f"{key}_solved"] = solved
        feature_vector[f"{key}_accuracy"] = round(topic_acc, 3)

    return feature_vector


if __name__ == "__main__":
    features = build_feature_vector("neal_wu")
    if features:
        print("\n" + "=" * 60)
        print(f"FEATURE VECTOR FOR {features['username']}")
        print("=" * 60)
        for key, value in features.items():
            if key != "username":
                print(f"  {key:35} {value}")
    else:
        print("Failed to fetch data")