"""
生成专利技术交底书助手Chrome扩展图标
需要安装: pip install Pillow
"""

from PIL import Image, ImageDraw, ImageFont
import os

def create_icon(size):
    """创建指定尺寸的图标"""
    # 创建透明背景
    img = Image.new('RGBA', (size, size), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)

    # 颜色定义
    blue = '#3498db'
    blue_dark = '#2980b9'
    white = '#ffffff'
    gray = '#bdc3c7'
    green = '#27ae60'

    # 转换颜色
    def hex_to_rgb(hex_color):
        hex_color = hex_color.lstrip('#')
        return tuple(int(hex_color[i:i+2], 16) for i in (0, 2, 4))

    blue_rgb = hex_to_rgb(blue)
    blue_dark_rgb = hex_to_rgb(blue_dark)
    white_rgb = hex_to_rgb(white)
    gray_rgb = hex_to_rgb(gray)
    green_rgb = hex_to_rgb(green)

    # 计算缩放比例
    scale = size / 128

    # 绘制背景圆形
    margin = int(4 * scale)
    draw.ellipse([margin, margin, size - margin, size - margin],
                 fill=blue_rgb)

    # 绘制文档背景
    doc_x = int(32 * scale)
    doc_y = int(24 * scale)
    doc_w = int(64 * scale)
    doc_h = int(88 * scale)
    radius = int(4 * scale)

    # 绘制圆角矩形
    draw.rounded_rectangle([doc_x, doc_y, doc_x + doc_w, doc_y + doc_h],
                          radius=radius, fill=white_rgb + (230,))

    # 绘制文档折角
    fold_size = int(16 * scale)
    if size >= 32:
        fold_points = [
            (doc_x + doc_w - fold_size, doc_y),
            (doc_x + doc_w, doc_y + fold_size),
            (doc_x + doc_w - fold_size, doc_y + fold_size)
        ]
        draw.polygon(fold_points, fill=blue_dark_rgb)

    # 绘制专利符号圆圈
    circle_radius = int(16 * scale)
    circle_center = (size // 2, int(58 * scale))
    if size >= 32:
        draw.ellipse([
            circle_center[0] - circle_radius,
            circle_center[1] - circle_radius,
            circle_center[0] + circle_radius,
            circle_center[1] + circle_radius
        ], outline=blue_rgb, width=int(3 * scale))

    # 绘制字母P
    if size >= 32:
        font_size = int(20 * scale)
        try:
            font = ImageFont.truetype("arial.ttf", font_size)
        except:
            font = ImageFont.load_default()

        text = "P"
        # 获取文本边界框
        bbox = draw.textbbox((0, 0), text, font=font)
        text_width = bbox[2] - bbox[0]
        text_height = bbox[3] - bbox[1]

        text_x = circle_center[0] - text_width // 2
        text_y = circle_center[1] - text_height // 2 - int(2 * scale)
        draw.text((text_x, text_y), text, fill=blue_rgb, font=font)

    # 绘制文本行
    line_y_start = int(82 * scale)
    line_spacing = int(8 * scale)
    line_height = int(2 * scale)

    for i in range(3):
        line_y = line_y_start + i * line_spacing
        line_width = doc_w - int(16 * scale)
        if i == 2:
            line_width = int(32 * scale)
        draw.line([
            doc_x + int(8 * scale),
            line_y,
            doc_x + int(8 * scale) + line_width,
            line_y
        ], fill=gray_rgb + (200,), width=line_height)

    # 绘制认证印章
    if size >= 48:
        seal_center = (int(100 * scale), int(100 * scale))
        seal_radius = int(16 * scale)
        draw.ellipse([
            seal_center[0] - seal_radius,
            seal_center[1] - seal_radius,
            seal_center[0] + seal_radius,
            seal_center[1] + seal_radius
        ], fill=green_rgb)

        # 绘制对勾
        checkmark_thickness = int(3 * scale)
        checkmark_points = [
            (seal_center[0] - int(8 * scale), seal_center[1]),
            (seal_center[0] - int(2 * scale), seal_center[1] + int(6 * scale)),
            (seal_center[0] + int(8 * scale), seal_center[1] - int(6 * scale))
        ]
        draw.line([checkmark_points[0], checkmark_points[1]],
                 fill=white_rgb, width=checkmark_thickness)
        draw.line([checkmark_points[1], checkmark_points[2]],
                 fill=white_rgb, width=checkmark_thickness)

    return img

def main():
    """生成所有尺寸的图标"""
    icons_dir = os.path.dirname(os.path.abspath(__file__))
    sizes = [16, 32, 48, 128]

    print("Generating icon files...")

    for size in sizes:
        icon = create_icon(size)
        filename = os.path.join(icons_dir, f'icon{size}.png')
        icon.save(filename, 'PNG')
        print(f"[OK] Generated: {filename}")

    print("\nAll icons generated successfully!")
    print("\nIcon overview:")
    print("  - icon16.png: 16x16 pixels - Browser extension bar")
    print("  - icon32.png: 32x32 pixels - Extension management page")
    print("  - icon48.png: 48x48 pixels - Extension management page")
    print("  - icon128.png: 128x128 pixels - Chrome Web Store")

if __name__ == '__main__':
    main()
