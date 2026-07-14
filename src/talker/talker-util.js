export const E_SIDE_HEADER_LENGTH = 27;
export const E_SIDE_FRAME_HEADER = 0x30316364;

export function parseTalkUrl(url) {
    if (!url) {
        return null;
    }

    const urlSegments = String(url).split('/');
    if (urlSegments.length === 0) {
        return null;
    }

    const segment = urlSegments[urlSegments.length - 1];
    if (!segment) {
        return null;
    }

    const talkParts = segment.split('_');
    if (talkParts.length !== 3 || !talkParts[0] || !talkParts[1] || !talkParts[2]) {
        return null;
    }

    const protocol = talkParts[0].toLowerCase();
    if (protocol !== 'e' && protocol !== 'g') {
        return null;
    }

    return {
        protocol,
        imei: talkParts[1],
        channel: talkParts[2]
    };
}

export function int16ToUint8(int16Array) {
    return new Uint8Array(int16Array.buffer, int16Array.byteOffset, int16Array.byteLength);
}

export function resolveTalkIdentity(talkInfo, imei, channel) {
    return {
        imei: talkInfo && talkInfo.imei,
        channel: talkInfo && talkInfo.channel
    };
}

export function uint8ToInt16(uint8Array) {
    const byteLength = uint8Array.byteLength - (uint8Array.byteLength % 2);
    if (uint8Array.byteOffset % 2 !== 0) {
        const alignedBytes = new Uint8Array(byteLength);
        alignedBytes.set(uint8Array.subarray(0, byteLength));
        return new Int16Array(alignedBytes.buffer);
    }

    return new Int16Array(uint8Array.buffer, uint8Array.byteOffset, byteLength / 2);
}

export function getESideAudioBytes(data) {
    const bytes = data instanceof Uint8Array ? data : new Uint8Array(data);
    if (bytes.byteLength <= E_SIDE_HEADER_LENGTH) {
        return new Uint8Array(0);
    }
    return bytes.subarray(E_SIDE_HEADER_LENGTH);
}

export function createESidePacket({audioBytes, sequence, channel, timestamp}) {
    const body = audioBytes || new Uint8Array(0);
    if (body.byteLength > 0xffff) {
        throw new RangeError('E-side packet audio body length must be <= 65535 bytes');
    }

    const packet = new Uint8Array(E_SIDE_HEADER_LENGTH + body.byteLength);
    const view = new DataView(packet.buffer, packet.byteOffset, packet.byteLength);
    const time = Number(timestamp) || 0;
    const timestampHigh = Math.floor(time / 0x100000000);
    const timestampLow = time >>> 0;

    view.setUint32(0, E_SIDE_FRAME_HEADER);
    view.setUint16(4, sequence);
    view.setUint8(12, channel);
    view.setUint8(13, 0);
    view.setUint8(14, 1);
    view.setUint8(15, 0);
    view.setUint8(16, 1);
    view.setUint32(17, timestampHigh);
    view.setUint32(21, timestampLow);
    view.setUint16(25, body.byteLength);
    packet.set(body, E_SIDE_HEADER_LENGTH);

    return packet;
}
