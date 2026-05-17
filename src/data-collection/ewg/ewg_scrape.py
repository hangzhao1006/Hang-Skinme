# -*- coding: utf-8 -*-
"""
EWG Skin Deep > Face Category Crawler (Safe Version)
- robots.txt check + Crawl-delay parsing
- Single concurrency, rate limiting (base delay + jitter + exponential backoff)
- 429/503/5xx retry; respecting Retry-After
- Automatic pagination; product page resume crawling (state file)
- Key data saved: INGREDIENT CONCERNS and LABEL INFORMATION (text + HTML)

Dependencies:
pip install requests beautifulsoup4 lxml pandas tqdm tenacity

Example usage:
python crawl_ewg_face_safe.py \
  --category https://www.ewg.org/skindeep/browse/category/Face/ \
  --out_jsonl ewg_face.jsonl \
  --out_csv ewg_face.csv \
  --state ewg_urls.json \
  --base_delay 2.5 \
  --max_pages 10 \
  --max_products 300
"""
import re
import os
import time
import json
import argparse
import random
from typing import Dict, List, Optional, Tuple

import pandas as pd
import requests
from bs4 import BeautifulSoup, Tag
from tqdm import tqdm
from urllib import robotparser
from urllib.parse import urlparse
from bs4 import NavigableString
from urllib.parse import urljoin


SESSION = requests.Session()
SESSION.headers.update(
    {
        "User-Agent": (
            "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) "
            "AppleWebKit/537.36 (KHTML, like Gecko) "
            "Chrome/120.0.0.0 Safari/537.36"
        ),
        "Accept-Language": "en-US,en;q=0.8,zh-CN;q=0.6",
        "Cache-Control": "no-cache",
    }
)

BASE = "https://www.ewg.org"

# 当为 True 时，遇到 403/被判定为 WAF 的页面将快速放弃（不做长时间退避）
WAF_FAST_GIVEUP = False
# WAF 最长等待时间（秒）。若为 None 则不限制（默认行为），可从 CLI 覆盖。
MAX_WAF_WAIT: Optional[int] = None


def looks_like_waf(text: str) -> bool:
    """简单启发式检测 WAF / 反爬 页面文本。
    返回 True 表示页面很可能是防火墙/验证页面（应触发长退避）。
    检测要点：常见关键字（access denied / captcha / cloudflare / please enable
    javascript / are you human / unusual traffic / blocked 等），
    以及 <title> 中的提示。
    """
    if not text:
        return False
    try:
        low = text.lower()
    except Exception:
        return False

    waf_signals = [
        "access denied",
        "please enable javascript",
        "cloudflare",
        "bot detection",
        "are you human",
        "captcha",
        "request blocked",
        "our systems have detected unusual traffic",
        "security check",
        "verification",
        "denied",
        "blocked",
    ]

    for sig in waf_signals:
        if sig in low:
            return True

    # title 中的提示也可能表明是防火墙页面
    m = re.search(r"<title[^>]*>(.*?)</title>", text, re.I | re.S)
    if m:
        try:
            title = m.group(1).lower()
            for sig in waf_signals:
                if sig in title:
                    return True
        except Exception:
            pass

    return False


def sleep_safely(base_delay: float, backoff: int = 0):
    """基础延时 + 抖动 + 指数退避"""
    jitter = random.uniform(0, base_delay * 0.4)
    delay = base_delay + jitter
    if backoff > 0:
        delay *= 2 ** min(backoff, 5)  # 上限 32x
    time.sleep(delay)


def parse_robots_and_check(start_url: str, ua: str) -> float:
    """
    读取 robots.txt，检查是否允许抓取；返回 crawl_delay（若未给出则 0）
    """
    root = f"{urlparse(start_url).scheme}://{urlparse(start_url).netloc}"
    robots_url = urljoin(root, "/robots.txt")
    r = SESSION.get(robots_url, timeout=20)
    r.raise_for_status()
    content = r.text

    # 1) 让 robotparser 负责 allow/disallow
    rp = robotparser.RobotFileParser()
    rp.parse(content.splitlines())
    if not rp.can_fetch(ua, start_url):
        raise SystemExit(f"[ABORT] robots.txt 禁止抓取此路径：{start_url}")

    # 2) 尝试解析 Crawl-delay（robotparser 标准库不暴露该字段）
    crawl_delay = 0.0
    ua_block = None
    blocks = re.split(r"(?i)\nUser-agent:\s*", "\n" + content)
    # 选择最匹配的 UA 段（先精确后 *）
    for blk in blocks:
        head = blk.strip().splitlines()[:1]
        if not head:
            continue
        agent = head[0].strip()
        if agent and (agent == "*" or agent.lower() in ua.lower()):
            ua_block = blk
            if agent != "*":
                break
    if ua_block:
        m = re.search(r"(?i)Crawl-delay:\s*([\d\.]+)", ua_block)
        if m:
            crawl_delay = float(m.group(1))
    return crawl_delay


def respectful_get(url: str, base_delay: float, backoff: int = 0) -> requests.Response:
    """
    带限速/退避/429-503/403处理；检测到 WAF 文案就指数退避。
    """
    # 减少最大尝试次数，遇到持续的 403/429/503 时更快放弃单一 URL
    max_attempts = 3
    attempt = 0
    while True:
        sleep_safely(base_delay, backoff + attempt)
        resp = SESSION.get(url, timeout=30)

        # 429/503：尊重 Retry-After
        if resp.status_code in (429, 503):
            ra = resp.headers.get("Retry-After")
            if ra and ra.isdigit():
                wait = int(ra)
            else:
                wait = int(base_delay * (4 + attempt))
            print(f"[throttle] {resp.status_code} Retry-After={wait}s @ {url[:90]}...")
            time.sleep(wait)
            attempt += 1
        elif resp.status_code == 403 or looks_like_waf(resp.text):
            # 403/WAF：记录响应供人工分析，然后根据配置选择快速放弃或长退避
            try:
                with open("waf_debug.html", "ab") as f:
                    f.write(b"\n\n--- URL: " + url.encode() + b" ---\n")
                    f.write(resp.content or b"")
            except Exception:
                pass

            if WAF_FAST_GIVEUP:
                print(f"[waf_fast] 403/WAF fast giveup @ {url[:90]}")
                attempt = max_attempts
            else:
                wait = int(base_delay * (8 + attempt * 2))
                # 应用最大等待上限（若设置）
                if MAX_WAF_WAIT is not None:
                    wait = min(wait, int(MAX_WAF_WAIT))
                print(f"[waf] 403/WAF wait {wait}s @ {url[:90]}...")
                time.sleep(wait)
                attempt += 1
        else:
            resp.raise_for_status()
            return resp

        if attempt >= max_attempts:
            print(f"[giveup] after {attempt} attempts @ {url[:90]}")
            resp.raise_for_status()
            return resp


def get_soup(url: str, base_delay: float, backoff: int = 0) -> BeautifulSoup:
    r = respectful_get(url, base_delay, backoff)
    return BeautifulSoup(r.text, "lxml")


def absolute_url(base: str, href: str) -> str:
    return urljoin(base, href)


def find_next_page(soup: BeautifulSoup, current_url: Optional[str] = None) -> Optional[str]:
    """
    尝试查找下一页链接：
    1) 优先使用 rel="next" 或文本包含 next/下一页 的链接
    2) 若未找到，尝试分析分页数字链接（例如 page=2 或 /page/2），并用当前页号+1 推导下一页 URL
    返回完整的下一页 URL 或 None
    """
    # 1) rel="next" 或文本匹配
    a = soup.find("a", rel=lambda v: v and "next" in v.lower())
    if a and a.get("href"):
        return absolute_url(BASE, a["href"])
    for a in soup.select("a"):
        txt = a.get_text(" ", strip=True).lower()
        if "next" in txt or "下一页" in txt:
            href = a.get("href")
            if href:
                return absolute_url(BASE, href)

    # 2) 尝试数字分页推导（page= 或 /page/N）
    # 收集所有可能的分页链接
    candidates = []
    for a in soup.select("a[href]"):
        href = a.get("href") or ""
        if re.search(r"page=\d+", href) or re.search(r"/page/\d+", href) or re.search(r"\bpage-?\d+\b", href):
            candidates.append(absolute_url(BASE, href))

    if candidates:
        # 解析当前页号
        cur = 1
        if current_url:
            m = (
                re.search(r"page=(\d+)", current_url)
                or re.search(r"/page/(\d+)", current_url)
                or re.search(r"page-?(\d+)", current_url)
            )
            if m:
                try:
                    cur = int(m.group(1))
                except Exception:
                    cur = 1

        next_num = cur + 1
        for c in candidates:
            if re.search(r"page=\d+", c):
                next_try = re.sub(r"page=\d+", f"page={next_num}", c)
                return next_try
            if re.search(r"/page/\d+", c):
                next_try = re.sub(r"/page/\d+", f"/page/{next_num}", c)
                return next_try
            if re.search(r"page-?\d+", c):
                next_try = re.sub(r"page-?\d+", f"page-{next_num}", c)
                return next_try

    return None


def parse_category_page(url: str, base_delay: float) -> Tuple[List[str], Optional[str]]:
    soup = get_soup(url, base_delay)
    product_links = []
    for a in soup.select("a[href*='/skindeep/products/']"):
        href = a.get("href") or ""
        if re.search(r"/skindeep/products/\d+-", href):
            product_links.append(absolute_url(BASE, href))
    product_links = sorted(list(set(product_links)))
    next_url = find_next_page(soup, current_url=url)
    return product_links, next_url


def _sidebar_block(soup: BeautifulSoup) -> Tag:
    for blk in soup.find_all(True):
        txt = blk.get_text(" ", strip=True)
        if re.search(r"\bWHERE TO BUY\b", txt, re.I):
            return blk
    return soup


def _pick_from_sidebar(soup: BeautifulSoup, label_patterns) -> Optional[str]:
    sidebar = _sidebar_block(soup)
    if isinstance(label_patterns, str):
        label_patterns = [label_patterns]
    pats = [re.compile(p, re.I) for p in label_patterns]

    def is_label(text: str) -> bool:
        return any(p.search((text or "").strip()) for p in pats)

    cand = []
    for node in sidebar.find_all(True):
        text = node.get_text(" ", strip=True)
        if is_label(text):
            cand.append(node)
    if not cand:
        return None

    label_node = cand[0]

    for sib in label_node.next_siblings:
        if isinstance(sib, NavigableString):
            if sib.strip():
                return sib.strip()
            continue
        if not isinstance(sib, Tag):
            continue
        a = sib.find("a")
        if a and a.get_text(strip=True):
            return a.get_text(strip=True)
        t = sib.get_text(" ", strip=True)
        if t and not is_label(t):
            return t

    parent = label_node.parent
    if parent:
        for sib in parent.next_siblings:
            if isinstance(sib, Tag):
                a = sib.find("a")
                if a and a.get_text(strip=True):
                    return a.get_text(strip=True)
                t = sib.get_text(" ", strip=True)
                if t and not is_label(t):
                    return t
    return None


def _extract_where_to_buy(soup: BeautifulSoup) -> dict:
    sidebar = _sidebar_block(soup)

    all_urls: List[str] = []
    buy_button_urls: List[str] = []
    has_site = False

    for a in sidebar.select("a[href]"):
        href = a.get("href")
        if not href:
            continue
        url = urljoin(BASE, href)
        all_urls.append(url)
        if re.search(r"\bwebsite\b", a.get_text(" ", strip=True), re.I):
            has_site = True
    buy_button_elements = sidebar.select("a.btn")
    if not buy_button_elements:
        buy_button_elements = sidebar.select("a[class*='btn']")

    for btn_el in buy_button_elements:
        href = btn_el.get("href")
        if href:
            buy_button_urls.append(urljoin(BASE, href))

    if not has_site:
        for u in buy_button_urls:
            try:
                parsed = urlparse(u)
                if parsed.netloc and "ewg.org" not in parsed.netloc:
                    has_site = True
                    break
            except Exception:
                continue

    all_urls = list(dict.fromkeys(all_urls))
    buy_button_urls = list(dict.fromkeys(buy_button_urls))

    return {
        "where_to_buy_urls": all_urls,
        "has_website_button": has_site,
        "buy_button_urls": buy_button_urls,
    }


def save_state(path: str, obj: dict):
    tmp = path + ".tmp"
    with open(tmp, "w", encoding="utf-8") as f:
        json.dump(obj, f, ensure_ascii=False, indent=2)
    os.replace(tmp, path)


def load_state(path: str) -> dict:
    if not path or not os.path.exists(path):
        return {}
    with open(path, "r", encoding="utf-8") as f:
        return json.load(f)


def _collect_section(soup: BeautifulSoup, title_en: str) -> Dict[str, str]:
    title_pat = re.compile(rf"^{re.escape(title_en)}\b", re.I)
    header = None
    for tag in soup.find_all(["h2", "h3", "h4"]):
        if title_pat.search(tag.get_text(" ", strip=True)):
            header = tag
            break
    if not header:
        tab = soup.select_one(f"a[href*='{title_en.lower().replace(' ', '-')[:12]}']")
        if tab:
            target = tab.get("href", "").lstrip("#")
            sec = soup.find(id=target)
            if sec:
                return {"text": sec.get_text(" ", strip=True), "html": str(sec)}
        return {}
    parts_html, parts_text = [], []
    for el in header.next_siblings:
        if isinstance(el, Tag) and el.name in ["h2", "h3", "h4"]:
            break
        if isinstance(el, Tag):
            parts_html.append(str(el))
            parts_text.append(el.get_text(" ", strip=True))
    return {"text": " ".join(parts_text).strip(), "html": "\n".join(parts_html).strip()}


def parse_basic_meta(soup: BeautifulSoup) -> Dict:
    """右栏精确取 Brand/Category/更新时间，EWG VERIFIED 粗判"""
    data = {}
    h1 = soup.find("h1") or soup.find("h2")
    data["title"] = h1.get_text(" ", strip=True) if h1 else None

    data["brand"] = _pick_from_sidebar(soup, [r"^\s*BRAND\s*$", r"品牌"])
    data["category"] = _pick_from_sidebar(soup, [r"^\s*CATEGORY\s*$", r"^Category$", r"类别"])

    category_link_element = soup.select_one("div.product-lower > a:nth-of-type(2)")
    if category_link_element:
        data["category"] = category_link_element.get_text(" ", strip=True)
        data["category_url"] = urljoin(BASE, category_link_element.get("href", ""))
    else:
        data["category"] = None
        data["category_url"] = None

    data.update(_extract_where_to_buy(soup))
    return data


def parse_product_page(
    url: str,
    base_delay: float,
    save_ingredient_pages: bool = False,
    max_ingredient_pages: int = 0,
) -> Dict:
    soup = get_soup(url, base_delay)
    basic = parse_basic_meta(soup)
    original_url = url

    where_to_buy_info = {
        "has_website_button": basic.get("has_website_button"),
        "where_to_buy_urls": basic.get("where_to_buy_urls"),
        "buy_button_urls": basic.get("buy_button_urls", []),
    }

    label_section = soup.select_one("section#label-information")
    label_information_text = label_section.get_text(" ", strip=True) if label_section else ""
    label_information_html = str(label_section) if label_section else ""

    ingredient_concerns_html = ""
    try:
        els = soup.select("*[class*='concern']")
        found = False
        for el in els:
            if el.name == "li":
                parent = el.find_parent(["ul", "ol"])
                if parent:
                    ingredient_concerns_html = str(parent)
                    found = True
                    break
            elif el.name in ["ul", "ol"]:
                ingredient_concerns_html = str(el)
                found = True
                break
            else:
                if el.find("li"):
                    ingredient_concerns_html = str(el)
                    found = True
                    break
                if el.find(["p", "h2", "h3"]) or (
                    el.get_text(" ", strip=True) and len(el.get_text(" ", strip=True)) > 30
                ):
                    ingredient_concerns_html = str(el)
                    found = True
                    break

        if not found:
            hdr_pat = re.compile(r"ingredient.*concern", re.I)
            header = None
            for tag in soup.find_all(["h2", "h3", "h4"]):
                if hdr_pat.search(tag.get_text(" ", strip=True)):
                    header = tag
                    break
            if header:
                parts = []
                for el in header.next_siblings:
                    if isinstance(el, Tag) and el.name in ["h2", "h3", "h4"]:
                        break
                    if isinstance(el, Tag):
                        parts.append(str(el))
                if parts:
                    ingredient_concerns_html = "".join(parts)
                    found = True

        if not found:
            for ul in soup.find_all(["ul", "ol"]):
                lis = ul.find_all("li")
                if not lis:
                    continue
                ok = False
                for li in lis:
                    txt = li.get_text(" ", strip=True)
                    if re.search(r"\b(high|moderate|low)\b", txt, re.I) or re.search(r"concern", txt, re.I):
                        ok = True
                        break
                if ok:
                    ingredient_concerns_html = str(ul)
                    found = True
                    break
    except Exception:
        ingredient_concerns_html = ""

    sidebar = _sidebar_block(soup)

    all_urls = []
    buy_button_urls = []

    for a in sidebar.select("a[href]"):
        href = a.get("href")
        if not href:
            continue
        link = urljoin(BASE, href)
        all_urls.append(link)

    buy_button_elements = sidebar.select("a.btn")
    if not buy_button_elements:
        buy_button_elements = sidebar.select("a[class*='btn']")

    for btn_el in buy_button_elements:
        href = btn_el.get("href")
        if href:
            buy_button_urls.append(urljoin(BASE, href))

    ingredient_concerns_section = soup.select_one("section.ingredient-concerns")

    ingredient_concerns_text = None
    ingredient_concerns_html = None

    if ingredient_concerns_section:
        ingredient_concerns_text = ingredient_concerns_section.get_text(" ", strip=True)
        ingredient_concerns_html = str(ingredient_concerns_section)

    result = {
        "url": original_url,
        "title": basic.get("title"),
        "category": basic.get("category"),
        "brand": basic.get("brand"),
        "label_information_text": label_information_text,
        "label_information_html": label_information_html,
        "ingredient_concerns_text": ingredient_concerns_text,
        "ingredient_concerns_html": ingredient_concerns_html,
        "has_website_button": where_to_buy_info.get("has_website_button"),
        "where_to_buy_urls": where_to_buy_info.get("where_to_buy_urls"),
        "buy_button_urls": where_to_buy_info.get("buy_button_urls", []),
    }

    try:
        ing_links = []
        for a in soup.select("a[href*='/skindeep/ingredients/']"):
            href = a.get("href") or ""
            if not href:
                continue
            full = urljoin(BASE, href)
            ing_links.append(full)
        seen = set()
        ingredient_links = []
        for u in ing_links:
            if u not in seen:
                seen.add(u)
                ingredient_links.append(u)
    except Exception:
        ingredient_links = []

    result["ingredient_links"] = ingredient_links

    ingredient_pages = []
    if save_ingredient_pages and max_ingredient_pages and ingredient_links:
        for u in ingredient_links[:max_ingredient_pages]:
            try:
                r = respectful_get(u, base_delay)
                ingredient_pages.append({"url": u, "html": r.text})
            except Exception:
                continue
    if ingredient_pages:
        result["ingredient_pages"] = ingredient_pages

    return result


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--category", required=True)
    ap.add_argument("--out_jsonl", default="ewg_face.jsonl")
    ap.add_argument("--out_csv", default="ewg_face.csv")
    ap.add_argument("--state", default="ewg_face.state.json")
    ap.add_argument(
        "--base_delay",
        type=float,
        default=2.5,
        help="base delay between requests in seconds (before jitter and backoff)",
    )
    ap.add_argument("--max_pages", type=int, default=0, help="max pages to scrape (0=unlimited)")
    ap.add_argument(
        "--force_pages",
        type=int,
        default=0,
        help="force pagination (e.g. --force_pages 1576 scrapes from page=1 to page=1576), 0 means disable",
    )
    ap.add_argument(
        "--page_param",
        type=str,
        default="page",
        help="page parameter name (default 'page', constructs ?page=N or &page=N",
    )
    ap.add_argument(
        "--start_page",
        type=int,
        default=1,
        help="start page (default 1)",
    )
    ap.add_argument("--max_products", type=int, default=0, help="max products to scrape (0=unlimited)")
    ap.add_argument(
        "--save-ingredient-pages",
        action="store_true",
        help="optionally save ingredient pages HTML",
    )
    ap.add_argument(
        "--max-ingredient-pages",
        type=int,
        default=5,
        help="every product scraped, max ingredient pages to fetch (only if --save-ingredient-pages is set)",
    )
    ap.add_argument(
        "--waf-fast-giveup",
        action="store_true",
        help="when encountering 403/WAF, give up quickly instead of long backoff",
    )
    ap.add_argument(
        "--max_waf_wait",
        type=int,
        default=120,
        help="WAF max wait time in seconds (0 means no limit)",
    )
    ap.add_argument(
        "--keep-skipped",
        action="store_true",
        help="Keep skipped URLs in links/state for future retries (do not mark as done)",
    )
    args = ap.parse_args()

    #  CLI option applied to global vars
    global WAF_FAST_GIVEUP
    WAF_FAST_GIVEUP = bool(args.waf_fast_giveup)
    global MAX_WAF_WAIT
    # CLI 0 denotes no limit
    MAX_WAF_WAIT = (
        None if (getattr(args, "max_waf_wait", None) is None or args.max_waf_wait == 0) else int(args.max_waf_wait)
    )

    # robots check
    crawl_delay = parse_robots_and_check(args.category, SESSION.headers["User-Agent"])
    # max(base_delay, crawl_delay)
    base_delay = max(args.base_delay, crawl_delay or 0.0)
    print(f"[robots] Crawl-delay={crawl_delay or 0}；实际 base_delay={base_delay}")

    state = load_state(args.state)
    done = set(state.get("done_urls", []))
    # skipped_urls: URLs that were previously skipped/given-up but we may want to retry later
    skipped_set = set(state.get("skipped_urls", []))
    links_cached = state.get("links", [])

    links: List[str] = links_cached
    if not links:
        print("[1/3] collecting product links from category...")
        pages = 0

        def build_page_url(base_url: str, p: int) -> str:
            if "?" in base_url:
                return f"{base_url}&{args.page_param}={p}"
            else:
                return f"{base_url}?{args.page_param}={p}"

        if args.force_pages and args.force_pages > 0:
            # 强制按数字页抓取，从 1 到 force_pages
            for p in range(1, args.force_pages + 1):
                if args.max_pages and pages >= args.max_pages:
                    print(f"[INFO] 达到 max_pages={args.max_pages}，停止翻页")
                    break
                page_url = build_page_url(args.category, p)
                try:
                    products, _ = parse_category_page(page_url, base_delay)
                except Exception as e:
                    print(f"[WARN] 访问分页 {page_url} 失败：{e}")
                    break
                for u in products:
                    if u not in links:
                        links.append(u)
                pages += 1
                save_state(
                    args.state,
                    {"links": links, "done_urls": list(done), "skipped_urls": list(skipped_set), "page_count": pages},
                )
            print(f"发现产品链接：{len(links)}")
        else:
            url = args.category
            while url:
                if args.max_pages and pages >= args.max_pages:
                    print(f"[INFO] 达到 max_pages={args.max_pages}，停止翻页")
                    break
                products, next_url = parse_category_page(url, base_delay)
                for u in products:
                    if u not in links:
                        links.append(u)
                pages += 1
                url = next_url
                save_state(
                    args.state,
                    {"links": links, "done_urls": list(done), "skipped_urls": list(skipped_set), "page_count": pages},
                )
            print(f"发现产品链接：{len(links)}")
    else:
        print(f"[1/3] 使用 state 中的链接：{len(links)}")

    # 2) 抓取详情
    print("[2/3] 抓取产品详情...")

    remaining = [u for u in links if u not in done]
    random.shuffle(remaining)  # 避免连续打到同一品牌/CDN
    rows = []
    bar = tqdm(total=len(remaining), desc="products")
    processed = 0
    last_heartbeat = time.time()

    for url in remaining:
        # max_products 逻辑：done + 本轮新增 >= 上限 就停
        if args.max_products and (len(done) + len(rows)) >= args.max_products:
            print(f"[INFO] 达到 max_products={args.max_products}，提前停止")
            break

        backoff = 0
        while True:
            try:
                row = parse_product_page(url, base_delay)
                rows.append(row)
                # 成功抓取的 URL 仍然视为 done
                done.add(url)
                with open(args.out_jsonl, "a", encoding="utf-8") as f:
                    f.write(json.dumps(row, ensure_ascii=False) + "\n")
                save_state(
                    args.state,
                    {
                        "links": links,
                        "done_urls": list(done),
                        "skipped_urls": list(skipped_set),
                        "page_count": state.get("page_count", 0),
                    },
                )
                bar.update(1)
                processed += 1
                break

            except requests.HTTPError as e:
                code = getattr(e.response, "status_code", None)
                if code in (429, 503, 403):
                    # 对 429/503/403（节流或 WAF）实行有限次数重试，超过次数则放弃并跳过该 URL
                    backoff += 1
                    if backoff > 2 or (code == 403 and WAF_FAST_GIVEUP):
                        print(f"[giveup_http] HTTP {code} after {backoff} attempts, 跳过：{url}")
                        # 根据 CLI 选项决定是否把跳过的 URL 标为 done
                        if not getattr(args, "keep_skipped", False):
                            done.add(url)
                        else:
                            skipped_set.add(url)
                        bar.update(1)
                        break
                    wait = base_delay * (4 + backoff if code != 403 else 8 + backoff)
                    print(f"[retry] HTTP {code} wait {int(wait)}s @ {url[:90]}...")
                    time.sleep(wait)
                    continue
                print(f"[WARN] HTTP {code} 跳过：{url}")
                if not getattr(args, "keep_skipped", False):
                    done.add(url)
                else:
                    skipped_set.add(url)
                bar.update(1)
                break

            except Exception as e:
                backoff += 1
                if backoff <= 3:
                    wait = base_delay * (2**backoff)
                    print(f"[retry] {type(e).__name__} wait {int(wait)}s @ {url[:90]}...")
                    time.sleep(wait)
                    continue
                print(f"[WARN] 解析失败 跳过：{url} -> {e}")
                if not getattr(args, "keep_skipped", False):
                    done.add(url)
                else:
                    skipped_set.add(url)
                bar.update(1)
                break

        # 每 60 秒打一条心跳，告诉你没卡死
        if time.time() - last_heartbeat > 60:
            print(f"[heartbeat] processed={processed}, done_total={len(done)}/{len(links)}")
            last_heartbeat = time.time()

    bar.close()

    # 3) 汇总 CSV（从 JSONL 读，避免重复内存）
    print("[3/3] 生成 CSV...")
    all_rows: List[Dict] = []
    if os.path.exists(args.out_jsonl):
        with open(args.out_jsonl, "r", encoding="utf-8") as f:
            for line in f:
                try:
                    all_rows.append(json.loads(line))
                except (json.JSONDecodeError, ValueError):
                    # 忽略无效或损坏的 JSON 行
                    continue
    if rows:  # 加入本轮新抓的（避免仅 JSONL）
        all_rows.extend(rows)
    # 去重（过滤掉 None 或 非 dict 的记录，确保每条记录至少有 url）
    uniq = {}
    for r in all_rows:
        if not isinstance(r, dict):
            # 跳过空行或无效 JSON 解析结果
            continue
        url_val = r.get("url")
        if not url_val:
            # 有些旧/损坏条目可能没有 url，跳过它们
            continue
        uniq[url_val] = r
    pd.DataFrame(list(uniq.values())).to_csv(args.out_csv, index=False, encoding="utf-8")
    print(f"完成：{args.out_jsonl} / {args.out_csv}；state：{args.state}")
    print("小贴士：若需要更慢更稳，调大 --base_delay 并设置 --max_pages / --max_products 做分批抓取。")


if __name__ == "__main__":
    main()
