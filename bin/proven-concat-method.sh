#!/bin/bash

# Proven Concatenation Method
# Based on the successful creation of final_all_messages.mp4
# Enhanced with custom waveform colors and guest name text

set -e

# Timeout function to kill long-running ffmpeg processes
run_with_timeout() {
    local timeout_duration=$1
    shift
    local command=("$@")
    
    echo "Running with ${timeout_duration}s timeout: ${command[*]}"
    
    # Run command in background
    "${command[@]}" &
    local pid=$!
    
    # Start timeout in background
    (
        sleep "$timeout_duration"
        if kill -0 "$pid" 2>/dev/null; then
            echo "⏰ TIMEOUT: Killing process $pid after ${timeout_duration}s"
            kill -TERM "$pid" 2>/dev/null || true
            sleep 2
            kill -KILL "$pid" 2>/dev/null || true
        fi
    ) &
    local timeout_pid=$!
    
    # Wait for the command to complete
    local exit_code=0
    wait "$pid" || exit_code=$?
    
    # Kill the timeout process
    kill "$timeout_pid" 2>/dev/null || true
    
    return $exit_code
}

MESSAGES_DIR="./messages"
OUTPUT_FILE="./final_proven.mp4"

echo "🎬 Proven Concatenation Method"
echo "=============================="
echo "This recreates the exact process that created final_all_messages.mp4"
echo ""

# Clean up any previous run files
echo "🧹 Cleaning up previous run files..."
rm -f temp_*.mp4 proven_concat_list.txt "$OUTPUT_FILE"
echo "✅ Cleanup complete"
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
echo "Step 1: Converting files to MP4 format (trimming black screens)..."
temp_files=()

# Convert video files with consistent parameters and guest name text
for i in "${!VIDEO_FILES[@]}"; do
    temp_file="temp_video_$((i+1)).mp4"
    
    # Get guest name from manifest.json for this video file
    video_filename=$(basename "${VIDEO_FILES[$i]}")
    GUEST_NAME=$(python3 -c "
import json
import sys
try:
    with open('messages/manifest.json', 'r') as f:
        data = json.load(f)
    for file_info in data['files']:
        if '$video_filename' in file_info['path']:
            print(file_info['guestName'])
            break
    else:
        print('Guest')
except:
    print('Guest')
")
    
    echo "  Converting $(basename "${VIDEO_FILES[$i]}") with guest name '$GUEST_NAME' (removing black frames)"
    
    # Use a more aggressive approach - detect the first non-black frame
    echo "    Detecting first non-black frame..."
    FIRST_FRAME=$(ffmpeg -i "${VIDEO_FILES[$i]}" -vf "blackdetect=d=0.01:pix_th=0.05" -f null - 2>&1 | \
                  grep "black_end:" | head -1 | sed 's/.*black_end:\([0-9.]*\).*/\1/' || echo "")
    
    if [ -z "$FIRST_FRAME" ] || [ "$FIRST_FRAME" = "" ]; then
        # If no black frames detected, try a more aggressive trim
        TRIM_START="0.2"
        echo "    No black frames detected, using aggressive trim: ${TRIM_START}s"
    else
        # Start from the end of the black period with a small buffer
        TRIM_START=$(python3 -c "print(max(0, $FIRST_FRAME + 0.05))")
        echo "    Black frames end at ${FIRST_FRAME}s, trimming from ${TRIM_START}s"
    fi
    
    ffmpeg -y -i "${VIDEO_FILES[$i]}" \
           -ss "$TRIM_START" \
           -vf "drawtext=text='$GUEST_NAME':fontcolor=#B34A6B:fontsize=44:x=(w-text_w)/2:y=h-80:shadowcolor=black@0.6:shadowx=2:shadowy=2" \
           -c:v libx264 -c:a aac -preset fast -crf 23 \
           -r 25 -video_track_timescale 25000 -avoid_negative_ts make_zero \
           "$temp_file" 2>/dev/null
    
    # Verify the temp video file was created correctly
    if [ -f "$temp_file" ]; then
        temp_duration=$(ffprobe -v quiet -show_entries format=duration -of csv=p=0 "$temp_file" 2>/dev/null | cut -d. -f1)
        temp_size=$(du -h "$temp_file" | cut -f1)
        echo "    ✅ Created $temp_file (${temp_size}, ${temp_duration}s)"
    else
        echo "    ❌ Failed to create $temp_file"
    fi
    
    temp_files+=("$temp_file")
done

# Convert audio files to video with custom waveform and guest names
for i in "${!AUDIO_FILES[@]}"; do
    temp_file="temp_audio_$((i+1)).mp4"
    duration=$(ffprobe -v quiet -show_entries format=duration -of csv=p=0 "${AUDIO_FILES[$i]}" 2>/dev/null)
    
    # Get guest name from manifest.json for this audio file
    audio_filename=$(basename "${AUDIO_FILES[$i]}")
    GUEST_NAME=$(python3 -c "
import json
import sys
try:
    with open('messages/manifest.json', 'r') as f:
        data = json.load(f)
    for file_info in data['files']:
        if '$audio_filename' in file_info['path']:
            print(file_info['guestName'])
            break
    else:
        print('Guest')
except:
    print('Guest')
")
    
    echo "  Converting $(basename "${AUDIO_FILES[$i]}") to video with waveform and guest name '$GUEST_NAME' (${duration}s)"
    
    # For audio files, use a more aggressive trim
    AUDIO_TRIM_START="0.1"
    echo "    Trimming audio from ${AUDIO_TRIM_START}s"
    
    run_with_timeout 30 ffmpeg -y -i "${AUDIO_FILES[$i]}" \
           -f lavfi -i "color=c=#FFFAF9:s=640x480" -r 25 \
           -ss "$AUDIO_TRIM_START" \
           -filter_complex "[0:a]showwaves=size=640x480:colors=#B34A6B:mode=line[vout];[1:v][vout]overlay=format=auto:shortest=1,format=yuv420p[v];[v]drawtext=text='$GUEST_NAME':fontcolor=#B34A6B:fontsize=44:x=(w-text_w)/2:y=h-80:shadowcolor=black@0.6:shadowx=2:shadowy=2[vfinal]" \
           -map "[vfinal]" -map 0:a \
           -c:v libx264 -c:a aac -preset fast -crf 23 \
           -r 25 -video_track_timescale 25000 -avoid_negative_ts make_zero \
           "$temp_file" 2>/dev/null
    
    # Verify the temp audio file was created correctly
    if [ -f "$temp_file" ]; then
        temp_duration=$(ffprobe -v quiet -show_entries format=duration -of csv=p=0 "$temp_file" 2>/dev/null | cut -d. -f1)
        temp_size=$(du -h "$temp_file" | cut -f1)
        echo "    ✅ Created $temp_file (${temp_size}, ${temp_duration}s)"
    else
        echo "    ❌ Failed to create $temp_file"
    fi
           
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

ffmpeg -y -f concat -safe 0 -i "$concat_list" \
       -c:v copy -c:a copy \
       -avoid_negative_ts make_zero \
       -fflags +genpts \
       "$OUTPUT_FILE"

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
    
    # Clean up (but keep temp files for debugging)
    echo ""
    echo "Cleaning up temporary files (keeping temp files for debugging)..."
    rm -f "$concat_list"
    echo "✅ Cleanup complete"
    echo ""
    echo "🔍 Temp files kept for debugging:"
    for temp_file in temp_*.mp4; do
        if [ -f "$temp_file" ]; then
            file_size=$(du -h "$temp_file" | cut -f1)
            duration=$(ffprobe -v quiet -show_entries format=duration -of csv=p=0 "$temp_file" 2>/dev/null | cut -d. -f1)
            echo "  - $temp_file (${file_size}, ${duration}s)"
        fi
    done
    echo ""
    echo "💡 To clean up temp files later: rm -f temp_*.mp4"
    
else
    echo "❌ FAILED to create output"
    exit 1
fi
