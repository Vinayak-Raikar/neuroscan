import base64
import io

import cv2
import numpy as np
from PIL import Image
from flask import Flask, render_template, request, jsonify

app = Flask(__name__)
app.config["MAX_CONTENT_LENGTH"] = 10 * 1024 * 1024   # 10 MB upload limit

SIZE = 256
ALLOWED = (".jpg", ".jpeg", ".png", ".bmp", ".tif", ".tiff")


def to_gray(file_bytes):
    """Read uploaded bytes as an 8-bit grayscale image (handles TIF, BMP, 16-bit, colour)."""
    data = np.frombuffer(file_bytes, dtype=np.uint8)
    img = cv2.imdecode(data, cv2.IMREAD_UNCHANGED)
    if img is None:
        try:
            img = np.array(Image.open(io.BytesIO(file_bytes)).convert("L"))
        except Exception:
            return None
    if img.ndim == 3:
        code = cv2.COLOR_BGRA2GRAY if img.shape[2] == 4 else cv2.COLOR_BGR2GRAY
        img = cv2.cvtColor(img, code)
    if img.dtype != np.uint8:
        img = cv2.normalize(img, None, 0, 255, cv2.NORM_MINMAX).astype(np.uint8)
    return img


def analyze(img, min_ratio):
    img = cv2.resize(img, (SIZE, SIZE))
    blur = cv2.GaussianBlur(img, (5, 5), 0)
    empty = np.zeros_like(img)

    # 1. Find the brain area, then shrink it to drop skull edges
    _, th = cv2.threshold(blur, 0, 255, cv2.THRESH_BINARY + cv2.THRESH_OTSU)
    contours, _ = cv2.findContours(th, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
    if not contours:
        return img, empty, 0.0, False
    c = max(contours, key=cv2.contourArea)
    brain = np.zeros_like(img)
    cv2.drawContours(brain, [c], -1, 255, -1)
    inner = cv2.erode(brain, cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (15, 15)))
    brain_area = int((inner > 0).sum())
    if brain_area < 1000:
        return img, empty, 0.0, False

    # 2. Find unusually bright regions inside the brain
    vals = blur[inner > 0].astype(np.float32)
    thr = vals.mean() + 2.0 * vals.std()
    cand = ((blur > thr) & (inner > 0)).astype(np.uint8) * 255
    cand = cv2.morphologyEx(cand, cv2.MORPH_OPEN, np.ones((3, 3), np.uint8))
    cand = cv2.morphologyEx(cand, cv2.MORPH_CLOSE,
                            cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (7, 7)))

    # 3. Take the biggest bright region
    n, lab, stats, _ = cv2.connectedComponentsWithStats(cand)
    region = empty.copy()
    best_area = 0
    if n > 1:
        best = 1 + int(np.argmax(stats[1:, cv2.CC_STAT_AREA]))
        best_area = int(stats[best, cv2.CC_STAT_AREA])
        region = (lab == best).astype(np.uint8) * 255

    ratio = best_area / brain_area
    tumor = ratio >= min_ratio and best_area >= 150
    return img, region, ratio, tumor


def to_data_uri(img):
    ok, buf = cv2.imencode(".png", img)
    return "data:image/png;base64," + base64.b64encode(buf).decode("utf-8")


@app.route("/")
def home():
    return render_template("index.html")


@app.route("/analyze", methods=["POST"])
def analyze_route():
    file = request.files.get("image")
    if file is None or file.filename == "":
        return jsonify(error="Please choose an image first."), 400
    if not file.filename.lower().endswith(ALLOWED):
        return jsonify(error="Unsupported file type. Use JPG, PNG, BMP or TIF."), 400

    try:
        min_percent = float(request.form.get("min_percent", 1.0))
    except ValueError:
        min_percent = 1.0
    min_ratio = min(max(min_percent, 0.2), 10.0) / 100.0

    gray = to_gray(file.read())
    if gray is None:
        return jsonify(error="Could not read that image. Try another file."), 400

    img, region, ratio, tumor = analyze(gray, min_ratio)

    overlay = cv2.cvtColor(img, cv2.COLOR_GRAY2BGR)
    if tumor:
        cnts, _ = cv2.findContours(region, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
        cv2.drawContours(overlay, cnts, -1, (0, 0, 255), 2)      # red outline (BGR)

    return jsonify(
        tumor=bool(tumor),
        verdict="Tumor-like region found" if tumor else "No tumor-like region found",
        ratio=round(ratio * 100, 2),
        original=to_data_uri(img),
        region=to_data_uri(region),
        overlay=to_data_uri(overlay),
    )


@app.errorhandler(413)
def too_large(_):
    return jsonify(error="File too large (max 10 MB)."), 413


if __name__ == "__main__":
    app.run(debug=True)