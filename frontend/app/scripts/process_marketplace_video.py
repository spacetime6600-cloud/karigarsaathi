import subprocess
import os
import imageio_ffmpeg

ffmpeg = imageio_ffmpeg.get_ffmpeg_exe()
assets_dir = os.path.abspath('src/assets/ecosystem')
orig_video = os.path.join(assets_dir, 'marketplace-artisan-original.mp4')

desktop_mp4 = os.path.join(assets_dir, 'marketplace-artisan-desktop.mp4')
desktop_webm = os.path.join(assets_dir, 'marketplace-artisan-desktop.webm')
mobile_mp4 = os.path.join(assets_dir, 'marketplace-artisan-mobile.mp4')
poster_webp = os.path.join(assets_dir, 'marketplace-artisan-poster.webp')

# Video Filters:
# 1. eq: saturation=0.86, contrast=1.04, brightness=-0.02
# 2. colorbalance: shadows slightly shifted towards deep navy/blue, midtones slightly warmed towards cream
# 3. fade in from 0x001D36 (0.85s)
# 4. fade out to 0x001D36 (1.2s at 12.54s)
vf_desktop = (
    "eq=saturation=0.86:contrast=1.04:brightness=-0.02,"
    "colorbalance=rs=0.0:gs=0.01:bs=0.04:rm=0.02:gm=0.01:bm=-0.01:rh=-0.01:gh=0.0:bh=-0.02,"
    "fade=t=in:st=0:d=0.85:color=0x001D36,"
    "fade=t=out:st=12.54:d=1.2:color=0x001D36"
)

# 1. Desktop H.264 MP4 (under 5MB, no audio, faststart)
print("Encoding Desktop MP4...")
cmd_desktop_mp4 = [
    ffmpeg, '-y',
    '-i', orig_video,
    '-vf', vf_desktop,
    '-an', # Remove audio track
    '-c:v', 'libx264',
    '-crf', '25',
    '-preset', 'slow',
    '-pix_fmt', 'yuv420p',
    '-movflags', '+faststart',
    desktop_mp4
]
subprocess.run(cmd_desktop_mp4, check=True)

# 2. Desktop VP9 WebM (under 5MB, no audio)
print("Encoding Desktop WebM...")
cmd_desktop_webm = [
    ffmpeg, '-y',
    '-i', orig_video,
    '-vf', vf_desktop,
    '-an', # Remove audio track
    '-c:v', 'libvpx-vp9',
    '-crf', '34',
    '-b:v', '0',
    '-pix_fmt', 'yuv420p',
    desktop_webm
]
subprocess.run(cmd_desktop_webm, check=True)

# 3. Mobile H.264 MP4 (960x540, under 2.5MB, no audio, faststart)
print("Encoding Mobile MP4...")
vf_mobile = (
    "scale=960:540:force_original_aspect_ratio=increase,crop=960:540,"
    "eq=saturation=0.86:contrast=1.04:brightness=-0.02,"
    "colorbalance=rs=0.0:gs=0.01:bs=0.04:rm=0.02:gm=0.01:bm=-0.01:rh=-0.01:gh=0.0:bh=-0.02,"
    "fade=t=in:st=0:d=0.85:color=0x001D36,"
    "fade=t=out:st=12.54:d=1.2:color=0x001D36"
)
cmd_mobile_mp4 = [
    ffmpeg, '-y',
    '-i', orig_video,
    '-vf', vf_mobile,
    '-an', # Remove audio track
    '-c:v', 'libx264',
    '-crf', '24',
    '-preset', 'slow',
    '-pix_fmt', 'yuv420p',
    '-movflags', '+faststart',
    mobile_mp4
]
subprocess.run(cmd_mobile_mp4, check=True)

# 4. Poster WebP (extracted at 2.0s with identical color grade)
print("Extracting Color-Graded Poster WebP...")
cmd_poster = [
    ffmpeg, '-y',
    '-ss', '00:00:02.000',
    '-i', orig_video,
    '-vf', (
        "eq=saturation=0.86:contrast=1.04:brightness=-0.02,"
        "colorbalance=rs=0.0:gs=0.01:bs=0.04:rm=0.02:gm=0.01:bm=-0.01:rh=-0.01:gh=0.0:bh=-0.02"
    ),
    '-vframes', '1',
    '-c:v', 'libwebp',
    '-quality', '88',
    poster_webp
]
subprocess.run(cmd_poster, check=True)

print("All optimized video derivatives generated successfully!")
for path in [orig_video, desktop_mp4, desktop_webm, mobile_mp4, poster_webp]:
    size_mb = os.path.getsize(path) / (1024 * 1024)
    print(f"- {os.path.basename(path)}: {size_mb:.2f} MB")
