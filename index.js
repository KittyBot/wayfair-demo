import html from './html'

fly.http.respondWith(lazyImages('.Picture-image'))

function lazyImages(selector, skip) {
  if (!skip) skip = 0
  if (typeof selector === "string") {
    selector = [selector]
  }
  if (!selector || !(selector instanceof Array)) {
    throw new Error("lazyImages selector must be a string or array")
  }
  const fn = async function lazyImages(req, next) {
    let resp = await next()

    const doc = await html.responseDocument(resp)
    if (!doc) return resp // not html

    for (const s of selector) {
      const images = doc.querySelectorAll(s)

      let idx = 0
      for (const img of images) {
        if (++idx < skip) {
          continue
        }
        const src = img.getAttribute("src")
        const srcset = img.getAttribute("srcset")
        let style = img.getAttribute('style') || ""
        img.setAttribute('data-style', style)

        style = `visibility: hidden;${style}`
        img.setAttribute('style', style)
        if (src) {
          img.setAttribute("src", '')
          img.setAttribute("data-image-src", src)
        }
        if (srcset) {
          img.setAttribute("srcset", '')
          img.setAttribute("data-image-srcset", srcset)
        }
        img.setAttribute("onerror", '')
      }
    }

    if (!doc.querySelector("script#lazy-images")) {
      let script = await fetch("file://image-observer.js")
      script = await script.text()
      const target = doc.querySelector("head")
      if (target) {
        target.appendChild(`<script id="lazy-images">${script}</script>`)
      }
    }
    const body = doc.documentElement.outerHTML
    return new Response(body, resp)
  }
  return fn
}
