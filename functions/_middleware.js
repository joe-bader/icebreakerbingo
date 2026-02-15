export async function onRequest(context) {
    const url = new URL(context.request.url);
    const boardId = url.searchParams.get('g');

    // Only intercept requests with a ?g= board ID that serve HTML
    if (!boardId || boardId.length !== 12) {
        return context.next();
    }

    // Skip non-page requests (assets, API calls, the /og endpoint)
    if (url.pathname !== '/' && url.pathname !== '/index.html') {
        return context.next();
    }

    const response = await context.next();
    const contentType = response.headers.get('content-type') || '';
    if (!contentType.includes('text/html')) {
        return response;
    }

    // Build dynamic OG image URL
    const ogImageUrl = `${url.origin}/og?g=${boardId}`;
    const ogPageUrl = `${url.origin}?g=${boardId}`;

    // Rewrite og:image and og:url meta tags in the HTML
    return new HTMLRewriter()
        .on('meta[property="og:image"]', {
            element(el) {
                el.setAttribute('content', ogImageUrl);
            }
        })
        .on('meta[property="og:url"]', {
            element(el) {
                el.setAttribute('content', ogPageUrl);
            }
        })
        .on('meta[name="twitter:image"]', {
            element(el) {
                el.setAttribute('content', ogImageUrl);
            }
        })
        .on('link[rel="canonical"]', {
            element(el) {
                el.setAttribute('href', ogPageUrl);
            }
        })
        .transform(response);
}
