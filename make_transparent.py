from PIL import Image

def make_transparent(input_path, output_path, tolerance=50):
    img = Image.open(input_path).convert("RGBA")
    data = img.getdata()

    new_data = []
    # Identify the background color (usually near top-left pixel)
    bg_color = data[0]

    for item in data:
        # Check if color is close to background color
        if (abs(item[0] - bg_color[0]) < tolerance and
            abs(item[1] - bg_color[1]) < tolerance and
            abs(item[2] - bg_color[2]) < tolerance):
            new_data.append((255, 255, 255, 0)) # Fully transparent
        else:
            new_data.append(item)

    img.putdata(new_data)
    img.save(output_path, "PNG")

make_transparent("frontend/public/logo.png", "frontend/public/logo_transparent.png", tolerance=60)
