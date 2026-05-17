import os
import httpx
import json
import time
import re
from bs4 import BeautifulSoup
from tqdm import tqdm
from urllib.parse import urljoin

BASE = "https://dermnetnz.org/topics"
DOMAIN = "https://dermnetnz.org"
OUT_DIR = "data/raw"
os.makedirs(OUT_DIR, exist_ok=True)


def scrape_links():
    """Collect all article links from the DermNet topics page."""
    r = httpx.get(BASE, timeout=20)
    soup = BeautifulSoup(r.text, "lxml")
    links = [urljoin(DOMAIN, a["href"]) for a in soup.select("a[href^='/topics/']")]
    # Deduplicate while preserving order
    return list(dict.fromkeys(links))


def clean_page(html):
    """Extract the title and main text from a single DermNet page."""
    soup = BeautifulSoup(html, "lxml")
    for tag in soup(["script", "style", "img", "figure", "aside", "footer", "nav"]):
        tag.decompose()
    title = soup.find("h1").get_text(strip=True) if soup.find("h1") else "untitled"
    text = " ".join(p.get_text(" ", strip=True) for p in soup.find_all("p"))
    return title, text


def main():
    links = scrape_links()[:20]  # limit for testing
    print(f"Scraping {len(links)} DermNet pages...")
    for url in tqdm(links):
        time.sleep(1)  # be polite to the server
        try:
            html = httpx.get(url, timeout=20).text
            title, text = clean_page(html)
            fn = re.sub(r"[^a-z0-9]+", "_", title.lower()).strip("_")
            record = {"id": f"dermnet-{fn}", "source": "dermnet", "title": title, "url": url, "text": text}
            with open(f"{OUT_DIR}/{fn}.json", "w", encoding="utf-8") as f:
                json.dump(record, f, ensure_ascii=False, indent=2)
        except Exception as e:
            print("Error scraping", url, e)


if __name__ == "__main__":
    main()
