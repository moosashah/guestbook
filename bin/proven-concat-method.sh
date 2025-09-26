#!/bin/bash

# Proven Concatenation Method
# Based on the successful creation of final_all_messages.mp4

set -e

MESSAGES_DIR="./messages"
OUTPUT_FILE="./final_proven.mp4"

echo "🎬 Proven Concatenation Method"
echo "=============================="
echo "This recreates the exact process that created final_all_messages.mp4"
echo ""

# Get files
VIDEO_FILES=($(find $MESSAGES_DIR -name "*.webm" | sort))
AUDIO_FILES=($(find $MESSAGES_DIR -name "*.wav" | sort))

echo "Found files:"
for file in "${VIDEO_FILES[@]}"; do
    duration=$(ffprobe -v quiet -show_entries format=duration -of csv=p=0 "$file" 2>/dev/null)
    echo "  VIDEO: $(basename "$file") (${duration}s)"
done
for file in "${AUDIO_FILES[@]}"; do
    duration=$(ffprobe -v quiet -show_entries format=duration -of csv=p=0 "$file" 2>/dev/null)
    echo "  AUDIO: $(basename "$file") (${duration}s)"
done
echo ""

# Step 1: Convert to consistent format
echo "Step 1: Converting files to MP4 format..."
temp_files=()

# Convert video files
for i in "${!VIDEO_FILES[@]}"; do
    temp_file="temp_video_$((i+1)).mp4"
    echo "  Converting $(basename "${VIDEO_FILES[$i]}")"
    ffmpeg -y -i "${VIDEO_FILES[$i]}" -c:v libx264 -c:a aac -preset fast -crf 23 "$temp_file" 2>/dev/null
    temp_files+=("$temp_file")
done

# Convert audio files to video with black screen
for i in "${!AUDIO_FILES[@]}"; do
    temp_file="temp_audio_$((i+1)).mp4"
    duration=$(ffprobe -v quiet -show_entries format=duration -of csv=p=0 "${AUDIO_FILES[$i]}" 2>/dev/null)
    echo "  Converting $(basename "${AUDIO_FILES[$i]}") to video (${duration}s)"
    ffmpeg -y -f lavfi -i "color=c=black:s=640x480:d=${duration}" -i "${AUDIO_FILES[$i]}" \
           -c:v libx264 -c:a aac -preset fast -crf 23 -shortest "$temp_file" 2>/dev/null
    temp_files+=("$temp_file")
done

echo "  ✅ Created ${#temp_files[@]} temporary files"
echo ""

# Step 2: Create concat list
echo "Step 2: Creating concatenation list..."
concat_list="proven_concat_list.txt"
rm -f "$concat_list"

for temp_file in "${temp_files[@]}"; do
    echo "file '$temp_file'" >> "$concat_list"
done

echo "Concatenation order:"
cat "$concat_list"
echo ""

# Step 3: Concatenate
echo "Step 3: Concatenating files..."
echo "Command: ffmpeg -y -f concat -safe 0 -i $concat_list -c copy $OUTPUT_FILE"
echo ""

ffmpeg -y -f concat -safe 0 -i "$concat_list" -c copy "$OUTPUT_FILE"

# Verify result
if [ -f "$OUTPUT_FILE" ]; then
    file_size=$(du -h "$OUTPUT_FILE" | cut -f1)
    duration=$(ffprobe -v quiet -show_entries format=duration -of csv=p=0 "$OUTPUT_FILE" 2>/dev/null | cut -d. -f1)
    
    echo ""
    echo "🎉 SUCCESS!"
    echo "  Output: $OUTPUT_FILE"
    echo "  Size: $file_size"
    echo "  Duration: ${duration}s"
    echo ""
    
    # Compare with original
    original_duration=$(ffprobe -v quiet -show_entries format=duration -of csv=p=0 "final_all_messages.mp4" 2>/dev/null | cut -d. -f1)
    echo "Comparison with original:"
    echo "  final_all_messages.mp4: ${original_duration}s"
    echo "  $OUTPUT_FILE: ${duration}s"
    
    if [ "$duration" = "$original_duration" ]; then
        echo "  ✅ Duration matches!"
    else
        echo "  ⚠️  Duration differs"
    fi
    
    # Clean up
    echo ""
    echo "Cleaning up temporary files..."
    rm -f temp_*.mp4 "$concat_list"
    echo "✅ Cleanup complete"
    
else
    echo "❌ FAILED to create output"
    exit 1
fi
