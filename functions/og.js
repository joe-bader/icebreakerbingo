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
        // Reconstruct board state
        const { shuffled, cells, checked, title } = reconstructBoard(boardId);

        // Build the 5x5 grid as a flat row of 25 cells
        const cellSize = 218;
        const cellHeight = 90;
        const gridGap = 6;

        const gridCells = [];
        let promptIdx = 0;
        for (let i = 0; i < 25; i++) {
            const row = Math.floor(i / 5);
            const col = i % 5;
            const isCenter = i === 12;
            const isChecked = cells[i];
            const text = isCenter ? 'FREE' : shuffled[promptIdx++];

            const bg = isChecked ? '#1e3a5f' : '#141e30';
            const borderColor = isChecked ? '#38bdf8' : '#1e293b';
            const color = isChecked ? '#e2e8f0' : '#94a3b8';
            const fontSize = isCenter ? '24px' : '11px';
            const fontWeight = isCenter ? '700' : '400';

            const left = col * (cellSize + gridGap);
            const top = row * (cellHeight + gridGap);

            gridCells.push(
                `<div style="position:absolute;left:${left}px;top:${top}px;width:${cellSize}px;height:${cellHeight}px;display:flex;align-items:center;justify-content:center;background:${bg};border:2px solid ${borderColor};border-radius:8px;padding:4px;font-size:${fontSize};font-weight:${fontWeight};color:${color};overflow:hidden;text-align:center;">${text}</div>`
            );
        }

        const gridWidth = 5 * cellSize + 4 * gridGap;
        const gridHeight = 5 * cellHeight + 4 * gridGap;

        const html = `
            <div style="display:flex;flex-direction:column;align-items:center;width:1200px;height:630px;background:#0b1628;padding:28px 0;font-family:Arial,sans-serif;">
                <div style="display:flex;align-items:center;justify-content:space-between;width:${gridWidth}px;margin-bottom:12px;">
                    <div style="display:flex;flex-direction:column;">
                        <div style="font-size:26px;font-weight:700;color:#f1f5f9;">Icebreaker Bingo</div>
                        <div style="font-size:15px;color:#64748b;margin-top:2px;">${checked}/24 checked</div>
                    </div>
                    <div style="display:flex;align-items:center;background:#172a45;border:2px solid #2563eb;border-radius:50px;padding:6px 18px;">
                        <span style="font-size:16px;font-weight:600;color:#38bdf8;">${title}</span>
                    </div>
                </div>
                <div style="display:flex;position:relative;width:${gridWidth}px;height:${gridHeight}px;">
                    ${gridCells.join('')}
                </div>
                <div style="display:flex;margin-top:10px;">
                    <span style="font-size:14px;color:#64748b;">Play yours at </span>
                    <span style="font-size:15px;font-weight:700;color:#e2e8f0;margin-left:6px;">icebreakerbingo.com</span>
                </div>
            </div>
        `;

        const imgResponse = new ImageResponse(html, {
            width: 1200,
            height: 630,
        });

        // Buffer the entire image before returning (avoids streaming issues)
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
