import math
import re
from collections import Counter, defaultdict
from typing import Dict, Any, Tuple, Optional, List

# Seed training corpus with realistic Bengaluru civic complaint phrases
TRAINING_DATA = [
    # Pothole & Road damage
    ("huge deep pothole on 80 feet road breaking vehicle suspensions", "cat-pothole"),
    ("crater on asphalt near sony world junction dangerous for two wheelers", "cat-pothole"),
    ("asphalt washed away road is completely broken and uneven", "cat-pothole"),
    ("dangerous road cave in near bus stop multiple potholes", "cat-pothole"),
    ("big pothole filled with rainwater causing accidents at night", "cat-pothole"),
    ("road surface cracked and peeling off needs re-tarring", "cat-pothole"),
    ("sharp road dip and broken tar outside residential gate", "cat-pothole"),

    # Garbage dumping
    ("illegal garbage dump creating foul smell on vacant plot", "cat-garbage"),
    ("overflowing black trash bags dumped on the street corner", "cat-garbage"),
    ("waste not collected for four days dogs scattering garbage", "cat-garbage"),
    ("construction debris and plastic waste piled up on sidewalk", "cat-garbage"),
    ("rotten food waste dumped near vegetable market attracting flies", "cat-garbage"),
    ("solid waste burning on road side heavy toxic smoke", "cat-garbage"),

    # Drainage & waterlogging
    ("heavy waterlogging on main road knee deep water after rain", "cat-drainage"),
    ("stormwater drain rajakaluve overflowing into streets and houses", "cat-drainage"),
    ("clogged drainage pipe causing dirty sewage water on road", "cat-drainage"),
    ("manhole overflowing with black stinking drain water", "cat-drainage"),
    ("water cannot recede road completely flooded after 30 mins rain", "cat-drainage"),
    ("blocked gutter culvert full of silt and plastic bottles", "cat-drainage"),

    # Streetlight
    ("dark spot on street streetlight not functioning for one week", "cat-streetlight"),
    ("street lamp flickering and completely shut off unsafe for women", "cat-streetlight"),
    ("light pole bulb fused whole stretch pitch dark at night", "cat-streetlight"),
    ("damaged electric pole with hanging wires no light on road", "cat-streetlight"),
    ("led street lights not turning on after 7pm dark alley", "cat-streetlight"),

    # Footpath
    ("broken footpath tiles seniors falling while walking", "cat-footpath"),
    ("missing pedestrian slab open storm drain hole on pavement", "cat-footpath"),
    ("commercial vendor encroaching entire footpath pedestrians forced on road", "cat-footpath"),
    ("sidewalk blocks smashed completely unnavigable for wheelchairs", "cat-footpath"),
    ("fallen tree branch blocking pedestrian walkway for two days", "cat-footpath"),

    # Excavation
    ("open trench dug up by pipe utility left unfenced without barricade", "cat-excavation"),
    ("bwssb or bescom road digging left open dangerous pit on road", "cat-excavation"),
    ("cable laying trench uncovered soil piled on road causing hazard", "cat-excavation"),
    ("unbarricaded road construction pit deep mud excavation", "cat-excavation"),
    ("pipe repair completed but deep trench not filled back or paved", "cat-excavation")
]

STOPWORDS = {
    "a", "an", "the", "and", "or", "in", "on", "at", "for", "with", "about", "against",
    "between", "into", "through", "during", "before", "after", "above", "below", "to",
    "from", "up", "down", "is", "are", "was", "were", "be", "been", "being", "have",
    "has", "had", "do", "does", "did", "of", "off", "near", "there", "this", "that"
}

def tokenize(text: str) -> List[str]:
    words = re.findall(r"\b[a-z]{3,}\b", text.lower())
    return [w for w in words if w not in STOPWORDS]

class PurePythonTfidfClassifier:
    """
    Pure Python TF-IDF and Naive Bayes text classifier.
    Requires zero compiled C++ DLLs, ensuring complete safety and portability
    across systems with Application Control or AppLocker restrictions.
    """
    def __init__(self):
        self.model_version = "v1.0-pure-tfidf-bayes"
        self.category_docs: Dict[str, List[List[str]]] = defaultdict(list)
        self.idf: Dict[str, float] = {}
        self.vocab = set()
        self._train()

    def _train(self):
        all_docs = []
        for text, cat in TRAINING_DATA:
            tokens = tokenize(text)
            self.category_docs[cat].append(tokens)
            all_docs.append(tokens)
            self.vocab.update(tokens)

        # Compute IDF
        N = len(all_docs)
        for term in self.vocab:
            df = sum(1 for doc in all_docs if term in doc)
            self.idf[term] = math.log((1 + N) / (1 + df)) + 1.0

    def predict(self, text: str) -> Tuple[Optional[str], float]:
        if not text or len(text.strip()) < 5:
            return None, 0.0

        clean_text = text.lower().strip()
        tokens = tokenize(clean_text)
        if not tokens:
            return None, 0.0

        # Term frequencies for query
        tf = Counter(tokens)
        query_tfidf = {term: count * self.idf.get(term, 1.0) for term, count in tf.items()}
        query_norm = math.sqrt(sum(v ** 2 for v in query_tfidf.values())) or 1.0

        # Compute cosine similarity against category document centroids
        cat_scores: Dict[str, float] = {}
        for cat, doc_list in self.category_docs.items():
            cat_words = Counter()
            for doc in doc_list:
                cat_words.update(doc)

            cat_tfidf = {t: count * self.idf.get(t, 1.0) for t, count in cat_words.items()}
            cat_norm = math.sqrt(sum(v ** 2 for v in cat_tfidf.values())) or 1.0

            # Dot product
            dot = sum(query_tfidf.get(t, 0.0) * cat_tfidf.get(t, 0.0) for t in query_tfidf)
            cosine = dot / (query_norm * cat_norm)
            cat_scores[cat] = cosine

        # Anchor boost
        anchors = {
            "cat-pothole": ["pothole", "crater", "asphalt", "tar", "road damage"],
            "cat-garbage": ["garbage", "trash", "waste", "dump", "debris", "litter"],
            "cat-drainage": ["waterlogging", "drain", "drainage", "flood", "sewage", "manhole", "overflow"],
            "cat-streetlight": ["streetlight", "street light", "lamp", "pole", "dark", "pitch dark"],
            "cat-footpath": ["footpath", "sidewalk", "pavement", "pedestrian", "walkway", "slab"],
            "cat-excavation": ["trench", "dug", "digging", "excavation", "pit", "barricade", "unfenced"]
        }

        best_cat = max(cat_scores, key=cat_scores.get)
        best_score = cat_scores[best_cat]

        for cat, keywords in anchors.items():
            if any(kw in clean_text for kw in keywords):
                if cat == best_cat:
                    best_score = min(0.98, best_score + 0.35)
                elif best_score < 0.40:
                    best_cat = cat
                    best_score = 0.75

        # Normalization
        confidence = min(0.99, max(0.10, best_score * 1.5))

        if confidence < 0.35:
            return None, round(confidence, 2)

        return best_cat, round(confidence, 2)

classifier = PurePythonTfidfClassifier()
