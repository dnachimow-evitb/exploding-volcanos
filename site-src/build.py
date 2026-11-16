#!/usr/bin/env python3
"""Builds the story website's four pages from the fragments in this folder.

    python3 site-src/build.py

Writes story.html (the homepage), the-song.html, the-game.html and album.html at the top of the repository.
EDIT THE FRAGMENTS HERE (home.html, the-song.html, the-game.html, album.html), NEVER THE BUILT PAGES: they are
overwritten. The header, menu, side rail, footer and <head> live in this file, once, so the pages cannot drift.

Bump VERSION on every change. It is stamped into the stylesheet and script links and into every link between
pages, so a phone that saved an old copy still loads the current one (that bit us twice on 2026-11-16).
"""
import re
from pathlib import Path

VERSION = 16
SITE = "https://dnachimow-evitb.github.io/exploding-volcanos/"
APP = "https://apps.apple.com/app/id6834466189"
here = Path(__file__).parent
root = here.parent

# The site map. `beats` are the numbered sections of a chapter (side rail on wide screens, numbers in the menu);
# `more` are its other sections (menu only).
PAGES = [
    dict(file="story.html", key="home", nav="Home", menu="Home", sub="The Whole Story",
         title="Exploding Volcanoes in the Bathtub: a song, a game and an album",
         desc="A dad, a guitar, and two boys in the tub. How one soggy bath night became a real song, a free iPhone game, and then an album.",
         theme="#2a6fdb", banner=True, beats=[], more=[]),
    dict(file="the-song.html", key="song", nav="The Song", menu="The Song", sub="Chapter One",
         title="The Song | Exploding Volcanoes",
         desc="Chapter one. How a bath-night jam, a rough recording on my phone, and a little AI became a song.",
         theme="#2a6fdb", script="the-song.js",
         beats=[("story", "The Jam"), ("journey", "The AI"), ("song", "The Song")], more=[]),
    dict(file="the-game.html", key="game", nav="The Game", menu="The Game", sub="Chapter Two",
         title="The Game | Exploding Volcanoes",
         desc="Chapter two. My boys wanted to hear the song. Now they can play it: a free game with no ads.",
         theme="#2a6fdb",
         beats=[("experiment", "The Experiment"), ("game", "The Game"), ("cast", "The Cast")],
         more=[("parents", "For Parents")]),
    dict(file="album.html", key="album", nav="The Album", menu="The Album", sub="Chapter Three",
         title="The Album | Exploding Volcanoes",
         desc="Chapter three. First came one song, then the game. Then I went back to twenty years of half-finished song ideas.",
         theme="#0d1c54", script="album.js",
         beats=[], more=[("listen", "Listen"), ("pile", "The Pile"), ("upload", "The Upload"), ("conflict", "The Conflict"), ("name", "The Name")]),
]
FILES = [p["file"] for p in PAGES]


def link(target, current, anchor=""):
    """href to one of the site's pages: a bare #anchor on the same page, file?v=N#anchor on another."""
    if target == current:
        return "#" + (anchor or "top")
    return f"{target}?v={VERSION}" + (f"#{anchor}" if anchor else "")


def header(page):
    cur = page["file"]
    nav = "\n".join(
        f'      <a href="{link(p["file"], cur)}"' + (' class="here" aria-current="page"' if p is page else "") + f'>{p["nav"]}</a>'
        for p in PAGES)
    items = []
    for p in PAGES:
        subs = [(a, f"{i:02d} · {t}") for i, (a, t) in enumerate(p["beats"], 1)] + list(p["more"])
        sub_html = ""
        if subs:
            sub_html = '\n          <div class="subs">' + "".join(f'<a href="{link(p["file"], cur, a)}">{t}</a>' for a, t in subs) + "</div>"
        here_cls = " here" if p is page else ""
        items.append(f'        <li><a class="top{here_cls}" href="{link(p["file"], cur)}">{p["menu"]}<small>{p["sub"]}</small></a>{sub_html}</li>')
    return f'''<header class="bar">
  <div class="wrap">
    <a class="brand" href="{link("story.html", cur)}"><img src="apple-touch-icon.png" alt="" width="32" height="32" />Exploding Volcanoes</a>
    <nav class="nav" aria-label="Site">
{nav}
    </nav>
    <a class="get" href="{APP}">Get The App</a>
    <button class="menu-btn" id="menubtn" type="button" aria-label="Menu" aria-expanded="false" aria-controls="menu"><i></i><i></i><i></i></button>
  </div>
  <div class="menu" id="menu" hidden>
    <div class="wrap">
      <ul>
{chr(10).join(items)}
        <li><a class="top" href="./">Play The Game<small>Free</small></a></li>
        <li><a class="top" href="{APP}">Get The iPhone App<small>App Store</small></a></li>
      </ul>
      <div class="foot"><a href="privacy.html">Privacy</a><a href="support.html">Support</a><a href="mailto:dnachimow@gmail.com">Contact</a></div>
    </div>
  </div>
</header>'''


def rail(page):
    if not page["beats"]:
        return ""
    rows = "\n".join(f'  <a href="#{a}" data-s="{a}"><b>{i:02d}</b><span>{t}</span></a>' for i, (a, t) in enumerate(page["beats"], 1))
    return f'<nav class="rail" aria-label="This chapter, part by part">\n{rows}\n</nav>\n\n'


def footer(page):
    cur = page["file"]
    links = " &nbsp;·&nbsp; ".join(
        [f'<a href="{link(p["file"], cur)}">{p["nav"]}</a>' for p in PAGES if p is not page]
        + ['<a href="./">Play the game</a>', '<a href="privacy.html">Privacy</a>', '<a href="support.html">Support</a>',
           '<a href="mailto:dnachimow@gmail.com">dnachimow@gmail.com</a>'])
    return f'''<footer>
  <div class="wrap">
    <p>Made with a guitar, a bathtub, my two boys, and a little AI. Pow! Pow!</p>
    <p>Noah &amp; Max's dad &nbsp;·&nbsp; {links}</p>
  </div>
</footer>'''


def versioned(body, cur):
    """Add ?v=N to links between the site's pages inside a fragment (fragments are written with plain names)."""
    def fix(m):
        target, anchor = m.group(1), m.group(2) or ""
        if target == cur:
            return f'href="{anchor or "#top"}"'
        return f'href="{target}?v={VERSION}{anchor}"'
    return re.sub(r'href="(' + "|".join(re.escape(f) for f in FILES) + r')(#[^"]*)?"', fix, body)


def build(page):
    cur = page["file"]
    body = versioned((here / ("home.html" if page["key"] == "home" else cur)).read_text(), cur)
    extra = ""
    if page.get("script"):
        extra += "<script>\n" + (here / page["script"]).read_text() + "</script>\n"
    if page["key"] == "home":
        # links saved before the 2026-11-16 split pointed at sections of this page; send them to their new home
        moved = {"story": "the-song.html", "journey": "the-song.html", "song": "the-song.html",
                 "experiment": "the-game.html", "game": "the-game.html", "cast": "the-game.html", "parents": "the-game.html"}
        extra += ("<script>\n(function(){var m=" + repr(moved).replace("'", '"') + ",h=location.hash.slice(1);"
                  f"if(m[h])location.replace(m[h]+'?v={VERSION}#'+h);}})();\n</script>\n")
    banner = '<meta name="apple-itunes-app" content="app-id=6834466189" />\n' if page.get("banner") else ""
    html = f'''<!DOCTYPE html>
<html lang="en" data-v="{VERSION}">
<head>
<!-- BUILT FILE. Do not edit: change site-src/ and run `python3 site-src/build.py`. -->
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
<title>{page["title"]}</title>
<meta name="description" content="{page["desc"]}" />
<meta name="theme-color" content="{page["theme"]}" />
{banner}<meta property="og:type" content="website" />
<meta property="og:title" content="{page["title"]}" />
<meta property="og:description" content="{page["desc"]}" />
<meta property="og:url" content="{SITE}{cur}" />
<meta property="og:image" content="{SITE}assets/site/share.jpg" />
<meta name="twitter:card" content="summary_large_image" />
<link rel="icon" href="icon.svg" type="image/svg+xml" />
<link rel="apple-touch-icon" href="apple-touch-icon.png" />
<link rel="stylesheet" href="assets/site/site.css?v={VERSION}" />
</head>
<body>

{header(page)}

{rail(page)}<main id="top">

{body}
</main>

{footer(page)}

{extra}<script src="assets/site/site.js?v={VERSION}"></script>
</body>
</html>
'''
    (root / cur).write_text(html)
    return len(html)


if __name__ == "__main__":
    for p in PAGES:
        print(f'{p["file"]:16} {build(p):6} bytes')
    print("site version", VERSION)
