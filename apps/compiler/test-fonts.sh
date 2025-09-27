#!/bin/bash
echo "Testing font availability in container..."
echo ""

echo "=== Font Cache Status ==="
fc-cache -v

echo ""
echo "=== Available Fonts ==="
fc-list | head -10

echo ""
echo "=== Custom Fonts ==="
ls -la /usr/share/fonts/custom/ || echo "Custom fonts directory not found"

echo ""
echo "=== DejaVu Fonts ==="
ls -la /usr/share/fonts/dejavu/ || echo "DejaVu fonts not found"

echo ""
echo "=== Test FFmpeg Font Loading ==="
ffmpeg -f lavfi -i "color=c=black:s=320x240:d=1" -vf "drawtext=text='Test':fontfile=/usr/share/fonts/custom/Arial.ttf:fontcolor=white:fontsize=24:x=10:y=10" -y /tmp/font_test.mp4 2>&1 | head -20

echo ""
echo "Font test complete!"
