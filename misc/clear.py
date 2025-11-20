"""
Opens the folder ../process and process all the files available there.
If we find a reply in that email, we remove it (except if dry-mode is True).

This helps remove all the similar files once we have implemented a fix.
"""
from utils import load_file
from bs4 import BeautifulSoup
import os, argparse


def main(folder, dry_mode=False, clear=True):
    for filename in os.listdir(folder):
        if filename.startswith('.'):
            continue

        filepath = os.path.join(folder, filename)
        unquote = load_file(filepath)

        if unquote.parse() and not unquote.is_html_quote_found:
            """
            .parse() returned true, so it means it was able to find the reply.
            But if quote_found was found, it means we found a clas with the name *quote* in it,
                but the filtering by class name didn't worked, so we don't delete that file.
            """
            print('Deleting file:', filename)
            if not dry_mode:
                os.remove(filepath)

        if unquote.is_html_quote_found and not clear:
            # Found a "*quote*" class in the HTML data
            print('Quote found via class name in file:', filename)
            with open(filepath, 'r', encoding='utf-8') as file:
                data = file.read()
                soup = BeautifulSoup(data, 'html.parser')
                print(soup.prettify())
                return

        if unquote.is_no_patterns_found and not clear:
            # No regex pattern matched the text
            print('-' * 40)
            print('No patterns found in file:', filename)
            if unquote.get_html():
                print(unquote.get_html())
            else:
                print(unquote.get_text())
            print('')

            # ask if delete via prompt
            response = input("Do you want to delete this file? (y/n): ")
            if response.lower() == 'y':
                if not dry_mode:
                    os.remove(filepath)
            else:
                return


if __name__ == "__main__":
    argparser = argparse.ArgumentParser(description="Clear processed emails by removing replies.")
    argparser.add_argument("--folder", type=str, default="../process", help="Folder containing processed emails.", required=False)
    argparser.add_argument("--dry-mode", action="store_true", help="If set, do not actually modify files.")
    argparser.add_argument("-c", "--clear", action="store_true", help="Don't stop at the first error, but remove all the matching files.")

    args = argparser.parse_args()
    main(args.folder, dry_mode=args.dry_mode, clear=args.clear)
