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

    // Reconstruct board state
    const { shuffled, cells, checked, title } = reconstructBoard(boardId);

    // Build the 5x5 grid HTML
    const gridCells = [];
    let promptIdx = 0;
    for (let i = 0; i < 25; i++) {
        const isCenter = i === 12;
        const isChecked = cells[i];
        const text = isCenter ? '\u2B50' : shuffled[promptIdx++];

        const bg = isChecked
            ? 'rgba(56, 189, 248, 0.25)'
            : 'rgba(255, 255, 255, 0.05)';
        const border = isChecked
            ? '2px solid rgba(56, 189, 248, 0.5)'
            : '1px solid rgba(255, 255, 255, 0.1)';
        const color = isChecked ? '#e2e8f0' : '#94a3b8';
        const fontSize = isCenter ? '28px' : '11px';

        gridCells.push(`
            <div style="display:flex;align-items:center;justify-content:center;background:${bg};border:${border};border-radius:8px;padding:4px;text-align:center;font-size:${fontSize};color:${color};line-height:1.2;overflow:hidden;">
                ${text}
            </div>
        `);
    }

    const html = `
        <div style="display:flex;flex-direction:column;width:1200px;height:630px;background:linear-gradient(135deg,#0b1628 0%,#0f2440 50%,#0b1628 100%);padding:32px 40px;font-family:Inter,system-ui,sans-serif;">
            <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:16px;">
                <div style="display:flex;flex-direction:column;">
                    <div style="font-size:28px;font-weight:700;color:#f1f5f9;">Icebreaker Bingo</div>
                    <div style="font-size:16px;color:#64748b;margin-top:4px;">${checked}/24 checked</div>
                </div>
                <div style="display:flex;align-items:center;background:rgba(56,189,248,0.15);border:1px solid rgba(56,189,248,0.3);border-radius:50px;padding:8px 20px;">
                    <span style="font-size:18px;font-weight:600;color:#38bdf8;">${title}</span>
                </div>
            </div>
            <div style="display:flex;flex-wrap:wrap;gap:6px;flex:1;">
                ${gridCells.map(cell => `<div style="display:flex;width:226px;height:96px;">${cell}</div>`).join('')}
            </div>
            <div style="display:flex;justify-content:center;margin-top:12px;">
                <span style="font-size:14px;color:#64748b;">Play yours at </span>
                <span style="font-size:16px;font-weight:700;color:#e2e8f0;margin-left:6px;">icebreakerbingo.com</span>
            </div>
        </div>
    `;

    const response = new ImageResponse(html, {
        width: 1200,
        height: 630,
    });

    // Cache for 1 year (board IDs are immutable)
    const cacheResponse = new Response(response.body, response);
    cacheResponse.headers.set('Cache-Control', 'public, max-age=31536000, immutable');
    context.waitUntil(cache.put(cacheKey, cacheResponse.clone()));

    return cacheResponse;
}
