import os
from PIL import Image, ImageSequence

def extract_frames(gif_path, output_dir, prefix):
    names = ["one", "two", "three", "four", "five", "six", "seven", "eight"]
    with Image.open(gif_path) as img:
        for i, frame in enumerate(ImageSequence.Iterator(img)):
            frame_path = os.path.join(output_dir, f"{prefix}-{names[i]}.png")
            frame.save(frame_path)
            print(f"Saved frame {i + 1} to {frame_path}")

def rename_frames(output_dir, prefix):
    rename_map = {
        "one": "8",
        "two": "1",
        "three": "2",
        "four": "3",
        "five": "4",
        "six": "5",
        "seven": "6",
        "eight": "7"
    }
    for old_name, new_name in rename_map.items():
        old_path = os.path.join(output_dir, f"{prefix}-{old_name}.png")
        new_path = os.path.join(output_dir, f"{prefix}-{new_name}.png")
        if os.path.exists(old_path):
            os.rename(old_path, new_path)
            print(f"Renamed {old_path} to {new_path}")

def main():
    gif_directory = '/Users/saoriuchida/suki_ran_away/sprites'
    output_directories = {
        'mochi': '/Users/saoriuchida/suki_ran_away/mochi',
        'nori': '/Users/saoriuchida/suki_ran_away/nori',
        'yaku': '/Users/saoriuchida/suki_ran_away/yaku',
        'ume': '/Users/saoriuchida/suki_ran_away/ume'
    }
    animations = [
        'run',
    ]

    for skin, output_dir in output_directories.items():
        for animation in animations:
            gif_file = f"{skin}_{animation}.gif"
            gif_path = os.path.join(gif_directory, gif_file)
            if os.path.exists(gif_path):
                prefix = animation
                extract_frames(gif_path, output_dir, prefix)
                rename_frames(output_dir, prefix)

if __name__ == "__main__":
    main()