import cv2
import numpy as np
import matplotlib.pyplot as plt
import tkinter as tk
from tkinter import filedialog, messagebox

SIZE = 256
MIN_RATIO = 0.01   # tumor region must be at least 1% of brain area (increase if too many false alarms)


def read_gray(path):
    data = np.fromfile(path, dtype=np.uint8)
    return cv2.imdecode(data, cv2.IMREAD_GRAYSCALE)


def analyze(img):

    img = cv2.resize(img, (SIZE, SIZE))
    blur = cv2.GaussianBlur(img, (5, 5), 0)

    # 1. Find the brain area (largest bright shape), then shrink it to drop skull edges
    _, th = cv2.threshold(blur, 0, 255, cv2.THRESH_BINARY + cv2.THRESH_OTSU)
    contours, _ = cv2.findContours(th, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
    if not contours:
        return img, np.zeros_like(img), np.zeros_like(img), 0.0, False
    c = max(contours, key=cv2.contourArea)
    brain = np.zeros_like(img)
    cv2.drawContours(brain, [c], -1, 255, -1)
    inner = cv2.erode(brain, cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (15, 15)))
    brain_area = int((inner > 0).sum())
    if brain_area < 1000:
        return img, brain, np.zeros_like(img), 0.0, False

    # 2. Find unusually bright regions inside the brain
    vals = blur[inner > 0].astype(np.float32)
    thr = vals.mean() + 2.0 * vals.std()
    cand = ((blur > thr) & (inner > 0)).astype(np.uint8) * 255
    cand = cv2.morphologyEx(cand, cv2.MORPH_OPEN, np.ones((3, 3), np.uint8))
    cand = cv2.morphologyEx(cand, cv2.MORPH_CLOSE,
                            cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (7, 7)))

    # 3. Take the biggest bright region
    n, lab, stats, _ = cv2.connectedComponentsWithStats(cand)
    region = np.zeros_like(img)
    best_area = 0
    if n > 1:
        best = 1 + int(np.argmax(stats[1:, cv2.CC_STAT_AREA]))
        best_area = int(stats[best, cv2.CC_STAT_AREA])
        region = (lab == best).astype(np.uint8) * 255

    ratio = best_area / brain_area
    tumor = ratio >= MIN_RATIO and best_area >= 150
    return img, brain, region, ratio, tumor


def show_result(path):
    gray = read_gray(path)
    if gray is None:
        messagebox.showerror("Error", "Could not read that image.")
        return

    img, brain, region, ratio, tumor = analyze(gray)

    overlay = cv2.cvtColor(img, cv2.COLOR_GRAY2RGB)
    if tumor:
        cnts, _ = cv2.findContours(region, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
        cv2.drawContours(overlay, cnts, -1, (255, 0, 0), 2)

    verdict = "TUMOR-LIKE REGION FOUND" if tumor else "NO TUMOR-LIKE REGION FOUND"
    print(f"Image: {path}")
    print(f"Bright region = {ratio * 100:.2f}% of brain area -> {verdict}")

    fig, axs = plt.subplots(1, 3, figsize=(12, 4.5))
    axs[0].imshow(img, cmap="gray");   axs[0].set_title("Uploaded image")
    axs[1].imshow(region, cmap="gray"); axs[1].set_title("Detected bright region")
    axs[2].imshow(overlay);            axs[2].set_title("Result (red = suspected tumor)")
    for a in axs:
        a.axis("off")
    fig.suptitle(f"{verdict}  (region = {ratio * 100:.1f}% of brain)",
color="red" if tumor else "green", fontweight="bold")
    fig.text(0.5, 0.02, "Learning project only - not a medical diagnosis", ha="center")
    plt.tight_layout()
    plt.show()


if __name__ == "__main__":
    root = tk.Tk()
    root.withdraw()
    root.attributes("-topmost", True)

    while True:
        path = filedialog.askopenfilename(
            title="Upload a brain MRI image",
            filetypes=[("Images", "*.jpg *.jpeg *.png *.bmp *.tif *.tiff"), ("All files", "*.*")])
        if not path:
            break
        show_result(path)
        if not messagebox.askyesno("Continue", "Check another image?"):
            break