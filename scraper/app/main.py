from fastapi import FastAPI, UploadFile
from fastapi.middleware.cors import CORSMiddleware
import cv2
import numpy as np
import base64
import easyocr
import mediapipe as mp

app = FastAPI(title="Vision Microservice")

origins = ["https://your-nextjs-api.com"]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["POST"],
    allow_headers=["*"],
)

reader = easyocr.Reader(['en'], gpu=False)
_face_detector = mp.solutions.face_detection.FaceDetection(
    model_selection=0, min_detection_confidence=0.4
)

# --- Helper functions ---
def load_image(file):
    bytes_data = file.file.read()
    npimg = np.frombuffer(bytes_data, np.uint8)
    image = cv2.imdecode(npimg, cv2.IMREAD_COLOR)
    return image

def detect_faces(image):
    rgb = cv2.cvtColor(image, cv2.COLOR_BGR2RGB)
    results = _face_detector.process(rgb)
    faces = []
    if results.detections:
        h, w = image.shape[:2]
        for detection in results.detections:
            bbox = detection.location_data.relative_bounding_box
            x = int(bbox.xmin * w)
            y = int(bbox.ymin * h)
            fw = int(bbox.width * w)
            fh = int(bbox.height * h)
            faces.append({"x": x, "y": y, "w": fw, "h": fh})
    return faces

def cluster_rows(faces, threshold=80):
    rows = []
    for face in sorted(faces, key=lambda f: f["y"]):
        placed = False
        for row in rows:
            if abs(row[0]["y"] - face["y"]) < threshold:
                row.append(face)
                placed = True
                break
        if not placed:
            rows.append([face])
    return rows

def crop_card(face):
    return {
        "x": max(face["x"] - 80, 0),
        "y": max(face["y"] - 60, 0),
        "w": face["w"] + 160,
        "h": face["h"] + 350
    }

def extract_text(image):
    result = reader.readtext(image)
    words = []
    for (box, text, _conf) in (result or []):
        x = int(box[0][0])
        y = int(box[0][1])
        words.append({"text": text, "x": x, "y": y})
    return words

def find_name(words):
    def is_name_word(w):
        return w.replace("'", "").replace("-", "").isalpha() and (
            w.istitle() or w.isupper()
        )

    run = []
    for word_obj in words:
        if is_name_word(word_obj["text"]):
            run.append(word_obj["text"].title())
        else:
            if 2 <= len(run) <= 4:
                return " ".join(run)
            run = []
    if 2 <= len(run) <= 4:
        return " ".join(run)
    return "Unknown"

def crop_face(image, face):
    x, y, w, h = face["x"], face["y"], face["w"], face["h"]
    crop = image[y:y+h, x:x+w]
    _, buffer = cv2.imencode(".jpg", crop)
    return base64.b64encode(buffer).decode("utf-8")

# --- API endpoints ---
@app.post("/debug")
async def debug(file: UploadFile):
    image = load_image(file)
    faces = detect_faces(image)
    words = extract_text(image)
    return {"faces": faces, "words": words}

@app.post("/extract")
async def extract(file: UploadFile):
    image = load_image(file)
    faces = detect_faces(image)
    rows = cluster_rows(faces)
    people = []

    for row in rows:
        row.sort(key=lambda f: f["x"])
        for face in row:
            card = crop_card(face)
            x, y, w, h = card["x"], card["y"], card["w"], card["h"]
            card_img = image[y:y+h, x:x+w]
            words = extract_text(card_img)
            name = find_name(words)
            photo = crop_face(image, face)
            people.append({"name": name, "photo": photo})

    return {"people": people}
