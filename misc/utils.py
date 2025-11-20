from mailparse import EmailDecode
import sys, os

# add the path ../unquotemail
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from unquotemail import Unquote


class ProcessUnquote(Unquote):
    def __init__(self, **kwargs):
        super().__init__(**kwargs)
        self.is_no_patterns_found = False
        self.is_html_quote_found = False

    def quote_found(self, data):
        self.is_html_quote_found = True

    def no_patterns_found(self, text):
        """
        This function is called when no regex pattern matched the text, and this after the HTML based parsing failed.
        In a nutshell, this means we were not able to find any clue that this email contained a reply, which might be a possibility.
        """
        self.is_no_patterns_found = True


def load_file(file_path):
    with open(file_path, 'r', encoding='utf-8') as file:
        if file_path.endswith('.html'):
            decode = {'html': file.read(), 'text': None}
        elif file_path.endswith('.txt'):
            decode = {'html': None, 'text': file.read()}
        else:
            decode = EmailDecode.load(file.read())

    return ProcessUnquote(html=decode.get('html'), text=decode.get('text'), parse=False)
