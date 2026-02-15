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

        // Build 5 rows of 5 cells — solid colors approximating the real board
        let promptIdx = 0;
        const rows = [];
        for (let r = 0; r < 5; r++) {
            const rowCells = [];
            for (let c = 0; c < 5; c++) {
                const i = r * 5 + c;
                const isCenter = i === 12;
                const isChecked = cells[i];
                const text = isCenter ? 'FREE' : shuffled[promptIdx++];

                let bg, borderColor, color, fontWeight;

                if (isCenter) {
                    // Gold center cell
                    bg = '#d97706';
                    borderColor = '#b45309';
                    color = '#ffffff';
                    fontWeight = '800';
                } else if (isChecked) {
                    // Checked: purple aurora
                    bg = '#7c3aed';
                    borderColor = '#5b21b6';
                    color = '#ffffff';
                    fontWeight = '700';
                } else {
                    // Unchecked: frosted ice tile
                    bg = '#c8ddf0';
                    borderColor = '#a8c4dc';
                    color = '#152540';
                    fontWeight = '600';
                }

                const fontSize = isCenter ? '20px' : '11px';

                rowCells.push(
                    `<div style="display:flex;align-items:center;justify-content:center;width:210px;height:86px;background:${bg};border:2px solid ${borderColor};border-radius:10px;font-size:${fontSize};font-weight:${fontWeight};color:${color};text-align:center;padding:6px;margin:3px;">${text}</div>`
                );
            }
            rows.push(
                `<div style="display:flex;flex-direction:row;">${rowCells.join('')}</div>`
            );
        }

        const html = `<div style="display:flex;flex-direction:column;align-items:center;justify-content:center;width:1200px;height:630px;background:#0a1d3d;font-family:Arial,sans-serif;"><div style="display:flex;flex-direction:row;align-items:center;justify-content:space-between;width:1090px;margin-bottom:10px;"><div style="display:flex;flex-direction:column;"><div style="display:flex;font-size:26px;font-weight:700;color:#e2e8f0;">Icebreaker Bingo</div><div style="display:flex;font-size:14px;color:#94a3b8;margin-top:2px;">${checked}/24 checked</div></div><div style="display:flex;align-items:center;background:#172a45;border:1px solid #2563eb;border-radius:50px;padding:6px 18px;"><div style="display:flex;font-size:16px;font-weight:600;color:#38bdf8;">${title}</div></div></div><div style="display:flex;flex-direction:column;align-items:center;">${rows.join('')}</div><div style="display:flex;flex-direction:row;margin-top:8px;"><div style="display:flex;font-size:13px;color:#64748b;margin-right:6px;">Play yours at</div><div style="display:flex;font-size:14px;font-weight:700;color:#e2e8f0;">icebreakerbingo.com</div></div></div>`;

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
