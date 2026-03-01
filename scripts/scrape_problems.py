import requests
import csv
import time
import os

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
    "Union-Find":"Graphs",
    
    "Recursion": "Recursion",
    "Backtracking": "Recursion",
    "Divide and Conquer": "Recursion",

    "Stack": "Stack/Queue",
    "Monotonic Stack": "Stack/Queue",
    "Queue": "Stack/Queue",
    "Monotonic Queue": "Stack/Queue",
    
    "Binary Search": "Binary Search",
}


def fetch_problems(limit=100, skip=0):
    """Fetch a batch of problems from LeetCode GraphQL API"""
    query = f"""
    query {{
      problemsetQuestionListV2(
        categorySlug: ""
        limit: {limit}
        skip: {skip}
      ) {{
        questions {{
          questionFrontendId
          title
          titleSlug
          difficulty
          topicTags {{
            name
          }}
        }}
      }}
    }}
    """
    try:
        response = requests.post(URL, json={"query": query})
        data = response.json()

        if "errors" in data:
            print(f"API Error: {data['errors']}")
            return []

        return data["data"]["problemsetQuestionListV2"]["questions"]

    except Exception as e:
        print(f"Request failed: {e}")
        return []


def map_topic(leetcode_tags):
    tag_names = [tag["name"] for tag in leetcode_tags]
    
    # Check specific topics first before generic ones
    priority_order = [
        "Dynamic Programming", "Binary Search", "Sliding Window",
        "Binary Search Tree", "Monotonic Stack", "Monotonic Queue",
        "Topological Sort", "Union-Find", "Divide and Conquer",
        "Backtracking", "Recursion", "Stack", "Queue", "Tree",
        "Binary Tree", "Depth-First Search", "Breadth-First Search",
        "Graph", "String", "Array"
    ]
    
    for priority_tag in priority_order:
        if priority_tag in tag_names and priority_tag in TOPIC_MAPPING:
            return TOPIC_MAPPING[priority_tag]
    
    return None


def save_to_csv(problems, filename="data/problems.csv"):
    """Save final problem list to CSV"""
    os.makedirs(os.path.dirname(filename), exist_ok=True)
    with open(filename, 'w', newline='', encoding='utf-8') as file:
        writer = csv.writer(file)
        writer.writerow(["questionId", "title", "titleSlug", "difficulty", "topic"])
        for problem in problems:
            writer.writerow([
                problem["questionFrontendId"],
                problem["title"],
                problem["titleSlug"],
                problem["difficulty"],
                problem["topic"]
            ])
    print(f"\nSaved {len(problems)} problems to {filename}")


def main():
    all_raw = []
    print("Fetching problems from LeetCode...")
    print("-" * 50)

    # Fetch up to 4000 problems in batches of 100
    for skip in range(0, 4000, 100):
        print(f"Fetching batch skip={skip} (problems {skip+1} to {skip+100})...")
        batch = fetch_problems(limit=100, skip=skip)

        if not batch:
            print("  Batch failed or empty. Stopping.")
            break

        all_raw.extend(batch)
        print(f"  Got {len(batch)} problems")
        time.sleep(1)  # Be nice to the API

    print(f"\nTotal raw problems fetched: {len(all_raw)}")

    # Increased bucket size to 500 to keep all problems
    topic_buckets = {topic: [] for topic in set(TOPIC_MAPPING.values())}

    for problem in all_raw:
        topic = map_topic(problem["topicTags"])
        if topic :  # Increased cap
            problem["topic"] = topic
            topic_buckets[topic].append(problem)

    print("\nBreakdown by topic:")
    print("-" * 30)
    final_problems = []
    for topic, problems in topic_buckets.items():
        print(f"  {topic}: {len(problems)} problems")
        final_problems.extend(problems)

    print(f"\nTotal balanced problems: {len(final_problems)}")

    if final_problems:
        save_to_csv(final_problems)
    else:
        print("No problems to save.")


if __name__ == "__main__":
    main()