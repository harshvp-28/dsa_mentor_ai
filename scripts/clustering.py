import pandas as pd
from sklearn.cluster import KMeans
from sklearn.preprocessing import StandardScaler
import matplotlib.pyplot as plt

def load_features():
    features_df = pd.read_csv("data/features.csv")
    user_ids = features_df['user_id']
    X = features_df.drop('user_id', axis=1)
    return user_ids, X

def find_optimal_k(X_scaled):
    inertias = []
    K_range = range(1, 9)
    
    for k in K_range:
        kmeans = KMeans(n_clusters=k, random_state=42, n_init=10)
        kmeans.fit(X_scaled)
        inertias.append(kmeans.inertia_)
    
    plt.figure(figsize=(10, 6))
    plt.plot(K_range, inertias, 'bo-')
    plt.xlabel('Number of Clusters (K)')
    plt.ylabel('Inertia')
    plt.title('Elbow Method for Optimal K')
    plt.grid(True, alpha=0.3)
    plt.savefig("data/elbow_plot.png")
    plt.show()
    
    return inertias

def apply_clustering(X_scaled, k=3):
    kmeans = KMeans(n_clusters=k, random_state=42, n_init=10)
    cluster_labels = kmeans.fit_predict(X_scaled)
    return cluster_labels

def main():
    print("Loading features...")
    user_ids, X = load_features()
    print(f"Loaded {len(user_ids)} users with {X.shape[1]} features")
    
    print("\nScaling features...")
    scaler = StandardScaler()
    X_scaled = scaler.fit_transform(X)
    
    print("\nFinding optimal K with elbow method...")
    inertias = find_optimal_k(X_scaled)
    
    print("\nInertia values:")
    for k, inertia in enumerate(inertias, 1):
        print(f"  K={k}: {inertia:.2f}")
    
    print("\nApplying KMeans with K=3...")
    cluster_labels = apply_clustering(X_scaled, k=3)
    
    clusters_df = pd.DataFrame({
        'user_id': user_ids,
        'cluster': cluster_labels
    })
    clusters_df.to_csv("data/clusters.csv", index=False)
    print(f"\nSaved cluster assignments to data/clusters.csv")
    
    print("\nCluster distribution:")
    print(clusters_df['cluster'].value_counts().sort_index())

if __name__ == "__main__":
    main()