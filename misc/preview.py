
from utils import load_file
import argparse, os


def main(filename, folder):
    unquote = load_file(os.path.join(folder, filename))
    print(unquote.get_html())


if __name__ == "__main__":
    argparser = argparse.ArgumentParser(description="Clear processed emails by removing replies.")
    argparser.add_argument("-f", "--filename", type=str, help="Filename of the processed email to check.", required=True)
    argparser.add_argument("--folder", type=str, default="../process", help="Folder containing processed emails.", required=False)

    args = argparser.parse_args()
    main(args.filename, args.folder)
