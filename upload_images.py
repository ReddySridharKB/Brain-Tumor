import requests
import sys

def upload(file_path):
    url = "https://catbox.moe/user/api.php"
    with open(file_path, "rb") as f:
        files = {"fileToUpload": f}
        data = {"reqtype": "fileupload"}
        res = requests.post(url, data=data, files=files)
        print(res.text)

for file in sys.argv[1:]:
    upload(file)
