import os
from yt_dlp import YoutubeDL

# A few South African / Cape Town creators to use for dummy profiles
channels = [
    {"name": "Nadia Jaftha", "url": "https://www.youtube.com/@nadiajaftha6820/shorts"},
    {"name": "Kay Yarms", "url": "https://www.youtube.com/@KayYarms/shorts"},
    {"name": "Cool Story Bru", "url": "https://www.youtube.com/@coolstorybru/shorts"}
]

base_save_dir = "/home/iedrees/Downloads/CapeTown_Dummy_Profiles"
os.makedirs(base_save_dir, exist_ok=True)

# Path to Deno (Required to bypass YouTube's bot protection as per your setup)
deno_path = os.path.expanduser("~/.deno/bin/deno")

for channel in channels:
    save_dir = os.path.join(base_save_dir, channel["name"].replace(" ", "_"))
    os.makedirs(save_dir, exist_ok=True)
    
    print(f"\n--- Scraping {channel['name']} ---")

    ydl_opts = {
        "format": "bv*+ba/b", 
        "outtmpl": os.path.join(
            save_dir,
            "%(playlist_index)s - %(title).150s.%(ext)s"
        ),
        "cookiefile": "/home/iedrees/Downloads/cookies.txt",
        "download_archive": os.path.join(save_dir, "downloaded.txt"),
        "merge_output_format": "mp4",
        "ignoreerrors": True,
        "playlistend": 10, # Limiting to 10 videos as requested
        
        # --- REQUIRED TO FIX YOUTUBE BOT PROTECTION ---
        "js_runtimes": {"deno": {"path": deno_path}},
    }

    try:
        with YoutubeDL(ydl_opts) as ydl:
            ydl.download([channel["url"]]) 
    except Exception as e:
        print(f"Error downloading for {channel['name']}: {e}")

print("\nDone downloading dummy content!")
