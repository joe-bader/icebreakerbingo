import { ImageResponse } from 'workers-og';
import { reconstructBoard } from './board-logic.js';

export async function onRequest(context) {
    const url = new URL(context.request.url);
    const boardId = url.searchParams.get('g');

    if (!boardId || boardId.length !== 12) {
        return new Response('Missing or invalid board ID', { status: 400 });
    }

    // Check cache first
    const cacheKey = new Request(url.toString(), context.request);
    const cache = caches.default;
    const cachedResponse = await cache.match(cacheKey);
    if (cachedResponse) return cachedResponse;

    try {
        const { shuffled, cells, checked, title } = reconstructBoard(boardId);

        // Build 5 rows of 5 cells each — styled to match the real board
        let promptIdx = 0;
        const rows = [];
        for (let r = 0; r < 5; r++) {
            const rowCells = [];
            for (let c = 0; c < 5; c++) {
                const i = r * 5 + c;
                const isCenter = i === 12;
                const isChecked = cells[i];
                const text = isCenter ? 'FREE' : shuffled[promptIdx++];

                let bg, borderColor, color, fontWeight, shadow;

                if (isCenter) {
                    // Gold center cell
                    bg = 'linear-gradient(155deg, #fbbf24 0%, #d97706 50%, #b45309 100%)';
                    borderColor = '#92400e';
                    color = '#ffffff';
                    fontWeight = '800';
                    shadow = '0 4px 0 #92400e, 0 6px 12px rgba(0,0,0,0.3)';
                } else if (isChecked) {
                    // Checked: teal-to-purple aurora gradient
                    bg = 'linear-gradient(155deg, #14b8a6 0%, #8b5cf6 50%, #6d28d9 100%)';
                    borderColor = '#134e4a';
                    color = '#ffffff';
                    fontWeight = '700';
                    shadow = '0 4px 0 #134e4a, 0 6px 12px rgba(0,0,0,0.3)';
                } else {
                    // Unchecked: frosted ice tile
                    bg = 'linear-gradient(155deg, #dae9f6 0%, #bdd4e8 60%, #a8c4dc 100%)';
                    borderColor = 'rgba(255,255,255,0.5)';
                    color = '#152540';
                    fontWeight = '600';
                    shadow = '0 4px 0 #7ba6c9, 0 6px 12px rgba(0,0,0,0.2)';
                }

                const fontSize = isCenter ? '20px' : '11px';

                rowCells.push(
                    `<div style="display:flex;align-items:center;justify-content:center;width:210px;height:86px;background:${bg};border:1px solid ${borderColor};border-radius:10px;font-size:${fontSize};font-weight:${fontWeight};color:${color};text-align:center;padding:6px;margin:3px;box-shadow:${shadow};">${text}</div>`
                );
            }
            rows.push(
                `<div style="display:flex;flex-direction:row;">${rowCells.join('')}</div>`
            );
        }

        const html = `<div style="display:flex;flex-direction:column;align-items:center;justify-content:center;width:1200px;height:630px;background:linear-gradient(180deg, #091832 0%, #0d2348 100%);font-family:Arial,sans-serif;"><div style="display:flex;flex-direction:row;align-items:center;justify-content:space-between;width:1090px;margin-bottom:10px;"><div style="display:flex;flex-direction:column;"><div style="display:flex;font-size:26px;font-weight:700;color:#e2e8f0;">Icebreaker Bingo</div><div style="display:flex;font-size:14px;color:#94a3b8;margin-top:2px;">${checked}/24 checked</div></div><div style="display:flex;align-items:center;background:rgba(56,189,248,0.15);border:1px solid rgba(56,189,248,0.3);border-radius:50px;padding:6px 18px;"><div style="display:flex;font-size:16px;font-weight:600;color:#38bdf8;">${title}</div></div></div><div style="display:flex;flex-direction:column;align-items:center;">${rows.join('')}</div><div style="display:flex;flex-direction:row;margin-top:8px;"><div style="display:flex;font-size:13px;color:#64748b;margin-right:6px;">Play yours at</div><div style="display:flex;font-size:14px;font-weight:700;color:#e2e8f0;">icebreakerbingo.com</div></div></div>`;

        const imgResponse = new ImageResponse(html, {
            width: 1200,
            height: 630,
        });

        // Buffer the entire image before returning
        const buffer = await imgResponse.arrayBuffer();

        const cacheResponse = new Response(buffer, {
            status: 200,
            headers: {
                'Content-Type': 'image/png',
                'Cache-Control': 'public, max-age=31536000, immutable',
            },
        });

        context.waitUntil(cache.put(cacheKey, cacheResponse.clone()));
        return cacheResponse;
    } catch (err) {
        return new Response(`OG image generation failed: ${err.message}`, {
            status: 500,
            headers: { 'Content-Type': 'text/plain' },
        });
    }
}
