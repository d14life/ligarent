DROP YOUR OWN SITE PHOTOGRAPHS IN THIS FOLDER
=============================================

Name them exactly like this and the page picks them up automatically. No code
change, no rebuild. Anything missing falls back to the 3D render already in
assets/media/, so you can add them one at a time.

  site-1.jpg   large card, top left of the gallery   <- put the best one here
  site-2.jpg
  site-3.jpg
  site-4.jpg
  site-5.jpg
  site-6.jpg

  machine-d6r.jpg    shown beside the D6R specs
  machine-d7r.jpg    shown beside the D7R specs
  machine-d8r.jpg    shown beside the D8R specs

  hero-poster.jpg    still shown behind the video while it loads

HOW TO GET YOUR PHOTOS IN
-------------------------
The three you sent came through the chat, not as files, so they could not be
saved from here. Save them out of the chat onto your computer, rename them as
below, and drop them into this folder. That is all that is needed.

Suggested for the three photographs already sent over:

  the D7R with the LIGARENT decal, ripper down   ->  site-1.jpg AND machine-d7r.jpg
  the dozer cutting the bank, operator in shot   ->  site-2.jpg
  the wide site with the two excavators          ->  site-3.jpg

How it works
------------
The page checks each slot when it loads. If the file is there it is used; if it
is not, the 3D render already in assets/media/ is kept. That means you can add
one photo today and another next week with nothing to rebuild. Empty slots show
as 404s in a browser's developer console, which is expected and harmless.

Notes
-----
* Landscape, roughly 1600 x 1000 or larger. The page darkens them itself, so
  send normally exposed originals rather than pre-darkened ones.
* JPEG. Keep each one under about 400 KB or the page gets slow on phones.
* The captions that sit over each photo are the site.1.t ... site.6.b keys in
  assets/js/i18n.js, in all six languages.
